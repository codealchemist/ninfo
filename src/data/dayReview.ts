import { MACRO_LABELS, type MacroKey, type MacroTotals } from './types'

const TRACKED_MACROS: MacroKey[] = ['protein', 'carbs', 'fat', 'fiber']

/** A short, human-readable read on how the day's macros are shaping up vs. goals. */
export function generateDayReview(totals: MacroTotals, goals: MacroTotals | null): string {
  if (!goals) {
    return `Logged ${Math.round(totals.calories)} kcal so far today — ${Math.round(totals.protein)}g protein, ${Math.round(totals.carbs)}g carbs, ${Math.round(totals.fat)}g fat, ${Math.round(totals.fiber)}g fiber. Set daily goals in your sheet to see progress here.`
  }

  const pct = (key: MacroKey) => (goals[key] > 0 ? totals[key] / goals[key] : 0)
  const calPct = pct('calories')

  const ranked = TRACKED_MACROS.map((key) => ({ key, pct: pct(key) })).sort((a, b) => b.pct - a.pct)
  const leading = ranked[0]
  const lagging = ranked[ranked.length - 1]

  const calorieDelta = Math.round(goals.calories - totals.calories)
  const calorieClause =
    calorieDelta >= 0
      ? `${calorieDelta} kcal left in today's budget`
      : `${Math.abs(calorieDelta)} kcal over today's budget`

  const macroClause =
    leading.key !== lagging.key
      ? `${MACRO_LABELS[leading.key]} is leading at ${Math.round(leading.pct * 100)}% of goal, while ${MACRO_LABELS[lagging.key].toLowerCase()} lags at ${Math.round(lagging.pct * 100)}%.`
      : `${MACRO_LABELS[leading.key]} is at ${Math.round(leading.pct * 100)}% of goal.`

  return `You're at ${Math.round(calPct * 100)}% of your calorie goal, with ${calorieClause}. ${macroClause}`
}
