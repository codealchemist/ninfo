import type { LipidTotals, MacroTotals, Meal, MealItem } from '../types'
import { dailyLipids, dailyTotals, groupIntoMeals, itemsForDate, medianTotals, trailingDates } from './dailyTotals'

export interface DaySummaryData {
  meals: Meal[]
  totals: MacroTotals
  lipids: LipidTotals
  goals: MacroTotals | null
  prevDayTotals: MacroTotals | null
  weekMedianTotals: MacroTotals | null
  monthMedianTotals: MacroTotals | null
}

interface BuildDaySummaryDataParams {
  meals: MealItem[]
  goalsByDate: Record<string, MacroTotals>
  dates: string[]
  date: string
}

export function buildDaySummaryData({ meals, goalsByDate, dates, date }: BuildDaySummaryDataParams): DaySummaryData {
  const idx = dates.indexOf(date)
  return {
    meals: groupIntoMeals(itemsForDate(meals, date)),
    totals: dailyTotals(meals, date),
    lipids: dailyLipids(meals, date),
    goals: goalsByDate[date] ?? null,
    prevDayTotals: idx > 0 ? dailyTotals(meals, dates[idx - 1]) : null,
    weekMedianTotals: medianTotals(meals, trailingDates(dates, date, 7)),
    monthMedianTotals: medianTotals(meals, trailingDates(dates, date, 30)),
  }
}
