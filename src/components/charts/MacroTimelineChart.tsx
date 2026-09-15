import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import { useTranslation } from 'react-i18next'
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
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { DailyAggregate, MacroKey } from '../../data/types'
import { useOrientationChange } from '../../hooks/useOrientationChange'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

const COLORS: Record<MacroKey, string> = {
  protein: '#e07a5f',
  carbs: '#3d9970',
  fat: '#f2b134',
  fiber: '#577590',
  calories: '#9b5de5',
}

interface Props {
  days: DailyAggregate[]
  onDayClick?: (date: string) => void
  /** An index to force-highlight and show the tooltip for, driven by the mobile scrubber
   * (see Timeline.tsx) rather than the chart's own hover/touch handling — null hides it. */
  activeIndex?: number | null
}

const MacroTimelineChart = forwardRef<HTMLDivElement, Props>(function MacroTimelineChart(
  { days, onDayClick, activeIndex = null },
  ref
) {
  const { t, i18n } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<ChartJS<'line'> | null>(null)

  useImperativeHandle(ref, () => containerRef.current as HTMLDivElement)

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

  useEffect(() => {
    const chart = chartInstanceRef.current
    if (!chart) return
    const active: ActiveElement[] =
      activeIndex === null || activeIndex < 0 || activeIndex >= days.length
        ? []
        : chart.data.datasets.map((_, datasetIndex) => ({ datasetIndex, index: activeIndex }) as ActiveElement)
    chart.setActiveElements(active)
    chart.tooltip?.setActiveElements(active, { x: 0, y: 0 })
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
      const target = event.native?.target as HTMLElement | undefined
      if (target) target.style.cursor = onDayClick && days.length > 0 ? 'pointer' : 'default'
      void chart
    },
    onClick: (_event, elements) => {
      if (!onDayClick || elements.length === 0) return
      const day = days[elements[0].index]
      if (day) onDayClick(day.date)
    },
    scales: {
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

  return (
    <div className="chart-container" ref={containerRef}>
      <Line ref={chartInstanceRef} data={data} options={options} />
    </div>
  )
})

export default MacroTimelineChart
