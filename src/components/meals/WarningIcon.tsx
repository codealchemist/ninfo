import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  icon: LucideIcon
  tone: 'amber' | 'red'
  label: string
  children: ReactNode
}

export default function WarningIcon({ icon: Icon, tone, label, children }: Props) {
  const [open, setOpen] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  // Hover (mouseenter/leave) is what desktop gets for free, but touch devices never fire
  // those — there, the tooltip only opens via the button's own onClick below, and needs an
  // explicit "tap elsewhere closes it" listener since there's no hover-out to rely on.
  useEffect(() => {
    if (!open) return
    const handlePointerDown = (e: PointerEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [open])

  return (
    <div
      className="warning-icon-wrap"
      ref={wrapRef}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        className={`warning-icon warning-icon--${tone}`}
        aria-label={label}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
      >
        <Icon size={13} />
      </button>
      {open && (
        <div className="warning-tooltip" role="tooltip">
          {children}
        </div>
      )}
    </div>
  )
}
