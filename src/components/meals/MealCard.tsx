import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Meal } from '../../data/types'
import type { FeedingWindow } from '../../data/mtorc1'
import NutritionLabel from './NutritionLabel'
import MealItemsTable from './MealItemsTable'
import MealWarningsView from './MealWarningsView'
import Mtorc1View from './Mtorc1View'
import MealAiView from './MealAiView'

interface Props {
  meal: Meal
  /** The meal's mTORC1 feeding window, for the badge and its back view. */
  mtorc1Window: FeedingWindow | null
  focused: boolean
  flipped: boolean
  onToggleFlip: () => void
  /** Reports this card's front-face height (at least MIN_CARD_HEIGHT)... */
  onMeasure?: (key: string, height: number) => void
  /** ...and the height to render the front at instead — the strip passes the tallest front's,
   * so every card in it lines up. */
  height?: number
}

const MIN_CARD_HEIGHT = 340

export default function MealCard({ meal, mtorc1Window, focused, flipped, onToggleFlip, onMeasure, height }: Props) {
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)
  const [frontHeight, setFrontHeight] = useState(MIN_CARD_HEIGHT)
  const [backHeight, setBackHeight] = useState(0)
  // Which content the back face shows once flipped — the warnings button and mTORC1 badge flip
  // straight to their own view instead of the items table; flipping back to front resets it.
  const [backView, setBackView] = useState<'items' | 'warnings' | 'mtorc1' | 'ai'>('items')

  // Both faces are measured at their natural content height — including content that changes
  // size after the first render, like the fat-quality details expanding or a sort/selection
  // change in the items table. The card is as tall as its front (so the strip has no empty
  // space under the labels) and only grows to the back's height while flipped, so neither face
  // ever has to scroll or get clipped. A ResizeObserver (rather than re-measuring
  // only on `meal`/`flipped` changes) catches those interior changes regardless of which
  // deeply-nested child state caused them, without threading callbacks through every layer.
  // Re-runs on `backView` too, since that swaps which element `backRef` actually points at.
  useLayoutEffect(() => {
    const front = frontRef.current
    const back = backRef.current
    if (!front || !back) return

    // The front label stretches to the card (to pin its footer to the bottom), so its natural
    // height is the sum of its parts rather than its own, possibly stretched, box. The back's
    // content keeps its natural height (see .meal-card-face--back), so scrollHeight is fine.
    const naturalFront = () => Array.from(front.children).reduce((sum, el) => sum + (el as HTMLElement).offsetHeight, 0)
    const measure = () => {
      const front = Math.max(naturalFront(), MIN_CARD_HEIGHT)
      setFrontHeight(front)
      setBackHeight(back.scrollHeight)
      onMeasure?.(meal.key, front)
    }
    measure()

    const observer = new ResizeObserver(measure)
    observer.observe(front)
    observer.observe(back)
    // The stretched label doesn't resize when its content shrinks — its parts do.
    for (const child of Array.from(front.children)) observer.observe(child)
    return () => observer.disconnect()
  }, [meal, backView])

  const handleToggleBackView = (view: 'warnings' | 'mtorc1' | 'ai') => {
    if (flipped && backView === view) {
      setBackView('items')
      onToggleFlip()
      return
    }
    setBackView(view)
    if (!flipped) onToggleFlip()
  }

  const handleFlipBack = () => {
    setBackView('items')
    onToggleFlip()
  }

  // Escape flips any back view to the front — only while flipped, so it never flips a card open.
  // Overlays above the card (Modal, the maximized items table, the mobile menu) claim Escape in
  // the capture phase and preventDefault it, so one press closes just the topmost thing.
  useEffect(() => {
    if (!flipped) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) handleFlipBack()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [flipped, onToggleFlip])

  return (
    <div
      className={'meal-card-flip' + (focused ? ' meal-card-flip--focused' : '')}
      style={{ height: Math.max(height ?? 0, frontHeight, flipped ? backHeight : 0) }}
    >
      <div className={'meal-card-inner' + (flipped ? ' meal-card-inner--flipped' : '')}>
        <div className="meal-card-face meal-card-face--front" onClick={onToggleFlip}>
          <NutritionLabel
            ref={frontRef}
            meal={meal}
            mtorc1Window={mtorc1Window}
            onShowWarnings={() => handleToggleBackView('warnings')}
            onShowMtorc1={() => handleToggleBackView('mtorc1')}
            onShowAi={() => handleToggleBackView('ai')}
            aiActive={flipped && backView === 'ai'}
          />
        </div>
        <div className="meal-card-face meal-card-face--back">
          {backView === 'warnings' ? (
            <MealWarningsView ref={backRef} meal={meal} onFlipBack={handleFlipBack} />
          ) : backView === 'ai' ? (
            <MealAiView ref={backRef} meal={meal} onFlipBack={handleFlipBack} />
          ) : backView === 'mtorc1' && mtorc1Window ? (
            <Mtorc1View ref={backRef} meal={meal} window={mtorc1Window} onFlipBack={handleFlipBack} />
          ) : (
            <MealItemsTable ref={backRef} meal={meal} onFlipBack={handleFlipBack} />
          )}
        </div>
      </div>
    </div>
  )
}
