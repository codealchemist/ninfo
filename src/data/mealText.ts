import type { FatBreakdown } from './lipidAnalysis'
import type { Meal, MealItem } from './types'

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
  return new Date(`${dateIso}T00:00:00`).toLocaleDateString(undefined, {
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

  for (const item of items) {
    const qty = item.quantity !== 1 ? ` ×${item.quantity}` : ''
    lines.push(
      `- ${item.food}${qty} — ${Math.round(item.protein)}g protein, ${Math.round(item.carbs)}g carbs, ${Math.round(item.fat)}g fat, ${Math.round(item.fiber)}g fiber, ${Math.round(item.calories)} kcal`
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
    `Totals: ${Math.round(totals.protein)}g protein, ${Math.round(totals.carbs)}g carbs, ${Math.round(totals.fat)}g fat, ${Math.round(totals.fiber)}g fiber, ${Math.round(totals.calories)} kcal`
  )

  return lines.join('\n')
}

const RULE = '⎯'.repeat(17)

/** Mirrors the on-screen "Nutrition Facts" label, ruled lines and all, as plain text. */
export function formatNutritionLabelAsText(
  meal: Meal,
  fat: FatBreakdown
): string {
  const lines = [
    RULE,
    `Nutrition Facts — ${formatMealDateLabel(meal.date)}, ${meal.time} (${meal.items.length} item${meal.items.length !== 1 ? 's' : ''})`,
    RULE,
    `Calories: ${Math.round(meal.totals.calories)}`,
    RULE,
    `Fat: ${round(meal.totals.fat)}g`,
    `  Saturated: ${round(fat.saturated)}g / Unsaturated: ${round(fat.unsaturated)}g`
  ]

  if (fat.omega6to3Ratio !== null) {
    lines.push(
      `  Ω-6:Ω-3 ratio: ${fat.omega6to3Ratio === Infinity ? '∞' : `${round(fat.omega6to3Ratio)}:1`}`
    )
  }
  if (fat.trans > 0) lines.push(`  Trans: ${round(fat.trans)}g`)

  lines.push(RULE, `Carbs: ${round(meal.totals.carbs)}g`)
  lines.push(RULE, `Fiber: ${round(meal.totals.fiber)}g`)
  lines.push(RULE, `Protein: ${round(meal.totals.protein)}g`)
  lines.push(RULE)

  return lines.join('\n')
}
