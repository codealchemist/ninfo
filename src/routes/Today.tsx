import { useMemo } from 'react'
import { useAppStore } from '../store/appStore'
import { groupIntoMeals, itemsForDate } from '../data/aggregate/dailyTotals'
import DaySummarySwiper from '../components/summary/DaySummarySwiper'
import MealTimelineStrip from '../components/meals/MealTimelineStrip'

export default function Today() {
  const meals = useAppStore((s) => s.meals)
  const selectedDate = useAppStore((s) => s.selectedDate)

  const dayMeals = useMemo(() => {
    if (!selectedDate) return []
    return groupIntoMeals(itemsForDate(meals, selectedDate))
  }, [meals, selectedDate])

  if (!selectedDate) return null

  return (
    <div className="page today-page">
      <DaySummarySwiper />
      <MealTimelineStrip meals={dayMeals} />
    </div>
  )
}
