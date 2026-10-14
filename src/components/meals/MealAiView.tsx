import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, X } from 'lucide-react'
import type { Meal } from '../../data/types'
import { mealTarget } from '../../webmcp/targets'
import AiFeedbackView from '../ai/AiFeedbackView'
import AiFeedbackActions from '../ai/AiFeedbackActions'
import { suggestedAiPrompt } from '../ai/useAiCardPanel'

interface Props {
  meal: Meal
  onFlipBack: () => void
}

/** The meal card's back face when flipped via the AI icon: the connected AI tool's analysis. */
const MealAiView = forwardRef<HTMLDivElement, Props>(function MealAiView({ meal, onFlipBack }, ref) {
  const { t } = useTranslation()
  const target = mealTarget(meal)

  return (
    <div className="meal-items-table-wrap" ref={ref}>
      <div className="meal-items-table-header">
        <span className="ai-view-header-title">
          <Sparkles size={13} /> {t('ai.title')}
        </span>
        <div className="meal-items-table-actions">
          <AiFeedbackActions target={target} />
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
      <AiFeedbackView target={target} suggestedPrompt={suggestedAiPrompt(t, target)} className="ai-view--card" />
    </div>
  )
})

export default MealAiView
