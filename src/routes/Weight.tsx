import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { LoaderCircle, RefreshCw, TriangleAlert } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { getSheetLink } from '../db/sheetLinkStorage'
import { parseGoogleSheetUrl } from '../utils/googleSheetUrl'
import { PesoSource } from '../data/sources/PesoSource'
import type { WeightEntry } from '../data/parsers/pesoParser'
import TrendChart from '../components/charts/TrendChart'
import WeightHistoryList from '../components/weight/WeightHistoryList'

type Status = 'idle' | 'loading' | 'ready' | 'error'

const RANGES = [7, 30, 90, 0] as const // 0 = all

const AGO_PERIODS = [
  { months: 1, key: 'oneMonth' },
  { months: 3, key: 'threeMonths' },
  { months: 6, key: 'sixMonths' },
  { months: 12, key: 'oneYear' },
] as const

function fmt(value: number): string {
  return value.toFixed(1)
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

function monthsAgoDate(dateStr: string, months: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setMonth(d.getMonth() - months)
  return d.toISOString().slice(0, 10)
}

/** Last entry at or before the target date, from an ascending-by-date list. */
function entryAtOrBefore(sortedEntries: WeightEntry[], targetDate: string): WeightEntry | null {
  let result: WeightEntry | null = null
  for (const e of sortedEntries) {
    if (e.date <= targetDate) result = e
    else break
  }
  return result
}

export default function Weight() {
  const { t, i18n } = useTranslation()
  const sheetLinkId = useAppStore((s) => s.sheetLinkId)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [entries, setEntries] = useState<WeightEntry[]>([])
  const [range, setRange] = useState<number>(30)

  const spreadsheetId = sheetLinkId
    ? parseGoogleSheetUrl(getSheetLink(sheetLinkId)?.url ?? '')?.spreadsheetId ?? null
    : null

  const load = async () => {
    if (!spreadsheetId) return
    setStatus('loading')
    setError(null)
    try {
      const result = await new PesoSource(spreadsheetId).load()
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
          <h2>{t('weight.title')}</h2>
          <p className="hint">
            {t('weight.needsLinkedSheet')}
            <Link to="/">{t('bia.importLink')}</Link>
            {t('bia.toSeeIt')}
          </p>
        </section>
      </div>
    )
  }

  // Same "last N days that have entries" semantics as Liquids/Timeline — range only trims from
  // the older side, so the latest measurement itself is unaffected by the selected range.
  const filteredEntries = range === 0 ? entries : entries.slice(-range)
  const latest = filteredEntries[filteredEntries.length - 1] ?? null
  const weights = filteredEntries.map((e) => e.weightKg)
  const medianKg = median(weights)
  const maxKg = max(weights)
  const minKg = min(weights)
  const rows = [...filteredEntries].reverse()
  const points = filteredEntries.map((e) => ({ date: e.date, value: e.weightKg }))

  const agoDiffs: Array<{ key: string; diff: number }> = []
  if (latest) {
    for (const p of AGO_PERIODS) {
      const target = monthsAgoDate(latest.date, p.months)
      const match = entryAtOrBefore(entries, target)
      if (match && match.date !== latest.date) {
        agoDiffs.push({ key: p.key, diff: latest.weightKg - match.weightKg })
      }
    }
  }

  return (
    <div className="page">
      <section className="card">
        <div className="bia-header">
          <h2>{t('weight.title')}</h2>
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
            <button className="link-button" onClick={load} disabled={status === 'loading'} title={t('weight.refreshTitle')}>
              <RefreshCw size={14} className={status === 'loading' ? 'spin' : undefined} /> <span>{t('bia.refresh')}</span>
            </button>
          </div>
        </div>

        {status === 'loading' && entries.length === 0 && (
          <p className="hint">
            <LoaderCircle size={14} className="spin" /> {t('weight.loading')}
          </p>
        )}

        {status === 'error' && (
          <p className="hint bia-error">
            <TriangleAlert size={14} /> {error}
          </p>
        )}

        {status === 'ready' && entries.length === 0 && <p className="hint">{t('weight.noMeasurements')}</p>}

        {latest && (
          <>
            <div className="bia-stat-row">
              <div className="bia-stat">
                <span className="bia-stat-value">
                  {fmt(latest.weightKg)}
                  <span className="bia-stat-unit">kg</span>
                </span>
                <span className="bia-stat-label">{t('weight.metrics.weight')}</span>
              </div>
              <div className="bia-stat">
                <span className="bia-stat-value">
                  {fmt(medianKg)}
                  <span className="bia-stat-unit">kg</span>
                </span>
                <span className="bia-stat-label">
                  {t('weight.metrics.median')}
                  {range !== 0 && ` (${t('timeline.rangeDays', { count: range })})`}
                </span>
              </div>
              <div className="bia-stat">
                <span className="bia-stat-value bia-stat-value--max">
                  {fmt(maxKg)}
                  <span className="bia-stat-unit">kg</span>
                </span>
                <span className="bia-stat-label">
                  {t('weight.metrics.max')}
                  {range !== 0 && ` (${t('timeline.rangeDays', { count: range })})`}
                </span>
              </div>
              <div className="bia-stat">
                <span className="bia-stat-value bia-stat-value--min">
                  {fmt(minKg)}
                  <span className="bia-stat-unit">kg</span>
                </span>
                <span className="bia-stat-label">
                  {t('weight.metrics.min')}
                  {range !== 0 && ` (${t('timeline.rangeDays', { count: range })})`}
                </span>
              </div>
            </div>
            <p className="hint" style={{ margin: '10px 0 0' }}>
              {t('weight.latestMeasurement', {
                date: new Date(latest.date + 'T00:00:00').toLocaleDateString(i18n.language, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                }),
              })}
              {latest.notes && ` — ${latest.notes}`}
            </p>
            {agoDiffs.length > 0 && (
              <div className="delta-row">
                {agoDiffs.map((d) => (
                  <span key={d.key} className="delta-chip">
                    {t('weight.metrics.weight')} {fmtDelta(d.diff)} kg {t(`weight.periods.${d.key}`)}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {filteredEntries.length > 1 && (
        <section className="card">
          <h2>{t('bia.trends')}</h2>
          <TrendChart points={points} label={t('weight.metrics.weight')} unit="kg" color="#577590" />
        </section>
      )}

      {filteredEntries.length > 0 && (
        <section className="card">
          <h2>{t('bia.history')}</h2>
          <WeightHistoryList entries={rows} />
        </section>
      )}
    </div>
  )
}
