import { Dumbbell } from 'lucide-react'
import { MTORC1_THRESHOLDS, type FeedingWindow } from '../../data/mtorc1'

export type Mtorc1Tone = 'full' | 'strong' | 'weak' | 'refractory' | 'none'

/**
 * Which color of the activation ramp a window gets: full, then partial split at the midpoint
 * between the partial and full leucine triggers into strong/weak (a leucine-rich window can
 * still be partial when its total protein falls short — that lands on strong), and grey for
 * refractory (enough protein, too soon after the previous pulse).
 */
export function mtorc1Tone(window: FeedingWindow): Mtorc1Tone {
  if (window.status !== 'partial') return window.status
  const { partialLeucineGrams, fullLeucineGrams } = MTORC1_THRESHOLDS
  return window.leucine >= (partialLeucineGrams + fullLeucineGrams) / 2 ? 'strong' : 'weak'
}

/** A dumbbell colored by the window's activation tone (see .mtorc1-tone--* in styles.css). */
export default function Mtorc1Badge({ window, size = 18 }: { window: FeedingWindow; size?: number }) {
  return (
    <Dumbbell
      size={size}
      strokeWidth={2.25}
      className={`mtorc1-badge mtorc1-tone--${mtorc1Tone(window)}`}
    />
  )
}
