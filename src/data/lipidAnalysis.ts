import type { LipidTotals } from './types'

/**
 * Heuristic thresholds for the fat-quality warnings on meal cards. These are common
 * rule-of-thumb figures from nutrition guidance (AHA/WHO-style saturated-fat limits,
 * the widely-cited omega-6:omega-3 balance target), not a personalized clinical
 * assessment — surfaced to the user as "commonly cited guidance" in the tooltip copy.
 */
export const FAT_WARNING_THRESHOLDS = {
  /** Below this much total fat in a meal, ratio-based warnings are skipped as noise. */
  minFatGramsForRatioWarnings: 3,
  /** Warn when saturated fat is more than this share of the meal's total fat. */
  saturatedShareOfFat: 0.4,
  /** Warn when the omega-6:omega-3 ratio exceeds this (common cited healthy upper bound is ~4:1). */
  omega6to3Ratio: 4,
  /** Below this much combined omega-6+omega-3 in a meal, the ratio warning is skipped as noise. */
  minOmegaGramsForRatioWarning: 0.5,
  /** Warn when trans/"Tóx" fat is at least this many grams (guidance treats any amount as unsafe). */
  minTransFatGrams: 0.05,
} as const

export interface FatBreakdown {
  totalFat: number
  unsaturated: number // omega3 + omega6 + omega9
  saturated: number // scfa + mcfa + lcfa
  trans: number // "Tóx"
  omega3: number
  omega6: number
  /** null when there isn't enough omega-3/6 data to compute a ratio */
  omega6to3Ratio: number | null
  warnings: {
    saturatedHigh: boolean
    omegaImbalance: boolean
    transFatPresent: boolean
  }
}

export function analyzeFat(lipids: LipidTotals, totalFat: number): FatBreakdown {
  const unsaturated = lipids.omega3 + lipids.omega6 + lipids.omega9
  const saturated = lipids.scfa + lipids.mcfa + lipids.lcfa
  const trans = lipids.tox

  const hasEnoughFat = totalFat >= FAT_WARNING_THRESHOLDS.minFatGramsForRatioWarnings
  const saturatedHigh =
    hasEnoughFat && saturated / totalFat > FAT_WARNING_THRESHOLDS.saturatedShareOfFat

  let omega6to3Ratio: number | null = null
  if (lipids.omega6 > 0 || lipids.omega3 > 0) {
    omega6to3Ratio = lipids.omega3 > 0 ? lipids.omega6 / lipids.omega3 : Infinity
  }
  const hasEnoughOmega =
    lipids.omega6 + lipids.omega3 >= FAT_WARNING_THRESHOLDS.minOmegaGramsForRatioWarning
  const omegaImbalance =
    hasEnoughOmega &&
    omega6to3Ratio !== null &&
    omega6to3Ratio > FAT_WARNING_THRESHOLDS.omega6to3Ratio

  const transFatPresent = trans >= FAT_WARNING_THRESHOLDS.minTransFatGrams

  return {
    totalFat,
    unsaturated,
    saturated,
    trans,
    omega3: lipids.omega3,
    omega6: lipids.omega6,
    omega6to3Ratio,
    warnings: { saturatedHigh, omegaImbalance, transFatPresent },
  }
}
