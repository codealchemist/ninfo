import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Activity, CalendarRange, Droplet, Salad, Scale } from 'lucide-react'
import { MACRO_KEYS, MACRO_UNITS, type MacroTotals, type MealItem } from '../../data/types'
import { aggregateByDay, groupIntoMeals, medianTotals } from '../../data/aggregate/dailyTotals'
import type { BiaEntry } from '../../data/parsers/bioimpedanciaParser'
import type { WeightEntry } from '../../data/parsers/pesoParser'
import type { LiquidEntry } from '../../data/parsers/liquidoParser'
import { dailyTotalMlByDate, normalizeLiquidKey } from '../../data/liquidUtils'
import { REPORT_PAGE_HEIGHT_PX, REPORT_PAGE_WIDTH_PX } from '../../utils/reportPageSize'

// Same hex values as the live app's CSS variables (--macro-*, --macro-*-over, --water-blue,
// --info-blue, --warning-red/-red-light) — written as literals since html-to-image doesn't
// reliably carry custom properties through into SVG fill/stroke when rasterizing (see
// clipboard.ts's bakeComputedColors), so the export could otherwise come out with stale colors.
const MACRO_COLORS: Record<string, string> = {
  protein: '#e07a5f',
  carbs: '#3d9970',
  fat: '#f2b134',
  fiber: '#577590',
  calories: '#9b5de5',
}
const MACRO_OVER_COLORS: Record<string, string> = {
  protein: '#924f3e',
  carbs: '#28634a',
  fat: '#9d7322',
  fiber: '#394c5e',
  calories: '#653c95',
}
const WATER_COLOR = '#56ccf2'
const WATER_OVER_COLOR = '#2f89a8'
const MAX_COLOR = '#2f80ed'
const MIN_COLOR = '#c0392b'
const OVER_TEXT_COLOR = '#d9584a'
const UNDER_TEXT_COLOR = '#2f80ed'
const LIQUID_COLORS: Record<string, string> = {
  agua: '#2f80ed',
  cafe: '#7a4a2e',
  te: '#e0a458',
  mate: '#3d9970',
}
const LIQUID_FALLBACK_PALETTE = ['#9b5de5', '#577590', '#f2b134', '#e07a5f', '#c0392b']

const INK = '#23201b'
const MUTED = '#74705f'
const BORDER = '#e6e2da'
const RING_TRACK = '#ece8de'
const ACCENT = '#3d7a5c'

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function max(values: number[]): number {
  return values.length === 0 ? 0 : Math.max(...values)
}

function min(values: number[]): number {
  return values.length === 0 ? 0 : Math.min(...values)
}

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

function monthsAgoDate(dateStr: string, months: number): string {
  const d = new Date(`${dateStr}T00:00:00`)
  d.setMonth(d.getMonth() - months)
  return d.toISOString().slice(0, 10)
}

function entryAtOrBefore<T extends { date: string }>(sortedEntries: T[], targetDate: string): T | null {
  let result: T | null = null
  for (const e of sortedEntries) {
    if (e.date <= targetDate) result = e
    else break
  }
  return result
}

function colorForLiquidType(type: string, fallbackIndex: number): string {
  return LIQUID_COLORS[normalizeLiquidKey(type)] ?? LIQUID_FALLBACK_PALETTE[fallbackIndex % LIQUID_FALLBACK_PALETTE.length]
}

function Panel({
  icon,
  title,
  children,
  style,
  bodyStyle,
}: {
  icon: ReactNode
  title: string
  children: ReactNode
  style?: CSSProperties
  bodyStyle?: CSSProperties
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        padding: '16px 20px',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        {icon}
        <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{title}</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, ...bodyStyle }}>{children}</div>
    </div>
  )
}

function StatGrid({
  children,
  center,
  gap = 18,
  noWrap,
}: {
  children: ReactNode
  center?: boolean
  gap?: number
  noWrap?: boolean
}) {
  return (
    <div style={{ display: 'flex', flexWrap: noWrap ? 'nowrap' : 'wrap', gap, justifyContent: center ? 'center' : undefined }}>
      {children}
    </div>
  )
}

function Stat({
  label,
  value,
  unit,
  color,
  compact,
}: {
  label: string
  value: string
  unit?: string
  color?: string
  compact?: boolean
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
        minWidth: compact ? 0 : 90,
        alignItems: 'center',
        textAlign: 'center',
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: compact ? 14 : 19, fontWeight: 700, color: color ?? INK, whiteSpace: 'nowrap' }}>
        {value}
        {unit && (
          <span style={{ fontSize: compact ? 9 : 12, fontWeight: 600, color: MUTED, marginLeft: 2 }}>{unit}</span>
        )}
      </span>
      <span style={{ fontSize: compact ? 9 : 11.5, color: MUTED, whiteSpace: 'nowrap' }}>{label}</span>
    </div>
  )
}

/** A goal-fill gauge with an outer "second lap" ring once the value passes 100% of goal, an
 * over/under % badge, and goal/diff details below — the export's equivalent of
 * GoalProgressRing, reimplemented with literal colors instead of colorVar (see note above). */
function Gauge({
  label,
  value,
  goal,
  unit,
  color,
  overColor,
}: {
  label: string
  value: number
  goal: number | null
  unit: string
  color: string
  overColor: string
}) {
  const SIZE = 66
  const CENTER = SIZE / 2
  const INNER_RADIUS = 23
  const INNER_STROKE = 6
  const INNER_CIRCUMFERENCE = 2 * Math.PI * INNER_RADIUS
  const OUTER_RADIUS = 30
  const OUTER_STROKE = 3.5
  const OUTER_CIRCUMFERENCE = 2 * Math.PI * OUTER_RADIUS

  const ratio = goal && goal > 0 ? value / goal : 0
  const innerDash = Math.min(ratio, 1) * INNER_CIRCUMFERENCE
  const overflowRatio = Math.max(0, Math.min(ratio - 1, 1))
  const outerDash = overflowRatio * OUTER_CIRCUMFERENCE
  const overGoal = goal != null && value > goal
  const diff = goal != null ? value - goal : null
  const pctOver = goal != null && ratio > 1 ? Math.round((ratio - 1) * 100) : null
  const pctMissing = goal != null && ratio <= 1 ? Math.round((1 - ratio) * 100) : null

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 106 }}>
      <div style={{ position: 'relative', width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <circle cx={CENTER} cy={CENTER} r={INNER_RADIUS} fill="none" stroke={RING_TRACK} strokeWidth={INNER_STROKE} />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={INNER_RADIUS}
            fill="none"
            stroke={color}
            strokeWidth={INNER_STROKE}
            strokeDasharray={`${innerDash} ${INNER_CIRCUMFERENCE}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
          />
          {outerDash > 0 && (
            <>
              <circle cx={CENTER} cy={CENTER} r={OUTER_RADIUS} fill="none" stroke={RING_TRACK} strokeWidth={OUTER_STROKE} />
              <circle
                cx={CENTER}
                cy={CENTER}
                r={OUTER_RADIUS}
                fill="none"
                stroke={overColor}
                strokeWidth={OUTER_STROKE}
                strokeDasharray={`${outerDash} ${OUTER_CIRCUMFERENCE}`}
                strokeLinecap="round"
                transform={`rotate(-90 ${CENTER} ${CENTER})`}
              />
            </>
          )}
          <text x="50%" y="46%" textAnchor="middle" fontSize="13" fontWeight="700" fill={INK}>
            {Math.round(value).toLocaleString()}
          </text>
          <text x="50%" y="63%" textAnchor="middle" fontSize="8.5" fill={MUTED}>
            {unit}
          </text>
        </svg>
        {pctOver != null && (
          <span style={{ position: 'absolute', top: -10, right: -14, fontSize: 9.5, fontWeight: 700, color: OVER_TEXT_COLOR }}>
            +{pctOver}%
          </span>
        )}
        {pctMissing != null && pctMissing > 0 && (
          <span style={{ position: 'absolute', top: -10, left: -14, fontSize: 9.5, fontWeight: 700, color: UNDER_TEXT_COLOR }}>
            -{pctMissing}%
          </span>
        )}
      </div>
      <span style={{ fontSize: 11.5, color: MUTED, textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
      {goal != null && (
        <div style={{ textAlign: 'center', lineHeight: 1.4 }}>
          <div style={{ fontSize: 9.5, color: MUTED }}>
            {Math.round(goal).toLocaleString()}
            {unit} goal
          </div>
          <div style={{ fontSize: 9.5, color: overGoal ? OVER_TEXT_COLOR : MUTED }}>
            {diff! >= 0 ? '+' : ''}
            {Math.round(diff!).toLocaleString()}
            {unit} vs goal
          </div>
        </div>
      )}
    </div>
  )
}

/** A plain share ring (0-100%, no goal) — used for liquid-type breakdown. `size` lets it shrink
 * to fit alongside other gauges in a single row (see the Liquids panel). */
function ShareRing({ pct, color, label, size = 60 }: { pct: number; color: string; label: string; size?: number }) {
  const SIZE = size
  const CENTER = SIZE / 2
  const RADIUS = SIZE / 2 - 6
  const STROKE = size < 50 ? 4.5 : 6
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS
  const dash = (Math.max(0, Math.min(pct, 100)) / 100) * CIRCUMFERENCE
  const fontSize = size < 50 ? 10 : 13
  const labelFontSize = size < 50 ? 9.5 : 11.5

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, width: SIZE + 22, flexShrink: 0 }}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke={RING_TRACK} strokeWidth={STROKE} />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
        />
        <text x="50%" y="53%" textAnchor="middle" fontSize={fontSize} fontWeight="700" fill={INK}>
          {Math.round(pct)}%
        </text>
      </svg>
      <span style={{ fontSize: labelFontSize, color: MUTED, textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
    </div>
  )
}

/** A minimal two-series line sparkline (no axes/gridlines) — used for the BIA muscle-mass/
 * body-fat trend, since a full Chart.js instance isn't worth mounting for a one-time export
 * (see the module doc comment on GlobalReportDocument). */
function MiniTrendChart({
  entries,
  series,
  locale,
}: {
  entries: BiaEntry[]
  series: Array<{ key: 'muscleMassPct' | 'bodyFatPct'; color: string; label: string }>
  locale: string
}) {
  const WIDTH = 260
  const HEIGHT = 108
  const MARGIN = { top: 10, right: 10, bottom: 18, left: 32 }
  const recent = entries.slice(-14)
  if (recent.length < 2) return null

  const plotWidth = WIDTH - MARGIN.left - MARGIN.right
  const plotHeight = HEIGHT - MARGIN.top - MARGIN.bottom

  const allValues = series.flatMap((s) => recent.map((e) => e[s.key]))
  const minV = Math.min(...allValues)
  const maxV = Math.max(...allValues)
  const midV = (minV + maxV) / 2
  const range = maxV - minV || 1
  const xStep = plotWidth / (recent.length - 1)
  const xFor = (i: number) => MARGIN.left + i * xStep
  const yFor = (v: number) => MARGIN.top + plotHeight - ((v - minV) / range) * plotHeight

  const fmtShortDate = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(locale, { month: 'short', day: 'numeric' })

  const xTickIndices = Array.from(new Set([0, Math.round((recent.length - 1) / 2), recent.length - 1]))
  const yTicks = [minV, midV, maxV]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`}>
        {/* Axes */}
        <line x1={MARGIN.left} y1={MARGIN.top} x2={MARGIN.left} y2={MARGIN.top + plotHeight} stroke={BORDER} strokeWidth={1} />
        <line
          x1={MARGIN.left}
          y1={MARGIN.top + plotHeight}
          x2={MARGIN.left + plotWidth}
          y2={MARGIN.top + plotHeight}
          stroke={BORDER}
          strokeWidth={1}
        />

        {/* Y-axis reference ticks (min/mid/max) */}
        {yTicks.map((v, i) => (
          <g key={i}>
            <line x1={MARGIN.left - 3} y1={yFor(v)} x2={MARGIN.left} y2={yFor(v)} stroke={BORDER} strokeWidth={1} />
            <text x={MARGIN.left - 6} y={yFor(v) + 3} textAnchor="end" fontSize="7.5" fill={MUTED}>
              {Math.round(v)}
            </text>
          </g>
        ))}

        {/* X-axis reference ticks (first/middle/last date) */}
        {xTickIndices.map((i) => (
          <g key={i}>
            <line x1={xFor(i)} y1={MARGIN.top + plotHeight} x2={xFor(i)} y2={MARGIN.top + plotHeight + 3} stroke={BORDER} strokeWidth={1} />
            <text x={xFor(i)} y={HEIGHT - 3} textAnchor="middle" fontSize="7.5" fill={MUTED}>
              {fmtShortDate(recent[i].date)}
            </text>
          </g>
        ))}

        {series.map((s) => (
          <g key={s.key}>
            <polyline
              points={recent.map((e, i) => `${xFor(i)},${yFor(e[s.key])}`).join(' ')}
              fill="none"
              stroke={s.color}
              strokeWidth={2.25}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {recent.map((e, i) => (
              <circle key={i} cx={xFor(i)} cy={yFor(e[s.key])} r={1.8} fill={s.color} />
            ))}
          </g>
        ))}
      </svg>
      <div style={{ display: 'flex', gap: 14 }}>
        {series.map((s) => (
          <span key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10.5, color: MUTED }}>
            <span style={{ width: 8, height: 8, borderRadius: 4, background: s.color, display: 'inline-block' }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  )
}

interface Props {
  meals: MealItem[]
  goalsByDate: Record<string, MacroTotals>
  biaEntries: BiaEntry[]
  weightEntries: WeightEntry[]
  liquidEntries: LiquidEntry[]
  generatedAt: Date
  pageRef: (el: HTMLDivElement | null) => void
}

/**
 * A single, off-screen A4 page assembled into the global PDF report — see pdfReport.ts.
 * Deliberately plain numbers/gauges rather than re-rendering the app's live Chart.js trend
 * charts: mounting a second, hidden copy of every chart just for a one-time export isn't worth
 * the runtime cost. Every figure here reuses the same computations the live pages already do
 * (median, fasting-since-first-meal, month-ago diffs, liquid type shares, etc.), and the deck
 * intentionally leaves out anything tied to "today" — this is a global-tendency snapshot, not a
 * daily log. Colors are literal hex, not CSS variables — see the constants above.
 */
export default function GlobalReportDocument({
  meals,
  goalsByDate,
  biaEntries,
  weightEntries,
  liquidEntries,
  generatedAt,
  pageRef,
}: Props) {
  const { t, i18n } = useTranslation()

  const fmtDate = (iso: string) =>
    new Date(`${iso}T00:00:00`).toLocaleDateString(i18n.language, { year: 'numeric', month: 'short', day: 'numeric' })

  const generatedLabel = generatedAt.toLocaleString(i18n.language, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  // ---- Median macros (last 30 logged days, or fewer if not available) ----
  const allDays = aggregateByDay(meals, goalsByDate)
  const medianDays = allDays.slice(-30)
  const medianDates = medianDays.map((d) => d.date)
  const medians = medianTotals(meals, medianDates)
  const medianGoals = medianDays.length > 0 ? medianDays[medianDays.length - 1].goals : null

  let medianGrams = 0
  let medianFasting: number | null = null
  let medianWater: number | null = null
  let medianWaterGoal: number | null = null
  let proteinPerKg: number | null = null

  if (medians) {
    const gramsByDate = new Map<string, number>()
    for (const item of meals) gramsByDate.set(item.date, (gramsByDate.get(item.date) ?? 0) + item.grams)
    medianGrams = median(medianDays.map((d) => gramsByDate.get(d.date) ?? 0))

    const firstMealByDate = new Map<string, string | null>()
    for (const meal of groupIntoMeals(meals)) {
      if (!firstMealByDate.has(meal.date)) firstMealByDate.set(meal.date, meal.items[0]?.fastingSincePrev ?? null)
    }
    const fastingValues = medianDates
      .map((d) => parseFastingMinutes(firstMealByDate.get(d) ?? null))
      .filter((v): v is number => v !== null)
    medianFasting = fastingValues.length > 0 ? median(fastingValues) : null

    const waterByDate = dailyTotalMlByDate(liquidEntries)
    medianWater = medianDays.length > 0 ? median(medianDays.map((d) => waterByDate.get(d.date) ?? 0)) : null

    const sortedWeights = [...weightEntries].sort((a, b) => a.date.localeCompare(b.date))
    const minDate = medianDates[0]
    const maxDate = medianDates[medianDates.length - 1]
    const weightsInRange = sortedWeights.filter((e) => e.date >= minDate && e.date <= maxDate)
    const medianWeightKg = weightsInRange.length > 0 ? median(weightsInRange.map((e) => e.weightKg)) : null
    proteinPerKg = medianWeightKg ? medians.protein / medianWeightKg : null
    medianWaterGoal = medianWeightKg ? medianWeightKg * 35 : null
  }

  const gaugeMacros = MACRO_KEYS.filter((m) => m !== 'calories')

  // ---- BIA (body composition) ----
  const latestBia = biaEntries[biaEntries.length - 1] ?? null
  const previousBia = biaEntries[biaEntries.length - 2] ?? null

  // ---- Weight ----
  const sortedWeightEntries = [...weightEntries].sort((a, b) => a.date.localeCompare(b.date))
  const latestWeight = sortedWeightEntries[sortedWeightEntries.length - 1] ?? null
  const recentWeights = sortedWeightEntries.slice(-30).map((e) => e.weightKg)
  const AGO_PERIODS = [
    { months: 1, key: 'oneMonth' },
    { months: 3, key: 'threeMonths' },
    { months: 6, key: 'sixMonths' },
    { months: 12, key: 'oneYear' },
  ] as const
  const weightDiffs: Array<{ key: string; diff: number }> = []
  if (latestWeight) {
    for (const p of AGO_PERIODS) {
      const match = entryAtOrBefore(sortedWeightEntries, monthsAgoDate(latestWeight.date, p.months))
      if (match && match.date !== latestWeight.date) weightDiffs.push({ key: p.key, diff: latestWeight.weightKg - match.weightKg })
    }
  }

  // ---- Liquids ----
  const totalsByDate = dailyTotalMlByDate(liquidEntries)
  const sortedLiquidDates = [...totalsByDate.keys()].sort()
  const recentLiquidValues = sortedLiquidDates.slice(-30).map((d) => totalsByDate.get(d)!)
  const byType = new Map<string, number>()
  let grandTotal = 0
  for (const e of liquidEntries) {
    const amount = e.realAmountMl || e.amountMl
    byType.set(e.liquidType, (byType.get(e.liquidType) ?? 0) + amount)
    grandTotal += amount
  }
  const liquidShares = Array.from(byType.entries())
    .map(([type, totalMl]) => ({ type, pct: grandTotal > 0 ? (totalMl / grandTotal) * 100 : 0 }))
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 5)

  // The BIA panel sits to the right of the weight/liquids column and should match its full
  // height rather than shrink-wrap its own (usually shorter) content — measured directly since
  // this off-screen document is only ever rendered once, right before being rasterized, so
  // there's no risk of a visible flash between the unmeasured and measured layouts.
  const leftColumnRef = useRef<HTMLDivElement>(null)
  const [leftColumnHeight, setLeftColumnHeight] = useState<number | null>(null)
  useLayoutEffect(() => {
    if (leftColumnRef.current) setLeftColumnHeight(leftColumnRef.current.offsetHeight)
  })

  return (
    <div
      ref={pageRef}
      style={{
        width: REPORT_PAGE_WIDTH_PX,
        height: REPORT_PAGE_HEIGHT_PX,
        boxSizing: 'border-box',
        padding: '34px 48px',
        background: '#ffffff',
        color: INK,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `2px solid ${ACCENT}`, paddingBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <Salad size={25} color={ACCENT} strokeWidth={2} />
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: ACCENT, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Ninfo <span style={{ color: MUTED, fontWeight: 500, textTransform: 'none', letterSpacing: 'normal' }}>v{__APP_VERSION__}</span>
            </div>
            <h1 style={{ margin: '3px 0 0', fontSize: 24, fontWeight: 700 }}>{t('report.title')}</h1>
          </div>
        </div>
        <span style={{ fontSize: 12.5, color: MUTED }}>{t('report.generatedAt', { date: generatedLabel })}</span>
      </div>

      {medians ? (
        <Panel icon={<CalendarRange size={17} color={ACCENT} />} title={t('timeline.medianTitle')}>
          <p style={{ margin: 0, fontSize: 12.5, color: MUTED, textAlign: 'center' }}>{t('report.medianRangeHint', { count: medianDays.length })}</p>
          <StatGrid center>
            {gaugeMacros.map((macro) => (
              <Gauge
                key={macro}
                label={t(`common.macros.${macro}`)}
                value={medians[macro]}
                goal={medianGoals ? medianGoals[macro] : null}
                unit={MACRO_UNITS[macro]}
                color={MACRO_COLORS[macro]}
                overColor={MACRO_OVER_COLORS[macro]}
              />
            ))}
          </StatGrid>
          <StatGrid center>
            <Gauge
              label={t('common.macros.calories')}
              value={medians.calories}
              goal={medianGoals ? medianGoals.calories : null}
              unit={MACRO_UNITS.calories}
              color={MACRO_COLORS.calories}
              overColor={MACRO_OVER_COLORS.calories}
            />
            {medianWater !== null && (
              <Gauge
                label={t('timeline.metrics.water')}
                value={medianWater}
                goal={medianWaterGoal}
                unit="ml"
                color={WATER_COLOR}
                overColor={WATER_OVER_COLOR}
              />
            )}
          </StatGrid>
          <StatGrid center>
            {proteinPerKg !== null && (
              <Stat label={t('timeline.metrics.proteinPerKg')} value={proteinPerKg.toFixed(1)} unit="g/kg" color={MACRO_COLORS.protein} />
            )}
            <Stat label={t('timeline.metrics.foodGrams')} value={Math.round(medianGrams).toLocaleString()} unit="g" />
            {medianFasting !== null && <Stat label={t('timeline.metrics.fasting')} value={formatFastingMinutes(medianFasting)} />}
          </StatGrid>
        </Panel>
      ) : (
        <Panel icon={<CalendarRange size={17} color={ACCENT} />} title={t('timeline.medianTitle')}>
          <p style={{ color: MUTED, fontSize: 14, margin: 0 }}>{t('report.noData')}</p>
        </Panel>
      )}

      {(latestWeight || liquidEntries.length > 0 || latestBia) && (
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flex: 1, minHeight: 0 }}>
          <div ref={leftColumnRef} style={{ flex: 3, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            {latestWeight && (
              <Panel icon={<Scale size={17} color={ACCENT} />} title={t('weight.title')}>
                <div style={{ display: 'flex', gap: 20 }}>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0, alignItems: 'flex-end' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, width: 'fit-content' }}>
                      <Stat label={t('weight.metrics.weight')} value={latestWeight.weightKg.toFixed(1)} unit="kg" />
                      <Stat label={t('weight.metrics.median')} value={median(recentWeights).toFixed(1)} unit="kg" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, width: 'fit-content' }}>
                      <Stat label={t('weight.metrics.max')} value={max(recentWeights).toFixed(1)} unit="kg" color={MAX_COLOR} />
                      <Stat label={t('weight.metrics.min')} value={min(recentWeights).toFixed(1)} unit="kg" color={MIN_COLOR} />
                    </div>
                  </div>
                  {weightDiffs.length > 0 && (
                    <>
                      <div style={{ width: 1, background: BORDER, alignSelf: 'stretch' }} />
                      <div
                        style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 14,
                          justifyContent: 'center',
                          alignItems: 'flex-start',
                          minWidth: 0,
                        }}
                      >
                        {weightDiffs.map((d) => (
                          <Stat
                            key={d.key}
                            label={t(`weight.periods.${d.key}`)}
                            value={`${d.diff >= 0 ? '+' : ''}${d.diff.toFixed(1)}`}
                            unit="kg"
                          />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </Panel>
            )}

            {liquidEntries.length > 0 && (
              <Panel icon={<Droplet size={17} color={ACCENT} />} title={t('liquid.title')}>
                <StatGrid center>
                  <Stat label={t('liquid.metrics.median')} value={Math.round(median(recentLiquidValues)).toLocaleString()} unit="ml" />
                  <Stat
                    label={t('liquid.metrics.max')}
                    value={Math.round(max(recentLiquidValues)).toLocaleString()}
                    unit="ml"
                    color={MAX_COLOR}
                  />
                  <Stat
                    label={t('liquid.metrics.min')}
                    value={Math.round(min(recentLiquidValues)).toLocaleString()}
                    unit="ml"
                    color={MIN_COLOR}
                  />
                </StatGrid>
                {liquidShares.length > 0 && (
                  <StatGrid center>
                    {liquidShares.map((s, i) => (
                      <ShareRing key={s.type} pct={s.pct} color={colorForLiquidType(s.type, i)} label={s.type} />
                    ))}
                  </StatGrid>
                )}
              </Panel>
            )}
          </div>

          {latestBia && (
            <div style={{ flex: 2, display: 'flex', minWidth: 0, height: leftColumnHeight ?? undefined }}>
              <Panel
                icon={<Activity size={17} color={ACCENT} />}
                title={t('report.biaTitle')}
                style={{ flex: 1 }}
                bodyStyle={{ flex: 1, justifyContent: 'center' }}
              >
                <StatGrid center>
                  <Stat label={t('bia.metrics.weight')} value={latestBia.weightKg.toFixed(1)} unit="kg" />
                  <Stat label={t('bia.metrics.bodyFat')} value={latestBia.bodyFatPct.toFixed(1)} unit="%" />
                  <Stat label={t('bia.metrics.visceralFat')} value={latestBia.visceralFat.toFixed(0)} />
                  <Stat label={t('bia.metrics.muscleMass')} value={latestBia.muscleMassPct.toFixed(1)} unit="%" />
                  <Stat label={t('bia.metrics.bmi')} value={latestBia.bmi.toFixed(1)} />
                </StatGrid>
                <MiniTrendChart
                  entries={biaEntries}
                  locale={i18n.language}
                  series={[
                    { key: 'muscleMassPct', color: '#3d9970', label: t('bia.metrics.muscleMass') },
                    { key: 'bodyFatPct', color: '#e07a5f', label: t('bia.metrics.bodyFat') },
                  ]}
                />
                <p style={{ margin: 0, fontSize: 12, color: MUTED, textAlign: 'center' }}>
                  {t('bia.latestMeasurement', { date: fmtDate(latestBia.date) })}
                  {previousBia &&
                    ` — ${t('bia.vsPrevious')} ${latestBia.weightKg - previousBia.weightKg >= 0 ? '+' : ''}${(latestBia.weightKg - previousBia.weightKg).toFixed(1)} kg`}
                </p>
              </Panel>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
