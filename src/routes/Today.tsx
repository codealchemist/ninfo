import { useMemo } from 'react'
import { useAppStore } from '../store/appStore'
import { dailyLipids, dailyTotals, groupIntoMeals, itemsForDate } from '../data/aggregate/dailyTotals'
import DaySummaryCard from '../components/summary/DaySummaryCard'
import MealTimelineStrip from '../components/meals/MealTimelineStrip'

export default function Today() {
  const meals = useAppStore((s) => s.meals)
  const goalsByDate = useAppStore((s) => s.goalsByDate)
  const dates = useAppStore((s) => s.dates)
  const selectedDate = useAppStore((s) => s.selectedDate)

  const dayMeals = useMemo(() => {
    if (!selectedDate) return []
    return groupIntoMeals(itemsForDate(meals, selectedDate))
  }, [meals, selectedDate])

  const totals = useMemo(
    () => (selectedDate ? dailyTotals(meals, selectedDate) : null),
    [meals, selectedDate]
  )

  const lipids = useMemo(
    () => (selectedDate ? dailyLipids(meals, selectedDate) : null),
    [meals, selectedDate]
  )

  const prevDayTotals = useMemo(() => {
    if (!selectedDate) return null
    const idx = dates.indexOf(selectedDate)
    if (idx <= 0) return null
    return dailyTotals(meals, dates[idx - 1])
  }, [meals, dates, selectedDate])

  if (!selectedDate || !totals || !lipids) return null

  return (
    <div className="page today-page">
      <DaySummaryCard
        totals={totals}
        lipids={lipids}
        goals={goalsByDate[selectedDate] ?? null}
        prevDayTotals={prevDayTotals}
      />
      <MealTimelineStrip meals={dayMeals} />
    </div>
  )
}
