import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, ChevronLeft } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { dailyTotals, groupIntoMeals } from '../../data/aggregate/dailyTotals'
import { todayLocalIso } from '../../utils/localDate'
import { MACRO_KEYS, MACRO_UNITS } from '../../data/types'
import GoalProgressRing from './GoalProgressRing'

type MacroSource = 'lastDay' | 'lastMeal'

const COLOR_VARS: Record<string, string> = {
  protein: '--macro-protein',
  carbs: '--macro-carbs',
  fat: '--macro-fat',
  fiber: '--macro-fiber',
  calories: '--macro-calories',
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

/** Shown on the Today page — a live "how long since your last meal" clock. Without today's data
 * it's always shown in full and can't be collapsed (it's the only thing on the page then — see
 * Today.tsx), and it carries a "previous day" arrow — the same control DaySummarySwiper shows in
 * the normal view, just floated over this card instead — that steps the app's actual selected
 * date rather than a private copy, so using it pins the date chip and reveals the real day
 * summary/meal list (Today.tsx renders those, and stops rendering this component, once a past
 * date is pinned) instead of a second, stripped-down copy of the same gauges. There's no "next"
 * arrow: this view only ever shows today, so there's never a later day to step to. Once today
 * has data the panel starts as a compact title+clock strip that expands, on click, into the same
 * full view, and its macros section becomes collapsible too. Ticks every second via its own
 * interval since this is the one place in the app that shows a genuinely live (not just
 * periodically-refreshed) value. */
export default function FastingTimer() {
  const { t, i18n } = useTranslation()
  const meals = useAppStore((s) => s.meals)
  const dates = useAppStore((s) => s.dates)
  const goalsByDate = useAppStore((s) => s.goalsByDate)
  const stepDate = useAppStore((s) => s.stepDate)

  const todayIso = todayLocalIso()
  const hasTodayData = dates.includes(todayIso)

  const [expanded, setExpanded] = useState(false)
  const [macrosOpen, setMacrosOpen] = useState(false)
  const [macroSource, setMacroSource] = useState<MacroSource>('lastDay')

  const lastMeal = useMemo(() => {
    const grouped = groupIntoMeals(meals)
    return grouped.length > 0 ? grouped[grouped.length - 1] : null
  }, [meals])

  // The most recent logged day that isn't today itself — same "nearest earlier day with data"
  // baseline DaySummaryCard's own "vs. yesterday" uses, so it stays meaningful even once today
  // has its own data (where it'd otherwise just be a stand-in for "today").
  const lastDayDate = useMemo(() => {
    const priorDates = dates.filter((d) => d < todayIso)
    return priorDates.length > 0 ? priorDates[priorDates.length - 1] : null
  }, [dates, todayIso])
  const lastDayTotals = useMemo(() => (lastDayDate ? dailyTotals(meals, lastDayDate) : null), [meals, lastDayDate])
  const lastDayGoals = lastDayDate ? (goalsByDate[lastDayDate] ?? null) : null
  // Falls back to "last meal" if there's no earlier logged day at all (e.g. the very first day
  // ever logged) — the tab stays disabled in that case, but the default shouldn't render
  // all-zero rings.
  const effectiveMacroSource: MacroSource = macroSource === 'lastDay' && !lastDayTotals ? 'lastMeal' : macroSource
  const macroTotals = effectiveMacroSource === 'lastDay' ? lastDayTotals : (lastMeal?.totals ?? null)
  // A single meal doesn't have its own goal (goals are daily) — only the "last day" totals fill
  // against one, the same convention Timeline/DaySummaryCard use for any non-whole-day total.
  const macroGoals = effectiveMacroSource === 'lastDay' ? lastDayGoals : null

  // The prev-day arrow only makes sense once today has no data of its own to show — otherwise
  // the normal view (with its own arrows) is already on screen right below this panel.
  const showPrevDayArrow = !hasTodayData
  const canGoPrevDay = dates.length > 0
  // The macros section can't be collapsed away on a no-data day — it's the only content this
  // view has to offer, so hiding it would leave the page with nothing but a clock.
  const macrosCollapsible = hasTodayData
  const macrosVisible = macrosCollapsible ? macrosOpen : true

  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const isOpen = hasTodayData ? expanded : true
  const title = hasTodayData ? t('fasting.title') : t('fasting.noEntriesTodayTitle')
  const elapsed = lastMeal
    ? formatElapsed(now.getTime() - new Date(`${lastMeal.date}T${lastMeal.time}`).getTime())
    : null

  const header = (
    <>
      <h2>{title}</h2>
      {isOpen && lastMeal && <p className="hint">{t('fasting.sinceLastMeal')}</p>}
      {elapsed ? (
        <div className={'fasting-timer-clock' + (isOpen ? '' : ' fasting-timer-clock--compact')}>{elapsed}</div>
      ) : (
        <p className="hint">{t('fasting.noMealsYet')}</p>
      )}
    </>
  )

  return (
    <div className="fasting-timer-viewport">
      <section className={'card fasting-timer-card' + (isOpen ? '' : ' fasting-timer-card--compact')}>
        {hasTodayData ? (
          <button className="fasting-timer-toggle" onClick={() => setExpanded((e) => !e)} aria-expanded={expanded}>
            {header}
          </button>
        ) : (
          header
        )}

        {isOpen && lastMeal && (
          <>
            <p className="fasting-timer-last-meal">
              {t('fasting.lastMealLabel', {
                date: formatDateLabel(lastMeal.date, i18n.language),
                time: lastMeal.time,
              })}
            </p>

            <div className="fasting-macros-section">
              {macrosCollapsible && (
                <button
                  className="fasting-macros-toggle"
                  onClick={() => setMacrosOpen((o) => !o)}
                  aria-expanded={macrosOpen}
                >
                  <ChevronDown size={14} className={macrosOpen ? 'chevron chevron--open' : 'chevron'} />
                  {t('fasting.macrosSectionTitle')}
                </button>
              )}

              {macrosVisible && (
                <>
                  <div className="macro-view-tabs" role="tablist" aria-label={t('fasting.macroSourceAriaLabel')}>
                    <button
                      className={'range-button' + (effectiveMacroSource === 'lastDay' ? ' range-button--active' : '')}
                      onClick={() => setMacroSource('lastDay')}
                      role="tab"
                      aria-selected={effectiveMacroSource === 'lastDay'}
                      disabled={!lastDayTotals}
                    >
                      {t('fasting.lastDayTab')}
                    </button>
                    <button
                      className={'range-button' + (effectiveMacroSource === 'lastMeal' ? ' range-button--active' : '')}
                      onClick={() => setMacroSource('lastMeal')}
                      role="tab"
                      aria-selected={effectiveMacroSource === 'lastMeal'}
                    >
                      {t('fasting.lastMealTab')}
                    </button>
                  </div>
                  <div className="progress-ring-row fasting-macros-rings">
                    {MACRO_KEYS.map((macro) => (
                      <GoalProgressRing
                        key={macro}
                        label={t(`common.macros.${macro}`)}
                        value={macroTotals ? macroTotals[macro] : 0}
                        goal={macroGoals ? macroGoals[macro] : null}
                        unit={MACRO_UNITS[macro]}
                        colorVar={COLOR_VARS[macro]}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </section>

      {showPrevDayArrow && (
        <button
          className="icon-button day-summary-nav-arrow day-summary-nav-arrow--prev"
          onClick={() => canGoPrevDay && stepDate(-1)}
          disabled={!canGoPrevDay}
          aria-label={t('dateNavigator.previousDay')}
        >
          <ChevronLeft size={18} />
        </button>
      )}
    </div>
  )
}
