import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronLeft, ChevronRight, ChevronsRight } from 'lucide-react'
import { useAppStore } from '../../store/appStore'

function formatDateLabel(iso: string, locale: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(locale, { weekday: 'short', month: 'short', day: 'numeric' })
}

export default function DateNavigator() {
  const { t, i18n } = useTranslation()
  const dates = useAppStore((s) => s.dates)
  const selectedDate = useAppStore((s) => s.selectedDate)
  const stepDate = useAppStore((s) => s.stepDate)
  const setSelectedDate = useAppStore((s) => s.setSelectedDate)

  // Shift+arrow steps between days from anywhere in the dashboard (not just this page) —
  // plain arrow keys are left alone so the meal timeline's own arrow navigation still works.
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!e.shiftKey) return
      const target = e.target as HTMLElement | null
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        stepDate(-1)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        stepDate(1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [stepDate])

  if (!selectedDate) return null
  const idx = dates.indexOf(selectedDate)
  const isFirst = idx <= 0
  const isLast = idx >= dates.length - 1
  const lastDate = dates[dates.length - 1]

  return (
    <div className="date-nav">
      <button
        className="icon-button"
        onClick={() => stepDate(-1)}
        disabled={isFirst}
        aria-label={t('dateNavigator.previousDay')}
      >
        <ChevronLeft size={18} />
      </button>
      <input
        type="date"
        className="date-nav-input"
        value={selectedDate}
        min={dates[0]}
        max={lastDate}
        onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
      />
      <span className="date-nav-label">{formatDateLabel(selectedDate, i18n.language)}</span>
      <button
        className="icon-button"
        onClick={() => stepDate(1)}
        disabled={isLast}
        aria-label={t('dateNavigator.nextDay')}
      >
        <ChevronRight size={18} />
      </button>
      {selectedDate !== lastDate && (
        <button
          className="icon-button"
          onClick={() => setSelectedDate(lastDate)}
          aria-label={t('dateNavigator.jumpToLatest')}
          title={t('dateNavigator.jumpToLatest')}
        >
          <ChevronsRight size={18} />
        </button>
      )}
    </div>
  )
}
