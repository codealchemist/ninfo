import type { Meal } from './types'
import { MTORC1_THRESHOLDS, estimateLeucine, type FeedingWindow } from './mtorc1'
import { formatMealDateLabel } from './mealText'
import i18n from '../i18n'

export type Mtorc1CheckState = 'pass' | 'fail' | 'info'

export interface Mtorc1Check {
  state: Mtorc1CheckState
  text: string
}

export interface Mtorc1Source {
  food: string
  protein: number
  leucine: number
}

export type Mtorc1Level = 'full' | 'strong' | 'weak' | 'refractory' | 'none'

export const roundTenth = (n: number) => Math.round(n * 10) / 10

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`
}

/** The "Why" checklist: the protein check, the timing check and, if any, the merged meals. */
export function mtorc1Checks(meal: Meal, window: FeedingWindow): Mtorc1Check[] {
  const th = MTORC1_THRESHOLDS
  const checks: Mtorc1Check[] = [
    {
      state: window.protein >= window.proteinThreshold ? 'pass' : 'fail',
      text: window.weightKg
        ? i18n.t('meals.mtorc1.checks.proteinPerKg', {
            grams: Math.round(window.protein),
            needed: Math.round(window.proteinThreshold),
            perKg: th.proteinPerKg,
            kg: roundTenth(window.weightKg),
          })
        : i18n.t('meals.mtorc1.checks.proteinFallback', {
            grams: Math.round(window.protein),
            needed: th.fallbackProteinGrams,
          }),
    },
    window.previousPulseStart === null || window.minutesSincePreviousPulse === null
      ? { state: 'pass', text: i18n.t('meals.mtorc1.checks.firstOfDay') }
      : {
          state: window.minutesSincePreviousPulse >= th.refractoryMinutes ? 'pass' : 'fail',
          text: i18n.t('meals.mtorc1.checks.sincePrevious', {
            duration: formatDuration(window.minutesSincePreviousPulse),
            time: window.previousPulseStart,
            hours: th.refractoryMinutes / 60,
          }),
        },
  ]
  const otherMeals = window.meals.filter((m) => m.key !== meal.key)
  if (otherMeals.length > 0) {
    checks.push({
      state: 'info',
      text: i18n.t('meals.mtorc1.checks.merged', {
        times: otherMeals.map((m) => m.time).join(', '),
        minutes: th.mergeWindowMinutes,
      }),
    })
  }
  return checks
}

/** The window's top leucine contributors, across every meal merged into it. */
export function mtorc1TopSources(window: FeedingWindow, limit = 3): Mtorc1Source[] {
  return window.meals
    .flatMap((m) => m.items)
    .map((item) => ({ food: item.food, protein: item.protein, leucine: estimateLeucine(item) }))
    .filter((s) => s.leucine >= 0.05)
    .sort((a, b) => b.leucine - a.leucine)
    .slice(0, limit)
}

/** Title line for anything leaving the app — the card only shows the time, so spell out the date. */
export function mtorc1ExportTitle(meal: Meal): string {
  return `${i18n.t('meals.mtorc1.title')} — ${formatMealDateLabel(meal.date)}, ${meal.time}`
}

const CHECK_MARKS: Record<Mtorc1CheckState, string> = { pass: '✓', fail: '✗', info: 'i' }

/** Everything the mTORC1 back view can show (all sections, open or not), as plain text. */
export function formatMtorc1AsText(meal: Meal, window: FeedingWindow, level: Mtorc1Level): string {
  const th = MTORC1_THRESHOLDS
  const t = i18n.t.bind(i18n)
  const lines = [
    mtorc1ExportTitle(meal),
    `≈${roundTenth(window.leucine)} g ${t('meals.mtorc1.leucineUnit')} · ${t(`meals.mtorc1.level.${level}`)}`,
    '',
    t('meals.mtorc1.whyTitle'),
    `${t('meals.mtorc1.gaugeLabel')}: ≈${roundTenth(window.leucine)} g (${t('meals.mtorc1.gaugePartial', {
      grams: th.partialLeucineGrams,
    })}, ${t('meals.mtorc1.gaugeFull', { grams: th.fullLeucineGrams })})`,
    ...mtorc1Checks(meal, window).map((c) => `${CHECK_MARKS[c.state]} ${c.text}`),
    '',
    t('meals.mtorc1.meaningTitle'),
    t(`meals.mtorc1.meaning.${window.status}`),
    t('meals.mtorc1.footnote'),
  ]
  const sources = mtorc1TopSources(window)
  if (sources.length > 0) {
    lines.push('', t('meals.mtorc1.sourcesTitle'))
    for (const s of sources) {
      lines.push(
        `- ${s.food} — ${t('meals.mtorc1.sourceValue', { leucine: roundTenth(s.leucine), protein: Math.round(s.protein) })}`
      )
    }
  }
  return lines.join('\n')
}
