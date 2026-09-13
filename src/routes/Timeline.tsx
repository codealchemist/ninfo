import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Check, Image as ImageIcon, Maximize2, Minimize2 } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { aggregateByDay } from '../data/aggregate/dailyTotals'
import { copyElementAsImage } from '../utils/clipboard'
import MacroTimelineChart from '../components/charts/MacroTimelineChart'

const RANGES = [7, 30, 90, 0] as const // 0 = all

export default function Timeline() {
  const { t } = useTranslation()
  const meals = useAppStore((s) => s.meals)
  const goalsByDate = useAppStore((s) => s.goalsByDate)
  const jumpToDate = useAppStore((s) => s.jumpToDate)
  const [range, setRange] = useState<number>(30)
  const chartRef = useRef<HTMLDivElement>(null)
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle')
  const [fullscreen, setFullscreen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (!fullscreen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [fullscreen])

  const handleDayClick = (date: string) => {
    jumpToDate(date)
    navigate('/app/today')
  }

  const allDays = useMemo(() => aggregateByDay(meals, goalsByDate), [meals, goalsByDate])
  const days = range === 0 ? allDays : allDays.slice(-range)

  const handleCopyImage = async () => {
    if (!chartRef.current) return
    const ok = await copyElementAsImage(chartRef.current)
    setCopyState(ok ? 'copied' : 'failed')
    setTimeout(() => setCopyState('idle'), 1500)
  }

  const content = (
    <>
      <div className="timeline-header">
        <h2>{t('timeline.title')}</h2>
        <div className="range-buttons">
          {RANGES.map((r) => (
            <button
              key={r}
              className={'range-button' + (range === r ? ' range-button--active' : '')}
              onClick={() => setRange(r)}
            >
              {r === 0 ? t('timeline.all') : t('timeline.rangeDays', { count: r })}
            </button>
          ))}
          <button
            className="icon-button icon-button--ghost"
            onClick={handleCopyImage}
            aria-label={t('timeline.copyImageAria')}
            title={t('timeline.copyImageTitle')}
          >
            {copyState === 'copied' ? <Check size={14} /> : <ImageIcon size={14} />}
          </button>
          <button
            className="icon-button icon-button--ghost"
            onClick={() => setFullscreen((f) => !f)}
            aria-label={fullscreen ? t('timeline.exitFullscreen') : t('timeline.viewFullscreen')}
            title={fullscreen ? t('timeline.exitFullscreen') : t('timeline.viewFullscreen')}
          >
            {fullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>
        </div>
      </div>
      <p className="hint">{t('timeline.hint')}</p>
      <MacroTimelineChart ref={chartRef} days={days} onDayClick={handleDayClick} />
    </>
  )

  return (
    <div className="page">
      <section className="card">{!fullscreen && content}</section>
      {fullscreen &&
        createPortal(
          <div className="timeline-modal-backdrop" onClick={() => setFullscreen(false)}>
            <div className="card timeline-modal" onClick={(e) => e.stopPropagation()}>
              {content}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}
