import { forwardRef, useEffect, useImperativeHandle, useRef, useState, type PointerEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ActiveElement,
  type ChartData,
  type ChartOptions,
  type ChartType,
  type Plugin,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { MACRO_UNITS, type DailyAggregate, type MacroKey } from '../../data/types'
import { useOrientationChange } from '../../hooks/useOrientationChange'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

const COLORS: Record<MacroKey, string> = {
  protein: '#e07a5f',
  carbs: '#3d9970',
  fat: '#f2b134',
  fiber: '#577590',
  calories: '#9b5de5',
}

const LEGEND_KEYS: MacroKey[] = ['protein', 'carbs', 'fat', 'fiber', 'calories']

/** How far the pointer needs to travel vertically before a press on the kcal drag zone counts
 * as a drag rather than a tap — mirrors TimelineScrubber's own tap threshold. */
const KCAL_TAP_THRESHOLD_PX = 6

function resolveCanvasColor(canvas: HTMLCanvasElement, cssVar: string): string {
  return getComputedStyle(canvas).getPropertyValue(cssVar).trim()
}

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function colorsClose(a: readonly [number, number, number], b: readonly [number, number, number]): boolean {
  return Math.abs(a[0] - b[0]) <= 30 && Math.abs(a[1] - b[1]) <= 30 && Math.abs(a[2] - b[2]) <= 30
}

/** Scans a single row of the canvas's actual rendered pixels — through the vertical middle of
 * chart.js's own legend swatches — for each macro's known color, returning each one's true
 * horizontal center in CSS pixels (or null if that color isn't found on that row). Reading
 * chart.js's internal legend layout state (legendHitBoxes) instead seemed like the obvious way
 * to do this, but it turned out unreliable — the item positions it reports don't always match
 * what's actually drawn. Reading the pixels chart.js already painted sidesteps that entirely:
 * whatever this finds is, by definition, exactly where the swatch really is.
 * A toggled-off macro's swatch is drawn at 50% opacity (see the legend's generateLabels below),
 * which blends it with the background — a match this loose tolerance won't find, so its value
 * quietly stops appearing in the values row along with it. Seems like a reasonable pairing rather
 * than something to special-case around. */
function findLegendSwatchCenters(chart: ChartJS, legendRowTop: number, legendRowHeight: number): Array<number | null> {
  const { canvas, ctx } = chart
  const dpr = canvas.width / canvas.clientWidth || 1
  const deviceY = Math.round((legendRowTop + legendRowHeight / 2) * dpr)
  if (deviceY < 0 || deviceY >= canvas.height) return LEGEND_KEYS.map(() => null)
  let row: Uint8ClampedArray
  try {
    row = ctx.getImageData(0, deviceY, canvas.width, 1).data
  } catch {
    return LEGEND_KEYS.map(() => null)
  }
  return LEGEND_KEYS.map((macro) => {
    const target = hexToRgb(COLORS[macro])
    let minX = -1
    let maxX = -1
    for (let x = 0; x < canvas.width; x++) {
      const i = x * 4
      if (colorsClose([row[i], row[i + 1], row[i + 2]], target)) {
        if (minX === -1) minX = x
        maxX = x
      }
    }
    return minX === -1 ? null : (minX + maxX) / 2 / dpr
  })
}

interface GuidesPluginOptions {
  /** Day index to draw a vertical marker through, driven by the mobile scrubber — null hides it. */
  activeIndex: number | null
  /** Calories value to draw a horizontal marker through, driven by dragging the kcal axis strip
   * at the right edge of the chart — null hides it. */
  kcalLineValue: number | null
  /** Pre-formatted reading for the dragged kcal line (e.g. "1,850 kcal") — drawn right at the
   * line's own right end so the number is exactly where the finger/cursor is, rather than in the
   * values row above the whole chart. */
  kcalLineLabel: string | null
  /** Reports the plot area's top edge (below chart.js's own legend) after each layout pass, so
   * the kcal drag zone (see .chart-kcal-drag-zone) can be positioned to start below the legend
   * instead of covering it — chart.js only knows that offset once it has laid itself out. */
  onPlotTopChange: (top: number) => void
  /** Reports each legend swatch's true horizontal center (see findLegendSwatchCenters) after each
   * render, so the values row (see the render below) can line each value up directly above its
   * matching swatch instead of guessing at even spacing. */
  onLegendCentersChange: (centers: Array<number | null>) => void
}

// Lets `options.plugins.timelineGuides` below type-check — chart.js only knows the option shapes
// of plugins it ships itself, so a custom one needs its options type merged in by hand.
declare module 'chart.js' {
  interface PluginOptionsByType<TType extends ChartType> {
    timelineGuides?: GuidesPluginOptions
  }
}

/** Draws the two live reference lines directly on the canvas instead of relying on chart.js's
 * built-in tooltip/crosshair, since neither the scrubbed date nor the dragged kcal reading are
 * "hover" state — they come from gestures outside chart.js's own interaction handling (the
 * scrubber, the kcal axis drag) and need to stay in sync with chart.js's own scale math
 * (getPixelForValue etc.) across resizes rather than being positioned in raw screen pixels. */
const timelineGuidesPlugin: Plugin<'line', GuidesPluginOptions> = {
  id: 'timelineGuides',
  afterLayout(chart, _args, opts) {
    opts.onPlotTopChange(chart.chartArea.top)
  },
  // afterRender (rather than afterLayout) since this reads pixels chart.js has actually painted
  // — the legend isn't drawn onto the canvas yet until render runs.
  afterRender(chart, _args, opts) {
    // legendHitBoxes isn't part of chart.js's public Legend type, but chart.js's own top/height
    // for the legend's first (and typically only) row is reliable — it's specifically each
    // item's *left* that turned out not to be (see findLegendSwatchCenters).
    const legend = chart.legend as unknown as { legendHitBoxes?: Array<{ top: number; height: number }> } | undefined
    const row = legend?.legendHitBoxes?.[0]
    if (row) {
      opts.onLegendCentersChange(findLegendSwatchCenters(chart, row.top, row.height))
    }
  },
  afterDatasetsDraw(chart, _args, opts) {
    const { ctx, chartArea, canvas } = chart
    if (!chartArea) return

    if (opts.activeIndex !== null && opts.activeIndex >= 0) {
      const point = chart.getDatasetMeta(0)?.data?.[opts.activeIndex]
      if (point) {
        // Line and arrow share one color, matching the highlighted date label below them (see
        // the x-scale's ticks.color in the options below) — together they read as one thread
        // connecting the scrubbed date's label up to the point it marks on every line.
        const highlight = resolveCanvasColor(canvas, '--accent')

        ctx.save()
        ctx.strokeStyle = highlight
        ctx.setLineDash([4, 4])
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(point.x, chartArea.top)
        ctx.lineTo(point.x, chartArea.bottom)
        ctx.stroke()
        ctx.restore()

        // A small arrow "connects" the line down to its date — chart.js can auto-skip x-axis
        // labels when there isn't room for all of them, so the line alone doesn't always land
        // next to a visible label to make clear which day it's marking.
        const arrowHalfWidth = 5
        const arrowHeight = 5
        ctx.save()
        ctx.fillStyle = highlight
        ctx.beginPath()
        ctx.moveTo(point.x - arrowHalfWidth, chartArea.bottom)
        ctx.lineTo(point.x + arrowHalfWidth, chartArea.bottom)
        ctx.lineTo(point.x, chartArea.bottom + arrowHeight)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }
    }

    if (opts.kcalLineValue !== null) {
      const scale = chart.scales.calories
      if (scale) {
        const y = scale.getPixelForValue(opts.kcalLineValue)
        const accent = resolveCanvasColor(canvas, '--accent')
        ctx.save()
        ctx.strokeStyle = accent
        ctx.setLineDash([6, 4])
        ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(chartArea.left, y)
        ctx.lineTo(chartArea.right, y)
        ctx.stroke()
        ctx.restore()

        // The reading itself, right at the line's own right end — reads immediately next to
        // wherever the finger/cursor actually is, instead of in the values row above the whole
        // chart. Clamped away from chartArea.top so dragging near the very top of the chart
        // doesn't push the label up into the legend.
        if (opts.kcalLineLabel) {
          ctx.save()
          ctx.fillStyle = accent
          ctx.font = 'bold 12px sans-serif'
          ctx.textAlign = 'right'
          ctx.textBaseline = 'bottom'
          const labelY = Math.max(chartArea.top + 12, y - 6)
          ctx.fillText(opts.kcalLineLabel, chartArea.right, labelY)
          ctx.restore()
        }
      }
    }
  },
}

interface Props {
  days: DailyAggregate[]
  onDayClick?: (date: string) => void
  /** An index to force-highlight and show the tooltip for, driven by the mobile scrubber
   * (see Timeline.tsx) rather than the chart's own hover/touch handling — null hides it. Stays
   * set after the scrubber is released; only cleared by the scrubber's own tap-to-dismiss or the
   * values row's close button (onDismiss). */
  activeIndex?: number | null
  /** Clears activeIndex — wired to the values row's close button (see the render below). */
  onDismiss?: () => void
  /** The calories value the horizontal kcal line is drawn at — null hides it. Lifted up to
   * Timeline.tsx (rather than owned locally) so Escape can dismiss it there alongside
   * activeIndex, in the same priority chain as the scrubbed date and fullscreen. */
  kcalLineValue: number | null
  onKcalLineChange: (value: number | null) => void
}

const MacroTimelineChart = forwardRef<HTMLDivElement, Props>(function MacroTimelineChart(
  { days, onDayClick, activeIndex = null, onDismiss, kcalLineValue, onKcalLineChange },
  ref
) {
  const { t, i18n } = useTranslation()
  const wrapperRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<ChartJS<'line'> | null>(null)
  // Where the pointer was when it first landed in the kcal drag zone — a release close to this
  // spot counts as a tap (dismiss) rather than a drag (keep the last dragged-to value); see
  // handleContainerPointerEnd.
  const kcalPointerDownYRef = useRef<number | null>(null)
  // Where the plot area (and so the kcal drag zone) starts, below chart.js's own legend — see
  // timelineGuidesPlugin's afterLayout.
  const [plotTop, setPlotTop] = useState(0)
  // Each legend swatch's true horizontal center, in the same order as LEGEND_KEYS/datasets, so
  // the values row can line up above the matching swatch — see
  // timelineGuidesPlugin/findLegendSwatchCenters.
  const [legendCenters, setLegendCenters] = useState<Array<number | null>>([])
  const legendCentersRef = useRef<Array<number | null>>([])

  // afterRender fires on every chart update — including the ones this very setState triggers by
  // changing `options` — so without comparing by value first, a fresh array from the plugin (even
  // one with identical numbers) would keep failing React's reference-equality bailout and loop.
  const handleLegendCentersChange = (centers: Array<number | null>) => {
    const prev = legendCentersRef.current
    const unchanged = prev.length === centers.length && centers.every((c, i) => c === prev[i])
    if (unchanged) return
    legendCentersRef.current = centers
    setLegendCenters(centers)
  }

  useImperativeHandle(ref, () => wrapperRef.current as HTMLDivElement)

  // chart.js's own ResizeObserver usually catches container size changes, but rotating a mobile
  // device (including while this chart is showing inside Timeline's fullscreen view) can leave a
  // stale canvas size behind — force a resize explicitly rather than relying on that alone.
  useOrientationChange(() => {
    chartInstanceRef.current?.resize()
  })

  // Entering Timeline's fullscreen mode mounts a brand new chart instance (it lives in a portal,
  // separate from the inline one) at the same moment the surrounding flex layout is still
  // settling into its final size — e.g. when fullscreen was itself just triggered by rotating the
  // device, so there's no earlier orientationchange for this new instance to have caught. Chart.js
  // measures its container on first mount too, but can catch it mid-reflow; forcing another
  // resize right after paint corrects it against the now-stable layout.
  useEffect(() => {
    chartInstanceRef.current?.resize()
    const id = requestAnimationFrame(() => chartInstanceRef.current?.resize())
    return () => cancelAnimationFrame(id)
  }, [])

  // Highlights the scrubbed point's hover style (bigger dot) without popping chart.js's own
  // floating tooltip over the chart — the scrubbed date's values are read from the values row
  // above the legend instead (see the render below), and the vertical guide line
  // (timelineGuidesPlugin) marks which day they belong to.
  useEffect(() => {
    const chart = chartInstanceRef.current
    if (!chart) return
    const active: ActiveElement[] =
      activeIndex === null || activeIndex < 0 || activeIndex >= days.length
        ? []
        : chart.data.datasets.map((_, datasetIndex) => ({ datasetIndex, index: activeIndex }) as ActiveElement)
    chart.setActiveElements(active)
    chart.update()
  }, [activeIndex, days.length])

  const labels = days.map((d) =>
    new Date(d.date + 'T00:00:00').toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })
  )

  const gramKeys: MacroKey[] = ['protein', 'carbs', 'fat', 'fiber']
  const datasets = gramKeys.map((k) => ({
    label: t(`common.macros.${k}`),
    data: days.map((d) => d.totals[k]),
    borderColor: COLORS[k],
    backgroundColor: COLORS[k],
    yAxisID: 'grams',
    tension: 0.3,
    pointRadius: 2,
  }))

  datasets.push({
    label: t('common.macros.calories'),
    data: days.map((d) => d.totals.calories),
    borderColor: COLORS.calories,
    backgroundColor: COLORS.calories,
    yAxisID: 'calories',
    tension: 0.3,
    pointRadius: 2,
  })

  const data: ChartData<'line'> = { labels, datasets }

  // Anywhere within the calories scale's own reserved strip at the right edge (its tick labels
  // and axis title together, not just the "kcal" title text) counts as the kcal drag handle —
  // simpler and more forgiving to hit than pinpointing the rotated title text alone, and it's
  // the actual "kcal" reference on the graph rather than a legend/title entry naming it.
  const isInKcalAxisZone = (clientX: number, clientY: number): boolean => {
    const chart = chartInstanceRef.current
    const scale = chart?.scales.calories
    if (!chart || !scale) return false
    const canvasRect = chart.canvas.getBoundingClientRect()
    const x = clientX - canvasRect.left
    const y = clientY - canvasRect.top
    return x >= scale.left && x <= scale.right && y >= chart.chartArea.top && y <= chart.chartArea.bottom
  }

  // Reads the calories value at the finger/cursor's current height, clamped to the chart's plot
  // area — pointer capture keeps delivering move events even once it wanders outside the chart's
  // bounds, so the drag isn't limited to staying inside the axis strip itself.
  const kcalValueFromClientY = (clientY: number): number | null => {
    const chart = chartInstanceRef.current
    const scale = chart?.scales.calories
    if (!chart || !scale) return null
    const canvasRect = chart.canvas.getBoundingClientRect()
    const yInCanvas = clientY - canvasRect.top
    const clamped = Math.min(chart.chartArea.bottom, Math.max(chart.chartArea.top, yInCanvas))
    return scale.getValueForPixel(clamped) ?? null
  }

  const handleContainerPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!isInKcalAxisZone(e.clientX, e.clientY)) return
    e.currentTarget.setPointerCapture(e.pointerId)
    kcalPointerDownYRef.current = e.clientY
    onKcalLineChange(kcalValueFromClientY(e.clientY))
  }
  const handleContainerPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    onKcalLineChange(kcalValueFromClientY(e.clientY))
  }
  // A release that barely moved counts as a tap — dismiss the line, same as the scrubber's own
  // tap-to-dismiss. A real drag instead leaves it showing at wherever it was last dragged to,
  // rather than vanishing the instant the finger/cursor lifts.
  const handleContainerPointerEnd = (e: PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    const startY = kcalPointerDownYRef.current
    kcalPointerDownYRef.current = null
    const moved = startY !== null && Math.abs(e.clientY - startY) >= KCAL_TAP_THRESHOLD_PX
    if (!moved) onKcalLineChange(null)
  }

  const formatValue = (macro: MacroKey, value: number): string => {
    const rounded = Math.round(value).toLocaleString()
    return MACRO_UNITS[macro] === 'g' ? `${rounded}g` : `${rounded} kcal`
  }
  const kcalLineLabel = kcalLineValue !== null ? formatValue('calories', kcalLineValue) : null

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    // Touch drags are handled by the mobile scrubber instead (see Timeline.tsx) — leaving
    // touchstart/touchmove wired here would pop the built-in tooltip on every finger graze of
    // the chart, defeating the scrubber's "only show the reference while touching the slider"
    // behavior. A tap's synthesized click event still fires, so onDayClick keeps working.
    events: ['mousemove', 'mouseout', 'click'],
    onHover: (event, _elements, chart) => {
      // The kcal drag zone (see .chart-kcal-drag-zone) sits visually on top of the canvas at the
      // right edge and has its own CSS cursor, so a real mouse hover never reaches here for that
      // strip — this only ever runs for the plot area itself.
      const target = event.native?.target as HTMLElement | undefined
      if (target) target.style.cursor = onDayClick && days.length > 0 ? 'pointer' : 'default'
      void chart
    },
    onClick: (event, elements) => {
      // A drag that started on the kcal axis strip and released back over the plot still fires
      // a native click here — without this guard it'd also jump to whichever day sits nearest
      // the release point, on top of updating the dragged reference line.
      const native = event.native as MouseEvent | undefined
      if (native && isInKcalAxisZone(native.clientX, native.clientY)) return
      if (!onDayClick || elements.length === 0) return
      const day = days[elements[0].index]
      if (day) onDayClick(day.date)
    },
    plugins: {
      legend: {
        labels: {
          // Chart.js's own hidden-dataset indicator is a strikethrough on the label text alone —
          // the swatch stays solid, so a toggled-off macro doesn't read as clearly "off" at a
          // glance. This keeps the strikethrough but also fades the whole item (box + text) to
          // 50% opacity, only touching color once a dataset is actually hidden. fontColor is
          // always given an explicit value (never left undefined for chart.js to "default") —
          // a canvas 2d context's fillStyle just stays at whatever it last was, black by default,
          // when assigned undefined, rather than falling back to any sensible text color.
          generateLabels: (chart) => {
            const textColor = resolveCanvasColor(chart.canvas, '--text-muted')
            return LEGEND_KEYS.map((macro, i) => {
              const hidden = !chart.isDatasetVisible(i)
              const swatch = COLORS[macro]
              return {
                text: chart.data.datasets[i]?.label ?? '',
                fillStyle: hidden ? withAlpha(swatch, 0.5) : swatch,
                strokeStyle: hidden ? withAlpha(swatch, 0.5) : swatch,
                fontColor: hidden ? withAlpha(textColor, 0.5) : textColor,
                lineWidth: 0,
                hidden,
                datasetIndex: i,
              }
            })
          },
        },
      },
      timelineGuides: {
        activeIndex,
        kcalLineValue,
        kcalLineLabel,
        onPlotTopChange: setPlotTop,
        onLegendCentersChange: handleLegendCentersChange,
      },
      // Dragging the kcal line with a mouse still moves it over the plot area, which would
      // otherwise also trigger chart.js's own hover tooltip at whatever point it passes over.
      tooltip: { enabled: kcalLineValue === null },
    },
    scales: {
      x: {
        ticks: {
          // Matches the scrubbed date's vertical guide line and arrow (timelineGuidesPlugin) —
          // together they make clear which label the line belongs to, even when chart.js has
          // auto-skipped some of the others for space.
          color: (context) =>
            context.index === activeIndex
              ? resolveCanvasColor(context.chart.canvas, '--accent')
              : resolveCanvasColor(context.chart.canvas, '--text-muted'),
        },
      },
      grams: {
        type: 'linear',
        position: 'left',
        title: { display: true, text: 'grams' },
      },
      calories: {
        type: 'linear',
        position: 'right',
        title: { display: true, text: 'kcal' },
        grid: { drawOnChartArea: false },
      },
    },
  }

  const activeDay = activeIndex !== null && activeIndex >= 0 ? days[activeIndex] : undefined

  return (
    <div className="timeline-chart-wrapper" ref={wrapperRef}>
      {/* A fixed-height strip above chart.js's own legend, always present (even empty) so the
          chart below never grows/shrinks as this fills in and clears while scrubbing — cheaper
          on space than making the legend itself show a value per macro, and it doesn't need to:
          each value sits directly above its matching legend swatch instead of needing its own
          color dot to say which macro it belongs to. Stays up after the scrubber is released
          (see activeIndex) until dismissed via the close button or a tap on the scrubber. The
          dragged kcal reading gets its own label right on the line instead (see
          timelineGuidesPlugin), so it never competes with this row for space or attention. */}
      <div className="chart-values-row">
        {LEGEND_KEYS.map((macro, index) => {
          const value = activeDay?.totals[macro]
          const center = legendCenters[index]
          if (value === undefined || center === null || center === undefined) return null
          return (
            <span key={macro} className="chart-value-item" style={{ left: center, color: COLORS[macro] }}>
              {formatValue(macro, value)}
            </span>
          )
        })}
        {activeDay && onDismiss && (
          <button
            type="button"
            className="chart-values-row-close"
            onClick={onDismiss}
            aria-label={t('common.close')}
            title={t('common.close')}
          >
            <X size={11} />
          </button>
        )}
      </div>
      <div className="chart-container">
        <Line ref={chartInstanceRef} data={data} options={options} plugins={[timelineGuidesPlugin]} />
        {/* The actual kcal drag handle — the calories axis's own tick labels/title at the right
            edge of the graph, not a legend entry naming it. Starts below chart.js's own legend
            (see plotTop) so it never covers that legend's click-to-toggle swatches. */}
        <div
          className="chart-kcal-drag-zone"
          style={{ top: plotTop }}
          onPointerDown={handleContainerPointerDown}
          onPointerMove={handleContainerPointerMove}
          onPointerUp={handleContainerPointerEnd}
          onPointerCancel={handleContainerPointerEnd}
        />
      </div>
    </div>
  )
})

export default MacroTimelineChart
