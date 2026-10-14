import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Sparkles } from 'lucide-react'
import { useAiFeedbackStore } from '../../store/aiFeedbackStore'
import CopyablePrompt from './CopyablePrompt'

interface Props {
  target: string
  /** The prompt suggested when there's no analysis yet — what to ask the connected AI tool. */
  suggestedPrompt: string
  className?: string
}

/**
 * Renders the AI analysis for one target as plain, escaped text (React text nodes — never HTML;
 * the content comes from an agent). Opening it marks the analysis read.
 */
export default function AiFeedbackView({ target, suggestedPrompt, className }: Props) {
  const { t, i18n } = useTranslation()
  const feedback = useAiFeedbackStore((s) => s.feedback[target])
  const markRead = useAiFeedbackStore((s) => s.markRead)

  useEffect(() => {
    if (feedback?.unread) markRead(target)
  }, [feedback, target, markRead])

  if (!feedback) {
    return (
      <div className={'ai-view ai-view--empty' + (className ? ` ${className}` : '')}>
        <Sparkles size={22} className="ai-view-empty-icon" />
        <p>{t('ai.empty')}</p>
        <CopyablePrompt prompt={suggestedPrompt} />
      </div>
    )
  }

  const receivedAt = new Date(feedback.receivedAt).toLocaleString(i18n.language, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  // Sections, not one flat list, so the wide layout (styles.css, @container ai-view) can place
  // them: the reading text and recommendations side by side, the estimates as a row of tiles.
  return (
    <div className={'ai-view' + (className ? ` ${className}` : '')}>
      <div className="ai-view-layout">
        <div className="ai-view-main">
          {feedback.title && <div className="ai-view-title">{feedback.title}</div>}
          {feedback.summary.split(/\n\s*\n/).map((paragraph, i) => (
            <p key={i} className="ai-view-summary">
              {paragraph}
            </p>
          ))}
          {feedback.observations.length > 0 && (
            <section className="ai-view-section">
              <div className="ai-view-section-title">{t('ai.observations')}</div>
              <ul className="ai-view-observations">
                {feedback.observations.map((obs, i) => (
                  <li key={i}>{obs}</li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {feedback.recommendations.length > 0 && (
          <section className="ai-view-section ai-view-recs">
            <div className="ai-view-section-title">{t('ai.recommendations')}</div>
            <ul className="ai-view-recommendations">
              {feedback.recommendations.map((rec, i) => (
                <li key={i} className="ai-view-rec">
                  {rec.priority && (
                    <span className={`ai-view-priority ai-view-priority--${rec.priority}`}>
                      {t(`ai.priority.${rec.priority}`)}
                    </span>
                  )}
                  <div className="ai-view-rec-title">{rec.title}</div>
                  {rec.detail && <div className="ai-view-rec-detail">{rec.detail}</div>}
                </li>
              ))}
            </ul>
          </section>
        )}

        {feedback.estimates.length > 0 && (
          <section className="ai-view-section ai-view-estimates-section">
            <div className="ai-view-section-title">{t('ai.estimates')}</div>
            {/* Both are rendered; the container query in styles.css shows the list in narrow
                views (meal cards) and the table once there's room for three columns. */}
            <div className="ai-view-estimates-table-wrap">
              <table className="ai-view-estimates-table">
                <thead>
                  <tr>
                    <th>{t('ai.table.estimate')}</th>
                    <th>{t('ai.table.value')}</th>
                    <th>{t('ai.table.note')}</th>
                  </tr>
                </thead>
                <tbody>
                  {feedback.estimates.map((est, i) => (
                    <tr key={i}>
                      <th scope="row">{est.label}</th>
                      <td className="ai-view-estimates-table-value">{est.value}</td>
                      <td className="ai-view-estimates-table-note">{est.note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="ai-view-estimates">
              {feedback.estimates.map((est, i) => (
                <div key={i} className="ai-view-estimate">
                  <dt>{est.label}</dt>
                  <dd className="ai-view-estimate-value">{est.value}</dd>
                  {est.note && <dd className="ai-view-estimate-note">{est.note}</dd>}
                </div>
              ))}
            </dl>
          </section>
        )}

        {/* Copy and remove live in the view's header (AiFeedbackActions), not down here. */}
        <div className="ai-view-footer">{t('ai.receivedAt', { date: receivedAt })}</div>
      </div>
    </div>
  )
}
