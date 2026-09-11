import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, Copy, Eye, EyeOff, Image as ImageIcon, ListChecks } from 'lucide-react'
import { MACRO_KEYS, MACRO_UNITS, type LipidTotals, type MacroTotals, type Meal } from '../../data/types'
import { analyzeFat } from '../../data/lipidAnalysis'
import { analyzeGlycemicRisk } from '../../data/glycemicRisk'
import { generateDayReview } from '../../data/dayReview'
import { formatDayFoodListAsText, formatDaySummaryAsText } from '../../data/dayText'
import { copyElementAsImage, copyTextToClipboard } from '../../utils/clipboard'
import GoalProgressRing from './GoalProgressRing'
import DaySummaryShareCard from './DaySummaryShareCard'
import MealCardWarnings from '../meals/MealCardWarnings'
import ToggleSwitch from '../common/ToggleSwitch'
import { useAppStore } from '../../store/appStore'
import { useSwipe } from '../../hooks/useSwipe'

const COLOR_VARS: Record<string, string> = {
  protein: '--macro-protein',
  carbs: '--macro-carbs',
  fat: '--macro-fat',
  fiber: '--macro-fiber',
  calories: '--macro-calories',
}

type CopyState = 'idle' | 'copied' | 'failed'
type ComparisonMode = 'yesterday' | 'week' | 'month'

interface Props {
  date: string
  meals: Meal[]
  totals: MacroTotals
  lipids: LipidTotals
  goals: MacroTotals | null
  prevDayTotals: MacroTotals | null
  weekMedianTotals: MacroTotals | null
  monthMedianTotals: MacroTotals | null
}

export default function DaySummaryCard({
  date,
  meals,
  totals,
  lipids,
  goals,
  prevDayTotals,
  weekMedianTotals,
  monthMedianTotals,
}: Props) {
  const { t } = useTranslation()
  const visibleMacros = useAppStore((s) => s.visibleMacros)
  const stepDate = useAppStore((s) => s.stepDate)
  const swipeHandlers = useSwipe({ onSwipeLeft: () => stepDate(1), onSwipeRight: () => stepDate(-1) })
  const macros = MACRO_KEYS.filter((m) => visibleMacros.has(m))
  const [collapsed, setCollapsed] = useState(false)
  const [showRingDetails, setShowRingDetails] = useState(false)
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('yesterday')
  const shareCardRef = useRef<HTMLDivElement>(null)
  const [foodListCopyState, setFoodListCopyState] = useState<CopyState>('idle')
  const [summaryTextCopyState, setSummaryTextCopyState] = useState<CopyState>('idle')
  const [summaryImageCopyState, setSummaryImageCopyState] = useState<CopyState>('idle')

  const fatBreakdown = analyzeFat(lipids, totals.fat)
  const glycemicRisk = analyzeGlycemicRisk(totals)
  const reviewText = generateDayReview(totals, goals)

  const comparisonTotals: Record<ComparisonMode, MacroTotals | null> = {
    yesterday: prevDayTotals,
    week: weekMedianTotals,
    month: monthMedianTotals,
  }
  const comparisonLabelKey: Record<ComparisonMode, string> = {
    yesterday: 'today.vsYesterday',
    week: 'today.vsWeek',
    month: 'today.vsMonth',
  }
  const comparisonOptions = [
    { value: 'yesterday', label: t('today.compareYesterday') },
    { value: 'week', label: t('today.compareWeek') },
    { value: 'month', label: t('today.compareMonth') },
  ]
  const activeComparison = comparisonTotals[comparisonMode]

  const flash = (setState: (s: CopyState) => void, ok: boolean) => {
    setState(ok ? 'copied' : 'failed')
    setTimeout(() => setState('idle'), 1500)
  }

  const handleCopyFoodList = async () => {
    const ok = await copyTextToClipboard(formatDayFoodListAsText(meals, date))
    flash(setFoodListCopyState, ok)
  }

  const handleCopySummaryText = async () => {
    const ok = await copyTextToClipboard(formatDaySummaryAsText(date, totals, goals))
    flash(setSummaryTextCopyState, ok)
  }

  const handleCopySummaryImage = async () => {
    if (!shareCardRef.current) return
    const ok = await copyElementAsImage(shareCardRef.current)
    flash(setSummaryImageCopyState, ok)
  }

  return (
    <section className="card day-summary-card" {...swipeHandlers}>
      <div className="day-summary-main">
        <div className="day-summary-header">
          <button
            className="day-summary-title-row"
            onClick={() => setCollapsed((c) => !c)}
            aria-expanded={!collapsed}
          >
            <ChevronDown size={16} className={collapsed ? 'chevron' : 'chevron chevron--open'} />
            <h2>{t('today.summaryHeading')}</h2>
          </button>
          <MealCardWarnings fat={fatBreakdown} glycemic={glycemicRisk} />
        </div>

        {!collapsed && (
          <>
            <div className="day-summary-body">
              <div className="progress-ring-row">
                {macros.map((macro) => (
                  <GoalProgressRing
                    key={macro}
                    label={t(`common.macros.${macro}`)}
                    value={totals[macro]}
                    goal={goals ? goals[macro] : null}
                    unit={MACRO_UNITS[macro]}
                    colorVar={COLOR_VARS[macro]}
                    showDetails={showRingDetails}
                  />
                ))}
              </div>
              <p className="day-review-text">{reviewText}</p>
            </div>
            {(prevDayTotals || weekMedianTotals || monthMedianTotals) && (
              <div className="day-summary-footer">
                <div className="day-summary-footer-top">
                  <ToggleSwitch
                    className="day-summary-comparison-toggle"
                    toggle={{ options: comparisonOptions, value: comparisonMode, onChange: (v) => setComparisonMode(v as ComparisonMode) }}
                  />
                  {comparisonMode !== 'yesterday' && <p className="hint day-summary-median-hint">{t('today.medianHint')}</p>}
                </div>
                {activeComparison && (
                  <div className="delta-row">
                    {macros.map((macro) => {
                      const delta = totals[macro] - activeComparison[macro]
                      const sign = delta >= 0 ? '+' : ''
                      const deltaClass = delta > 0 ? ' delta-chip--over' : delta < 0 ? ' delta-chip--under' : ''
                      return (
                        <span key={macro} className={'delta-chip' + deltaClass}>
                          {t(`common.macros.${macro}`)} {sign}
                          {Math.round(delta)} {MACRO_UNITS[macro]} {t(comparisonLabelKey[comparisonMode])}
                        </span>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <div className="day-summary-actions">
        <button
          className="icon-button icon-button--ghost"
          onClick={() => setShowRingDetails((s) => !s)}
          aria-pressed={showRingDetails}
          aria-label={showRingDetails ? t('today.hideRingDetailsAria') : t('today.showRingDetailsAria')}
          title={showRingDetails ? t('today.hideRingDetailsTitle') : t('today.showRingDetailsTitle')}
        >
          {showRingDetails ? <EyeOff size={14} /> : <Eye size={14} />}
        </button>
        <button
          className="icon-button icon-button--ghost"
          onClick={handleCopyFoodList}
          aria-label={t('today.copyFoodListAria')}
          title={t('today.copyFoodListTitle')}
        >
          {foodListCopyState === 'copied' ? <Check size={14} /> : <ListChecks size={14} />}
        </button>
        <button
          className="icon-button icon-button--ghost"
          onClick={handleCopySummaryText}
          aria-label={t('today.copySummaryTextAria')}
          title={t('today.copySummaryTextTitle')}
        >
          {summaryTextCopyState === 'copied' ? <Check size={14} /> : <Copy size={14} />}
        </button>
        <button
          className="icon-button icon-button--ghost"
          onClick={handleCopySummaryImage}
          aria-label={t('today.copySummaryImageAria')}
          title={t('today.copySummaryImageTitle')}
        >
          {summaryImageCopyState === 'copied' ? <Check size={14} /> : <ImageIcon size={14} />}
        </button>
      </div>

      <div className="day-summary-share-offscreen" aria-hidden="true">
        <DaySummaryShareCard
          ref={shareCardRef}
          date={date}
          meals={meals}
          macros={macros}
          totals={totals}
          goals={goals}
          comparisonTotals={activeComparison}
          comparisonLabel={t(comparisonLabelKey[comparisonMode])}
        />
      </div>
    </section>
  )
}
