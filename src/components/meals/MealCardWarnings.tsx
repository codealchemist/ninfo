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
  const { warnings } = fat
  if (!warnings.saturatedHigh && !warnings.omegaImbalance && !warnings.transFatPresent && !glycemic.spikeRisk) {
    return null
  }

  return (
    <div className="meal-card-warnings">
      {warnings.saturatedHigh && (
        <WarningIcon icon={TriangleAlert} tone="amber" label="High saturated fat">
          <strong>High saturated fat</strong>
          <p>
            Saturated fat ({round(fat.saturated)}g) is{' '}
            {Math.round((fat.saturated / fat.totalFat) * 100)}% of this meal's total fat — above
            the {Math.round(FAT_WARNING_THRESHOLDS.saturatedShareOfFat * 100)}% commonly cited as a
            healthy upper bound.
          </p>
        </WarningIcon>
      )}
      {warnings.omegaImbalance && (
        <WarningIcon icon={TriangleAlert} tone="amber" label="Omega-6 to omega-3 imbalance">
          <strong>Ω-6:Ω-3 imbalance</strong>
          <p>
            Ratio is{' '}
            {fat.omega6to3Ratio === Infinity ? 'undefined (no Ω-3)' : `${round(fat.omega6to3Ratio!)}:1`}
            , above the {FAT_WARNING_THRESHOLDS.omega6to3Ratio}:1 commonly cited as a healthy upper
            bound. Diets skewed heavily toward Ω-6 are linked to more inflammation.
          </p>
        </WarningIcon>
      )}
      {warnings.transFatPresent && (
        <WarningIcon icon={Ban} tone="red" label="Contains trans fat">
          <strong>Trans fat present</strong>
          <p>
            This meal has {round(fat.trans)}g of trans/"Tóx" fat. Guidance treats any amount of
            trans fat as unsafe.
          </p>
        </WarningIcon>
      )}
      {glycemic.spikeRisk && (
        <WarningIcon icon={Zap} tone="amber" label="Glucose spike risk">
          <strong>Glucose spike risk</strong>
          <p>
            This meal gets {Math.round(glycemic.carbsShareOfCalories * 100)}% of its calories from
            carbs, with too little protein or fat (under{' '}
            {GLUCOSE_SPIKE_THRESHOLDS.minProteinGrams}g / {GLUCOSE_SPIKE_THRESHOLDS.minFatGrams}g)
            to slow absorption. Carb-heavy meals like this can spike blood sugar.
          </p>
        </WarningIcon>
      )}
    </div>
  )
}
