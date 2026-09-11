import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Salad } from 'lucide-react'
import { MACRO_UNITS, type MacroKey, type MacroTotals, type Meal } from '../../data/types'
import { topSourcesByMacro } from '../../data/aggregate/dailyTotals'
import GoalProgressRing from './GoalProgressRing'

const COLOR_VARS: Record<string, string> = {
  protein: '--macro-protein',
  carbs: '--macro-carbs',
  fat: '--macro-fat',
  fiber: '--macro-fiber',
  calories: '--macro-calories',
}

interface Props {
  date: string
  meals: Meal[]
  macros: MacroKey[]
  totals: MacroTotals
  goals: MacroTotals | null
  comparisonTotals: MacroTotals | null
  comparisonLabel: string
}

/**
 * A self-contained, fixed-size rendition of the day summary — built specifically to be
 * screenshotted (see DaySummaryCard's handleCopySummaryImage), not for on-screen display.
 * Rendered off-screen at a fixed portrait size so the exported PNG is a clean rectangle
 * that reads well as a shared photo (WhatsApp, etc.) regardless of how wide the dashboard
 * itself happens to be. Deliberately excludes the day-review sentence — the date heading
 * here is what gives the image its context once it's out of the app.
 */
const DaySummaryShareCard = forwardRef<HTMLDivElement, Props>(function DaySummaryShareCard(
  { date, meals, macros, totals, goals, comparisonTotals, comparisonLabel },
  ref
) {
  const { t, i18n } = useTranslation()
  const dateLabel = new Date(`${date}T00:00:00`).toLocaleDateString(i18n.language, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  const topSources = topSourcesByMacro(meals)

  return (
    <div className="day-summary-share" ref={ref}>
      <div className="day-summary-share-header">
        <div className="day-summary-share-brand">
          <Salad size={18} strokeWidth={2} />
          <span>Ninfo</span>
        </div>
        <span className="day-summary-share-date">{dateLabel}</span>
      </div>
      <div className="day-summary-share-rings">
        {macros.map((macro) => (
          <GoalProgressRing
            key={macro}
            label={t(`common.macros.${macro}`)}
            value={totals[macro]}
            goal={goals ? goals[macro] : null}
            unit={MACRO_UNITS[macro]}
            colorVar={COLOR_VARS[macro]}
          />
        ))}
      </div>
      {comparisonTotals && (
        <div className="delta-row day-summary-share-deltas">
          {macros.map((macro) => {
            const delta = totals[macro] - comparisonTotals[macro]
            const sign = delta >= 0 ? '+' : ''
            const deltaClass = delta > 0 ? ' delta-chip--over' : delta < 0 ? ' delta-chip--under' : ''
            return (
              <span key={macro} className={'delta-chip' + deltaClass}>
                {t(`common.macros.${macro}`)} {sign}
                {Math.round(delta)} {MACRO_UNITS[macro]} {comparisonLabel}
              </span>
            )
          })}
        </div>
      )}
      <div className="day-summary-share-sources">
        <span className="day-summary-share-sources-heading">{t('today.topSources')}</span>
        <div className="day-summary-share-sources-list">
          {macros.map((macro) => {
            const source = topSources[macro]
            if (!source) return null
            const pct = Math.round((source.amount / totals[macro]) * 100)
            const amountLabel = `${Math.round(source.amount)}${macro === 'calories' ? ' kcal' : 'g'}`
            return (
              <span key={macro} className="day-summary-share-source">
                <strong style={{ color: `var(${COLOR_VARS[macro]})` }}>{t(`common.macros.${macro}`)}:</strong>{' '}
                {t('today.topSourceLine', { food: source.food, amount: amountLabel, pct })}
              </span>
            )
          })}
        </div>
      </div>
    </div>
  )
})

export default DaySummaryShareCard
