import type { Meal, MealItem } from './types'

/**
 * Heuristic for flagging meals that likely triggered an mTORC1 / muscle protein synthesis
 * pulse — see docs/mtorc1-pulse-criteria.md for the reasoning and references. Leucine isn't in
 * the sheet, so it's estimated from each item's protein and source; nothing here is measured,
 * which is why the UI says "likely" throughout.
 */
export const MTORC1_THRESHOLDS = {
  /** Estimated leucine for a full pulse (the "leucine trigger", ~2–3 g). */
  fullLeucineGrams: 2.5,
  /** Estimated leucine for a submaximal pulse (~20 g of mixed protein). */
  partialLeucineGrams: 1.7,
  /** Protein a full pulse also needs, per kg of body weight... */
  proteinPerKg: 0.3,
  /** ...or in absolute grams when no body weight is known. */
  fallbackProteinGrams: 25,
  /** Muscle-full refractory period: a new pulse needs this long since the last counted one. */
  refractoryMinutes: 180,
  /** Meals this close together are absorbed as one feeding window. */
  mergeWindowMinutes: 45,
  /** Full pulses per day to aim for — the low end of the usual 3–4, spaced ≥3 h apart. */
  dailyPulseTarget: 3,
} as const

const PLANT_PROTEIN = /soja|champi|poroto|lenteja|garbanzo|tofu|seit[aá]n|arveja/i
const PROTEIN_PRODUCT = /prote|whey|g4u|power|growsbar|b3st|crudda/i

/**
 * Approximate leucine share of an item's protein, from its food type plus name keywords —
 * animal and dairy proteins run ~8–10% leucine, plants ~6–7%. Deliberately coarse.
 */
export function leucineFraction(item: Pick<MealItem, 'foodType' | 'food'>): number {
  const name = item.food
  switch (item.foodType) {
    case 'Lácteo':
      return /coco/i.test(name) ? 0 : 0.095
    case 'Proteína':
      return PLANT_PROTEIN.test(name) ? 0.07 : 0.08
    case 'Procesado':
      return PROTEIN_PRODUCT.test(name) ? 0.085 : 0.07
    case 'Elaborado':
      return 0.08
    case 'Grano':
    case 'Carb':
      return 0.07
    case 'Fruto Seco':
      return 0.065
    case 'Verdura':
    case 'Fruta':
      return 0.05
    default:
      // Complemento (creatine, vitamins), Infusión, Grasa, unknown
      return 0
  }
}

export const estimateLeucine = (item: MealItem): number => item.protein * leucineFraction(item)

export type Mtorc1Status = 'full' | 'partial' | 'refractory' | 'none'

export interface FeedingWindow {
  /** The meals absorbed together, in time order (one unless some were ≤45 min apart). */
  meals: Meal[]
  start: string // HH:MM of the first meal
  protein: number
  leucine: number
  /** Protein a full pulse needs for this window — per-kg when weight is known. */
  proteinThreshold: number
  weightKg: number | null
  status: Mtorc1Status
  /** The previous counted (full/partial) window's start, and minutes since it — null if none today. */
  previousPulseStart: string | null
  minutesSincePreviousPulse: number | null
}

export interface Mtorc1Day {
  windows: FeedingWindow[]
  /** Per meal: its window — except later meals of a window that fired, which get their own
   * one-meal window marked as eaten during that pulse (see duringPulseWindow). */
  byMealKey: Map<string, FeedingWindow>
  fullPulses: number
  partialPulses: number
}

const toMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

/**
 * A later meal of a feeding window that fired: the pulse is credited to the window's first meal
 * (it started at that time), so this one is judged on its own, as eaten during that pulse —
 * "refractory" when it has enough leucine to have counted otherwise, else "none".
 */
function duringPulseWindow(meal: Meal, pulse: FeedingWindow): FeedingWindow {
  const protein = meal.items.reduce((sum, i) => sum + i.protein, 0)
  const leucine = meal.items.reduce((sum, i) => sum + estimateLeucine(i), 0)
  return {
    meals: [meal],
    start: meal.time,
    protein,
    leucine,
    proteinThreshold: pulse.proteinThreshold,
    weightKg: pulse.weightKg,
    status: leucine >= MTORC1_THRESHOLDS.partialLeucineGrams ? 'refractory' : 'none',
    previousPulseStart: pulse.start,
    minutesSincePreviousPulse: toMinutes(meal.time) - toMinutes(pulse.start),
  }
}

/** Classifies one day's meals (as from groupIntoMeals, chronological) into feeding windows. */
export function analyzeMtorc1Day(meals: Meal[], weightKg: number | null): Mtorc1Day {
  const t = MTORC1_THRESHOLDS
  const proteinThreshold = weightKg ? weightKg * t.proteinPerKg : t.fallbackProteinGrams

  const groups: Meal[][] = []
  for (const meal of meals) {
    const last = groups[groups.length - 1]
    const lastMeal = last?.[last.length - 1]
    if (lastMeal && toMinutes(meal.time) - toMinutes(lastMeal.time) <= t.mergeWindowMinutes) {
      last.push(meal)
    } else {
      groups.push([meal])
    }
  }

  const windows: FeedingWindow[] = []
  const byMealKey = new Map<string, FeedingWindow>()
  let previousPulseStart: string | null = null
  let fullPulses = 0
  let partialPulses = 0

  for (const group of groups) {
    const items = group.flatMap((m) => m.items)
    const protein = items.reduce((sum, i) => sum + i.protein, 0)
    const leucine = items.reduce((sum, i) => sum + estimateLeucine(i), 0)
    const start = group[0].time
    const minutesSincePreviousPulse =
      previousPulseStart !== null ? toMinutes(start) - toMinutes(previousPulseStart) : null

    let status: Mtorc1Status = 'none'
    if (leucine >= t.partialLeucineGrams) {
      if (minutesSincePreviousPulse !== null && minutesSincePreviousPulse < t.refractoryMinutes) {
        status = 'refractory'
      } else {
        status = leucine >= t.fullLeucineGrams && protein >= proteinThreshold ? 'full' : 'partial'
      }
    }

    const window: FeedingWindow = {
      meals: group,
      start,
      protein,
      leucine,
      proteinThreshold,
      weightKg,
      status,
      previousPulseStart,
      minutesSincePreviousPulse,
    }
    windows.push(window)
    const fired = status === 'full' || status === 'partial'
    group.forEach((meal, i) => byMealKey.set(meal.key, fired && i > 0 ? duringPulseWindow(meal, window) : window))

    if (fired) {
      previousPulseStart = start
      if (status === 'full') fullPulses++
      else partialPulses++
    }
  }

  return { windows, byMealKey, fullPulses, partialPulses }
}
