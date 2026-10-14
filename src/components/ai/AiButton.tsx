import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'
import { useAiAvailable, useAiFeedbackStore } from '../../store/aiFeedbackStore'

interface Props {
  target: string
  active?: boolean
  onClick: () => void
}

/**
 * The AI icon for one target. Hidden unless an AI agent is connected over WebMCP or analysis
 * already exists for it, so the app looks unchanged otherwise; a dot marks unread analysis.
 */
export default function AiButton({ target, active = false, onClick }: Props) {
  const { t } = useTranslation()
  const available = useAiAvailable(target)
  const feedback = useAiFeedbackStore((s) => s.feedback[target])
  if (!available) return null

  const label = feedback ? t('ai.open') : t('ai.openEmpty')
  return (
    <button
      className={
        'ai-button' + (feedback ? ' ai-button--has-feedback' : '') + (active ? ' ai-button--active' : '')
      }
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      aria-label={label}
      aria-pressed={active}
      title={label}
    >
      <Sparkles size={16} strokeWidth={2.25} />
      {feedback?.unread && <span className="ai-button-dot" aria-hidden="true" />}
    </button>
  )
}
