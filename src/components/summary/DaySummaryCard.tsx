import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { MACRO_KEYS, MACRO_LABELS, MACRO_UNITS, type LipidTotals, type MacroTotals } from '../../data/types'
import { analyzeFat } from '../../data/lipidAnalysis'
import { analyzeGlycemicRisk } from '../../data/glycemicRisk'
import { generateDayReview } from '../../data/dayReview'
import GoalProgressRing from './GoalProgressRing'
import MealCardWarnings from '../meals/MealCardWarnings'
import { useAppStore } from '../../store/appStore'

const COLOR_VARS: Record<string, string> = {
  protein: '--macro-protein',
  carbs: '--macro-carbs',
  fat: '--macro-fat',
  fiber: '--macro-fiber',
  calories: '--macro-calories',
}

interface Props {
  totals: MacroTotals
  lipids: LipidTotals
  goals: MacroTotals | null
  prevDayTotals: MacroTotals | null
}

export default function DaySummaryCard({ totals, lipids, goals, prevDayTotals }: Props) {
  const visibleMacros = useAppStore((s) => s.visibleMacros)
  const macros = MACRO_KEYS.filter((m) => visibleMacros.has(m))
  const [collapsed, setCollapsed] = useState(false)

  const fatBreakdown = analyzeFat(lipids, totals.fat)
  const glycemicRisk = analyzeGlycemicRisk(totals)
  const reviewText = generateDayReview(totals, goals)

  return (
    <section className="card day-summary-card">
      <div className="day-summary-header">
        <button
          className="day-summary-title-row"
          onClick={() => setCollapsed((c) => !c)}
          aria-expanded={!collapsed}
        >
          <ChevronDown size={16} className={collapsed ? 'chevron' : 'chevron chevron--open'} />
          <h2>Today's summary</h2>
        </button>
        <MealCardWarnings fat={fatBreakdown} glycemic={glycemicRisk} />
      </div>

      {!collapsed && (
        <>
          <div className="day-summary-body">
            <div className="progress-ring-row">
              {macros.map((macro) => (
                <GoalProgressRing
                  key={macro}
                  label={MACRO_LABELS[macro]}
                  value={totals[macro]}
                  goal={goals ? goals[macro] : null}
                  unit={MACRO_UNITS[macro]}
                  colorVar={COLOR_VARS[macro]}
                />
              ))}
            </div>
            <p className="day-review-text">{reviewText}</p>
          </div>
          {prevDayTotals && (
            <div className="delta-row">
              {macros.map((macro) => {
                const delta = totals[macro] - prevDayTotals[macro]
                const sign = delta >= 0 ? '+' : ''
                return (
                  <span key={macro} className="delta-chip">
                    {MACRO_LABELS[macro]} {sign}
                    {Math.round(delta)} {MACRO_UNITS[macro]} vs. yesterday
                  </span>
                )
              })}
            </div>
          )}
        </>
      )}
    </section>
  )
}
