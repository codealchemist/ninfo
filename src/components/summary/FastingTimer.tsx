import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { groupIntoMeals } from '../../data/aggregate/dailyTotals'
import type { MealItem } from '../../data/types'

interface Props {
  meals: MealItem[]
}

function formatDateLabel(iso: string, locale: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })
}

function formatElapsed(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = totalSeconds % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${h}:${pad(m)}:${pad(s)}`
}

/** Shown on the Today page in place of the day summary whenever nothing has been logged yet
 * today — a live "how long since your last meal" clock instead of a stale previous day dressed
 * up as today's. Ticks every second via its own interval since this is the one place in the app
 * that shows a genuinely live (not just periodically-refreshed) value. */
export default function FastingTimer({ meals }: Props) {
  const { t, i18n } = useTranslation()

  const lastMeal = useMemo(() => {
    const grouped = groupIntoMeals(meals)
    return grouped.length > 0 ? grouped[grouped.length - 1] : null
  }, [meals])

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <section className="card fasting-timer-card">
      <h2>{t('fasting.noEntriesTodayTitle')}</h2>
      {lastMeal ? (
        <>
          <p className="hint">{t('fasting.sinceLastMeal')}</p>
          <div className="fasting-timer-clock">
            {formatElapsed(now.getTime() - new Date(`${lastMeal.date}T${lastMeal.time}`).getTime())}
          </div>
          <p className="fasting-timer-last-meal">
            {t('fasting.lastMealLabel', {
              food: lastMeal.items[0]?.food ?? '',
              date: formatDateLabel(lastMeal.date, i18n.language),
              time: lastMeal.time,
            })}
          </p>
        </>
      ) : (
        <p className="hint">{t('fasting.noMealsYet')}</p>
      )}
    </section>
  )
}
