import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy, Trash2 } from 'lucide-react'
import { useAiFeedbackStore } from '../../store/aiFeedbackStore'
import { copyTextToClipboard } from '../../utils/clipboard'
import { formatAiFeedback, type AiCopyFormat } from './aiFeedbackFormat'

const COPY_FORMATS: AiCopyFormat[] = ['markdown', 'text', 'json']

/**
 * The AI analysis actions — copy (as Markdown, text or JSON) and remove — for a view's header, so
 * they're reachable without scrolling to the end of a long analysis. Renders nothing until there
 * is analysis for the target. Compact enough for the 250px meal card header: copying is one icon
 * with a small menu of formats.
 */
export default function AiFeedbackActions({ target }: { target: string }) {
  const { t } = useTranslation()
  const feedback = useAiFeedbackStore((s) => s.feedback[target])
  const removeFeedback = useAiFeedbackStore((s) => s.removeFeedback)
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  // Click outside closes the menu; Escape closes just the menu — claimed in the capture phase so
  // the card or panel behind it doesn't also close (same convention as Modal).
  useEffect(() => {
    if (!menuOpen) return
    const handlePointer = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setMenuOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      setMenuOpen(false)
    }
    document.addEventListener('mousedown', handlePointer)
    window.addEventListener('keydown', handleKey, true)
    return () => {
      document.removeEventListener('mousedown', handlePointer)
      window.removeEventListener('keydown', handleKey, true)
    }
  }, [menuOpen])

  if (!feedback) return null

  const copyAs = async (format: AiCopyFormat) => {
    setMenuOpen(false)
    if (await copyTextToClipboard(formatAiFeedback(feedback, format, t))) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  return (
    <div className="ai-actions" ref={rootRef} onClick={(e) => e.stopPropagation()}>
      <button
        className="ai-actions-button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label={t('ai.copyAs')}
        title={t('ai.copyAs')}
      >
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      {menuOpen && (
        <div className="ai-actions-menu" role="menu">
          {COPY_FORMATS.map((format) => (
            <button
              key={format}
              role="menuitem"
              className="ai-actions-menu-item"
              onClick={() => copyAs(format)}
              title={t('ai.copyFormatTitle', { format: t(`ai.copyFormats.${format}`) })}
            >
              {t(`ai.copyFormats.${format}`)}
            </button>
          ))}
        </div>
      )}
      <button
        className="ai-actions-button"
        onClick={() => removeFeedback(target)}
        aria-label={t('ai.dismiss')}
        title={t('ai.dismiss')}
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}
