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
import type { BiaEntry } from '../../data/parsers/bioimpedanciaParser'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip)

interface Props {
  entries: BiaEntry[]
  metric: keyof Pick<BiaEntry, 'weightKg' | 'bodyFatPct' | 'visceralFat' | 'muscleMassPct' | 'bmi'>
  label: string
  unit: string
  color: string
}

export default function BiaTrendChart({ entries, metric, label, unit, color }: Props) {
  const labels = entries.map((e) =>
    new Date(e.date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  )

  const data: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label,
        data: entries.map((e) => e[metric]),
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
    plugins: { tooltip: { callbacks: { label: (ctx) => `${ctx.parsed.y} ${unit}` } } },
    scales: {
      y: { ticks: { callback: (v) => `${v}` } },
    },
  }

  return (
    <div className="bia-chart">
      <h3>{label}</h3>
      <div className="bia-chart-container">
        <Line data={data} options={options} />
      </div>
    </div>
  )
}
