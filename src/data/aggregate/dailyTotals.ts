import type { DailyAggregate, LipidTotals, MacroTotals, Meal, MealItem } from '../types'

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
