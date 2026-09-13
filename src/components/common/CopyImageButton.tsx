import { useState, type RefObject } from 'react'
import { Check, Image as ImageIcon } from 'lucide-react'
import { copyElementAsImage } from '../../utils/clipboard'

interface Props {
  targetRef: RefObject<HTMLElement>
  ariaLabel: string
  title: string
}

/** Icon button that snapshots whatever `targetRef` points at and copies it to the clipboard as
 * a PNG — the same icon-swap-on-success behavior used for the timeline chart and day-summary
 * exports, factored out since several panels now offer this. */
export default function CopyImageButton({ targetRef, ariaLabel, title }: Props) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  const handleClick = async () => {
    if (!targetRef.current) return
    const ok = await copyElementAsImage(targetRef.current)
    setState(ok ? 'copied' : 'failed')
    setTimeout(() => setState('idle'), 1500)
  }

  return (
    <button className="icon-button icon-button--ghost" onClick={handleClick} aria-label={ariaLabel} title={title}>
      {state === 'copied' ? <Check size={14} /> : <ImageIcon size={14} />}
    </button>
  )
}
