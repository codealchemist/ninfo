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
import type { BiaEntry } from '../../data/parsers/bioimpedanciaParser'
import ToggleSwitch, { type ToggleControl } from '../common/ToggleSwitch'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip)

type NumericMetric = keyof Pick<
  BiaEntry,
  'weightKg' | 'bodyFatPct' | 'bodyFatKg' | 'visceralFat' | 'muscleMassPct' | 'muscleMassKg' | 'bmi'
>

interface Props {
  entries: BiaEntry[]
  metric: NumericMetric
  label: string
  unit: string
  color: string
  /** Plots the change from each entry's previous measurement instead of its absolute value. */
  diff?: boolean
  /** Renders a small unit switcher (e.g. "% / kg") next to the chart title. */
  unitToggle?: ToggleControl
  /** Renders a small "Value / Diff" switcher next to the chart title. */
  diffToggle?: ToggleControl
}

export default function BiaTrendChart({ entries, metric, label, unit, color, diff, unitToggle, diffToggle }: Props) {
  const { t, i18n } = useTranslation()
  const dateLabel = (date: string) =>
    new Date(date + 'T00:00:00').toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })

  // A diff has nothing to compare the very first entry against, so the series is one point
  // shorter — each point is the change from the previous row to the row named on the axis.
  const plotted = diff ? entries.slice(1) : entries
  const values = diff ? entries.slice(1).map((e, i) => e[metric] - entries[i][metric]) : entries.map((e) => e[metric])
  const labels = plotted.map((e) => dateLabel(e.date))
  const datasetLabel = diff ? `Δ ${label}` : label

  const data: ChartData<'line'> = {
    labels,
    datasets: [
      {
        label: datasetLabel,
        data: values,
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
          label: (ctx) => {
            const y = ctx.parsed.y ?? 0
            return `${diff && y >= 0 ? '+' : ''}${y} ${unit}`
          },
        },
      },
    },
    scales: {
      y: { ticks: { callback: (v) => `${v}` } },
    },
  }

  return (
    <div className="bia-chart">
      <div className="bia-chart-header">
        <h3>{label}</h3>
        <div className="bia-chart-toggles">
          {unitToggle && <ToggleSwitch toggle={unitToggle} />}
          {diffToggle && <ToggleSwitch toggle={diffToggle} />}
        </div>
      </div>
      {values.length === 0 ? (
        <p className="hint">{t('bia.notEnoughForDiff')}</p>
      ) : (
        <div className="bia-chart-container">
          <Line data={data} options={options} />
        </div>
      )}
    </div>
  )
}
