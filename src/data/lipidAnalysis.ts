import type { LipidTotals } from './types'

/**
 * Heuristic thresholds for the fat-quality warnings on meal cards. These are common
 * rule-of-thumb figures from nutrition guidance (the Mediterranean / "Mediterranean keto"
 * fat balance, the widely-cited omega-6:omega-3 balance target), not a personalized clinical
 * assessment — surfaced to the user as "commonly cited guidance" in the tooltip copy.
 */
export const FAT_WARNING_THRESHOLDS = {
  /** Below this much total fat in a meal, ratio-based warnings are skipped as noise. */
  minFatGramsForRatioWarnings: 3,
  /**
   * Warn when the unsaturated:saturated ratio falls below this (i.e. saturated is more than
   * 1/5 of fat). A deliberately stricter target than the ~2:1 Mediterranean-keto balance.
   * Expressed unsaturated-first, like the P:S ratio, so higher is better.
   * Share-of-fat rather than %-of-calories, since a 10%-of-energy cap would flag every keto meal.
   */
  minUnsatToSatRatio: 4,
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
  /** null when there's no saturated/unsaturated data; Infinity when there's no saturated fat */
  unsatToSatRatio: number | null
  /** Saturated share of the lipid breakdown (sat + unsat + trans), 0 when there's no data */
  saturatedShareOfFat: number
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

  // Ratios come from the lipid breakdown itself rather than the separately reported fat total,
  // which doesn't always agree with the breakdown in the source data.
  const lipidFat = unsaturated + saturated + trans
  const saturatedShareOfFat = lipidFat > 0 ? saturated / lipidFat : 0
  let unsatToSatRatio: number | null = null
  if (saturated > 0 || unsaturated > 0) {
    unsatToSatRatio = saturated > 0 ? unsaturated / saturated : Infinity
  }
  const hasEnoughFat = lipidFat >= FAT_WARNING_THRESHOLDS.minFatGramsForRatioWarnings
  const saturatedHigh =
    hasEnoughFat &&
    unsatToSatRatio !== null &&
    unsatToSatRatio < FAT_WARNING_THRESHOLDS.minUnsatToSatRatio

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
    unsatToSatRatio,
    saturatedShareOfFat,
    omega6to3Ratio,
    warnings: { saturatedHigh, omegaImbalance, transFatPresent },
  }
}
