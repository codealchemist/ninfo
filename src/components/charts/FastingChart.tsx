import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CategoryScale,
  Chart as ChartJS,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import { formatFastingMinutes } from '../../data/fasting'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip)

// Past this many days the markers crowd the line; hovering still shows each day's value.
const MAX_DAYS_WITH_MARKERS = 30

export interface FastingPoint {
  date: string
  /** The fast before that day's first meal; null leaves a gap in the line. */
  minutes: number | null
}

interface Props {
  points: FastingPoint[]
  label: string
  onDayClick: (date: string) => void
}

/** Each logged day's fast before its first meal, in hours. Hovering anywhere over a day shows
 * its value, and clicking opens that day — same as the macro chart above it. */
const FastingChart = forwardRef<HTMLDivElement, Props>(function FastingChart({ points, label, onDayClick }, ref) {
  const { i18n } = useTranslation()
  const color = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()

  const data: ChartData<'line'> = {
    labels: points.map((p) =>
      new Date(`${p.date}T00:00:00`).toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })
    ),
    datasets: [
      {
        label,
        data: points.map((p) => (p.minutes === null ? null : p.minutes / 60)),
        borderColor: color,
        backgroundColor: color,
        borderWidth: 2,
        tension: 0.3,
        pointRadius: points.length > MAX_DAYS_WITH_MARKERS ? 0 : 4,
        pointHoverRadius: 5,
      },
    ],
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    onHover: (event, elements) => {
      const target = event.native?.target as HTMLElement | undefined
      if (target) target.style.cursor = elements.length > 0 ? 'pointer' : 'default'
    },
    onClick: (_event, elements) => {
      const point = elements[0] && points[elements[0].index]
      if (point) onDayClick(point.date)
    },
    scales: {
      y: { ticks: { stepSize: 2, callback: (value) => `${value}h` } },
    },
    plugins: {
      tooltip: {
        displayColors: false,
        callbacks: {
          label: (ctx) => formatFastingMinutes((ctx.parsed.y ?? 0) * 60),
        },
      },
    },
  }

  return (
    <div className="bia-chart-container" ref={ref} role="img" aria-label={label}>
      <Line data={data} options={options} />
    </div>
  )
})

export default FastingChart
