import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, Timer } from 'lucide-react'
import type { Meal } from '../../data/types'
import MealCard from './MealCard'

interface Props {
  meals: Meal[]
}

export default function MealTimelineStrip({ meals }: Props) {
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [flippedKeys, setFlippedKeys] = useState<Set<string>>(new Set())
  const cardRefs = useRef<Array<HTMLDivElement | null>>([])

  useEffect(() => {
    setFocusedIndex(0)
    setFlippedKeys(new Set())
  }, [meals])

  useEffect(() => {
    cardRefs.current[focusedIndex]?.scrollIntoView({
      behavior: 'smooth',
      inline: 'center',
      block: 'nearest',
    })
  }, [focusedIndex])

  const goPrev = () => setFocusedIndex((i) => Math.max(0, i - 1))
  const goNext = () => setFocusedIndex((i) => Math.min(meals.length - 1, i + 1))

  const toggleFlip = (key: string) => {
    setFlippedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // Left/right arrow keys step between meals, matching the on-screen chevrons, and Enter flips
  // the focused card — all ignored while the user is typing into a form control (e.g. the date
  // picker), and shift+arrow is left alone entirely so DateNavigator can handle day navigation.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (e.shiftKey) return
      if (e.key === 'ArrowLeft') goPrev()
      else if (e.key === 'ArrowRight') goNext()
      else if (e.key === 'Enter' && meals[focusedIndex]) {
        e.preventDefault()
        toggleFlip(meals[focusedIndex].key)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [meals, focusedIndex])

  if (meals.length === 0) {
    return <p className="empty-state">No meals logged for this day.</p>
  }

  return (
    <section className="card">
      <div className="meal-strip-header">
        <h2>Meals by time</h2>
        <div className="meal-strip-controls">
          <button
            className="icon-button"
            onClick={goPrev}
            disabled={focusedIndex === 0}
            aria-label="Previous meal"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="meal-strip-position">
            {focusedIndex + 1} / {meals.length}
          </span>
          <button
            className="icon-button"
            onClick={goNext}
            disabled={focusedIndex === meals.length - 1}
            aria-label="Next meal"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="meal-strip">
        {meals.map((meal, i) => (
          <div className="meal-strip-entry" key={meal.key}>
            {i > 0 && meal.items[0].fastingSincePrev && (
              <div className="fasting-connector">
                <Timer size={14} />
                {meal.items[0].fastingSincePrev}
              </div>
            )}
            <div ref={(el) => (cardRefs.current[i] = el)} onClick={() => setFocusedIndex(i)}>
              <MealCard
                meal={meal}
                focused={i === focusedIndex}
                flipped={flippedKeys.has(meal.key)}
                onToggleFlip={() => toggleFlip(meal.key)}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
