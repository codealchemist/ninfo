import { useLayoutEffect, useRef, useState } from 'react'
import type { Meal } from '../../data/types'
import NutritionLabel from './NutritionLabel'
import MealItemsTable from './MealItemsTable'

interface Props {
  meal: Meal
  focused: boolean
  flipped: boolean
  onToggleFlip: () => void
}

const MIN_CARD_HEIGHT = 340

export default function MealCard({ meal, focused, flipped, onToggleFlip }: Props) {
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)
  const [cardHeight, setCardHeight] = useState(MIN_CARD_HEIGHT)

  // Both faces are laid out in normal flow (no fixed height, no internal scroll) so each is
  // exactly as tall as its own content needs — including content that can change size after
  // the initial render, like the fat-quality details panel expanding or a sort/selection
  // change in the items table. The card itself then adopts whichever face is taller, so
  // neither ever has to scroll or get clipped. A ResizeObserver (rather than re-measuring
  // only on `meal`/`flipped` changes) catches those interior changes regardless of which
  // deeply-nested child state caused them, without threading callbacks through every layer.
  useLayoutEffect(() => {
    const front = frontRef.current
    const back = backRef.current
    if (!front || !back) return

    const measure = () => {
      setCardHeight(Math.max(front.scrollHeight, back.scrollHeight, MIN_CARD_HEIGHT))
    }
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(front)
    observer.observe(back)
    return () => observer.disconnect()
  }, [meal])

  return (
    <div
      className={'meal-card-flip' + (focused ? ' meal-card-flip--focused' : '')}
      style={{ height: cardHeight }}
    >
      <div className={'meal-card-inner' + (flipped ? ' meal-card-inner--flipped' : '')}>
        <div className="meal-card-face meal-card-face--front" onClick={onToggleFlip}>
          <NutritionLabel ref={frontRef} meal={meal} />
        </div>
        <div className="meal-card-face meal-card-face--back">
          <MealItemsTable ref={backRef} meal={meal} onFlipBack={onToggleFlip} />
        </div>
      </div>
    </div>
  )
}
