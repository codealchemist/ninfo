import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Calendar,
  Check,
  ChevronDown,
  ChevronsRight,
  Copy,
  Eye,
  EyeOff,
  Image as ImageIcon,
  ListChecks,
  TriangleAlert,
} from 'lucide-react'
import { MACRO_KEYS, MACRO_UNITS, type LipidTotals, type MacroTotals, type Meal } from '../../data/types'
import { analyzeFat } from '../../data/lipidAnalysis'
import { analyzeGlycemicRisk } from '../../data/glycemicRisk'
import { generateDayReview } from '../../data/dayReview'
import { formatDayFoodListAsText, formatDaySummaryAsText } from '../../data/dayText'
import { topSourcesByMacro } from '../../data/aggregate/dailyTotals'
import { buildWarningStamps } from '../../data/warningStamps'
import { copyElementAsImage, copyTextToClipboard } from '../../utils/clipboard'
import GoalProgressRing from './GoalProgressRing'
import DaySummaryShareCard from './DaySummaryShareCard'
import ToggleSwitch from '../common/ToggleSwitch'
import WarningStampList from '../common/WarningStampList'
import { useAppStore } from '../../store/appStore'

function formatDateHeading(iso: string, locale: string): string {
  const d = new Date(iso + 'T00:00:00')
  return d.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' })
}

const COLOR_VARS: Record<string, string> = {
  protein: '--macro-protein',
  carbs: '--macro-carbs',
  fat: '--macro-fat',
  fiber: '--macro-fiber',
  calories: '--macro-calories',
}

type CopyState = 'idle' | 'copied' | 'failed'
type ComparisonMode = 'yesterday' | 'week' | 'month'
type MobileTab = 'summary' | 'vs' | 'sources'

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
  const { t, i18n } = useTranslation()
  const visibleMacros = useAppStore((s) => s.visibleMacros)
  const dates = useAppStore((s) => s.dates)
  const setSelectedDate = useAppStore((s) => s.setSelectedDate)
  const lastDate = dates[dates.length - 1]
  const macros = MACRO_KEYS.filter((m) => visibleMacros.has(m))
  const [collapsed, setCollapsed] = useState(false)
  const [showRingDetails, setShowRingDetails] = useState(false)
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>('yesterday')
  const [activeTab, setActiveTab] = useState<MobileTab>('summary')
  const [showWarnings, setShowWarnings] = useState(false)
  const shareCardRef = useRef<HTMLDivElement>(null)
  const [foodListCopyState, setFoodListCopyState] = useState<CopyState>('idle')
  const [summaryTextCopyState, setSummaryTextCopyState] = useState<CopyState>('idle')
  const [summaryImageCopyState, setSummaryImageCopyState] = useState<CopyState>('idle')

  const fatBreakdown = analyzeFat(lipids, totals.fat)
  const glycemicRisk = analyzeGlycemicRisk(totals)
  const reviewText = generateDayReview(totals, goals)
  const dayWarnings = buildWarningStamps(fatBreakdown, glycemicRisk, t, 'today')
  const hasWarnings = dayWarnings.length > 0

  useEffect(() => {
    if (!showWarnings) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowWarnings(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showWarnings])

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
  const topSources = topSourcesByMacro(meals)

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

  // Rendered twice — in the panel header on desktop, in a bottom-right column on mobile (see
  // .day-summary-header-buttons / .day-summary-actions) — same buttons, different position.
  const actionButtons = (
    <>
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
    </>
  )

  return (
    <section className="card day-summary-card">
      <div className="day-summary-main">
        <div className="day-summary-header">
          <button
            className="day-summary-title-row"
            onClick={() => setCollapsed((c) => !c)}
            aria-expanded={!collapsed}
          >
            <ChevronDown size={16} className={collapsed ? 'chevron' : 'chevron chevron--open'} />
            <h2 className="day-summary-date-heading">{formatDateHeading(date, i18n.language)}</h2>
          </button>
          <div className="day-summary-header-actions">
            <div className="day-summary-date-picker">
              <Calendar size={16} className="day-summary-date-picker-icon" aria-hidden="true" />
              <input
                type="date"
                className="day-summary-date-input"
                value={date}
                min={dates[0]}
                max={lastDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                aria-label={t('dateNavigator.pickDate')}
              />
            </div>
            {date !== lastDate && (
              <button
                className="icon-button icon-button--ghost"
                onClick={() => setSelectedDate(lastDate)}
                aria-label={t('dateNavigator.jumpToLatest')}
                title={t('dateNavigator.jumpToLatest')}
              >
                <ChevronsRight size={16} />
              </button>
            )}
            <button
              className="icon-button icon-button--ghost warnings-button"
              onClick={() => setShowWarnings((s) => !s)}
              disabled={!hasWarnings}
              aria-label={t('today.warningsButtonAria')}
              title={t('today.warningsButtonAria')}
            >
              <TriangleAlert size={16} />
            </button>
            <div className="day-summary-header-buttons">{actionButtons}</div>
          </div>
        </div>

        {!collapsed && showWarnings && (
          <div className="day-summary-warnings-view">
            <div className="day-summary-warnings-header">
              <span className="day-summary-footer-title">{t('today.warningsTitle')}</span>
            </div>
            <WarningStampList warnings={dayWarnings} />
          </div>
        )}

        {!collapsed && !showWarnings && (
          <>
            <div className="day-summary-tabbar">
              <button
                className={'day-summary-tab' + (activeTab === 'summary' ? ' day-summary-tab--active' : '')}
                onClick={() => setActiveTab('summary')}
              >
                {t('today.tabSummary')}
              </button>
              <button
                className={'day-summary-tab' + (activeTab === 'vs' ? ' day-summary-tab--active' : '')}
                onClick={() => setActiveTab('vs')}
              >
                {t('today.tabVs')}
              </button>
              <button
                className={'day-summary-tab' + (activeTab === 'sources' ? ' day-summary-tab--active' : '')}
                onClick={() => setActiveTab('sources')}
              >
                {t('today.tabSources')}
              </button>
            </div>

            <div className={'day-summary-panel' + (activeTab === 'summary' ? ' day-summary-panel--active' : '')}>
              <span className="day-summary-footer-title day-summary-body-title">{t('today.macroNutrientsTitle')}</span>
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
            </div>

            {(prevDayTotals || weekMedianTotals || monthMedianTotals) && (
              <div className="day-summary-footer">
                <div className={'day-summary-panel day-summary-footer-half' + (activeTab === 'vs' ? ' day-summary-panel--active' : '')}>
                  <div className="day-summary-footer-top">
                    <span className="day-summary-footer-title">{t('today.currentDayVsTitle')}</span>
                    <ToggleSwitch
                      className="day-summary-comparison-toggle"
                      toggle={{ options: comparisonOptions, value: comparisonMode, onChange: (v) => setComparisonMode(v as ComparisonMode) }}
                    />
                    {comparisonMode !== 'yesterday' && <p className="hint day-summary-median-hint">{t('today.medianHint')}</p>}
                  </div>
                  {activeComparison && (
                    <div className="delta-table">
                      {macros.map((macro) => {
                        const baseline = activeComparison[macro]
                        const delta = totals[macro] - baseline
                        const sign = delta > 0 ? '+' : delta < 0 ? '-' : ''
                        const pct = baseline > 0 ? Math.round((Math.abs(delta) / baseline) * 100) : null
                        const deltaClass = delta > 0 ? ' delta-table-row--over' : delta < 0 ? ' delta-table-row--under' : ''
                        return (
                          <div key={macro} className={'delta-table-row' + deltaClass}>
                            <span className="delta-table-label">{t(`common.macros.${macro}`)}</span>
                            <span className="delta-table-grams">
                              {sign}
                              {Math.round(Math.abs(delta))} {MACRO_UNITS[macro]}
                            </span>
                            <span className="delta-table-pct">{pct !== null ? `${sign}${pct}%` : '—'}</span>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                <div className={'day-summary-panel day-summary-footer-half' + (activeTab === 'sources' ? ' day-summary-panel--active' : '')}>
                  <span className="day-summary-footer-title">{t('today.topSources')}</span>
                  <div className="day-summary-sources-list">
                    {macros.map((macro) => {
                      const source = topSources[macro]
                      if (!source) return null
                      const pct = Math.round((source.amount / totals[macro]) * 100)
                      const amountLabel = `${Math.round(source.amount)}${macro === 'calories' ? ' kcal' : 'g'}`
                      return (
                        <div key={macro} className="day-summary-source-item">
                          <span className="day-summary-source-macro" style={{ color: `var(${COLOR_VARS[macro]})` }}>
                            {t(`common.macros.${macro}`)}
                          </span>
                          <span className="day-summary-source-detail">
                            {t('today.topSourceLine', { food: source.food, amount: amountLabel, pct })}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="day-summary-actions">{actionButtons}</div>

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
