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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip)

export interface TrendPoint {
  date: string
  value: number
}

interface Props {
  points: TrendPoint[]
  label: string
  unit: string
  color: string
}

/** A single-metric trend line — the generic version of BiaTrendChart, for simpler one-metric
 * series (weight, daily liquid intake) that don't need its unit/diff toggles. */
const TrendChart = forwardRef<HTMLDivElement, Props>(function TrendChart({ points, label, unit, color }, ref) {
  const { i18n } = useTranslation()
  const labels = points.map((p) =>
    new Date(p.date + 'T00:00:00').toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })
  )

  const data: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label,
        data: points.map((p) => p.value),
        borderColor: color,
        backgroundColor: color,
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.parsed.y ?? 0} ${unit}`,
        },
      },
    },
  }

  return (
    <div className="bia-chart-container" ref={ref}>
      <Line data={data} options={options} />
    </div>
  )
})

export default TrendChart
