import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'
import { useAiFeedbackStore } from '../../store/aiFeedbackStore'
import AiAssistantModal from './AiAssistantModal'

/**
 * A small chip that appears only when the browser supports WebMCP: how many tools an AI agent
 * can use, or that registration failed. Clicking it explains how to use the assistant.
 */
export default function WebMcpStatus() {
  const { t } = useTranslation()
  const status = useAiFeedbackStore((s) => s.webmcp)
  const [open, setOpen] = useState(false)
  if (!status?.supported) return null

  const ok = !status.error
  const label = ok
    ? t('ai.status.ready', { count: status.registered.length })
    : t('ai.status.error', { error: status.error })
  return (
    <>
      <button
        className={'webmcp-status' + (ok ? '' : ' webmcp-status--error')}
        onClick={() => setOpen(true)}
        title={`${label} · ${t('ai.help.openHint')}`}
        aria-label={`${label}. ${t('ai.help.openHint')}`}
        aria-haspopup="dialog"
      >
        <Sparkles size={12} />
        <span>{ok ? status.registered.length : '!'}</span>
      </button>
      {open && <AiAssistantModal onClose={() => setOpen(false)} />}
    </>
  )
}
