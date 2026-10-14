import { useTranslation } from 'react-i18next'
import { CircleAlert, CircleCheck, Sparkles } from 'lucide-react'
import Modal from '../common/Modal'
import { useAppStore } from '../../store/appStore'
import { useAiFeedbackStore } from '../../store/aiFeedbackStore'
import CopyablePrompt from './CopyablePrompt'

const CAPABILITY_KEYS = ['day', 'timeline', 'body', 'post'] as const
const PLACE_KEYS = ['meal', 'day', 'panels', 'dot'] as const
const EXAMPLE_KEYS = ['day', 'meal', 'timeline', 'body'] as const
const BROWSER_KEYS = ['chatgpt', 'chrome', 'edge', 'others'] as const

/** Opened from the top bar's WebMCP chip: how to use the connected AI assistant with Ninfo. */
export default function AiAssistantModal({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation()
  const status = useAiFeedbackStore((s) => s.webmcp)
  const hasLinkedSheet = useAppStore((s) => s.meta?.mode === 'sheet-link')
  const ok = Boolean(status?.supported && !status.error)

  return (
    <Modal onClose={onClose} className="ai-help-modal">
      <h3 className="ai-help-title">
        <Sparkles size={16} /> {t('ai.help.title')}
      </h3>
      <p className="hint">{t('ai.help.intro')}</p>

      <div className={'ai-help-status' + (ok ? '' : ' ai-help-status--error')}>
        {ok ? <CircleCheck size={15} /> : <CircleAlert size={15} />}
        <span>
          {ok
            ? t('ai.status.ready', { count: status!.registered.length })
            : t('ai.help.errorDetail', { error: status?.error ?? '' })}
        </span>
      </div>

      <h4>{t('ai.help.canTitle')}</h4>
      <ul className="ai-help-list">
        {CAPABILITY_KEYS.map((key) => (
          <li key={key}>{t(`ai.help.can.${key}`)}</li>
        ))}
      </ul>
      {!hasLinkedSheet && <p className="ai-help-note">{t('ai.help.needsSheet')}</p>}

      <h4>{t('ai.help.whereTitle')}</h4>
      <ul className="ai-help-list">
        {PLACE_KEYS.map((key) => (
          <li key={key}>{t(`ai.help.where.${key}`)}</li>
        ))}
      </ul>

      <h4>{t('ai.help.tryTitle')}</h4>
      <div className="ai-help-examples">
        {EXAMPLE_KEYS.map((key) => (
          <CopyablePrompt key={key} prompt={t(`ai.help.examples.${key}`)} />
        ))}
      </div>

      <h4>{t('ai.help.browsersTitle')}</h4>
      <ul className="ai-help-list">
        {BROWSER_KEYS.map((key) => (
          <li key={key}>{t(`ai.help.browsers.${key}`)}</li>
        ))}
      </ul>

      <h4>{t('ai.help.privacyTitle')}</h4>
      <p className="ai-help-text">{t('ai.help.privacy')}</p>

      {ok && status!.registered.length > 0 && (
        <p className="ai-help-tools">
          {t('ai.help.toolsLabel')} {status!.registered.map((name) => <code key={name}>{name}</code>)}
        </p>
      )}
    </Modal>
  )
}
