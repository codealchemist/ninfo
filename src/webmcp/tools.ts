import i18n from '../i18n'
import { useAppStore } from '../store/appStore'
import { useAiFeedbackStore, type AiFeedback, type AiPriority } from '../store/aiFeedbackStore'
import { buildDaySummaryData } from '../data/aggregate/daySummary'
import { aggregateByDay, groupIntoMeals, median, medianTotals } from '../data/aggregate/dailyTotals'
import { weightAtOrBefore } from '../data/weightUtils'
import { dailyTotalMlByDate } from '../data/liquidUtils'
import type { GlucoseReading, LipidTotals, MacroTotals, Meal, MealItem } from '../data/types'
import type { WeightEntry } from '../data/parsers/pesoParser'
import type { BiaEntry } from '../data/parsers/bioimpedanciaParser'
import type { LiquidEntry } from '../data/parsers/liquidoParser'
import { PesoSource } from '../data/sources/PesoSource'
import { BioimpedanciaSource } from '../data/sources/BioimpedanciaSource'
import { LiquidoSource } from '../data/sources/LiquidoSource'
import { getSheetLink } from '../db/sheetLinkStorage'
import { parseGoogleSheetUrl } from '../utils/googleSheetUrl'
import { todayLocalIso } from '../utils/localDate'
import { PANEL_TARGETS, dayTarget, isPanelTarget, mealTarget } from './targets'
import type { WebMcpTool } from './modelContext'

// ---------------------------------------------------------------------------------------------
// Shared helpers — the user's logged data as-is, in compact, self-describing objects. The tools
// deliberately leave out the app's own estimates (leucine, mTORC1 pulses, fat-quality and
// glucose-spike heuristics): the assistant analyses the raw data better than they do. Sums and
// medians are kept — plain arithmetic, rounded only to hide floating-point noise.

const r2 = (n: number) => Math.round(n * 100) / 100

/** Sums (day/meal/period totals). Single items use the logged values unrounded — see item(). */
function macros(t: MacroTotals) {
  return {
    calories_kcal: r2(t.calories),
    protein_g: r2(t.protein),
    carbs_g: r2(t.carbs),
    fat_g: r2(t.fat),
    fiber_g: r2(t.fiber),
  }
}

function fatBreakdown(l: LipidTotals) {
  return {
    omega3_g: r2(l.omega3),
    omega6_g: r2(l.omega6),
    omega9_g: r2(l.omega9),
    scfa_g: r2(l.scfa),
    mcfa_g: r2(l.mcfa),
    lcfa_g: r2(l.lcfa),
    tox_g: r2(l.tox),
  }
}

// Rows from before lipidsRecorded existed count as recorded (the old behaviour).
const hasFatBreakdown = (i: MealItem) => i.lipidsRecorded !== false

function glucose(g: GlucoseReading) {
  return { post_meal_mg_dl: g.postMeal, baseline_mg_dl: g.baseline, increment_mg_dl: g.increment }
}

function item(i: MealItem) {
  return {
    food: i.food,
    food_type: i.foodType,
    portions: i.quantity,
    grams: i.grams,
    calories_kcal: i.calories,
    protein_g: i.protein,
    carbs_g: i.carbs,
    fat_g: i.fat,
    fiber_g: i.fiber,
    fat_breakdown: hasFatBreakdown(i) ? fatBreakdown(i.lipids) : null,
  }
}

/** Fat-breakdown sums over the rows that recorded one, and how many did — blanks aren't zeros. */
function fatBreakdownTotals(items: MealItem[]) {
  const recorded = items.filter(hasFatBreakdown)
  const sum: LipidTotals = { omega3: 0, omega6: 0, omega9: 0, scfa: 0, mcfa: 0, lcfa: 0, tox: 0 }
  for (const i of recorded) for (const k of Object.keys(sum) as (keyof LipidTotals)[]) sum[k] += i.lipids[k]
  return { ...fatBreakdown(sum), recorded_on_items: `${recorded.length} of ${items.length}` }
}

/** One meal in full — shared by get_day (every meal) and get_meal (one), so both say the same. */
function mealDetail(meal: Meal) {
  return {
    target_id: mealTarget(meal),
    time: meal.time,
    fasting_since_previous_meal: meal.items[0]?.fastingSincePrev ?? null,
    // Logged on one of the meal's rows, but they describe the meal as a whole.
    blood_glucose_readings: meal.items.flatMap((i) => (i.glucose ? [glucose(i.glucose)] : [])),
    totals: macros(meal.totals),
    fat_breakdown_totals: fatBreakdownTotals(meal.items),
    item_count: meal.items.length,
    items: meal.items.map(item),
  }
}

/**
 * Appended to every read result: the model reads it right when deciding what to do next, so
 * spelling out the write-back call (with the target already filled in) makes agents post their
 * analysis to the app instead of only answering in chat.
 */
function nextStep(targets: string): string {
  return `When your analysis is ready, show it in Ninfo by calling show_ai_analysis with target ${targets}, writing in "${i18n.language}". Also answer the user in chat if they asked you to.`
}

function requireData() {
  const state = useAppStore.getState()
  if (!state.meta || state.dates.length === 0) {
    throw new Error(
      'No nutrition data is loaded in Ninfo yet. Ask the user to open a data source on the welcome screen (demo, CSV upload or a linked Google Sheet), then retry.'
    )
  }
  return state
}

/** Accepts "today", "selected", "latest", "YYYY-MM-DD", or anything Date can parse ("Oct 12"). */
function resolveDate(raw: unknown): string {
  const state = requireData()
  const value = typeof raw === 'string' ? raw.trim().toLowerCase() : ''
  const latest = state.dates[state.dates.length - 1]
  let date: string
  if (!value || value === 'selected') date = state.selectedDate ?? latest
  else if (value === 'today') date = todayLocalIso()
  else if (value === 'latest') date = latest
  else if (/^\d{4}-\d{2}-\d{2}$/.test(value)) date = value
  else {
    const parsed = new Date(`${raw} ${new Date().getFullYear()}`)
    const fallback = new Date(String(raw))
    const d = !Number.isNaN(parsed.getTime()) ? parsed : fallback
    if (Number.isNaN(d.getTime())) {
      throw new Error(`Could not read date "${raw}". Use YYYY-MM-DD, "today", "selected" or "latest".`)
    }
    date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }
  if (!state.dates.includes(date)) {
    throw new Error(
      `No meals are logged on ${date}. Logged days run from ${state.dates[0]} to ${latest}; pick one of those (or "latest").`
    )
  }
  return date
}

// Body data comes from the linked sheet's extra tabs — the same sources the pages use, cached per
// sheet for the session so repeated tool calls don't refetch.
type BodyKind = 'weight' | 'bia' | 'liquids'
const bodyCache = new Map<string, Promise<unknown[]>>()

function linkedSpreadsheetId(): string | null {
  const { sheetLinkId } = useAppStore.getState()
  const url = sheetLinkId ? getSheetLink(sheetLinkId)?.url : null
  return url ? parseGoogleSheetUrl(url)?.spreadsheetId ?? null : null
}

async function loadBody(kind: 'weight'): Promise<WeightEntry[]>
async function loadBody(kind: 'bia'): Promise<BiaEntry[]>
async function loadBody(kind: 'liquids'): Promise<LiquidEntry[]>
async function loadBody(kind: BodyKind): Promise<unknown[]> {
  if (kind === 'weight' && useAppStore.getState().weightEntries.length > 0) {
    return useAppStore.getState().weightEntries
  }
  const spreadsheetId = linkedSpreadsheetId()
  if (!spreadsheetId) {
    throw new Error(
      'Weight, BIA and liquid data come from a linked Google Sheet ("Peso", "Bioimpedancia" and "Líquido" tabs), and the current data source is not one. Ask the user to link their sheet on the welcome screen.'
    )
  }
  const key = `${spreadsheetId}:${kind}`
  if (!bodyCache.has(key)) {
    const source =
      kind === 'weight'
        ? new PesoSource(spreadsheetId)
        : kind === 'bia'
          ? new BioimpedanciaSource(spreadsheetId)
          : new LiquidoSource(spreadsheetId)
    const promise = source.load().catch((err) => {
      bodyCache.delete(key)
      throw err
    })
    bodyCache.set(key, promise)
  }
  return bodyCache.get(key)!
}

const optional = <T,>(promise: Promise<T>) => promise.catch(() => null)

const parseFastingMinutes = (value: string | null): number | null => {
  const m = value?.match(/^(\d+):(\d{2})/)
  return m ? Number(m[1]) * 60 + Number(m[2]) : null
}

// Strip control characters (keep newlines/tabs) and cap length — tool input is untrusted.
function cleanText(raw: unknown, max: number, field: string, required = false): string | null {
  if (raw === undefined || raw === null || raw === '') {
    if (required) throw new Error(`${field} is required.`)
    return null
  }
  if (typeof raw !== 'string') throw new Error(`${field} must be a string.`)
  // eslint-disable-next-line no-control-regex
  const text = raw.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').trim()
  if (!text && required) throw new Error(`${field} must not be empty.`)
  if (text.length > max) throw new Error(`${field} must be at most ${max} characters (got ${text.length}). Shorten it and retry.`)
  return text || null
}

function cleanList(raw: unknown, max: number, field: string): unknown[] {
  if (raw === undefined || raw === null) return []
  if (!Array.isArray(raw)) throw new Error(`${field} must be an array.`)
  if (raw.length > max) throw new Error(`${field} can have at most ${max} entries (got ${raw.length}). Keep the most important ones and retry.`)
  return raw
}

// ---------------------------------------------------------------------------------------------
// Tools

const getAppOverview: WebMcpTool = {
  name: 'get_app_overview',
  title: 'Ninfo overview',
  description:
    "Start here. Describes the nutrition data loaded in Ninfo (source, logged date range, current page and selected day, latest goals), a data dictionary explaining every field the other tools return, and every target id that show_ai_analysis can display analysis on. Food names and notes come from the user's own log.",
  inputSchema: { type: 'object', properties: {} },
  annotations: { readOnlyHint: true, untrustedContentHint: true },
  async execute() {
    const state = useAppStore.getState()
    const latest = state.dates[state.dates.length - 1] ?? null
    return {
      app: 'Ninfo, a nutrition dashboard built from a daily food log',
      app_language: i18n.language,
      data_loaded: Boolean(state.meta),
      data_source: state.meta ? { kind: state.meta.mode, label: state.meta.label, loaded_at: state.meta.loadedAt } : null,
      logged_days: state.dates.length,
      first_date: state.dates[0] ?? null,
      last_date: latest,
      logged_items: state.meals.length,
      current_page: window.location.pathname,
      selected_date: state.selectedDate,
      latest_daily_goals: latest && state.goalsByDate[latest] ? macros(state.goalsByDate[latest]) : null,
      body_data_available: linkedSpreadsheetId() !== null,
      data_dictionary: {
        source:
          "Everything comes from the user's own spreadsheet log as entered: one item per food row of the \"Registro\" tab. The tools return those values unchanged, with no estimates added; totals and medians are plain sums/medians of them.",
        items: {
          food: 'Food name as the user logged it, mostly Spanish (Argentina); a portion hint is often in the name, e.g. "(1 pechuga)", "(1 cda sop)" = 1 tablespoon.',
          food_type:
            "The user's own category: Proteína, Lácteo, Grano (also used for oils), Carb, Fruto Seco, Verdura, Fruta, Procesado (packaged), Elaborado (prepared dishes), Complemento (supplements: vitamins, creatine, magnesium), Infusión, Grasa.",
          portions: 'The "Cant." column: how many of the reference portion were eaten (can be fractional).',
          grams: 'Total weight eaten.',
          macros: 'calories_kcal, protein_g, carbs_g, fat_g and fiber_g are for the amount eaten, not per 100 g.',
          fat_breakdown:
            'Grams for the amount eaten, as logged: omega3 (n-3 PUFA), omega6 (n-6 PUFA), omega9 (n-9, mostly MUFA), scfa/mcfa/lcfa (fatty acids by chain length: short, medium, long), tox (the sheet\'s "Tóx" column: trans/harmful fats). The columns overlap and are not additive: lcfa counts all long-chain fat, unsaturated included (it is close to fat_g for most foods), so it is not saturated fat. Saturated fat is not logged directly; fat_g − omega3 − omega6 − omega9 − tox approximates it. null means not recorded for that food, not zero.',
        },
        meals: {
          time: 'Local time (HH:MM). Each meal is all items logged at the same date and time.',
          fasting_since_previous_meal: 'HH:MM since the previous meal ("Ayuno"); on the first meal of a day it is the overnight fast.',
          blood_glucose_readings:
            "The user's own measurements around that meal, in mg/dL: post_meal (PBG), baseline (BGB, before eating) and increment (BGI = PBG − BGB). Only some meals have them.",
        },
        days: {
          goals: "The user's daily targets from the sheet.",
          water_ml: 'Total drinks logged that day ("Líquido" tab), when a Google Sheet is linked.',
          body_weight_kg: 'The latest weigh-in on or before that day ("Peso" tab), when a Google Sheet is linked.',
        },
      },
      analysis_targets: {
        day: 'day:YYYY-MM-DD for one logged day (get_day returns it as target_id).',
        meal: "meal:YYYY-MM-DDTHH:MM for one meal (get_meal and get_day return it as target_id).",
        panels: PANEL_TARGETS,
      },
      how_to_help:
        "Read data with get_meal (one meal, by default the one open in the app), get_day, get_timeline and get_body_data. Analyse it yourself: micronutrients from the foods and amounts, fat quality, protein distribution and leucine/mTORC1 pulses, glucose responses. Then call show_ai_analysis once per target with a short summary, concrete recommendations and your estimates. Write in app_language.",
    }
  },
}

const getDay: WebMcpTool = {
  name: 'get_day',
  title: 'Get a day',
  description:
    "Returns one logged day in full, as the user logged it: every meal with every food (portions, grams, macros and fat breakdown) and any blood glucose readings, the day's goals and totals, the previous day and the week/month medians for comparison, water, body weight and the overnight fast. Each meal includes the target_id to use with show_ai_analysis. Use for a whole day; use get_meal for one meal.",
  inputSchema: {
    type: 'object',
    properties: {
      date: {
        type: 'string',
        description:
          'The day to read: "selected" (the day open in the app, default), "today", "latest", or a date like "2026-10-12".',
      },
    },
  },
  annotations: { readOnlyHint: true, untrustedContentHint: true },
  async execute(input) {
    const date = resolveDate(input.date)
    const state = useAppStore.getState()
    const data = buildDaySummaryData({ meals: state.meals, goalsByDate: state.goalsByDate, dates: state.dates, date })

    const [weightEntries, liquidEntries] = await Promise.all([
      optional(loadBody('weight')),
      optional(loadBody('liquids')),
    ])
    const weightKg = weightEntries ? weightAtOrBefore(weightEntries, date)?.weightKg ?? null : null
    const waterMl = liquidEntries ? dailyTotalMlByDate(liquidEntries).get(date) ?? 0 : null

    return {
      date,
      target_id: dayTarget(date),
      next_step: nextStep(`"${dayTarget(date)}" for the day as a whole, and each meal's own target_id for feedback on that meal's card`),
      is_selected_in_app: state.selectedDate === date,
      goals: data.goals ? macros(data.goals) : null,
      totals: macros(data.totals),
      comparison: {
        previous_logged_day: data.prevDayTotals ? macros(data.prevDayTotals) : null,
        median_of_previous_7_days: data.weekMedianTotals ? macros(data.weekMedianTotals) : null,
        median_of_previous_30_days: data.monthMedianTotals ? macros(data.monthMedianTotals) : null,
      },
      fat_breakdown_totals: fatBreakdownTotals(data.meals.flatMap((m) => m.items)),
      body_weight_kg: weightKg,
      water_ml: waterMl,
      overnight_fast: data.meals[0]?.items[0]?.fastingSincePrev ?? null,
      meal_count: data.meals.length,
      meals: data.meals.map((meal: Meal) => mealDetail(meal)),
    }
  },
}

const getMeal: WebMcpTool = {
  name: 'get_meal',
  title: 'Get a meal',
  description:
    "Returns one meal in full, as the user logged it: every food with portions, grams, macros and fat breakdown, any blood glucose readings, the fast before it, and context from its day (goals, day totals, body weight, position among the day's meals). With no input it returns the meal card the user is looking at in the app. Includes the target_id for show_ai_analysis. Use this for a single meal; use get_day for a whole day.",
  inputSchema: {
    type: 'object',
    properties: {
      meal: {
        type: 'string',
        description:
          'Which meal: "current" (the meal card centered in the app, default), "latest" (last meal of the selected day), a target_id like "meal:2026-10-12T13:00", or a time like "13:00".',
      },
      date: {
        type: 'string',
        description: 'Only with a time: the day, as "selected" (default), "today", "latest" or "2026-10-12".',
      },
    },
  },
  annotations: { readOnlyHint: true, untrustedContentHint: true },
  async execute(input) {
    const state = requireData()
    const raw = typeof input.meal === 'string' ? input.meal.trim() : ''
    const latestDate = state.dates[state.dates.length - 1]
    const selectedDate = state.selectedDate && state.dates.includes(state.selectedDate) ? state.selectedDate : latestDate
    let key: string
    let resolvedFrom: string

    const idMatch = raw.match(/^(?:meal:)?(\d{4}-\d{2}-\d{2})T(\d{1,2}:\d{2})$/)
    const timeMatch = raw.match(/^(\d{1,2}):(\d{2})$/)
    if (!raw || raw.toLowerCase() === 'current' || raw.toLowerCase() === 'focused') {
      if (state.focusedMealKey) {
        key = state.focusedMealKey
        resolvedFrom = 'the meal card centered in the app'
      } else {
        const last = groupIntoMeals(state.meals.filter((i) => i.date === selectedDate)).pop()
        if (!last) throw new Error(`No meals are logged on ${selectedDate}. Pass a meal target_id from get_day.`)
        key = last.key
        resolvedFrom = `no meal card is open in the app, so the latest meal of ${selectedDate}`
      }
    } else if (raw.toLowerCase() === 'latest') {
      const last = groupIntoMeals(state.meals.filter((i) => i.date === selectedDate)).pop()
      if (!last) throw new Error(`No meals are logged on ${selectedDate}.`)
      key = last.key
      resolvedFrom = `the latest meal of ${selectedDate}`
    } else if (idMatch) {
      key = `${idMatch[1]}T${idMatch[2].padStart(5, '0')}`
      resolvedFrom = 'the requested target_id'
    } else if (timeMatch) {
      const date = input.date === undefined ? selectedDate : resolveDate(input.date)
      key = `${date}T${timeMatch[1].padStart(2, '0')}:${timeMatch[2]}`
      resolvedFrom = `the ${timeMatch[0]} meal on ${date}`
    } else {
      throw new Error('meal must be "current", "latest", a target_id like "meal:2026-10-12T13:00", or a time like "13:00".')
    }

    const date = key.slice(0, 10)
    const dayMeals = groupIntoMeals(state.meals.filter((i) => i.date === date))
    const index = dayMeals.findIndex((m) => m.key === key)
    if (index === -1) {
      const times = dayMeals.map((m) => m.time)
      throw new Error(
        times.length > 0
          ? `There is no meal at ${key.slice(11)} on ${date}. Meals that day: ${times.join(', ')}.`
          : `No meals are logged on ${date}. Logged days run from ${state.dates[0]} to ${latestDate}.`
      )
    }

    const weightEntries = await optional(loadBody('weight'))
    const weightKg = weightEntries ? weightAtOrBefore(weightEntries, date)?.weightKg ?? null : null
    const day = buildDaySummaryData({ meals: state.meals, goalsByDate: state.goalsByDate, dates: state.dates, date })

    return {
      date,
      resolved_from: resolvedFrom,
      next_step: nextStep(`"${mealTarget({ key })}"`),
      is_open_in_app: state.focusedMealKey === key,
      ...mealDetail(dayMeals[index]),
      day_context: {
        day_target_id: dayTarget(date),
        meal_number: index + 1,
        meal_count: dayMeals.length,
        previous_meal_time: dayMeals[index - 1]?.time ?? null,
        next_meal_time: dayMeals[index + 1]?.time ?? null,
        day_goals: day.goals ? macros(day.goals) : null,
        day_totals: macros(day.totals),
        body_weight_kg: weightKg,
      },
    }
  },
}

const getTimeline: WebMcpTool = {
  name: 'get_timeline',
  title: 'Get the timeline',
  description:
    "Returns a period as the user logged it: every distinct food eaten in it (times logged, days, total portions, grams, macros and fat breakdown), every blood glucose reading with its meal, daily rows (macros against goals, meal count, overnight fast, water, body weight) and the period's medians (macros, protein per kg, overnight fast, water). Use for trends, habits and long-term recommendations; use get_day or get_meal for item-level detail of specific days.",
  inputSchema: {
    type: 'object',
    properties: {
      range_days: {
        type: 'string',
        description: 'How many of the most recent logged days to include: "7", "30" (default), "90" or "all".',
      },
      food: {
        type: 'string',
        description: 'Optional exact food name from the log to restrict the macros to that one food, e.g. "Huevo".',
      },
      skip_last_day: {
        type: 'boolean',
        description: 'Leave out the most recent day, which may still be incomplete. Default false.',
      },
    },
  },
  annotations: { readOnlyHint: true, untrustedContentHint: true },
  async execute(input) {
    const state = requireData()
    const rangeRaw = String(input.range_days ?? '30').trim().toLowerCase()
    const range = rangeRaw === 'all' ? 0 : Number.parseInt(rangeRaw, 10)
    if (Number.isNaN(range) || range < 0) throw new Error('range_days must be a number of days like "30", or "all".')

    let items = state.meals
    const food = typeof input.food === 'string' && input.food.trim() ? input.food.trim() : null
    if (food) {
      items = state.meals.filter((i) => i.food.toLowerCase() === food.toLowerCase())
      if (items.length === 0) {
        throw new Error(`No logged food is named "${food}". Use the exact name as it appears in get_day items.`)
      }
    }

    let days = aggregateByDay(state.meals, state.goalsByDate)
    if (range > 0) days = days.slice(-range)
    if (input.skip_last_day === true) days = days.slice(0, -1)
    const dates = days.map((d) => d.date)

    const [weightEntries, liquidEntries] = await Promise.all([
      optional(loadBody('weight')),
      optional(loadBody('liquids')),
    ])
    const waterByDate = liquidEntries ? dailyTotalMlByDate(liquidEntries) : null
    const mealsByDate = new Map<string, Meal[]>()
    for (const meal of groupIntoMeals(state.meals)) {
      const bucket = mealsByDate.get(meal.date)
      if (bucket) bucket.push(meal)
      else mealsByDate.set(meal.date, [meal])
    }
    const filteredByDate = food ? aggregateByDay(items, {}) : null
    const filteredTotals = new Map(filteredByDate?.map((d) => [d.date, d.totals]))

    const rows = days.map((d) => {
      const weightKg = weightEntries ? weightAtOrBefore(weightEntries, d.date)?.weightKg ?? null : null
      const dayMeals = mealsByDate.get(d.date) ?? []
      const totals = food ? filteredTotals.get(d.date) ?? { protein: 0, carbs: 0, fat: 0, fiber: 0, calories: 0 } : d.totals
      return {
        date: d.date,
        totals: macros(totals),
        goals: d.goals ? macros(d.goals) : null,
        meal_count: d.mealCount,
        overnight_fast: dayMeals[0]?.items[0]?.fastingSincePrev ?? null,
        water_ml: waterByDate ? waterByDate.get(d.date) ?? 0 : null,
        body_weight_kg: weightKg,
      }
    })

    const medianMacros = medianTotals(items, dates)
    const inRangeWeights =
      weightEntries && dates.length > 0
        ? weightEntries.filter((e) => e.date >= dates[0] && e.date <= dates[dates.length - 1]).map((e) => e.weightKg)
        : []
    const medianWeight = inRangeWeights.length > 0 ? median(inRangeWeights) : null
    const fasts = rows.map((r) => parseFastingMinutes(r.overnight_fast)).filter((v): v is number => v !== null)

    // Every distinct food in the period (or just the filtered one), most often logged first.
    const inRange = new Set(dates)
    const byFood = new Map<string, MealItem[]>()
    for (const i of items) {
      if (!inRange.has(i.date)) continue
      const bucket = byFood.get(i.food)
      if (bucket) bucket.push(i)
      else byFood.set(i.food, [i])
    }
    const foods = [...byFood.entries()]
      .map(([name, rowsOfFood]) => ({
        food: name,
        food_type: rowsOfFood[0].foodType,
        times_logged: rowsOfFood.length,
        days_logged: new Set(rowsOfFood.map((i) => i.date)).size,
        total_portions: r2(rowsOfFood.reduce((sum, i) => sum + i.quantity, 0)),
        total_grams: r2(rowsOfFood.reduce((sum, i) => sum + i.grams, 0)),
        totals: macros(
          rowsOfFood.reduce(
            (sum, i) => ({
              protein: sum.protein + i.protein,
              carbs: sum.carbs + i.carbs,
              fat: sum.fat + i.fat,
              fiber: sum.fiber + i.fiber,
              calories: sum.calories + i.calories,
            }),
            { protein: 0, carbs: 0, fat: 0, fiber: 0, calories: 0 }
          )
        ),
        fat_breakdown_totals: fatBreakdownTotals(rowsOfFood),
      }))
      .sort((a, b) => b.times_logged - a.times_logged || b.total_grams - a.total_grams)

    // Glucose readings describe a whole meal, so each comes with that meal's foods and totals.
    const glucoseReadings = dates.flatMap((date) =>
      (mealsByDate.get(date) ?? []).flatMap((meal) =>
        meal.items
          .filter((i) => i.glucose)
          .map((i) => ({
            meal_target_id: mealTarget(meal),
            date,
            time: meal.time,
            ...glucose(i.glucose!),
            meal_totals: macros(meal.totals),
            meal_foods: meal.items.map((m) => m.food),
          }))
      )
    )

    return {
      target_ids: { chart: 'timeline:chart', medians: 'timeline:medians' },
      next_step: nextStep('"timeline:medians" (period-level conclusions) or "timeline:chart" (day-to-day trends)'),
      range: rangeRaw === 'all' ? 'all logged days' : `last ${range} logged days`,
      food_filter: food,
      day_count: rows.length,
      medians: {
        macros_per_day: medianMacros ? macros(medianMacros) : null,
        protein_g_per_kg_body_weight: medianMacros && medianWeight ? r2(medianMacros.protein / medianWeight) : null,
        body_weight_kg: medianWeight,
        overnight_fast_minutes: fasts.length > 0 ? median(fasts) : null,
        water_ml: waterByDate ? median(rows.map((r) => r.water_ml ?? 0)) : null,
      },
      distinct_food_count: foods.length,
      foods,
      blood_glucose_readings: glucoseReadings,
      days: rows,
    }
  },
}

const getBodyData: WebMcpTool = {
  name: 'get_body_data',
  title: 'Get body data',
  description:
    'Returns the body measurements behind the Weight, BIA and Liquids pages from the linked Google Sheet: weigh-ins, bioimpedance measurements (body fat, visceral fat, muscle mass, BMI) or every logged drink with daily totals. Each result includes the panel target ids for show_ai_analysis.',
  inputSchema: {
    type: 'object',
    properties: {
      kind: {
        type: 'string',
        enum: ['weight', 'bia', 'liquids'],
        description: 'Which data: "weight" (weigh-ins), "bia" (bioimpedance) or "liquids" (drinks and water).',
      },
      from: { type: 'string', description: 'Optional first date to include, YYYY-MM-DD.' },
      to: { type: 'string', description: 'Optional last date to include, YYYY-MM-DD.' },
    },
    required: ['kind'],
  },
  annotations: { readOnlyHint: true, untrustedContentHint: true },
  async execute(input) {
    const kind = String(input.kind ?? '').trim().toLowerCase()
    if (kind !== 'weight' && kind !== 'bia' && kind !== 'liquids') {
      throw new Error('kind must be "weight", "bia" or "liquids".')
    }
    const from = typeof input.from === 'string' ? input.from.trim() : ''
    const to = typeof input.to === 'string' ? input.to.trim() : ''
    const inRange = (date: string) => (!from || date >= from) && (!to || date <= to)
    const section = kind === 'liquids' ? 'liquids' : kind
    const target_ids = {
      summary: `${section}:summary`,
      trends: `${section}:trends`,
      history: `${section}:history`,
    }
    const next_step = nextStep(`"${target_ids.summary}", "${target_ids.trends}" or "${target_ids.history}"`)

    if (kind === 'weight') {
      const entries = (await loadBody('weight')).filter((e) => inRange(e.date))
      return {
        kind,
        target_ids,
        next_step,
        entry_count: entries.length,
        entries: entries.map((e) => ({ date: e.date, weight_kg: e.weightKg, notes: e.notes })),
      }
    }
    if (kind === 'bia') {
      const entries = (await loadBody('bia')).filter((e) => inRange(e.date))
      return {
        kind,
        target_ids,
        next_step,
        entry_count: entries.length,
        entries: entries.map((e) => ({
          date: e.date,
          weight_kg: e.weightKg,
          body_fat_pct: e.bodyFatPct,
          body_fat_kg: e.bodyFatKg,
          visceral_fat: e.visceralFat,
          muscle_mass_pct: e.muscleMassPct,
          muscle_mass_kg: e.muscleMassKg,
          bmi: e.bmi,
          notes: e.notes,
        })),
      }
    }
    const entries = (await loadBody('liquids')).filter((e) => inRange(e.date))
    const daily = [...dailyTotalMlByDate(entries)].sort(([a], [b]) => a.localeCompare(b))
    return {
      kind,
      target_ids,
      next_step,
      daily_totals_ml: daily.map(([date, ml]) => ({ date, total_ml: ml })),
      entry_count: entries.length,
      entries: entries.map((e) => ({
        date: e.date,
        start: e.startTime,
        end: e.endTime,
        type: e.liquidType,
        amount_ml: e.amountMl,
        effective_amount_ml: e.realAmountMl,
        notes: e.notes,
      })),
    }
  },
}

const PRIORITIES: AiPriority[] = ['high', 'medium', 'low']

const showAiAnalysis: WebMcpTool = {
  name: 'show_ai_analysis',
  title: 'Show AI analysis in Ninfo',
  description:
    "Displays your analysis on one panel of Ninfo: a day, a meal, or a section panel (target ids come from get_app_overview, get_day, get_timeline and get_body_data). The user sees an AI icon with a dot on that panel and opens it to read it. Calling again for the same target replaces the previous analysis. It only changes what this browser shows; nothing is sent anywhere. Write in the app's language (get_app_overview.app_language), as plain text without markdown.",
  inputSchema: {
    type: 'object',
    properties: {
      target: {
        type: 'string',
        description: 'Where to show it, e.g. "day:2026-10-12", "meal:2026-10-12T13:00" or "timeline:medians".',
      },
      title: { type: 'string', description: 'Optional short headline, e.g. "Good protein, low fiber".' },
      summary: {
        type: 'string',
        description: 'The overall assessment in 1–4 short paragraphs. Plain text; separate paragraphs with a blank line.',
      },
      recommendations: {
        type: 'array',
        description: 'Concrete, actionable suggestions, most important first (up to 12).',
        items: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'The suggestion in one line, e.g. "Add a fiber source at lunch".' },
            detail: { type: 'string', description: 'Optional why/how, a sentence or two.' },
            priority: { type: 'string', enum: PRIORITIES, description: 'Optional: "high", "medium" or "low".' },
          },
          required: ['title'],
        },
      },
      estimates: {
        type: 'array',
        description:
          'Optional figures you calculated that the app does not, e.g. micronutrients, fat breakdowns or a refined mTORC1/leucine estimate (up to 40).',
        items: {
          type: 'object',
          properties: {
            label: { type: 'string', description: 'What it is, e.g. "Vitamin D" or "Leucine".' },
            value: { type: 'string', description: 'The value with units and context, e.g. "6 µg (30% DV)".' },
            note: { type: 'string', description: 'Optional caveat or source.' },
          },
          required: ['label', 'value'],
        },
      },
      observations: {
        type: 'array',
        description: 'Optional short factual observations, one sentence each (up to 12).',
        items: { type: 'string' },
      },
    },
    required: ['target', 'summary'],
  },
  async execute(input) {
    const state = requireData()
    const target = cleanText(input.target, 64, 'target', true)!
    const dayMatch = target.match(/^day:(\d{4}-\d{2}-\d{2})$/)
    const mealMatch = target.match(/^meal:(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})$/)
    let where: string
    if (isPanelTarget(target)) {
      where = PANEL_TARGETS[target]
    } else if (dayMatch) {
      if (!state.dates.includes(dayMatch[1])) {
        throw new Error(`No meals are logged on ${dayMatch[1]}, so there is no day panel for it. Use a date returned by get_timeline.`)
      }
      where = `The day summary for ${dayMatch[1]} on the Today page (AI icon next to the mTORC1 count).`
    } else if (mealMatch) {
      const exists = state.meals.some((i) => i.date === mealMatch[1] && i.time === mealMatch[2])
      if (!exists) {
        throw new Error(`There is no meal at ${mealMatch[2]} on ${mealMatch[1]}. Use a meal target_id returned by get_day.`)
      }
      where = `The ${mealMatch[2]} meal card on ${mealMatch[1]} (AI icon in the card header).`
    } else {
      throw new Error(
        `Unknown target "${target}". Use "day:YYYY-MM-DD", "meal:YYYY-MM-DDTHH:MM" or one of: ${Object.keys(PANEL_TARGETS).join(', ')}.`
      )
    }

    const feedback: AiFeedback = {
      target,
      title: cleanText(input.title, 160, 'title'),
      summary: cleanText(input.summary, 4000, 'summary', true)!,
      recommendations: cleanList(input.recommendations, 12, 'recommendations').map((rec, i) => {
        const r = (rec ?? {}) as Record<string, unknown>
        const priority = typeof r.priority === 'string' ? r.priority.trim().toLowerCase() : ''
        return {
          title: cleanText(r.title, 200, `recommendations[${i}].title`, true)!,
          detail: cleanText(r.detail, 1200, `recommendations[${i}].detail`),
          priority: PRIORITIES.includes(priority as AiPriority) ? (priority as AiPriority) : null,
        }
      }),
      estimates: cleanList(input.estimates, 40, 'estimates').map((est, i) => {
        const e = (est ?? {}) as Record<string, unknown>
        return {
          label: cleanText(e.label, 80, `estimates[${i}].label`, true)!,
          value: cleanText(e.value, 120, `estimates[${i}].value`, true)!,
          note: cleanText(e.note, 300, `estimates[${i}].note`),
        }
      }),
      observations: cleanList(input.observations, 12, 'observations').map(
        (obs, i) => cleanText(obs, 600, `observations[${i}]`, true)!
      ),
      receivedAt: new Date().toISOString(),
      unread: true,
    }
    useAiFeedbackStore.getState().setFeedback(feedback)
    return {
      target,
      shown: true,
      where,
      note: 'The user sees an AI icon with a dot on that panel; tell them where to look.',
    }
  },
}

export const NINFO_TOOLS: WebMcpTool[] = [getAppOverview, getDay, getMeal, getTimeline, getBodyData, showAiAnalysis]
