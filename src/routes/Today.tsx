import { useMemo } from 'react'
import { useAppStore } from '../store/appStore'
import { groupIntoMeals, itemsForDate } from '../data/aggregate/dailyTotals'
import { todayLocalIso } from '../utils/localDate'
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

  // Without today's data the swiper would otherwise default to the last logged (older) day and
  // show it as if it were today, so the fasting panel covers "today" instead — whether or not
  // it has data yet, and however the user got there (default landing, or navigating forward
  // past the last logged day / picking today directly, both of which now reach today even
  // though it isn't itself a logged date — see stepDate/DaySummarySwiper/DaySummaryCard). Any
  // other date shows the real day summary/meal list, and never the fasting panel.
  const todayIso = todayLocalIso()
  const hasTodayData = dates.includes(todayIso)
  const isToday = selectedDate === todayIso
  const showNormalView = !isToday || hasTodayData

  return (
    <div className="page today-page">
      {isToday && <FastingTimer />}
      {showNormalView && (
        <>
          <DaySummarySwiper />
          <MealTimelineStrip meals={dayMeals} />
        </>
      )}
    </div>
  )
}
