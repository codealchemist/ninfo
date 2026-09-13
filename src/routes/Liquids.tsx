import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronDown, LoaderCircle, RefreshCw, TriangleAlert } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { getSheetLink } from '../db/sheetLinkStorage'
import { parseGoogleSheetUrl } from '../utils/googleSheetUrl'
import { LiquidoSource } from '../data/sources/LiquidoSource'
import type { LiquidEntry } from '../data/parsers/liquidoParser'
import { amountOfLiquid, dailyTotalMlByDate, normalizeLiquidKey } from '../data/liquidUtils'
import TrendChart from '../components/charts/TrendChart'
import LiquidHistoryList from '../components/liquids/LiquidHistoryList'
import LiquidShareGauge from '../components/liquids/LiquidShareGauge'
import CopyImageButton from '../components/common/CopyImageButton'

type Status = 'idle' | 'loading' | 'ready' | 'error'

const RANGES = [7, 30, 90, 0] as const // 0 = all

// Known sources get a fixed color (matching the sheet's own dropdown color-coding where
// possible); anything else cycles through the fallback palette so new liquid types still get
// a distinct, consistent color.
const LIQUID_COLORS: Record<string, string> = {
  agua: '#2f80ed',
  cafe: '#7a4a2e',
  te: '#e0a458',
  mate: '#3d9970',
}
const FALLBACK_PALETTE = ['#9b5de5', '#577590', '#f2b134', '#e07a5f', '#c0392b']

function colorForLiquidType(type: string, fallbackIndex: number): string {
  return LIQUID_COLORS[normalizeLiquidKey(type)] ?? FALLBACK_PALETTE[fallbackIndex % FALLBACK_PALETTE.length]
}

function fmt(value: number): string {
  return Math.round(value).toLocaleString()
}

function fmtDelta(value: number): string {
  return `${value >= 0 ? '+' : ''}${fmt(value)}`
}

function median(values: number[]): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function max(values: number[]): number {
  return values.length === 0 ? 0 : Math.max(...values)
}

function min(values: number[]): number {
  return values.length === 0 ? 0 : Math.min(...values)
}

function dailyTotals(entries: LiquidEntry[]): Array<{ date: string; totalMl: number }> {
  return Array.from(dailyTotalMlByDate(entries).entries())
    .map(([date, totalMl]) => ({ date, totalMl }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

/** Each distinct liquid type's share of total intake over the given entries, most-consumed
 * first. */
function liquidShares(entries: LiquidEntry[]): Array<{ type: string; pct: number }> {
  const byType = new Map<string, number>()
  let grandTotal = 0
  for (const e of entries) {
    const amount = amountOfLiquid(e)
    byType.set(e.liquidType, (byType.get(e.liquidType) ?? 0) + amount)
    grandTotal += amount
  }
  return Array.from(byType.entries())
    .map(([type, totalMl]) => ({ type, pct: grandTotal > 0 ? (totalMl / grandTotal) * 100 : 0 }))
    .sort((a, b) => b.pct - a.pct)
}

export default function Liquids() {
  const { t, i18n } = useTranslation()
  const sheetLinkId = useAppStore((s) => s.sheetLinkId)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [entries, setEntries] = useState<LiquidEntry[]>([])
  const [range, setRange] = useState<number>(30)
  const [gaugesOpen, setGaugesOpen] = useState(true)
  const summaryRef = useRef<HTMLDivElement>(null)
  const trendsRef = useRef<HTMLDivElement>(null)

  const spreadsheetId = sheetLinkId
    ? parseGoogleSheetUrl(getSheetLink(sheetLinkId)?.url ?? '')?.spreadsheetId ?? null
    : null

  const load = async () => {
    if (!spreadsheetId) return
    setStatus('loading')
    setError(null)
    try {
      const result = await new LiquidoSource(spreadsheetId).load()
      setEntries(result)
      setStatus('ready')
    } catch (err) {
      setError((err as Error).message)
      setStatus('error')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spreadsheetId])

  if (!spreadsheetId) {
    return (
      <div className="page">
        <section className="card">
          <h2>{t('liquid.title')}</h2>
          <p className="hint">
            {t('liquid.needsLinkedSheet')}
            <Link to="/">{t('bia.importLink')}</Link>
            {t('bia.toSeeIt')}
          </p>
        </section>
      </div>
    )
  }

  // The range filters pick the last N *days that actually have entries* (not N calendar days),
  // same as Timeline's range slices its list of aggregated days — so a range like 7d always
  // shows the 7 most recent logged days rather than being thrown off by gaps with no entries.
  const allTotals = dailyTotals(entries)
  const totals = range === 0 ? allTotals : allTotals.slice(-range)
  const rangeDates = new Set(totals.map((d) => d.date))
  const filteredEntries = entries.filter((e) => rangeDates.has(e.date))

  const latest = totals[totals.length - 1] ?? null
  const previous = totals[totals.length - 2] ?? null
  const totalsMl = totals.map((d) => d.totalMl)
  const medianMl = median(totalsMl)
  const maxMl = max(totalsMl)
  const minMl = min(totalsMl)
  const shares = liquidShares(filteredEntries)
  const rows = [...filteredEntries].reverse()

  return (
    <div className="page">
      <section className="card">
        <div className="bia-header">
          <h2>{t('liquid.title')}</h2>
          <div className="bia-header-actions">
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
            </div>
            <CopyImageButton
              targetRef={summaryRef}
              ariaLabel={t('liquid.copySummaryImageAria')}
              title={t('liquid.copySummaryImageTitle')}
            />
            <button className="link-button" onClick={load} disabled={status === 'loading'} title={t('liquid.refreshTitle')}>
              <RefreshCw size={14} className={status === 'loading' ? 'spin' : undefined} /> <span>{t('bia.refresh')}</span>
            </button>
          </div>
        </div>

        {status === 'loading' && entries.length === 0 && (
          <p className="hint">
            <LoaderCircle size={14} className="spin" /> {t('liquid.loading')}
          </p>
        )}

        {status === 'error' && (
          <p className="hint bia-error">
            <TriangleAlert size={14} /> {error}
          </p>
        )}

        {status === 'ready' && entries.length === 0 && <p className="hint">{t('liquid.noMeasurements')}</p>}

        {latest && (
          <>
            <div className="liquid-summary-row" ref={summaryRef}>
              <div className="liquid-summary-stats">
                <div className="bia-stat-row">
                  <div className="bia-stat">
                    <span className="bia-stat-value">
                      {fmt(medianMl)}
                      <span className="bia-stat-unit">ml</span>
                    </span>
                    <span className="bia-stat-label">
                      {t('liquid.metrics.median')}
                      {range !== 0 && ` (${t('timeline.rangeDays', { count: range })})`}
                    </span>
                  </div>
                  <div className="bia-stat">
                    <span className="bia-stat-value bia-stat-value--max">
                      {fmt(maxMl)}
                      <span className="bia-stat-unit">ml</span>
                    </span>
                    <span className="bia-stat-label">
                      {t('liquid.metrics.max')}
                      {range !== 0 && ` (${t('timeline.rangeDays', { count: range })})`}
                    </span>
                  </div>
                  <div className="bia-stat">
                    <span className="bia-stat-value bia-stat-value--min">
                      {fmt(minMl)}
                      <span className="bia-stat-unit">ml</span>
                    </span>
                    <span className="bia-stat-label">
                      {t('liquid.metrics.min')}
                      {range !== 0 && ` (${t('timeline.rangeDays', { count: range })})`}
                    </span>
                  </div>
                </div>
                <p className="hint" style={{ margin: '10px 0 0' }}>
                  {t('liquid.latestDay', {
                    date: new Date(latest.date + 'T00:00:00').toLocaleDateString(i18n.language, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    }),
                    total: fmt(latest.totalMl),
                  })}
                </p>
                {previous && (
                  <div className="delta-row">
                    <span className="delta-chip">
                      {t('liquid.metrics.dailyTotal')} {fmtDelta(latest.totalMl - previous.totalMl)} ml {t('bia.vsPrevious')}
                    </span>
                  </div>
                )}
              </div>
              {shares.length > 0 && (
                <div className="liquid-summary-gauges-wrap">
                  <button
                    type="button"
                    className="liquid-gauges-toggle"
                    onClick={() => setGaugesOpen((o) => !o)}
                    aria-expanded={gaugesOpen}
                  >
                    <span>{t('liquid.sources')}</span>
                    <ChevronDown size={14} className={gaugesOpen ? 'chevron chevron--open' : 'chevron'} />
                  </button>
                  <div
                    className={
                      'progress-ring-row liquid-summary-gauges' + (gaugesOpen ? '' : ' liquid-summary-gauges--collapsed')
                    }
                  >
                    {shares.map((s, i) => (
                      <LiquidShareGauge key={s.type} label={s.type} pct={s.pct} color={colorForLiquidType(s.type, i)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </section>

      {totals.length > 1 && (
        <section className="card">
          <div className="bia-header">
            <h2>{t('bia.trends')}</h2>
            <CopyImageButton
              targetRef={trendsRef}
              ariaLabel={t('bia.copyTrendsImageAria')}
              title={t('bia.copyTrendsImageTitle')}
            />
          </div>
          <TrendChart
            ref={trendsRef}
            points={totals.map((d) => ({ date: d.date, value: d.totalMl }))}
            label={t('liquid.metrics.dailyTotal')}
            unit="ml"
            color="#2f80ed"
          />
        </section>
      )}

      {filteredEntries.length > 0 && (
        <section className="card">
          <h2>{t('bia.history')}</h2>
          <LiquidHistoryList entries={rows} />
        </section>
      )}
    </div>
  )
}
