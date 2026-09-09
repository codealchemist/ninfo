import { forwardRef, useRef, useState } from 'react'
import { Check, Copy, Image as ImageIcon } from 'lucide-react'
import type { Meal } from '../../data/types'
import { analyzeFat } from '../../data/lipidAnalysis'
import { analyzeGlycemicRisk } from '../../data/glycemicRisk'
import {
  formatMealDateLabel,
  formatNutritionLabelAsText
} from '../../data/mealText'
import { copyElementAsImage, copyTextToClipboard } from '../../utils/clipboard'
import FatSection from './FatSection'
import MealCardWarnings from './MealCardWarnings'

interface Props {
  meal: Meal
}

const round = (n: number) => Math.round(n * 10) / 10

type CopyState = 'idle' | 'copied' | 'failed'

/** Renders a meal's aggregate macros as a classic "Nutrition Facts" style label. */
const NutritionLabel = forwardRef<HTMLDivElement, Props>(
  function NutritionLabel({ meal }, ref) {
    const { totals, lipids } = meal
    const fatBreakdown = analyzeFat(lipids, totals.fat)
    const glycemicRisk = analyzeGlycemicRisk(totals)
    // Scoped narrower than `ref` — captures just the label content for the image export,
    // excluding the copy/maximize action buttons below it.
    const contentRef = useRef<HTMLDivElement>(null)
    const [textCopyState, setTextCopyState] = useState<CopyState>('idle')
    const [imageCopyState, setImageCopyState] = useState<CopyState>('idle')

    const flash = (setState: (s: CopyState) => void, ok: boolean) => {
      setState(ok ? 'copied' : 'failed')
      setTimeout(() => setState('idle'), 1500)
    }

    const handleCopyText = async (e: React.MouseEvent) => {
      e.stopPropagation()
      const ok = await copyTextToClipboard(
        formatNutritionLabelAsText(meal, fatBreakdown)
      )
      flash(setTextCopyState, ok)
    }

    const handleCopyImage = async (e: React.MouseEvent) => {
      e.stopPropagation()
      if (!contentRef.current) return
      const ok = await copyElementAsImage(contentRef.current)
      flash(setImageCopyState, ok)
    }

    return (
      <div className='nutrition-label' ref={ref}>
        <div className='nutrition-label-content' ref={contentRef}>
          <div className='nutrition-label-header'>
            <div className='nutrition-label-heading'>
              <div className='nutrition-label-title'>Nutrition Facts</div>
              <div className='nutrition-label-subtitle'>
                {formatMealDateLabel(meal.date)} · {meal.time}
              </div>
            </div>
            <MealCardWarnings fat={fatBreakdown} glycemic={glycemicRisk} />
          </div>
          <div className='nutrition-label-rule nutrition-label-rule--thick' />
          <div className='nutrition-label-calories'>
            <span>Calories</span>
            <strong>{Math.round(totals.calories)}</strong>
          </div>
          <div className='nutrition-label-rule' />

          <div className='nutrition-label-row nutrition-label-row--bold'>
            <span>Fat</span>
            <span>{round(totals.fat)} g</span>
          </div>
          <FatSection lipids={lipids} breakdown={fatBreakdown} />

          <div className='nutrition-label-rule' />
          <div className='nutrition-label-row nutrition-label-row--bold'>
            <span>Carbs</span>
            <span>{round(totals.carbs)} g</span>
          </div>

          <div className='nutrition-label-rule' />
          <div className='nutrition-label-row nutrition-label-row--bold'>
            <span>Fiber</span>
            <span>{round(totals.fiber)} g</span>
          </div>

          <div className='nutrition-label-rule' />
          <div className='nutrition-label-row nutrition-label-row--bold'>
            <span>Protein</span>
            <span>{round(totals.protein)} g</span>
          </div>
          <div className='nutrition-label-rule nutrition-label-rule--thick' />
        </div>

        <div className='nutrition-label-actions'>
          <button
            className='icon-button icon-button--ghost'
            onClick={handleCopyText}
            aria-label='Copy nutritional info'
            title='Copy nutritional info as text'
          >
            {textCopyState === 'copied' ? (
              <Check size={13} />
            ) : (
              <Copy size={13} />
            )}
          </button>
          <button
            className='icon-button icon-button--ghost'
            onClick={handleCopyImage}
            aria-label='Copy nutritional info as image'
            title='Copy nutritional info as an image'
          >
            {imageCopyState === 'copied' ? (
              <Check size={13} />
            ) : (
              <ImageIcon size={13} />
            )}
          </button>
          <span className='nutrition-label-hint'>Click for food details →</span>
        </div>
      </div>
    )
  }
)

export default NutritionLabel
