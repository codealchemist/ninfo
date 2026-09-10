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

type NumericMetric = keyof Pick<
  BiaEntry,
  'weightKg' | 'bodyFatPct' | 'bodyFatKg' | 'visceralFat' | 'muscleMassPct' | 'muscleMassKg' | 'bmi'
>

interface ToggleControl {
  options: Array<{ value: string; label: string }>
  value: string
  onChange: (value: string) => void
}

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

function ToggleSwitch({ toggle }: { toggle: ToggleControl }) {
  const count = toggle.options.length
  const activeIndex = Math.max(
    toggle.options.findIndex((opt) => opt.value === toggle.value),
    0
  )

  return (
    <div className="bia-toggle">
      <span
        className="bia-toggle-thumb"
        style={{ width: `calc((100% - 4px) / ${count})`, transform: `translateX(${activeIndex * 100}%)` }}
      />
      {toggle.options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          className={'bia-toggle-option' + (toggle.value === opt.value ? ' bia-toggle-option--active' : '')}
          onClick={() => toggle.onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

export default function BiaTrendChart({ entries, metric, label, unit, color, diff, unitToggle, diffToggle }: Props) {
  const dateLabel = (date: string) =>
    new Date(date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

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
        <p className="hint">Not enough measurements yet for a diff.</p>
      ) : (
        <div className="bia-chart-container">
          <Line data={data} options={options} />
        </div>
      )}
    </div>
  )
}
