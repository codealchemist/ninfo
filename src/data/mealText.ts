import type { FatBreakdown } from './lipidAnalysis'
import type { Meal, MealItem } from './types'
import i18n from '../i18n'

const round = (n: number) => Math.round(n * 10) / 10

/**
 * A meal's identity is really date + time, but the on-screen card only ever shows time
 * (the date is implied by whichever day is selected). Once copied out of the app — as text
 * or as an image — that context is gone, so anything leaving the app needs the date spelled
 * out. Includes the year too: the source sheet's own "Mon, Jul 13" style dates are exactly
 * the year-less, ambiguous-once-out-of-context format we had to work around when parsing —
 * no reason to reproduce that problem in what we export.
 */
export function formatMealDateLabel(dateIso: string): string {
  return new Date(`${dateIso}T00:00:00`).toLocaleDateString(i18n.language, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

/** Formats a list of food items (a full meal, or just a selected subset of it) as plain text. */
export function formatMealItemsAsText(
  items: MealItem[],
  label: string
): string {
  const lines = [label, '']
  const macros = i18n.t('common.macros', { returnObjects: true }) as Record<string, string>

  for (const item of items) {
    const qty = item.quantity !== 1 ? ` ×${item.quantity}` : ''
    lines.push(
      `- ${item.food}${qty} — ${Math.round(item.protein)}g ${macros.protein.toLowerCase()}, ${Math.round(item.carbs)}g ${macros.carbs.toLowerCase()}, ${Math.round(item.fat)}g ${macros.fat.toLowerCase()}, ${Math.round(item.fiber)}g ${macros.fiber.toLowerCase()}, ${Math.round(item.calories)} kcal`
    )
  }

  const totals = items.reduce(
    (acc, i) => ({
      protein: acc.protein + i.protein,
      carbs: acc.carbs + i.carbs,
      fat: acc.fat + i.fat,
      fiber: acc.fiber + i.fiber,
      calories: acc.calories + i.calories
    }),
    { protein: 0, carbs: 0, fat: 0, fiber: 0, calories: 0 }
  )

  lines.push('')
  lines.push(
    `${i18n.t('meals.nutritionLabel.totals')}: ${Math.round(totals.protein)}g ${macros.protein.toLowerCase()}, ${Math.round(totals.carbs)}g ${macros.carbs.toLowerCase()}, ${Math.round(totals.fat)}g ${macros.fat.toLowerCase()}, ${Math.round(totals.fiber)}g ${macros.fiber.toLowerCase()}, ${Math.round(totals.calories)} kcal`
  )

  return lines.join('\n')
}

const RULE = '⎯'.repeat(17)

/** Mirrors the on-screen "Nutrition Facts" label, ruled lines and all, as plain text. */
export function formatNutritionLabelAsText(
  meal: Meal,
  fat: FatBreakdown
): string {
  const macros = i18n.t('common.macros', { returnObjects: true }) as Record<string, string>
  const fatSection = i18n.t('meals.fatSection', { returnObjects: true }) as Record<string, string>
  const itemsCount = i18n.t('meals.nutritionLabel.itemsCount', { count: meal.items.length })

  const lines = [
    RULE,
    `${i18n.t('meals.nutritionLabel.title')} — ${formatMealDateLabel(meal.date)}, ${meal.time} (${itemsCount})`,
    RULE,
    `${macros.calories}: ${Math.round(meal.totals.calories)}`,
    RULE,
    `${macros.fat}: ${round(meal.totals.fat)}g`,
    `  ${fatSection.saturated}: ${round(fat.saturated)}g / ${fatSection.unsaturated}: ${round(fat.unsaturated)}g`
  ]

  if (fat.omega6to3Ratio !== null) {
    lines.push(
      `  Ω-6:Ω-3: ${fat.omega6to3Ratio === Infinity ? '∞' : `${round(fat.omega6to3Ratio)}:1`}`
    )
  }
  if (fat.trans > 0) lines.push(`  ${fatSection.trans}: ${round(fat.trans)}g`)

  lines.push(RULE, `${macros.carbs}: ${round(meal.totals.carbs)}g`)
  lines.push(RULE, `${macros.fiber}: ${round(meal.totals.fiber)}g`)
  lines.push(RULE, `${macros.protein}: ${round(meal.totals.protein)}g`)
  lines.push(RULE)

  return lines.join('\n')
}
