import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Salad } from 'lucide-react'
import { MACRO_UNITS, type MacroKey, type MacroTotals, type Meal } from '../../data/types'
import { macroViewRing, type MacroView } from '../../data/aggregate/macroView'
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
  dailyWaterMl: number | null
  dailyWaterGoalMl: number | null
  /** Which of the 3 macro views (grams/per body weight/kcal %) is currently selected on the
   * live card — the export mirrors whichever one the user was looking at, not always grams. */
  macroView: MacroView
  dayWeightKg: number | null
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
  {
    date,
    meals,
    macros,
    totals,
    goals,
    comparisonTotals,
    comparisonLabel,
    dailyWaterMl,
    dailyWaterGoalMl,
    macroView,
    dayWeightKg,
  },
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
      {/* Labels which of the 3 macro-view modes the rings below are in — this export doesn't
          include the live card's mode tabs, so without this an exported image gives no clue
          which one it's showing. */}
      <p className="macro-view-title">{t(`today.macroView.${macroView}`)}</p>
      {macroView === 'perKg' && !dayWeightKg && (
        <p className="hint">{t('today.macroView.noWeightData')}</p>
      )}
      <div className="day-summary-share-rings">
        {macros.map((macro) => {
          const ring = macroViewRing(
            macroView,
            macro,
            totals[macro],
            goals ? goals[macro] : null,
            totals.calories,
            dayWeightKg
          )
          return (
            <GoalProgressRing
              key={macro}
              label={t(`common.macros.${macro}`)}
              value={ring.value}
              goal={ring.goal}
              unit={ring.unit}
              decimals={ring.decimals}
              colorVar={COLOR_VARS[macro]}
            />
          )
        })}
        {macroView === 'macros' && dailyWaterMl != null && (
          <GoalProgressRing
            label={t('today.waterIntake')}
            value={dailyWaterMl}
            goal={dailyWaterGoalMl}
            unit="ml"
            colorVar="--water-blue"
          />
        )}
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
