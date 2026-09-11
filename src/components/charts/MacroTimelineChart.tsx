import { forwardRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { DailyAggregate, MacroKey } from '../../data/types'

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
  visibleMacros: Set<MacroKey>
  onDayClick?: (date: string) => void
}

const MacroTimelineChart = forwardRef<HTMLDivElement, Props>(function MacroTimelineChart(
  { days, visibleMacros, onDayClick },
  ref
) {
  const { t, i18n } = useTranslation()
  const labels = days.map((d) =>
    new Date(d.date + 'T00:00:00').toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })
  )

  const gramKeys: MacroKey[] = ['protein', 'carbs', 'fat', 'fiber']
  const datasets = gramKeys
    .filter((k) => visibleMacros.has(k))
    .map((k) => ({
      label: t(`common.macros.${k}`),
      data: days.map((d) => d.totals[k]),
      borderColor: COLORS[k],
      backgroundColor: COLORS[k],
      yAxisID: 'grams',
      tension: 0.3,
      pointRadius: 2,
    }))

  if (visibleMacros.has('calories')) {
    datasets.push({
      label: t('common.macros.calories'),
      data: days.map((d) => d.totals.calories),
      borderColor: COLORS.calories,
      backgroundColor: COLORS.calories,
      yAxisID: 'calories',
      tension: 0.3,
      pointRadius: 2,
    })
  }

  const data: ChartData<'line'> = { labels, datasets }

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
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
    <div className="chart-container" ref={ref}>
      <Line data={data} options={options} />
    </div>
  )
})

export default MacroTimelineChart
