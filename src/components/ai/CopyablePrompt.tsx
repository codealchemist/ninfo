import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Copy } from 'lucide-react'
import { copyTextToClipboard } from '../../utils/clipboard'

/** A suggested prompt for the user's AI assistant, with a button to copy it. */
export default function CopyablePrompt({ prompt }: { prompt: string }) {
  const { t } = useTranslation()
  const [copied, setCopied] = useState(false)

  return (
    <div className="ai-view-prompt">
      <span>{prompt}</span>
      <button
        className="icon-button icon-button--ghost"
        onClick={async (e) => {
          e.stopPropagation()
          if (await copyTextToClipboard(prompt)) {
            setCopied(true)
            setTimeout(() => setCopied(false), 1500)
          }
        }}
        aria-label={t('ai.copyPrompt')}
        title={t('ai.copyPrompt')}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </div>
  )
}
