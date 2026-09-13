import { useRef, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'

interface Props {
  count: number
  index: number | null
  onScrub: (index: number | null, active: boolean) => void
}

/** Mobile-only touch scrubber for the timeline chart — dragging the dot moves a reference
 * tooltip across the days, since pixel-precise taps on a dense line chart are hard on a phone
 * screen. Hidden on desktop (see .timeline-scrubber in styles.css), where hovering the chart
 * directly already shows the tooltip. */
export default function TimelineScrubber({ count, index, onScrub }: Props) {
  const { t } = useTranslation()
  const trackRef = useRef<HTMLDivElement>(null)

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
    onScrub(indexFromClientX(e.clientX), true)
  }

  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    onScrub(indexFromClientX(e.clientX), true)
  }

  const handlePointerUp = () => {
    onScrub(index, false)
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
