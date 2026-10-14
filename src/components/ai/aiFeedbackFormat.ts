import type { TFunction } from 'i18next'
import i18n from '../../i18n'
import type { AiFeedback } from '../../store/aiFeedbackStore'

export type AiCopyFormat = 'markdown' | 'text' | 'json'

// A line break inside a list item or table cell would break that line; a pipe, the table row.
const oneLine = (value: string) => value.replace(/\s*\n\s*/g, ' ')
const mdCell = (value: string) => oneLine(value).replace(/\|/g, '\\|')

/** The AI analysis for one target as Markdown, plain text or JSON — for the copy buttons. */
export function formatAiFeedback(feedback: AiFeedback, format: AiCopyFormat, t: TFunction): string {
  if (format === 'json') {
    const { target, title, summary, recommendations, estimates, observations, receivedAt } = feedback
    return JSON.stringify({ target, title, summary, recommendations, estimates, observations, receivedAt }, null, 2)
  }

  const md = format === 'markdown'
  const out: string[] = []
  const heading = (text: string, level: 2 | 3) => (md ? `${'#'.repeat(level)} ${text}` : text.toUpperCase())

  out.push(heading(feedback.title ?? t('ai.title'), 2), '', feedback.summary.trim())

  if (feedback.recommendations.length > 0) {
    out.push('', heading(t('ai.recommendations'), 3))
    for (const rec of feedback.recommendations) {
      const priority = rec.priority ? `[${t(`ai.priority.${rec.priority}`)}] ` : ''
      const title = md ? `**${rec.title}**` : rec.title
      out.push(`- ${priority}${title}${rec.detail ? `: ${oneLine(rec.detail)}` : ''}`)
    }
  }

  if (feedback.estimates.length > 0) {
    out.push('', heading(t('ai.estimates'), 3))
    if (md) {
      out.push(`| ${t('ai.table.estimate')} | ${t('ai.table.value')} | ${t('ai.table.note')} |`, '|---|---|---|')
      for (const est of feedback.estimates) {
        out.push(`| ${mdCell(est.label)} | ${mdCell(est.value)} | ${mdCell(est.note ?? '')} |`)
      }
    } else {
      for (const est of feedback.estimates) {
        out.push(`- ${oneLine(est.label)}: ${oneLine(est.value)}${est.note ? ` (${oneLine(est.note)})` : ''}`)
      }
    }
  }

  if (feedback.observations.length > 0) {
    out.push('', heading(t('ai.observations'), 3))
    for (const obs of feedback.observations) out.push(`- ${oneLine(obs)}`)
  }

  const receivedAt = new Date(feedback.receivedAt).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' })
  out.push('', md ? `_${t('ai.receivedAt', { date: receivedAt })}_` : t('ai.receivedAt', { date: receivedAt }))
  return out.join('\n')
}
