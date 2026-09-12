import { useLayoutEffect, useRef, useState } from 'react'
import type { Meal } from '../../data/types'
import NutritionLabel from './NutritionLabel'
import MealItemsTable from './MealItemsTable'
import MealWarningsView from './MealWarningsView'

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
  // Which content the back face shows once flipped — the warnings button flips straight to
  // 'warnings' instead of the items table; flipping back to front resets it for next time.
  const [backView, setBackView] = useState<'items' | 'warnings'>('items')

  // Both faces are laid out in normal flow (no fixed height, no internal scroll) so each is
  // exactly as tall as its own content needs — including content that can change size after
  // the initial render, like the fat-quality details panel expanding or a sort/selection
  // change in the items table. The card itself then adopts whichever face is taller, so
  // neither ever has to scroll or get clipped. A ResizeObserver (rather than re-measuring
  // only on `meal`/`flipped` changes) catches those interior changes regardless of which
  // deeply-nested child state caused them, without threading callbacks through every layer.
  // Re-runs on `backView` too, since that swaps which element `backRef` actually points at.
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
  }, [meal, backView])

  const handleToggleWarnings = () => {
    if (flipped && backView === 'warnings') {
      setBackView('items')
      onToggleFlip()
      return
    }
    setBackView('warnings')
    if (!flipped) onToggleFlip()
  }

  const handleFlipBack = () => {
    setBackView('items')
    onToggleFlip()
  }

  return (
    <div
      className={'meal-card-flip' + (focused ? ' meal-card-flip--focused' : '')}
      style={{ height: cardHeight }}
    >
      <div className={'meal-card-inner' + (flipped ? ' meal-card-inner--flipped' : '')}>
        <div className="meal-card-face meal-card-face--front" onClick={onToggleFlip}>
          <NutritionLabel ref={frontRef} meal={meal} onShowWarnings={handleToggleWarnings} />
        </div>
        <div className="meal-card-face meal-card-face--back">
          {backView === 'warnings' ? (
            <MealWarningsView ref={backRef} meal={meal} onFlipBack={handleFlipBack} />
          ) : (
            <MealItemsTable ref={backRef} meal={meal} onFlipBack={handleFlipBack} />
          )}
        </div>
      </div>
    </div>
  )
}
