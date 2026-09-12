import type { FatBreakdown } from './lipidAnalysis'
import { FAT_WARNING_THRESHOLDS } from './lipidAnalysis'
import type { GlycemicRisk } from './glycemicRisk'
import { GLUCOSE_SPIKE_THRESHOLDS } from './glycemicRisk'

export interface WarningStamp {
  key: string
  stamp: string
  description: string
}

type Translate = (key: string, options?: Record<string, unknown>) => string

const round = (n: number) => Math.round(n * 10) / 10

/**
 * The octagon-stamp + description list shown in a warnings view — same thresholds whether
 * it's for a single meal or a full day's totals, just different i18n copy ('meals.warnings'
 * says "this meal", 'today.warnings' says "today").
 */
export function buildWarningStamps(
  fat: FatBreakdown,
  glycemic: GlycemicRisk,
  t: Translate,
  namespace: 'meals' | 'today'
): WarningStamp[] {
  const omegaRatio =
    fat.omega6to3Ratio === Infinity || fat.omega6to3Ratio === null
      ? t('meals.warnings.omegaImbalance.undefinedRatio')
      : `${round(fat.omega6to3Ratio)}:1`

  const stamps: WarningStamp[] = []

  if (fat.warnings.saturatedHigh) {
    stamps.push({
      key: 'saturatedFat',
      stamp: t(`${namespace}.warnings.saturatedFat.stamp`),
      description: t(`${namespace}.warnings.saturatedFat.body`, {
        grams: round(fat.saturated),
        pct: Math.round((fat.saturated / fat.totalFat) * 100),
        threshold: Math.round(FAT_WARNING_THRESHOLDS.saturatedShareOfFat * 100),
      }),
    })
  }

  if (fat.warnings.omegaImbalance) {
    stamps.push({
      key: 'omegaImbalance',
      stamp: t(`${namespace}.warnings.omegaImbalance.stamp`),
      description: t(`${namespace}.warnings.omegaImbalance.body`, {
        ratio: omegaRatio,
        threshold: FAT_WARNING_THRESHOLDS.omega6to3Ratio,
      }),
    })
  }

  if (fat.warnings.transFatPresent) {
    stamps.push({
      key: 'transFat',
      stamp: t(`${namespace}.warnings.transFat.stamp`),
      description: t(`${namespace}.warnings.transFat.body`, { grams: round(fat.trans) }),
    })
  }

  if (glycemic.spikeRisk) {
    stamps.push({
      key: 'glucoseSpike',
      stamp: t(`${namespace}.warnings.glucoseSpike.stamp`),
      description: t(`${namespace}.warnings.glucoseSpike.body`, {
        pct: Math.round(glycemic.carbsShareOfCalories * 100),
        minProtein: GLUCOSE_SPIKE_THRESHOLDS.minProteinGrams,
        minFat: GLUCOSE_SPIKE_THRESHOLDS.minFatGrams,
      }),
    })
  }

  return stamps
}
