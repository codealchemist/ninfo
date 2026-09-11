import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

interface ModalProps {
  onClose: () => void
  className?: string
  children: ReactNode
}

/** Backdrop + centered card + close button/Escape/click-outside, shared by every modal. */
export default function Modal({ onClose, className, children }: ModalProps) {
  const { t } = useTranslation()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className={'modal' + (className ? ` ${className}` : '')} onClick={(e) => e.stopPropagation()}>
        <button className="icon-button icon-button--ghost modal-close" onClick={onClose} aria-label={t('common.close')}>
          <X size={16} />
        </button>
        {children}
      </div>
    </div>,
    document.body
  )
}
