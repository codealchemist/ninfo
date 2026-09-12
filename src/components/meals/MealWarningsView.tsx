import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import type { Meal } from '../../data/types'
import { analyzeFat } from '../../data/lipidAnalysis'
import { analyzeGlycemicRisk } from '../../data/glycemicRisk'
import { buildWarningStamps } from '../../data/warningStamps'
import WarningStampList from '../common/WarningStampList'

interface Props {
  meal: Meal
  onFlipBack: () => void
}

/** The meal card's back face when flipped via the warnings button, instead of the items table. */
const MealWarningsView = forwardRef<HTMLDivElement, Props>(function MealWarningsView(
  { meal, onFlipBack },
  ref
) {
  const { t } = useTranslation()
  const fatBreakdown = analyzeFat(meal.lipids, meal.totals.fat)
  const glycemicRisk = analyzeGlycemicRisk(meal.totals)
  const warnings = buildWarningStamps(fatBreakdown, glycemicRisk, t, 'meals')

  return (
    <div className="meal-items-table-wrap" ref={ref}>
      <div className="meal-items-table-header">
        <span>{t('meals.warningsTitle')}</span>
        <div className="meal-items-table-actions">
          <button
            className="icon-button icon-button--ghost"
            onClick={(e) => {
              e.stopPropagation()
              onFlipBack()
            }}
            aria-label={t('meals.table.backToSummaryAria')}
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="meal-warnings-content">
        <WarningStampList warnings={warnings} />
      </div>
    </div>
  )
})

export default MealWarningsView
