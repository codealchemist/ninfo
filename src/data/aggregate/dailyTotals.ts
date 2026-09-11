import type { DailyAggregate, LipidTotals, MacroKey, MacroTotals, Meal, MealItem } from '../types'
import { MACRO_KEYS } from '../types'

const emptyTotals = (): MacroTotals => ({ protein: 0, carbs: 0, fat: 0, fiber: 0, calories: 0 })

const emptyLipids = (): LipidTotals => ({
  omega3: 0,
  omega6: 0,
  omega9: 0,
  scfa: 0,
  mcfa: 0,
  lcfa: 0,
  tox: 0,
})

function addInto(totals: MacroTotals, item: MealItem) {
  totals.protein += item.protein
  totals.carbs += item.carbs
  totals.fat += item.fat
  totals.fiber += item.fiber
  totals.calories += item.calories
}

function addLipidsInto(lipids: LipidTotals, item: MealItem) {
  lipids.omega3 += item.lipids.omega3
  lipids.omega6 += item.lipids.omega6
  lipids.omega9 += item.lipids.omega9
  lipids.scfa += item.lipids.scfa
  lipids.mcfa += item.lipids.mcfa
  lipids.lcfa += item.lipids.lcfa
  lipids.tox += item.lipids.tox
}

export function itemsForDate(items: MealItem[], date: string): MealItem[] {
  return items.filter((i) => i.date === date)
}

/** Groups a day's items into meals — one meal per distinct date+time cluster, in chronological order. */
export function groupIntoMeals(items: MealItem[]): Meal[] {
  const byKey = new Map<string, MealItem[]>()
  for (const item of items) {
    const key = `${item.date}T${item.time}`
    const bucket = byKey.get(key)
    if (bucket) bucket.push(item)
    else byKey.set(key, [item])
  }
  return Array.from(byKey.entries())
    .map(([key, mealItems]) => {
      const totals = emptyTotals()
      const lipids = emptyLipids()
      for (const it of mealItems) {
        addInto(totals, it)
        addLipidsInto(lipids, it)
      }
      return { key, date: mealItems[0].date, time: mealItems[0].time, items: mealItems, totals, lipids }
    })
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
}

export function dailyTotals(items: MealItem[], date: string): MacroTotals {
  const totals = emptyTotals()
  for (const item of items) {
    if (item.date === date) addInto(totals, item)
  }
  return totals
}

export function dailyLipids(items: MealItem[], date: string): LipidTotals {
  const lipids = emptyLipids()
  for (const item of items) {
    if (item.date === date) addLipidsInto(lipids, item)
  }
  return lipids
}

export function aggregateByDay(
  items: MealItem[],
  goalsByDate: Record<string, MacroTotals>
): DailyAggregate[] {
  const byDate = new Map<string, MealItem[]>()
  for (const item of items) {
    const bucket = byDate.get(item.date)
    if (bucket) bucket.push(item)
    else byDate.set(item.date, [item])
  }
  return Array.from(byDate.entries())
    .map(([date, dayItems]) => {
      const totals = emptyTotals()
      for (const it of dayItems) addInto(totals, it)
      const meals = new Set(dayItems.map((i) => i.time)).size
      return { date, totals, goals: goalsByDate[date] ?? null, mealCount: meals }
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function sortedDates(items: MealItem[]): string[] {
  return Array.from(new Set(items.map((i) => i.date))).sort()
}

/** The up-to-`count` logged dates immediately before (not including) `beforeDate`. */
export function trailingDates(dates: string[], beforeDate: string, count: number): string[] {
  const idx = dates.indexOf(beforeDate)
  if (idx <= 0) return []
  return dates.slice(Math.max(0, idx - count), idx)
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/** The per-macro median of each date's daily totals — a comparison baseline that's less
 * skewed by a single unusually big or small day than a mean would be. */
export function medianTotals(items: MealItem[], dates: string[]): MacroTotals | null {
  if (dates.length === 0) return null
  const perDate = dates.map((d) => dailyTotals(items, d))
  return {
    protein: median(perDate.map((t) => t.protein)),
    carbs: median(perDate.map((t) => t.carbs)),
    fat: median(perDate.map((t) => t.fat)),
    fiber: median(perDate.map((t) => t.fiber)),
    calories: median(perDate.map((t) => t.calories)),
  }
}

export interface TopSource {
  food: string
  amount: number
}

/** For each macro, the single food that contributed the most of it across the given meals. */
export function topSourcesByMacro(meals: Meal[]): Record<MacroKey, TopSource | null> {
  const byFood = new Map<string, MacroTotals>()
  for (const meal of meals) {
    for (const item of meal.items) {
      const totals = byFood.get(item.food) ?? emptyTotals()
      addInto(totals, item)
      byFood.set(item.food, totals)
    }
  }

  const result = {} as Record<MacroKey, TopSource | null>
  for (const key of MACRO_KEYS) {
    let best: TopSource | null = null
    for (const [food, totals] of byFood) {
      if (totals[key] > 0 && (!best || totals[key] > best.amount)) {
        best = { food, amount: totals[key] }
      }
    }
    result[key] = best
  }
  return result
}
