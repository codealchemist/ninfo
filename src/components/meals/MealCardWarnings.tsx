import { useTranslation } from 'react-i18next'
import { Ban, TriangleAlert, Zap } from 'lucide-react'
import type { FatBreakdown } from '../../data/lipidAnalysis'
import { FAT_WARNING_THRESHOLDS } from '../../data/lipidAnalysis'
import type { GlycemicRisk } from '../../data/glycemicRisk'
import { GLUCOSE_SPIKE_THRESHOLDS } from '../../data/glycemicRisk'
import WarningIcon from './WarningIcon'

const round = (n: number) => Math.round(n * 10) / 10

interface Props {
  fat: FatBreakdown
  glycemic: GlycemicRisk
}

/** All of a meal's risk warnings, gathered in one place for the card header. */
export default function MealCardWarnings({ fat, glycemic }: Props) {
  const { t } = useTranslation()
  const { warnings } = fat
  if (!warnings.saturatedHigh && !warnings.omegaImbalance && !warnings.transFatPresent && !glycemic.spikeRisk) {
    return null
  }

  const omegaRatio =
    fat.omega6to3Ratio === Infinity
      ? t('meals.warnings.omegaImbalance.undefinedRatio')
      : `${round(fat.omega6to3Ratio!)}:1`

  return (
    <div className="meal-card-warnings">
      {warnings.saturatedHigh && (
        <WarningIcon icon={TriangleAlert} tone="amber" label={t('meals.warnings.saturatedFat.label')}>
          <strong>{t('meals.warnings.saturatedFat.label')}</strong>
          <p>
            {t('meals.warnings.saturatedFat.body', {
              grams: round(fat.saturated),
              pct: Math.round((fat.saturated / fat.totalFat) * 100),
              threshold: Math.round(FAT_WARNING_THRESHOLDS.saturatedShareOfFat * 100),
            })}
          </p>
        </WarningIcon>
      )}
      {warnings.omegaImbalance && (
        <WarningIcon icon={TriangleAlert} tone="amber" label={t('meals.warnings.omegaImbalance.label')}>
          <strong>{t('meals.warnings.omegaImbalance.heading')}</strong>
          <p>
            {t('meals.warnings.omegaImbalance.body', {
              ratio: omegaRatio,
              threshold: FAT_WARNING_THRESHOLDS.omega6to3Ratio,
            })}
          </p>
        </WarningIcon>
      )}
      {warnings.transFatPresent && (
        <WarningIcon icon={Ban} tone="red" label={t('meals.warnings.transFat.label')}>
          <strong>{t('meals.warnings.transFat.heading')}</strong>
          <p>{t('meals.warnings.transFat.body', { grams: round(fat.trans) })}</p>
        </WarningIcon>
      )}
      {glycemic.spikeRisk && (
        <WarningIcon icon={Zap} tone="amber" label={t('meals.warnings.glucoseSpike.label')}>
          <strong>{t('meals.warnings.glucoseSpike.label')}</strong>
          <p>
            {t('meals.warnings.glucoseSpike.body', {
              pct: Math.round(glycemic.carbsShareOfCalories * 100),
              minProtein: GLUCOSE_SPIKE_THRESHOLDS.minProteinGrams,
              minFat: GLUCOSE_SPIKE_THRESHOLDS.minFatGrams,
            })}
          </p>
        </WarningIcon>
      )}
    </div>
  )
}
