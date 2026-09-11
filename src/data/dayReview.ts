import type { MacroKey, MacroTotals } from './types'
import i18n from '../i18n'

const TRACKED_MACROS: MacroKey[] = ['protein', 'carbs', 'fat', 'fiber']

/** A short, human-readable read on how the day's macros are shaping up vs. goals. */
export function generateDayReview(totals: MacroTotals, goals: MacroTotals | null): string {
  if (!goals) {
    const summary = i18n.t('dayReview.noGoals', {
      calories: Math.round(totals.calories),
      protein: Math.round(totals.protein),
      carbs: Math.round(totals.carbs),
      fat: Math.round(totals.fat),
      fiber: Math.round(totals.fiber),
    })
    return `${summary} ${i18n.t('dayReview.noGoalsHint')}`
  }

  const pct = (key: MacroKey) => (goals[key] > 0 ? totals[key] / goals[key] : 0)
  const calPct = pct('calories')

  const ranked = TRACKED_MACROS.map((key) => ({ key, pct: pct(key) })).sort((a, b) => b.pct - a.pct)
  const leading = ranked[0]
  const lagging = ranked[ranked.length - 1]

  const calorieDelta = Math.round(goals.calories - totals.calories)
  const calorieSentence =
    calorieDelta >= 0
      ? i18n.t('dayReview.underBudget', { pct: Math.round(calPct * 100), delta: calorieDelta })
      : i18n.t('dayReview.overBudget', { pct: Math.round(calPct * 100), delta: Math.abs(calorieDelta) })

  const macroSentence =
    leading.key !== lagging.key
      ? i18n.t('dayReview.macroLeadLag', {
          leadMacro: i18n.t(`common.macros.${leading.key}`),
          leadPct: Math.round(leading.pct * 100),
          lagMacro: i18n.t(`common.macros.${lagging.key}`),
          lagPct: Math.round(lagging.pct * 100),
        })
      : i18n.t('dayReview.macroSingle', {
          macro: i18n.t(`common.macros.${leading.key}`),
          pct: Math.round(leading.pct * 100),
        })

  return `${calorieSentence} ${macroSentence}`
}
