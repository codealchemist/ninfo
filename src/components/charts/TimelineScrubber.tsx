import { useRef, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  count: number
  index: number | null
  onScrub: (index: number) => void
  /** Fired on release when the gesture barely moved — a deliberate dismiss tap rather than a
   * drag to a date, which onScrub already handles live as it happens. */
  onTap?: () => void
}

/** How far the pointer needs to travel before a press counts as a drag rather than a tap — a
 * few pixels of wobble is normal even for a "still" finger/mouse press. */
const TAP_THRESHOLD_PX = 6

/** Mobile-only touch scrubber for the timeline chart — dragging the dot moves a reference
 * tooltip across the days, since pixel-precise taps on a dense line chart are hard on a phone
 * screen. Hidden on desktop (see .timeline-scrubber in styles.css, shown by width on portrait
 * phones and by height on landscape ones), where hovering the chart directly already shows the
 * tooltip. */
export default function TimelineScrubber({ count, index, onScrub, onTap }: Props) {
  const { t } = useTranslation()
  const trackRef = useRef<HTMLDivElement>(null)
  const pointerDownXRef = useRef<number | null>(null)

  if (count <= 1) return null

  const indexFromClientX = (clientX: number): number => {
    const el = trackRef.current
    if (!el) return 0
    const rect = el.getBoundingClientRect()
    const ratio = rect.width > 0 ? Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)) : 0
    return Math.round(ratio * (count - 1))
  }

  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    pointerDownXRef.current = e.clientX
    onScrub(indexFromClientX(e.clientX))
  }

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    onScrub(indexFromClientX(e.clientX))
  }

  const handlePointerUp = (e: PointerEvent<HTMLDivElement>) => {
    const startX = pointerDownXRef.current
    pointerDownXRef.current = null
    if (startX !== null && Math.abs(e.clientX - startX) < TAP_THRESHOLD_PX) onTap?.()
  }

  const pct = index !== null ? (index / (count - 1)) * 100 : null

  return (
    <div
      className="timeline-scrubber"
      ref={trackRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="slider"
      aria-label={t('timeline.scrubberAria')}
      aria-valuemin={0}
      aria-valuemax={count - 1}
      aria-valuenow={index ?? 0}
    >
      <div className="timeline-scrubber-track" />
      {pct !== null && <div className="timeline-scrubber-dot" style={{ left: `${pct}%` }} />}
    </div>
  )
}
