import type { MacroTotals } from './types'

/**
 * Heuristic thresholds for flagging a meal likely to spike blood glucose: carb-dominant
 * with too little protein or fat to slow absorption. Common pairing guidance (not a
 * clinical/personalized assessment) — surfaced as such in the tooltip copy.
 */
export const GLUCOSE_SPIKE_THRESHOLDS = {
  /** A meal needs at least this many carb grams before "high carb" is considered at all. */
  minCarbsGrams: 30,
  /** ...and carbs must make up at least this share of the meal's calories. */
  minCarbsShareOfCalories: 0.5,
  /** Below this much protein, a meal doesn't have "enough" to slow glucose absorption. */
  minProteinGrams: 15,
  /** Below this much fat, a meal doesn't have "enough" to slow glucose absorption. */
  minFatGrams: 10,
} as const

export interface GlycemicRisk {
  carbsShareOfCalories: number
  isHighCarb: boolean
  hasEnoughProtein: boolean
  hasEnoughFat: boolean
  /** High carb AND lacking both protein and fat to buffer it. */
  spikeRisk: boolean
}

export function analyzeGlycemicRisk(totals: MacroTotals): GlycemicRisk {
  const carbCalories = totals.carbs * 4
  const carbsShareOfCalories = totals.calories > 0 ? carbCalories / totals.calories : 0

  const isHighCarb =
    totals.carbs >= GLUCOSE_SPIKE_THRESHOLDS.minCarbsGrams &&
    carbsShareOfCalories >= GLUCOSE_SPIKE_THRESHOLDS.minCarbsShareOfCalories
  const hasEnoughProtein = totals.protein >= GLUCOSE_SPIKE_THRESHOLDS.minProteinGrams
  const hasEnoughFat = totals.fat >= GLUCOSE_SPIKE_THRESHOLDS.minFatGrams

  return {
    carbsShareOfCalories,
    isHighCarb,
    hasEnoughProtein,
    hasEnoughFat,
    spikeRisk: isHighCarb && !hasEnoughProtein && !hasEnoughFat,
  }
}
