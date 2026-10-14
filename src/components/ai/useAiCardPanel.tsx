import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles, X } from 'lucide-react'
import type { TFunction } from 'i18next'
import type { PanelTarget } from '../../webmcp/targets'
import AiButton from './AiButton'
import AiFeedbackView from './AiFeedbackView'
import AiFeedbackActions from './AiFeedbackActions'

/** What to ask the connected AI tool for a target, shown (and copyable) before any analysis exists. */
export function suggestedAiPrompt(t: TFunction, target: string): string {
  const day = target.match(/^day:(.+)$/)
  if (day) return t('ai.prompt.day', { date: day[1] })
  const meal = target.match(/^meal:(.+)T(.+)$/)
  if (meal) return t('ai.prompt.meal', { date: meal[1], time: meal[2] })
  // i18next treats ":" as its namespace separator, so panel keys use "_".
  return t('ai.prompt.panel', { panel: t(`ai.panels.${target.replace(':', '_')}`) })
}

/**
 * AI analysis for a section card: `button` goes in the card's header, `panel` right below it —
 * a collapsible, scrollable region inside the same card. Escape closes it unless something on
 * top (a modal, the mobile menu) already handled the key.
 */
export function useAiCardPanel(target: PanelTarget) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !e.defaultPrevented) setOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  const button = <AiButton target={target} active={open} onClick={() => setOpen((o) => !o)} />
  const panel = open ? (
    <div className="ai-card-panel">
      <div className="ai-card-panel-header">
        <span>
          <Sparkles size={13} /> {t('ai.title')}
        </span>
        <div className="ai-header-actions">
          <AiFeedbackActions target={target} />
          <button
            className="icon-button icon-button--ghost"
            onClick={() => setOpen(false)}
            aria-label={t('common.close')}
          >
            <X size={14} />
          </button>
        </div>
      </div>
      <AiFeedbackView target={target} suggestedPrompt={suggestedAiPrompt(t, target)} className="ai-view--scroll" />
    </div>
  ) : null

  return { button, panel }
}
