import { useRef } from 'react'
import type { TouchEvent } from 'react'

interface SwipeHandlers {
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
}

// Minimum horizontal travel to count as a swipe, and how much vertical drift is tolerated
// relative to it — keeps an up/down scroll gesture from being misread as a swipe.
const MIN_DISTANCE = 50
const MAX_VERTICAL_RATIO = 0.6

export function useSwipe({ onSwipeLeft, onSwipeRight }: SwipeHandlers) {
  const start = useRef<{ x: number; y: number } | null>(null)

  const onTouchStart = (e: TouchEvent) => {
    const touch = e.touches[0]
    start.current = { x: touch.clientX, y: touch.clientY }
  }

  const onTouchEnd = (e: TouchEvent) => {
    const origin = start.current
    start.current = null
    if (!origin) return
    const touch = e.changedTouches[0]
    const dx = touch.clientX - origin.x
    const dy = touch.clientY - origin.y
    if (Math.abs(dx) < MIN_DISTANCE || Math.abs(dy) > Math.abs(dx) * MAX_VERTICAL_RATIO) return
    if (dx < 0) onSwipeLeft?.()
    else onSwipeRight?.()
  }

  return { onTouchStart, onTouchEnd }
}
