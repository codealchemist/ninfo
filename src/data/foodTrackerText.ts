import type { FoodPeriodStats } from './foodTracker'
import { MACRO_KEYS } from './types'
import i18n from '../i18n'

/** One food's block: name and times, then its median share of the day's macros. */
function foodBlock(food: string, stats: FoodPeriodStats): string[] {
  const macros = i18n.t('common.macros', { returnObjects: true }) as Record<string, string>
  const head = `${food}: ${stats.times} ${i18n.t('foodTracker.timesUnit', { count: stats.times })}`
  if (stats.times === 0 || !stats.medianSharePct) return [head, `  ${i18n.t('foodTracker.notEaten')}`]
  const shares = stats.medianSharePct
  return [head, `  ${MACRO_KEYS.map((key) => `${macros[key]} ${Math.round(shares[key])}%`).join(' · ')}`]
}

/** The food tracker's cards as plain text, under a title line naming the period. */
export function formatFoodTrackerAsText(periodLabel: string, entries: Array<[string, FoodPeriodStats]>): string {
  const lines = [`${i18n.t('foodTracker.title')} — ${periodLabel}`, i18n.t('foodTracker.shareHint')]
  for (const [food, stats] of entries) lines.push('', ...foodBlock(food, stats))
  return lines.join('\n')
}
