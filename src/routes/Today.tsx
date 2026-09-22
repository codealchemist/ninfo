import { useMemo } from 'react'
import { useAppStore } from '../store/appStore'
import { groupIntoMeals, itemsForDate } from '../data/aggregate/dailyTotals'
import DaySummarySwiper from '../components/summary/DaySummarySwiper'
import MealTimelineStrip from '../components/meals/MealTimelineStrip'
import FastingTimer from '../components/summary/FastingTimer'

export default function Today() {
  const meals = useAppStore((s) => s.meals)
  const selectedDate = useAppStore((s) => s.selectedDate)
  const dates = useAppStore((s) => s.dates)

  const dayMeals = useMemo(() => {
    if (!selectedDate) return []
    return groupIntoMeals(itemsForDate(meals, selectedDate))
  }, [meals, selectedDate])

  if (!selectedDate) return null

  // Nothing logged yet for the real current day — the swiper would otherwise default to the
  // last logged (older) day and show it as if it were today. Show a live fasting clock instead.
  const todayIso = new Date().toISOString().slice(0, 10)
  if (!dates.includes(todayIso)) {
    return (
      <div className="page today-page">
        <FastingTimer meals={meals} />
      </div>
    )
  }

  return (
    <div className="page today-page">
      <DaySummarySwiper />
      <MealTimelineStrip meals={dayMeals} />
    </div>
  )
}
