import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Info, LoaderCircle, RefreshCw, TriangleAlert } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { getSheetLink } from '../db/sheetLinkStorage'
import { parseGoogleSheetUrl } from '../utils/googleSheetUrl'
import { BioimpedanciaSource } from '../data/sources/BioimpedanciaSource'
import type { BiaEntry } from '../data/parsers/bioimpedanciaParser'
import BiaTrendChart from '../components/charts/BiaTrendChart'
import BiaGlossaryModal from '../components/common/BiaGlossaryModal'

type Status = 'idle' | 'loading' | 'ready' | 'error'

const METRICS: Array<{
  key: keyof Pick<BiaEntry, 'weightKg' | 'bodyFatPct' | 'visceralFat' | 'muscleMassPct' | 'bmi'>
  kgKey?: keyof Pick<BiaEntry, 'bodyFatKg' | 'muscleMassKg'>
  label: string
  unit: string
  color: string
  decimals: number
}> = [
  { key: 'weightKg', label: 'Weight', unit: 'kg', color: '#577590', decimals: 1 },
  { key: 'bodyFatPct', kgKey: 'bodyFatKg', label: 'Body fat', unit: '%', color: '#e07a5f', decimals: 1 },
  { key: 'visceralFat', label: 'Visceral fat', unit: '', color: '#f2b134', decimals: 0 },
  { key: 'muscleMassPct', kgKey: 'muscleMassKg', label: 'Muscle mass', unit: '%', color: '#3d9970', decimals: 1 },
  { key: 'bmi', label: 'BMI', unit: '', color: '#9b5de5', decimals: 1 },
]

function fmt(value: number, decimals: number): string {
  return value.toFixed(decimals)
}

function fmtDelta(value: number, decimals: number): string {
  return `${value >= 0 ? '+' : ''}${fmt(value, decimals)}`
}

const UNIT_TOGGLE_OPTIONS = [
  { value: 'pct', label: '%' },
  { value: 'kg', label: 'kg' },
]

const DIFF_TOGGLE_OPTIONS = [
  { value: 'value', label: 'Value' },
  { value: 'diff', label: 'Diff' },
]

export default function Bia() {
  const sheetLinkId = useAppStore((s) => s.sheetLinkId)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [entries, setEntries] = useState<BiaEntry[]>([])
  const [chartUnits, setChartUnits] = useState<Record<string, 'pct' | 'kg'>>({})
  const [chartDiff, setChartDiff] = useState<Record<string, boolean>>({})
  const [showGlossary, setShowGlossary] = useState(false)

  const spreadsheetId = sheetLinkId
    ? parseGoogleSheetUrl(getSheetLink(sheetLinkId)?.url ?? '')?.spreadsheetId ?? null
    : null

  const load = async () => {
    if (!spreadsheetId) return
    setStatus('loading')
    setError(null)
    try {
      const result = await new BioimpedanciaSource(spreadsheetId).load()
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
          <h2>Bioimpedancia</h2>
          <p className="hint">
            This report reads the "Bioimpedancia" tab from a linked Google Sheet. <Link to="/">Import one from a shared link</Link> to see it.
          </p>
        </section>
      </div>
    )
  }

  const latest = entries[entries.length - 1] ?? null
  const previous = entries[entries.length - 2] ?? null
  const rows = [...entries].reverse()

  return (
    <div className="page">
      <section className="card">
        <div className="bia-header">
          <h2>Bioimpedancia</h2>
          <div className="bia-header-actions">
            <button className="link-button" onClick={() => setShowGlossary(true)} title="What do these terms mean?">
              <Info size={14} /> <span>Terms</span>
            </button>
            <button className="link-button" onClick={load} disabled={status === 'loading'} title="Re-fetch the latest measurements">
              <RefreshCw size={14} className={status === 'loading' ? 'spin' : undefined} /> <span>Refresh</span>
            </button>
          </div>
        </div>

        {status === 'loading' && entries.length === 0 && (
          <p className="hint">
            <LoaderCircle size={14} className="spin" /> Loading measurements…
          </p>
        )}

        {status === 'error' && (
          <p className="hint bia-error">
            <TriangleAlert size={14} /> {error}
          </p>
        )}

        {status === 'ready' && entries.length === 0 && (
          <p className="hint">No measurements found in the Bioimpedancia tab yet.</p>
        )}

        {latest && (
          <>
            <div className="bia-stat-row">
              {METRICS.map((m) => (
                <div className="bia-stat" key={m.key}>
                  <span className="bia-stat-value">
                    {fmt(latest[m.key], m.decimals)}
                    {m.unit && <span className="bia-stat-unit">{m.unit}</span>}
                  </span>
                  {m.kgKey && <span className="bia-stat-kg">{fmt(latest[m.kgKey], 1)} kg</span>}
                  <span className="bia-stat-label">{m.label}</span>
                </div>
              ))}
            </div>
            <p className="hint" style={{ margin: '10px 0 0' }}>
              Latest measurement: {new Date(latest.date + 'T00:00:00').toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
              {latest.notes && ` — ${latest.notes}`}
            </p>
            {previous && (
              <div className="delta-row">
                {METRICS.map((m) => {
                  const delta = latest[m.key] - previous[m.key]
                  const kgDelta = m.kgKey ? latest[m.kgKey] - previous[m.kgKey] : null
                  return (
                    <span key={m.key} className="delta-chip">
                      {m.label} {fmtDelta(delta, m.decimals)}
                      {m.unit}
                      {kgDelta !== null && ` (${fmtDelta(kgDelta, 1)} kg)`} vs. previous
                    </span>
                  )
                })}
              </div>
            )}
          </>
        )}
      </section>

      {entries.length > 1 && (
        <section className="card">
          <h2>Trends</h2>
          <div className="bia-chart-grid">
            {METRICS.map((m) => {
              const diff = chartDiff[m.key] ?? false
              const diffToggle = {
                options: DIFF_TOGGLE_OPTIONS,
                value: diff ? 'diff' : 'value',
                onChange: (value: string) => setChartDiff((prev) => ({ ...prev, [m.key]: value === 'diff' })),
              }

              if (!m.kgKey) {
                return (
                  <BiaTrendChart
                    key={m.key}
                    entries={entries}
                    metric={m.key}
                    label={m.label}
                    unit={m.unit}
                    color={m.color}
                    diff={diff}
                    diffToggle={diffToggle}
                  />
                )
              }

              const unit = chartUnits[m.key] ?? 'pct'
              const kgKey = m.kgKey
              return (
                <BiaTrendChart
                  key={m.key}
                  entries={entries}
                  metric={unit === 'pct' ? m.key : kgKey}
                  label={m.label}
                  unit={unit === 'pct' ? m.unit : 'kg'}
                  color={m.color}
                  diff={diff}
                  unitToggle={{
                    options: UNIT_TOGGLE_OPTIONS,
                    value: unit,
                    onChange: (value) => setChartUnits((prev) => ({ ...prev, [m.key]: value as 'pct' | 'kg' })),
                  }}
                  diffToggle={diffToggle}
                />
              )
            })}
          </div>
        </section>
      )}

      {entries.length > 0 && (
        <section className="card">
          <h2>History</h2>
          <div className="bia-table-scroll">
            <table className="bia-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Weight</th>
                  <th>Body fat</th>
                  <th>Visceral fat</th>
                  <th>Muscle mass</th>
                  <th>BMI</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.date}>
                    <td>{new Date(e.date + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td>{fmt(e.weightKg, 1)} kg</td>
                    <td>
                      {fmt(e.bodyFatPct, 1)}% <span className="bia-table-kg">({fmt(e.bodyFatKg, 1)} kg)</span>
                    </td>
                    <td>{fmt(e.visceralFat, 0)}</td>
                    <td>
                      {fmt(e.muscleMassPct, 1)}% <span className="bia-table-kg">({fmt(e.muscleMassKg, 1)} kg)</span>
                    </td>
                    <td>{fmt(e.bmi, 1)}</td>
                    <td>{e.notes ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {showGlossary && <BiaGlossaryModal onClose={() => setShowGlossary(false)} />}
    </div>
  )
}
