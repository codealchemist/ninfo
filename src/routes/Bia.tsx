import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Info, LoaderCircle, RefreshCw, TriangleAlert } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { getSheetLink } from '../db/sheetLinkStorage'
import { parseGoogleSheetUrl } from '../utils/googleSheetUrl'
import { BioimpedanciaSource } from '../data/sources/BioimpedanciaSource'
import type { BiaEntry } from '../data/parsers/bioimpedanciaParser'
import BiaTrendChart from '../components/charts/BiaTrendChart'
import BiaGlossaryModal from '../components/common/BiaGlossaryModal'
import CopyImageButton from '../components/common/CopyImageButton'

type Status = 'idle' | 'loading' | 'ready' | 'error'

const METRICS: Array<{
  key: keyof Pick<BiaEntry, 'weightKg' | 'bodyFatPct' | 'visceralFat' | 'muscleMassPct' | 'bmi'>
  kgKey?: keyof Pick<BiaEntry, 'bodyFatKg' | 'muscleMassKg'>
  labelKey: 'weight' | 'bodyFat' | 'visceralFat' | 'muscleMass' | 'bmi'
  unit: string
  color: string
  decimals: number
}> = [
  { key: 'weightKg', labelKey: 'weight', unit: 'kg', color: '#577590', decimals: 1 },
  { key: 'bodyFatPct', kgKey: 'bodyFatKg', labelKey: 'bodyFat', unit: '%', color: '#e07a5f', decimals: 1 },
  { key: 'visceralFat', labelKey: 'visceralFat', unit: '', color: '#f2b134', decimals: 0 },
  { key: 'muscleMassPct', kgKey: 'muscleMassKg', labelKey: 'muscleMass', unit: '%', color: '#3d9970', decimals: 1 },
  { key: 'bmi', labelKey: 'bmi', unit: '', color: '#9b5de5', decimals: 1 },
]

function fmt(value: number, decimals: number): string {
  return value.toFixed(decimals)
}

function fmtDelta(value: number, decimals: number): string {
  return `${value >= 0 ? '+' : ''}${fmt(value, decimals)}`
}

export default function Bia() {
  const { t, i18n } = useTranslation()
  const sheetLinkId = useAppStore((s) => s.sheetLinkId)
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)
  const [entries, setEntries] = useState<BiaEntry[]>([])
  const [chartUnits, setChartUnits] = useState<Record<string, 'pct' | 'kg'>>({})
  const [chartDiff, setChartDiff] = useState<Record<string, boolean>>({})
  const [showGlossary, setShowGlossary] = useState(false)
  const trendsRef = useRef<HTMLDivElement>(null)

  const unitToggleOptions = [
    { value: 'pct', label: t('bia.unitToggle.pct') },
    { value: 'kg', label: t('bia.unitToggle.kg') },
  ]
  const diffToggleOptions = [
    { value: 'value', label: t('bia.diffToggle.value') },
    { value: 'diff', label: t('bia.diffToggle.diff') },
  ]

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
          <h2>{t('bia.title')}</h2>
          <p className="hint">
            {t('bia.needsLinkedSheet')}
            <Link to="/">{t('bia.importLink')}</Link>
            {t('bia.toSeeIt')}
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
          <h2>{t('bia.title')}</h2>
          <div className="bia-header-actions">
            <button className="link-button" onClick={() => setShowGlossary(true)} title={t('bia.termsTitle')}>
              <Info size={14} /> <span>{t('bia.termsButton')}</span>
            </button>
            <button className="link-button" onClick={load} disabled={status === 'loading'} title={t('bia.refreshTitle')}>
              <RefreshCw size={14} className={status === 'loading' ? 'spin' : undefined} /> <span>{t('bia.refresh')}</span>
            </button>
          </div>
        </div>

        {status === 'loading' && entries.length === 0 && (
          <p className="hint">
            <LoaderCircle size={14} className="spin" /> {t('bia.loading')}
          </p>
        )}

        {status === 'error' && (
          <p className="hint bia-error">
            <TriangleAlert size={14} /> {error}
          </p>
        )}

        {status === 'ready' && entries.length === 0 && (
          <p className="hint">{t('bia.noMeasurements')}</p>
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
                  <span className="bia-stat-label">{t(`bia.metrics.${m.labelKey}`)}</span>
                </div>
              ))}
            </div>
            <p className="hint" style={{ margin: '10px 0 0' }}>
              {t('bia.latestMeasurement', {
                date: new Date(latest.date + 'T00:00:00').toLocaleDateString(i18n.language, {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                }),
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
                      {t(`bia.metrics.${m.labelKey}`)} {fmtDelta(delta, m.decimals)}
                      {m.unit}
                      {kgDelta !== null && ` (${fmtDelta(kgDelta, 1)} kg)`} {t('bia.vsPrevious')}
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
          <div className="bia-header">
            <h2>{t('bia.trends')}</h2>
            <CopyImageButton
              targetRef={trendsRef}
              ariaLabel={t('bia.copyTrendsImageAria')}
              title={t('bia.copyTrendsImageTitle')}
            />
          </div>
          <div className="bia-chart-grid" ref={trendsRef}>
            {METRICS.map((m) => {
              const diff = chartDiff[m.key] ?? false
              const diffToggle = {
                options: diffToggleOptions,
                value: diff ? 'diff' : 'value',
                onChange: (value: string) => setChartDiff((prev) => ({ ...prev, [m.key]: value === 'diff' })),
              }
              const label = t(`bia.metrics.${m.labelKey}`)

              if (!m.kgKey) {
                return (
                  <BiaTrendChart
                    key={m.key}
                    entries={entries}
                    metric={m.key}
                    label={label}
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
                  label={label}
                  unit={unit === 'pct' ? m.unit : 'kg'}
                  color={m.color}
                  diff={diff}
                  unitToggle={{
                    options: unitToggleOptions,
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
          <h2>{t('bia.history')}</h2>
          <div className="bia-table-scroll">
            <table className="bia-table">
              <thead>
                <tr>
                  <th>{t('bia.table.date')}</th>
                  <th>{t('bia.table.weight')}</th>
                  <th>{t('bia.table.bodyFat')}</th>
                  <th>{t('bia.table.visceralFat')}</th>
                  <th>{t('bia.table.muscleMass')}</th>
                  <th>{t('bia.table.bmi')}</th>
                  <th>{t('bia.table.notes')}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((e) => (
                  <tr key={e.date}>
                    <td>
                      {new Date(e.date + 'T00:00:00').toLocaleDateString(i18n.language, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
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
