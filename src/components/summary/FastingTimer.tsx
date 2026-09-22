import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, Droplet } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { dailyTotals, groupIntoMeals } from '../../data/aggregate/dailyTotals'
import { todayLocalIso } from '../../utils/localDate'
import { MACRO_KEYS, MACRO_UNITS } from '../../data/types'
import { getSheetLink } from '../../db/sheetLinkStorage'
import { parseGoogleSheetUrl } from '../../utils/googleSheetUrl'
import { LiquidoSource } from '../../data/sources/LiquidoSource'
import type { LiquidEntry } from '../../data/parsers/liquidoParser'
import { dailyTotalMlByDate } from '../../data/liquidUtils'
import { PesoSource } from '../../data/sources/PesoSource'
import type { WeightEntry } from '../../data/parsers/pesoParser'
import { getCachedLatestWeight, setCachedLatestWeight } from '../../db/latestWeightCache'
import { getCachedLatestWater, setCachedLatestWater } from '../../db/latestWaterCache'
import GoalProgressRing from './GoalProgressRing'

type MacroSource = 'lastDay' | 'lastMeal'

const COLOR_VARS: Record<string, string> = {
  protein: '--macro-protein',
  carbs: '--macro-carbs',
  fat: '--macro-fat',
  fiber: '--macro-fiber',
  calories: '--macro-calories',
}

// Common daily water intake guideline, applied to body weight to get a personal goal — same
// figure DaySummarySwiper uses for the day summary's own water ring.
const WATER_ML_PER_KG = 35

/** Last weigh-in at or before the given date, from an ascending-by-date list — so a past day's
 * water goal reflects the weight known at the time, not today's. */
function weightAtOrBefore(sortedEntries: WeightEntry[], date: string): WeightEntry | null {
  let result: WeightEntry | null = null
  for (const e of sortedEntries) {
    if (e.date <= date) result = e
    else break
  }
  return result
}

function formatDateLabel(iso: string, locale: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${h}:${pad(m)}:${pad(s)}`
}

/** Shown on the Today page — a live "how long since your last meal" clock. Without today's data
 * it's shown in full: subtitle, big clock, last-meal date, liquid intake (if any), and a macros
 * section (last day's totals, or a tab away, the last meal's) — it's the only thing on the page
 * then (see Today.tsx), and it carries a "previous day" arrow — the same control DaySummarySwiper
 * shows in the normal view, just floated over this card instead — that steps the app's actual
 * selected date rather than a private copy, so using it pins the date chip and reveals the real
 * day summary/meal list (Today.tsx renders those, and stops rendering this component, once a
 * past date is pinned) instead of a second, stripped-down copy of the same gauges. There's no
 * "next" arrow: this view only ever shows today, so there's never a later day to step to. Once
 * today has data, all of that collapses to a permanent, non-interactive title+clock strip — the
 * real day summary/meal list are already on screen right below with their own "previous day"
 * arrow, so there's nothing left for expanding this panel to add. Ticks every second via its own
 * interval since this is the one place in the app that shows a genuinely live (not just
 * periodically-refreshed) value. */
export default function FastingTimer() {
  const { t, i18n } = useTranslation()
  const meals = useAppStore((s) => s.meals)
  const dates = useAppStore((s) => s.dates)
  const goalsByDate = useAppStore((s) => s.goalsByDate)
  const sheetLinkId = useAppStore((s) => s.sheetLinkId)
  const stepDate = useAppStore((s) => s.stepDate)

  const todayIso = todayLocalIso()
  const hasTodayData = dates.includes(todayIso)

  const [macroSource, setMacroSource] = useState<MacroSource>('lastDay')

  const lastMeal = useMemo(() => {
    const grouped = groupIntoMeals(meals)
    return grouped.length > 0 ? grouped[grouped.length - 1] : null
  }, [meals])

  // The most recent logged day that isn't today itself — same "nearest earlier day with data"
  // baseline DaySummaryCard's own "vs. yesterday" uses, so it stays meaningful even once today
  // has its own data (where it'd otherwise just be a stand-in for "today").
  const lastDayDate = useMemo(() => {
    const priorDates = dates.filter((d) => d < todayIso)
    return priorDates.length > 0 ? priorDates[priorDates.length - 1] : null
  }, [dates, todayIso])
  const lastDayTotals = useMemo(() => (lastDayDate ? dailyTotals(meals, lastDayDate) : null), [meals, lastDayDate])
  const lastDayGoals = lastDayDate ? (goalsByDate[lastDayDate] ?? null) : null
  // Falls back to "last meal" if there's no earlier logged day at all (e.g. the very first day
  // ever logged) — the tab stays disabled in that case, but the default shouldn't render
  // all-zero rings.
  const effectiveMacroSource: MacroSource = macroSource === 'lastDay' && !lastDayTotals ? 'lastMeal' : macroSource
  const macroTotals = effectiveMacroSource === 'lastDay' ? lastDayTotals : (lastMeal?.totals ?? null)
  // A single meal doesn't have its own goal (goals are daily) — only the "last day" totals fill
  // against one, the same convention Timeline/DaySummaryCard use for any non-whole-day total.
  const macroGoals = effectiveMacroSource === 'lastDay' ? lastDayGoals : null

  // Water intake and its goal — loaded the same way DaySummarySwiper loads them for the day
  // summary's own water ring, from the same linked sheet's "Líquido"/"Peso" tabs if any, with no
  // dedicated error UI since the rest of this panel is still useful without them.
  const [liquidEntries, setLiquidEntries] = useState<LiquidEntry[]>([])
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([])
  useEffect(() => {
    const spreadsheetId = sheetLinkId
      ? parseGoogleSheetUrl(getSheetLink(sheetLinkId)?.url ?? '')?.spreadsheetId ?? null
      : null
    if (!spreadsheetId) {
      setLiquidEntries([])
      setWeightEntries([])
      return
    }
    let cancelled = false

    const cachedWeight = getCachedLatestWeight(spreadsheetId)
    if (cachedWeight) setWeightEntries([{ date: cachedWeight.date, weightKg: cachedWeight.weightKg, notes: null }])
    const cachedWater = getCachedLatestWater(spreadsheetId)
    if (cachedWater) {
      setLiquidEntries([
        {
          date: cachedWater.date,
          startTime: null,
          endTime: null,
          duration: null,
          liquidType: 'Agua',
          amountMl: cachedWater.totalMl,
          realAmountMl: cachedWater.totalMl,
          dailyTotalMl: cachedWater.totalMl,
          notes: null,
        },
      ])
    }

    new LiquidoSource(spreadsheetId)
      .load()
      .then((result) => {
        if (cancelled) return
        setLiquidEntries(result)
        const byDate = dailyTotalMlByDate(result)
        const latestDate = [...byDate.keys()].sort().pop()
        if (latestDate) setCachedLatestWater(spreadsheetId, { date: latestDate, totalMl: byDate.get(latestDate)! })
      })
      .catch(() => {
        if (!cancelled && !cachedWater) setLiquidEntries([])
      })
    new PesoSource(spreadsheetId)
      .load()
      .then((result) => {
        if (cancelled) return
        setWeightEntries(result)
        const latest = result[result.length - 1]
        if (latest) setCachedLatestWeight(spreadsheetId, { date: latest.date, weightKg: latest.weightKg })
      })
      .catch(() => {
        if (!cancelled && !cachedWeight) setWeightEntries([])
      })
    return () => {
      cancelled = true
    }
  }, [sheetLinkId])

  const waterByDate = useMemo(() => dailyTotalMlByDate(liquidEntries), [liquidEntries])
  const waterGoalMlForDate = (date: string): number | null => {
    const entry = weightAtOrBefore(weightEntries, date)
    return entry ? entry.weightKg * WATER_ML_PER_KG : null
  }

  const todayWaterMl = waterByDate.get(todayIso) ?? null
  const todayWaterGoalMl = waterGoalMlForDate(todayIso)
  const lastDayWaterMl = lastDayDate ? (waterByDate.get(lastDayDate) ?? null) : null
  const lastDayWaterGoalMl = lastDayDate ? waterGoalMlForDate(lastDayDate) : null

  // The prev-day arrow only makes sense once today has no data of its own to show — otherwise
  // the normal view (with its own arrow) is already on screen right below this panel.
  const showPrevDayArrow = !hasTodayData
  const canGoPrevDay = dates.length > 0

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  // Once today has its own data, this panel permanently collapses to a title+clock strip — see
  // the doc comment above for why there's nothing left to expand it into.
  const isOpen = !hasTodayData
  const title = hasTodayData ? t('fasting.title') : t('fasting.noEntriesTodayTitle')
  const elapsed = lastMeal
    ? formatElapsed(now.getTime() - new Date(`${lastMeal.date}T${lastMeal.time}`).getTime())
    : null

  const header = (
    <>
      <h2>{title}</h2>
      {isOpen && lastMeal && <p className="hint">{t('fasting.sinceLastMeal')}</p>}
      {elapsed ? (
        <div className={'fasting-timer-clock' + (isOpen ? '' : ' fasting-timer-clock--compact')}>{elapsed}</div>
      ) : (
        <p className="hint">{t('fasting.noMealsYet')}</p>
      )}
    </>
  )

  return (
    <div className="fasting-timer-viewport">
      <section className={'card fasting-timer-card' + (isOpen ? '' : ' fasting-timer-card--compact')}>
        {/* Desktop splits into time+liquids (left) / last day's macros (right) — see the
            max-width:640px override, which stacks it back to one column on mobile. The class
            only applies to the full (no-data-today) view; the compact strip has nothing to
            split. */}
        <div className={isOpen ? 'fasting-timer-columns' : undefined}>
          <div className={isOpen ? 'fasting-timer-col-left' : undefined}>
            {header}

            {isOpen && lastMeal && (
              <p className="fasting-timer-last-meal">
                {t('fasting.lastMealLabel', {
                  date: formatDateLabel(lastMeal.date, i18n.language),
                  time: lastMeal.time,
                })}
              </p>
            )}

            {isOpen && todayWaterMl != null && (
              <>
                <hr className="fasting-divider" />
                <div className="fasting-water-row">
                  {/* 80% of GoalProgressRing's own 86px dial, so the icon reads as a matched
                      pair with the gauge instead of a small decoration next to it. */}
                  <Droplet size={69} className="fasting-water-icon" />
                  <GoalProgressRing
                    label={t('today.waterIntake')}
                    value={todayWaterMl}
                    goal={todayWaterGoalMl}
                    unit="ml"
                    colorVar="--water-blue"
                  />
                </div>
                {/* Only meaningful on mobile, where the macros section stacks below it in the
                    same column — on desktop it's the last thing in the left column, so there's
                    nothing below to separate from (see the max-width:640px override). */}
                <hr className="fasting-divider fasting-divider--trailing" />
              </>
            )}
          </div>

          {isOpen && lastMeal && (
            <div className="fasting-timer-col-right">
              <div className="fasting-macros-section">
                <div className="macro-view-tabs" role="tablist" aria-label={t('fasting.macroSourceAriaLabel')}>
                  <button
                    className={'range-button' + (effectiveMacroSource === 'lastDay' ? ' range-button--active' : '')}
                    onClick={() => setMacroSource('lastDay')}
                    role="tab"
                    aria-selected={effectiveMacroSource === 'lastDay'}
                    disabled={!lastDayTotals}
                  >
                    {t('fasting.lastDayTab')}
                  </button>
                  <button
                    className={'range-button' + (effectiveMacroSource === 'lastMeal' ? ' range-button--active' : '')}
                    onClick={() => setMacroSource('lastMeal')}
                    role="tab"
                    aria-selected={effectiveMacroSource === 'lastMeal'}
                  >
                    {t('fasting.lastMealTab')}
                  </button>
                </div>
                <div className="progress-ring-row fasting-macros-rings">
                  {MACRO_KEYS.map((macro) => (
                    <GoalProgressRing
                      key={macro}
                      label={t(`common.macros.${macro}`)}
                      value={macroTotals ? macroTotals[macro] : 0}
                      goal={macroGoals ? macroGoals[macro] : null}
                      unit={MACRO_UNITS[macro]}
                      colorVar={COLOR_VARS[macro]}
                    />
                  ))}
                  {effectiveMacroSource === 'lastDay' && lastDayWaterMl != null && (
                    <GoalProgressRing
                      label={t('today.waterIntake')}
                      value={lastDayWaterMl}
                      goal={lastDayWaterGoalMl}
                      unit="ml"
                      colorVar="--water-blue"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {showPrevDayArrow && (
        <button
          className="icon-button day-summary-nav-arrow day-summary-nav-arrow--prev"
          onClick={() => canGoPrevDay && stepDate(-1)}
          disabled={!canGoPrevDay}
          aria-label={t('dateNavigator.previousDay')}
        >
          <ChevronLeft size={18} />
        </button>
      )}
    </div>
  )
}
