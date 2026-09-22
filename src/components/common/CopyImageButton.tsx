import { useState, type RefObject } from 'react'
import { Check, Image as ImageIcon } from 'lucide-react'
import { copyElementAsImage } from '../../utils/clipboard'

interface Props {
  targetRef: RefObject<HTMLElement>
  ariaLabel: string
  title: string
  /** Class added to the target right before capture and removed right after, so a panel can
   * force its compact/mobile layout for the exported image regardless of the page's actual
   * (possibly much wider) viewport — CSS media queries key off that real viewport, not the
   * captured element's own size, so there's no way to get a mobile-style export just by
   * shrinking the node being captured. */
  forceClassName?: string
}

/** Icon button that snapshots whatever `targetRef` points at and copies it to the clipboard as
 * a PNG — the same icon-swap-on-success behavior used for the timeline chart and day-summary
 * exports, factored out since several panels now offer this. */
export default function CopyImageButton({ targetRef, ariaLabel, title, forceClassName }: Props) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  const handleClick = async () => {
    const target = targetRef.current
    if (!target) return
    if (forceClassName) target.classList.add(forceClassName)
    let ok: boolean
    try {
      ok = await copyElementAsImage(target)
    } finally {
      if (forceClassName) target.classList.remove(forceClassName)
    }
    setState(ok ? 'copied' : 'failed')
    setTimeout(() => setState('idle'), 1500)
  }

  return (
    <button className="icon-button icon-button--ghost" onClick={handleClick} aria-label={ariaLabel} title={title}>
      {state === 'copied' ? <Check size={14} /> : <ImageIcon size={14} />}
    </button>
  )
}
