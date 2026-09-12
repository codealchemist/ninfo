import { useTranslation } from 'react-i18next'

interface Props {
  date: string
}

function formatDateLabel(iso: string, locale: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })
}

/** Shown mid-swipe for a day whose summary hasn't been computed yet — just the date, while
 * DaySummarySwiper builds the real data in the background and swaps it in. */
export default function DaySummaryCardPlaceholder({ date }: Props) {
  const { i18n } = useTranslation()

  return (
    <section className="card day-summary-card day-summary-card--placeholder">
      <span className="day-summary-placeholder-date">{formatDateLabel(date, i18n.language)}</span>
      <div className="day-summary-placeholder-rings" aria-hidden="true">
        <span className="day-summary-placeholder-ring" />
        <span className="day-summary-placeholder-ring" />
        <span className="day-summary-placeholder-ring" />
      </div>
    </section>
  )
}
