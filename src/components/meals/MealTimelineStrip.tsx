import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, Timer } from 'lucide-react'
import type { Meal } from '../../data/types'
import MealCard from './MealCard'

interface Props {
  meals: Meal[]
}

export default function MealTimelineStrip({ meals }: Props) {
  const { t } = useTranslation()
  const [focusedIndex, setFocusedIndex] = useState(0)
  const [flippedKeys, setFlippedKeys] = useState<Set<string>>(new Set())
  const cardRefs = useRef<Array<HTMLDivElement | null>>([])
  const stripRef = useRef<HTMLDivElement>(null)
  // Set right before a scroll-driven setFocusedIndex, so the scrollIntoView effect below knows
  // to skip itself — the card is already where the user's swipe left it, no need to re-animate.
  const scrollSyncRef = useRef(false)
  const scrollSettleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    setFocusedIndex(0)
    setFlippedKeys(new Set())
  }, [meals])

  useEffect(() => {
    if (scrollSyncRef.current) {
      scrollSyncRef.current = false
      return
    }
    const strip = stripRef.current
    const card = cardRefs.current[focusedIndex]
    if (!strip || !card) return
    // Scroll the strip's own scrollLeft directly rather than card.scrollIntoView(), which
    // would also let the browser scroll the page vertically to bring the card into view —
    // exactly what caused the page to load pre-scrolled past the summary panel.
    const stripRect = strip.getBoundingClientRect()
    const cardRect = card.getBoundingClientRect()
    const delta = cardRect.left + cardRect.width / 2 - (stripRect.left + stripRect.width / 2)
    strip.scrollTo({ left: strip.scrollLeft + delta, behavior: 'smooth' })
  }, [focusedIndex])

  useEffect(() => {
    return () => {
      if (scrollSettleTimeout.current) clearTimeout(scrollSettleTimeout.current)
    }
  }, [])

  // Swiping the strip scroll-snaps cards natively (see .meal-strip in styles.css); once the
  // scroll settles, sync focusedIndex to whichever card landed nearest center so the position
  // counter, focus ring, and prev/next buttons stay in sync with what the user swiped to.
  const handleScroll = () => {
    if (scrollSettleTimeout.current) clearTimeout(scrollSettleTimeout.current)
    scrollSettleTimeout.current = setTimeout(() => {
      const strip = stripRef.current
      if (!strip) return
      const containerCenter = strip.getBoundingClientRect().left + strip.clientWidth / 2
      let nearest = 0
      let nearestDistance = Infinity
      cardRefs.current.forEach((el, i) => {
        if (!el) return
        const rect = el.getBoundingClientRect()
        const distance = Math.abs(rect.left + rect.width / 2 - containerCenter)
        if (distance < nearestDistance) {
          nearestDistance = distance
          nearest = i
        }
      })
      setFocusedIndex((current) => {
        if (current === nearest) return current
        scrollSyncRef.current = true
        return nearest
      })
    }, 120)
  }

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
  // picker), and shift+arrow is left alone entirely so DaySummarySwiper can handle day navigation.
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
    return <p className="empty-state">{t('meals.timelineStrip.empty')}</p>
  }

  return (
    <section className="card">
      <div className="meal-strip-header">
        <h2>{t('meals.timelineStrip.heading')}</h2>
        <div className="meal-strip-controls">
          <button
            className="icon-button"
            onClick={goPrev}
            disabled={focusedIndex === 0}
            aria-label={t('meals.timelineStrip.prevMeal')}
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
            aria-label={t('meals.timelineStrip.nextMeal')}
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
      <div className="meal-strip" ref={stripRef} onScroll={handleScroll}>
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
