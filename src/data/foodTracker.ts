import type { MacroTotals, MealItem } from './types'
import { MACRO_KEYS } from './types'
import { median } from './aggregate/dailyTotals'

/** Period lengths in days for the food tracker; 0 = the whole log. */
export const FOOD_TRACKER_RANGES = [7, 15, 30, 90, 0] as const
export type FoodTrackerRange = (typeof FOOD_TRACKER_RANGES)[number]

/** How many days back the food picker looks for foods to offer. */
export const FOOD_PICKER_DAYS = 30

/** `iso` moved by `days` calendar days (negative = earlier). Noon avoids DST edge cases. */
export function shiftIsoDate(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** First date of a period of `range` days ending on (and including) `endDate`; null = all. */
function periodStart(endDate: string, range: number): string | null {
  return range === 0 ? null : shiftIsoDate(endDate, -(range - 1))
}

/** Foods eaten in the `days` days up to `endDate`, most frequently eaten first. */
export function recentFoods(items: MealItem[], endDate: string, days = FOOD_PICKER_DAYS): string[] {
  const start = shiftIsoDate(endDate, -(days - 1))
  const counts = new Map<string, number>()
  for (const item of items) {
    if (item.date < start || item.date > endDate) continue
    counts.set(item.food, (counts.get(item.food) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([food]) => food)
}

export interface FoodPeriodStats {
  /** Distinct meals (date + time) that included the food. */
  times: number
  /** Logged days in the period that included the food. */
  daysEaten: number
  /** Meals that included the food, per date it was eaten on (dates in the period only). */
  timesByDate: Map<string, number>
  /** Logged days in the period (days with any entry). */
  loggedDays: number
  /** Median, over every logged day in the period (0 on days without it), of the food's share of
   * that day's total per macro (%). Days with no entries at all are missing data, not counted. */
  medianSharePct: MacroTotals | null
}

const zeroTotals = (): MacroTotals => ({ protein: 0, carbs: 0, fat: 0, fiber: 0, calories: 0 })

function medianByMacro(rows: MacroTotals[]): MacroTotals | null {
  if (rows.length === 0) return null
  const result = zeroTotals()
  for (const key of MACRO_KEYS) result[key] = median(rows.map((r) => r[key]))
  return result
}

/** One food's stats for the period of `range` days ending on `endDate`. */
export function foodPeriodStats(
  items: MealItem[],
  food: string,
  endDate: string,
  range: number
): FoodPeriodStats {
  const start = periodStart(endDate, range)
  const dayTotals = new Map<string, MacroTotals>()
  const foodTotals = new Map<string, MacroTotals>()
  const mealKeys = new Set<string>()

  for (const item of items) {
    if (item.date > endDate || (start !== null && item.date < start)) continue
    const day = dayTotals.get(item.date) ?? zeroTotals()
    for (const key of MACRO_KEYS) day[key] += item[key]
    dayTotals.set(item.date, day)
    if (item.food !== food) continue
    mealKeys.add(`${item.date}T${item.time}`)
    const own = foodTotals.get(item.date) ?? zeroTotals()
    for (const key of MACRO_KEYS) own[key] += item[key]
    foodTotals.set(item.date, own)
  }

  const shares: MacroTotals[] = []
  for (const [date, day] of dayTotals) {
    const own = foodTotals.get(date) ?? zeroTotals()
    const share = zeroTotals()
    for (const key of MACRO_KEYS) share[key] = day[key] > 0 ? (own[key] / day[key]) * 100 : 0
    shares.push(share)
  }

  const timesByDate = new Map<string, number>()
  for (const key of mealKeys) {
    const date = key.slice(0, 10)
    timesByDate.set(date, (timesByDate.get(date) ?? 0) + 1)
  }

  return {
    times: mealKeys.size,
    daysEaten: foodTotals.size,
    timesByDate,
    loggedDays: dayTotals.size,
    medianSharePct: medianByMacro(shares),
  }
}
