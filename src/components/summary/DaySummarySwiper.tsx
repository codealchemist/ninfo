import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { buildDaySummaryData, type DaySummaryData } from '../../data/aggregate/daySummary'
import DaySummaryCard from './DaySummaryCard'
import DaySummaryCardPlaceholder from './DaySummaryCardPlaceholder'

type Direction = 'prev' | 'next'

interface PeekState {
  date: string
  direction: Direction
  data: DaySummaryData | null
}

// Drag must cross this fraction of the viewport width to commit to the neighboring day;
// short of that, the card springs back to center.
const COMMIT_RATIO = 0.25
const SETTLE_MS = 280
// A brief delay before computing a never-visited neighbor's data, so the placeholder actually
// gets a paint instead of being replaced in the same frame it appeared.
const LOAD_DELAY_MS = 16
const CACHE_SIZE = 2
// Matches the margin-bottom reserved below the title (desktop) / tab bar (mobile) in
// styles.css, so the nav arrows land centered in that gap instead of over either row.
const NAV_ARROW_GAP = 46

export default function DaySummarySwiper() {
  const { t } = useTranslation()
  const meals = useAppStore((s) => s.meals)
  const goalsByDate = useAppStore((s) => s.goalsByDate)
  const dates = useAppStore((s) => s.dates)
  const selectedDate = useAppStore((s) => s.selectedDate)
  const setSelectedDate = useAppStore((s) => s.setSelectedDate)
  const stepDate = useAppStore((s) => s.stepDate)

  const currentData = useMemo(
    () => (selectedDate ? buildDaySummaryData({ meals, goalsByDate, dates, date: selectedDate }) : null),
    [meals, goalsByDate, dates, selectedDate]
  )

  const [dragX, setDragX] = useState(0)
  const [peek, setPeek] = useState<PeekState | null>(null)
  const [settling, setSettling] = useState(false)
  const [arrowTop, setArrowTop] = useState<number | null>(null)

  const viewportRef = useRef<HTMLDivElement>(null)
  const dragXRef = useRef(0)
  const peekRef = useRef<PeekState | null>(null)
  peekRef.current = peek
  const settlingRef = useRef(false)
  settlingRef.current = settling

  // Remembers the last two non-current days' computed data so re-swiping to a recently seen
  // neighbor renders the real card immediately instead of the placeholder.
  const cacheRef = useRef(new Map<string, DaySummaryData>())
  const touchOriginRef = useRef<{ x: number; y: number; width: number } | null>(null)
  const axisRef = useRef<'horizontal' | 'vertical' | null>(null)
  const draggingRef = useRef(false)
  const loadTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const settleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const setDrag = (x: number) => {
    dragXRef.current = x
    setDragX(x)
  }

  const rememberInCache = (date: string, data: DaySummaryData) => {
    const cache = cacheRef.current
    cache.delete(date)
    cache.set(date, data)
    if (cache.size > CACHE_SIZE) {
      const oldestKey = cache.keys().next().value
      if (oldestKey) cache.delete(oldestKey)
    }
  }

  // Any date change not driven by our own commit (arrow keys, date picker, "jump to latest")
  // should cancel whatever drag/peek state is in flight.
  useEffect(() => {
    setDrag(0)
    setPeek(null)
    setSettling(false)
    draggingRef.current = false
    axisRef.current = null
    touchOriginRef.current = null
    if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current)
    if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current)
  }, [selectedDate])

  useEffect(() => {
    return () => {
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current)
      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current)
    }
  }, [])

  // Shift+arrow steps between days — plain arrow keys are left alone so the meal timeline's
  // own arrow navigation still works, and shift+arrow is ignored while typing into a form
  // control (e.g. the date picker itself).
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.shiftKey) return
      const target = e.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        stepDate(-1)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        stepDate(1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [stepDate])

  // On mobile the arrows sit centered on the day-summary-actions row at the bottom of the card.
  // That row is display: none on desktop, so a nonzero offsetHeight also doubles as the signal
  // that we're in the mobile layout — desktop instead centers on the footer's divider line (or,
  // failing that, below the header). Measuring rather than using a fixed percentage keeps this
  // correct regardless of which tab is active, since each tab's content is a different height.
  useLayoutEffect(() => {
    const viewport = viewportRef.current
    if (!viewport) return

    const measure = () => {
      const viewportRect = viewport.getBoundingClientRect()
      const actions = viewport.querySelector<HTMLElement>('.day-summary-actions')

      if (actions && actions.offsetHeight > 0) {
        const rect = actions.getBoundingClientRect()
        setArrowTop(rect.top - viewportRect.top + rect.height / 2)
        return
      }

      const footer = viewport.querySelector<HTMLElement>('.day-summary-footer')
      if (footer) {
        const rect = footer.getBoundingClientRect()
        setArrowTop(rect.top - viewportRect.top)
        return
      }

      const header = viewport.querySelector<HTMLElement>('.day-summary-header')
      if (!header) return
      const headerRect = header.getBoundingClientRect()
      setArrowTop(headerRect.bottom - viewportRect.top + NAV_ARROW_GAP / 2)
    }

    measure()
    window.addEventListener('resize', measure)
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    return () => {
      window.removeEventListener('resize', measure)
      observer.disconnect()
    }
  }, [selectedDate])

  useEffect(() => {
    const el = viewportRef.current
    if (!el || !selectedDate) return

    const beginPeek = (direction: Direction, targetDate: string) => {
      const cached = cacheRef.current.get(targetDate)
      if (cached) {
        setPeek({ date: targetDate, direction, data: cached })
        return
      }
      setPeek({ date: targetDate, direction, data: null })
      if (loadTimeoutRef.current) clearTimeout(loadTimeoutRef.current)
      loadTimeoutRef.current = setTimeout(() => {
        const data = buildDaySummaryData({ meals, goalsByDate, dates, date: targetDate })
        rememberInCache(targetDate, data)
        setPeek((prev) => (prev && prev.date === targetDate ? { ...prev, data } : prev))
      }, LOAD_DELAY_MS)
    }

    const finishDrag = (viewportWidth: number) => {
      const activePeek = peekRef.current
      if (!activePeek) {
        setDrag(0)
        return
      }
      const commit = Math.abs(dragXRef.current) > viewportWidth * COMMIT_RATIO
      setSettling(true)
      if (settleTimeoutRef.current) clearTimeout(settleTimeoutRef.current)
      if (commit) {
        const targetDate = activePeek.date
        const outgoingDate = selectedDate
        const outgoingData = currentData
        setDrag(activePeek.direction === 'next' ? -viewportWidth : viewportWidth)
        settleTimeoutRef.current = setTimeout(() => {
          if (outgoingData) rememberInCache(outgoingDate, outgoingData)
          setSelectedDate(targetDate)
          setSettling(false)
          setDrag(0)
          setPeek(null)
        }, SETTLE_MS)
      } else {
        setDrag(0)
        settleTimeoutRef.current = setTimeout(() => {
          setSettling(false)
          setPeek(null)
        }, SETTLE_MS)
      }
    }

    const handleTouchStart = (e: TouchEvent) => {
      // Don't hijack taps/drags that start on an interactive control (buttons, the comparison
      // toggle, a tappable ring badge) — let those handle their own touch/click behavior. Also
      // ignore a new touch while the previous swipe is still settling into place.
      const target = e.target as HTMLElement | null
      if (settlingRef.current || target?.closest('button, input, a, [role="button"]')) {
        touchOriginRef.current = null
        return
      }
      const touch = e.touches[0]
      touchOriginRef.current = { x: touch.clientX, y: touch.clientY, width: el.offsetWidth }
      axisRef.current = null
      draggingRef.current = false
    }

    const handleTouchMove = (e: TouchEvent) => {
      const origin = touchOriginRef.current
      if (!origin) return
      // This panel is a horizontal-swipe surface only — block the page's vertical scroll for
      // any touch that started here from the first pixel of movement, before the browser's own
      // gesture recognizer has a chance to commit to scrolling.
      e.preventDefault()

      const touch = e.touches[0]
      const dx = touch.clientX - origin.x
      const dy = touch.clientY - origin.y

      if (axisRef.current === null) {
        if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return
        axisRef.current = Math.abs(dx) > Math.abs(dy) ? 'horizontal' : 'vertical'
        draggingRef.current = axisRef.current === 'horizontal'
      }
      if (axisRef.current !== 'horizontal') return

      const idx = dates.indexOf(selectedDate)
      const direction: Direction = dx < 0 ? 'next' : 'prev'
      const targetIdx = direction === 'next' ? idx + 1 : idx - 1
      const targetDate = targetIdx >= 0 && targetIdx < dates.length ? dates[targetIdx] : null

      if (!targetDate) {
        setDrag(0)
        return
      }
      const active = peekRef.current
      if (!active || active.direction !== direction || active.date !== targetDate) {
        beginPeek(direction, targetDate)
      }
      // Clamp so the peek card never slides past fully-revealed, even if the finger keeps
      // moving beyond one viewport width.
      setDrag(Math.max(-origin.width, Math.min(origin.width, dx)))
    }

    const handleTouchEnd = () => {
      const origin = touchOriginRef.current
      touchOriginRef.current = null
      const wasDragging = draggingRef.current
      draggingRef.current = false
      axisRef.current = null
      if (!origin || !wasDragging) {
        setDrag(0)
        return
      }
      finishDrag(origin.width)
    }

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchmove', handleTouchMove, { passive: false })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })
    el.addEventListener('touchcancel', handleTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchmove', handleTouchMove)
      el.removeEventListener('touchend', handleTouchEnd)
      el.removeEventListener('touchcancel', handleTouchEnd)
    }
  }, [selectedDate, dates, meals, goalsByDate, currentData, setSelectedDate])

  if (!selectedDate || !currentData) return null

  const idx = dates.indexOf(selectedDate)
  const canGoPrev = idx > 0
  const canGoNext = idx >= 0 && idx < dates.length - 1

  const peekWidth = viewportRef.current?.offsetWidth ?? 0
  const peekBase = peek ? (peek.direction === 'next' ? peekWidth : -peekWidth) : 0
  const slotClass = 'day-summary-swipe-slot' + (settling ? ' day-summary-swipe-slot--settling' : '')

  return (
    <div className="day-summary-swipe-viewport" ref={viewportRef}>
      <div className={slotClass + ' day-summary-swipe-slot--current'} style={{ transform: `translateX(${dragX}px)` }}>
        <DaySummaryCard date={selectedDate} {...currentData} />
      </div>
      {peek && (
        <div className={slotClass + ' day-summary-swipe-slot--peek'} style={{ transform: `translateX(${peekBase + dragX}px)` }}>
          {peek.data ? <DaySummaryCard date={peek.date} {...peek.data} /> : <DaySummaryCardPlaceholder date={peek.date} />}
        </div>
      )}
      <button
        className="icon-button day-summary-nav-arrow day-summary-nav-arrow--prev"
        onClick={() => canGoPrev && setSelectedDate(dates[idx - 1])}
        disabled={!canGoPrev}
        aria-label={t('dateNavigator.previousDay')}
        style={arrowTop !== null ? { top: `${arrowTop}px` } : undefined}
      >
        <ChevronLeft size={18} />
      </button>
      <button
        className="icon-button day-summary-nav-arrow day-summary-nav-arrow--next"
        onClick={() => canGoNext && setSelectedDate(dates[idx + 1])}
        disabled={!canGoNext}
        aria-label={t('dateNavigator.nextDay')}
        style={arrowTop !== null ? { top: `${arrowTop}px` } : undefined}
      >
        <ChevronRight size={18} />
      </button>
    </div>
  )
}
