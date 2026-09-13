import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, Image as ImageIcon, Link2, Maximize2, Minimize2 } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { aggregateByDay, dailyTotals, groupIntoMeals, medianTotals } from '../data/aggregate/dailyTotals'
import { MACRO_KEYS, MACRO_UNITS } from '../data/types'
import { copyElementAsImage } from '../utils/clipboard'
import { getSheetLink } from '../db/sheetLinkStorage'
import { parseGoogleSheetUrl } from '../utils/googleSheetUrl'
import { LiquidoSource } from '../data/sources/LiquidoSource'
import type { LiquidEntry } from '../data/parsers/liquidoParser'
import { dailyTotalMlByDate } from '../data/liquidUtils'
import { PesoSource } from '../data/sources/PesoSource'
import type { WeightEntry } from '../data/parsers/pesoParser'
import MacroTimelineChart from '../components/charts/MacroTimelineChart'
import TimelineScrubber from '../components/charts/TimelineScrubber'
import FoodSearchInput from '../components/charts/FoodSearchInput'
import GoalProgressRing from '../components/summary/GoalProgressRing'

const RANGES = [7, 30, 90, 0] as const // 0 = all

const COLOR_VARS: Record<string, string> = {
  protein: '--macro-protein',
  carbs: '--macro-carbs',
  fat: '--macro-fat',
  fiber: '--macro-fiber',
  calories: '--macro-calories',
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/** "02:40" -> 160. Null if missing/unparsable (e.g. the very first logged day, which has no
 * previous meal to measure a fast from). */
function parseFastingMinutes(value: string | null): number | null {
  if (!value) return null
  const [h, m] = value.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

function formatFastingMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = Math.round(totalMinutes % 60)
  return `${h}h ${m}m`
}

export default function Timeline() {
  const { t } = useTranslation()
  const meals = useAppStore((s) => s.meals)
  const goalsByDate = useAppStore((s) => s.goalsByDate)
  const foodCatalog = useAppStore((s) => s.foodCatalog)
  const jumpToDate = useAppStore((s) => s.jumpToDate)
  const sheetLinkId = useAppStore((s) => s.sheetLinkId)
  const [range, setRange] = useState<number>(30)
  const chartRef = useRef<HTMLDivElement>(null)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [fullscreen, setFullscreen] = useState(false)
  const [scrubIndex, setScrubIndex] = useState<number | null>(null)
  const [scrubbing, setScrubbing] = useState(false)
  const [medianRange, setMedianRange] = useState<number>(30)
  const [medianLinked, setMedianLinked] = useState(true)
  const [skipLastDay, setSkipLastDay] = useState(false)
  const [liquidEntries, setLiquidEntries] = useState<LiquidEntry[]>([])
  const [weightEntries, setWeightEntries] = useState<WeightEntry[]>([])
  const [selectedFood, setSelectedFood] = useState<string | null>(null)
  const navigate = useNavigate()

  const foodNames = useMemo(
    () => Array.from(new Set(foodCatalog.map((f) => f.food))).sort((a, b) => a.localeCompare(b)),
    [foodCatalog]
  )

  // When a food is selected, every macro figure below is that food's contribution only — the
  // same dates as the unfiltered view (so zero-days still show as zero, not a gap), just with
  // totals restricted to this one food's items.
  const filteredMeals = useMemo(
    () => (selectedFood ? meals.filter((m) => m.food === selectedFood) : null),
    [meals, selectedFood]
  )

  // Water intake and the protein/kg ratio are bonus stats alongside the macro medians — loaded
  // quietly from the same linked sheet's "Líquido"/"Peso" tabs (if any) with no dedicated error
  // UI, since the rest of the panel is still useful without them.
  useEffect(() => {
    const spreadsheetId = sheetLinkId
      ? parseGoogleSheetUrl(getSheetLink(sheetLinkId)?.url ?? '')?.spreadsheetId ?? null
      : null
    if (!spreadsheetId) {
      setLiquidEntries([])
      setWeightEntries([])
      return
    }
    let cancelled = false
    new LiquidoSource(spreadsheetId)
      .load()
      .then((result) => {
        if (!cancelled) setLiquidEntries(result)
      })
      .catch(() => {
        if (!cancelled) setLiquidEntries([])
      })
    new PesoSource(spreadsheetId)
      .load()
      .then((result) => {
        if (!cancelled) setWeightEntries(result)
      })
      .catch(() => {
        if (!cancelled) setWeightEntries([])
      })
    return () => {
      cancelled = true
    }
  }, [sheetLinkId])

  useEffect(() => {
    if (!fullscreen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fullscreen])

  const handleDayClick = (date: string) => {
    jumpToDate(date)
    navigate('/app/today')
  }

  const allDays = useMemo(() => aggregateByDay(meals, goalsByDate), [meals, goalsByDate])
  const days = range === 0 ? allDays : allDays.slice(-range)

  // The chart's own dates/labels stay anchored to the full log; only the plotted totals swap to
  // the selected food's per-day contribution (defaulting to zero on days it wasn't eaten).
  const displayDays = useMemo(
    () => (filteredMeals ? days.map((d) => ({ ...d, totals: dailyTotals(filteredMeals, d.date) })) : days),
    [days, filteredMeals]
  )

  // The scrubber's index is only meaningful for the currently displayed range — reset it
  // whenever that range changes so a stale position from a longer range can't linger.
  useEffect(() => {
    setScrubIndex(null)
    setScrubbing(false)
  }, [range])

  // The median panel has its own range, independent of the chart's — except while linked, when
  // it just follows the chart's range instead of being set directly.
  useEffect(() => {
    if (medianLinked) setMedianRange(range)
  }, [range, medianLinked])

  const medianDays = medianRange === 0 ? allDays : allDays.slice(-medianRange)
  // The most recent day is often still in progress (today isn't over yet) — skipping it is an
  // explicit opt-in rather than the default, since most of the time it's a full logged day.
  const effectiveMedianDays = skipLastDay ? medianDays.slice(0, -1) : medianDays
  const medians = useMemo(
    () => medianTotals(filteredMeals ?? meals, effectiveMedianDays.map((d) => d.date)),
    [meals, filteredMeals, effectiveMedianDays]
  )
  const medianLatestGoals =
    effectiveMedianDays.length > 0 ? effectiveMedianDays[effectiveMedianDays.length - 1].goals : null

  // Grams/day for the selected food when filtering, otherwise total food weight across everything.
  const medianGrams = useMemo(() => {
    if (effectiveMedianDays.length === 0) return null
    const gramsByDate = new Map<string, number>()
    for (const item of filteredMeals ?? meals) {
      gramsByDate.set(item.date, (gramsByDate.get(item.date) ?? 0) + item.grams)
    }
    return median(effectiveMedianDays.map((d) => gramsByDate.get(d.date) ?? 0))
  }, [meals, filteredMeals, effectiveMedianDays])

  // The daily fast is measured from the gap before each day's first meal (the overnight fast),
  // not every inter-meal gap — that's the one meaningful "how long was today's fast" number.
  const medianFastingMinutes = useMemo(() => {
    const firstMealByDate = new Map<string, string | null>()
    for (const meal of groupIntoMeals(meals)) {
      if (!firstMealByDate.has(meal.date)) firstMealByDate.set(meal.date, meal.items[0]?.fastingSincePrev ?? null)
    }
    const values = effectiveMedianDays
      .map((d) => parseFastingMinutes(firstMealByDate.get(d.date) ?? null))
      .filter((v): v is number => v !== null)
    return values.length > 0 ? median(values) : null
  }, [meals, effectiveMedianDays])

  const medianWaterMl = useMemo(() => {
    if (effectiveMedianDays.length === 0 || liquidEntries.length === 0) return null
    const waterByDate = dailyTotalMlByDate(liquidEntries)
    return median(effectiveMedianDays.map((d) => waterByDate.get(d.date) ?? 0))
  }, [liquidEntries, effectiveMedianDays])

  // Weigh-ins rarely land on the exact same dates as logged meals, so this medians over every
  // weigh-in that falls within the period's date span rather than requiring an exact date match.
  const medianWeightKg = useMemo(() => {
    if (effectiveMedianDays.length === 0 || weightEntries.length === 0) return null
    const minDate = effectiveMedianDays[0].date
    const maxDate = effectiveMedianDays[effectiveMedianDays.length - 1].date
    const inRange = weightEntries.filter((e) => e.date >= minDate && e.date <= maxDate)
    return inRange.length > 0 ? median(inRange.map((e) => e.weightKg)) : null
  }, [weightEntries, effectiveMedianDays])

  const medianProteinPerKg = useMemo(() => {
    if (!medians || !medianWeightKg) return null
    return medians.protein / medianWeightKg
  }, [medians, medianWeightKg])

  const handleScrub = (index: number | null, active: boolean) => {
    setScrubIndex(index)
    setScrubbing(active)
  }

  const handleMedianRangeSelect = (r: number) => {
    setMedianLinked(false)
    setMedianRange(r)
  }

  const handleToggleMedianLink = () => {
    setMedianLinked((linked) => {
      const next = !linked
      if (next) setMedianRange(range)
      return next
    })
  }

  const handleCopyImage = async () => {
    if (!chartRef.current) return
    const ok = await copyElementAsImage(chartRef.current)
    setCopyState(ok ? 'copied' : 'failed')
    setTimeout(() => setCopyState('idle'), 1500)
  }

  const content = (
    <>
      <div className="timeline-header">
        <h2>{t('timeline.title')}</h2>
        <div className="range-buttons">
          {RANGES.map((r) => (
            <button
              key={r}
              className={'range-button' + (range === r ? ' range-button--active' : '')}
              onClick={() => setRange(r)}
            >
              {r === 0 ? t('timeline.all') : t('timeline.rangeDays', { count: r })}
            </button>
          ))}
          <button
            className="icon-button icon-button--ghost"
            onClick={handleCopyImage}
            aria-label={t('timeline.copyImageAria')}
            title={t('timeline.copyImageTitle')}
          >
            {copyState === 'copied' ? <Check size={14} /> : <ImageIcon size={14} />}
          </button>
          <button
            className="icon-button icon-button--ghost"
            onClick={() => setFullscreen((f) => !f)}
            aria-label={fullscreen ? t('timeline.exitFullscreen') : t('timeline.viewFullscreen')}
            title={fullscreen ? t('timeline.exitFullscreen') : t('timeline.viewFullscreen')}
          >
            {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>
      <div className="timeline-search-row">
        <FoodSearchInput foods={foodNames} selectedFood={selectedFood} onSelect={setSelectedFood} />
      </div>
      <p className="hint">
        {selectedFood ? t('timeline.foodFilterHint', { food: selectedFood }) : t('timeline.hint')}
      </p>
      <MacroTimelineChart
        ref={chartRef}
        days={displayDays}
        onDayClick={handleDayClick}
        activeIndex={scrubbing ? scrubIndex : null}
      />
      <TimelineScrubber count={displayDays.length} index={scrubIndex} onScrub={handleScrub} />
    </>
  )

  return (
    <div className="page">
      <section className="card">{!fullscreen && content}</section>

      {medians && (
        <section className="card">
          <div className="timeline-header">
            <h2>{t('timeline.medianTitle')}</h2>
            <div className="range-buttons">
              <label className="skip-last-day-toggle" title={t('timeline.skipLastDayTitle')}>
                <input type="checkbox" checked={skipLastDay} onChange={(e) => setSkipLastDay(e.target.checked)} />
                <span>{t('timeline.skipLastDay')}</span>
              </label>
              {RANGES.map((r) => (
                <button
                  key={r}
                  className={'range-button' + (medianRange === r ? ' range-button--active' : '')}
                  onClick={() => handleMedianRangeSelect(r)}
                >
                  {r === 0 ? t('timeline.all') : t('timeline.rangeDays', { count: r })}
                </button>
              ))}
              <button
                className={'icon-button icon-button--ghost' + (medianLinked ? ' icon-button--active' : '')}
                onClick={handleToggleMedianLink}
                aria-pressed={medianLinked}
                aria-label={medianLinked ? t('timeline.unlinkRangeTitle') : t('timeline.linkRangeTitle')}
                title={medianLinked ? t('timeline.unlinkRangeTitle') : t('timeline.linkRangeTitle')}
              >
                <Link2 size={14} />
              </button>
            </div>
          </div>
          <p className="hint">
            {t('timeline.medianHint')}
            {medianRange !== 0 && ` (${t('timeline.rangeDays', { count: medianRange })})`}
          </p>
          <div className="median-panel-row">
            <div className="progress-ring-row median-panel-rings">
              {MACRO_KEYS.map((macro) => (
                <GoalProgressRing
                  key={macro}
                  label={t(`common.macros.${macro}`)}
                  value={medians[macro]}
                  // A whole-day macro goal doesn't mean anything against one food's
                  // contribution, so the ring just shows the raw median with no fill/goal.
                  goal={selectedFood ? null : medianLatestGoals ? medianLatestGoals[macro] : null}
                  unit={MACRO_UNITS[macro]}
                  colorVar={COLOR_VARS[macro]}
                />
              ))}
            </div>
            <div className="bia-stat-row median-panel-stats">
              <div className="bia-stat">
                <span className="bia-stat-value" style={{ color: `var(${COLOR_VARS.protein})` }}>
                  {medianProteinPerKg !== null ? medianProteinPerKg.toFixed(1) : '—'}
                  <span className="bia-stat-unit">g/kg</span>
                </span>
                <span className="bia-stat-label" title={t('timeline.metrics.proteinPerKgTitle')}>
                  {t('timeline.metrics.proteinPerKg')}
                </span>
              </div>
              <div className="bia-stat">
                <span className="bia-stat-value">
                  {medianGrams !== null ? Math.round(medianGrams).toLocaleString() : '—'}
                  <span className="bia-stat-unit">g</span>
                </span>
                <span className="bia-stat-label">
                  {selectedFood ? t('timeline.metrics.foodGramsFor', { food: selectedFood }) : t('timeline.metrics.foodGrams')}
                </span>
              </div>
              <div className="bia-stat" style={selectedFood ? { opacity: 0.5 } : undefined}>
                <span className="bia-stat-value">
                  {medianFastingMinutes !== null ? formatFastingMinutes(medianFastingMinutes) : '—'}
                </span>
                <span className="bia-stat-label">{t('timeline.metrics.fasting')}</span>
              </div>
              <div className="bia-stat" style={selectedFood ? { opacity: 0.5 } : undefined}>
                <span className="bia-stat-value" style={{ color: 'var(--water-blue)' }}>
                  {medianWaterMl !== null ? Math.round(medianWaterMl).toLocaleString() : '—'}
                  <span className="bia-stat-unit">ml</span>
                </span>
                <span className="bia-stat-label">{t('timeline.metrics.water')}</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {fullscreen &&
        createPortal(
          <div className="timeline-modal-backdrop" onClick={() => setFullscreen(false)}>
            <div className="card timeline-modal" onClick={(e) => e.stopPropagation()}>
              {content}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
