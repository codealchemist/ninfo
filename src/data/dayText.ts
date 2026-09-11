import type { Meal, MacroKey, MacroTotals } from './types'
import { MACRO_KEYS, MACRO_UNITS } from './types'
import { formatMealDateLabel } from './mealText'
import i18n from '../i18n'

/** Every meal's items for a day, one section per meal time, as plain text. */
export function formatDayFoodListAsText(meals: Meal[], dateIso: string): string {
  const macros = i18n.t('common.macros', { returnObjects: true }) as Record<string, string>
  const lines = [i18n.t('today.foodLogTitle', { date: formatMealDateLabel(dateIso) }), '']

  const dayTotals: MacroTotals = { protein: 0, carbs: 0, fat: 0, fiber: 0, calories: 0 }

  for (const meal of meals) {
    lines.push(meal.time)
    for (const item of meal.items) {
      const qty = item.quantity !== 1 ? ` ×${item.quantity}` : ''
      lines.push(
        `- ${item.food}${qty} — ${Math.round(item.protein)}g ${macros.protein.toLowerCase()}, ${Math.round(item.carbs)}g ${macros.carbs.toLowerCase()}, ${Math.round(item.fat)}g ${macros.fat.toLowerCase()}, ${Math.round(item.fiber)}g ${macros.fiber.toLowerCase()}, ${Math.round(item.calories)} kcal`
      )
      dayTotals.protein += item.protein
      dayTotals.carbs += item.carbs
      dayTotals.fat += item.fat
      dayTotals.fiber += item.fiber
      dayTotals.calories += item.calories
    }
    lines.push('')
  }

  lines.push(
    `${i18n.t('meals.nutritionLabel.totals')}: ${Math.round(dayTotals.protein)}g ${macros.protein.toLowerCase()}, ${Math.round(dayTotals.carbs)}g ${macros.carbs.toLowerCase()}, ${Math.round(dayTotals.fat)}g ${macros.fat.toLowerCase()}, ${Math.round(dayTotals.fiber)}g ${macros.fiber.toLowerCase()}, ${Math.round(dayTotals.calories)} kcal`
  )

  return lines.join('\n')
}

/** The day summary card's totals vs. goals, as plain text. */
export function formatDaySummaryAsText(
  dateIso: string,
  totals: MacroTotals,
  goals: MacroTotals | null
): string {
  const macros = i18n.t('common.macros', { returnObjects: true }) as Record<string, string>

  const lines = [i18n.t('today.summaryTitle', { date: formatMealDateLabel(dateIso) }), '']

  for (const key of MACRO_KEYS as readonly MacroKey[]) {
    const unit = key === 'calories' ? '' : MACRO_UNITS[key]
    const value = Math.round(totals[key])
    const goalSuffix = goals ? ` ${i18n.t('today.ofGoal', { goal: Math.round(goals[key]), unit })}` : ''
    lines.push(`${macros[key]}: ${value}${unit}${goalSuffix}`)
  }

  return lines.join('\n')
}
