import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Check,
  CircleCheck,
  Copy,
  ExternalLink,
  LoaderCircle,
  Pencil,
  Play,
  RefreshCw,
  Square,
  TriangleAlert,
  Undo2,
} from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { useFoodCheckStore, type FoodCheckScope } from '../store/foodCheckStore'
import { getSheetLink } from '../db/sheetLinkStorage'
import { clearFoodRefCache, getCachedResults, putCachedResults } from '../db/foodRefCache'
import { parseGoogleSheetUrl } from '../utils/googleSheetUrl'
import { copyTextToClipboard } from '../utils/clipboard'
import { loadAlimentos } from '../data/foodCheck/alimentosSource'
import { buildFoodQuery } from '../data/foodCheck/foodQuery'
import {
  completeFood,
  fdcFoodUrl,
  getFood,
  searchFoods,
  toProfile,
  UsdaAuthError,
  UsdaRateLimitError,
} from '../data/foodCheck/usdaClient'
import {
  buildCopy,
  checkRow,
  columnLetter,
  copySpan,
  spanFixesAll,
  spanHasFixes,
  DEVIATION_THRESHOLD,
  pickClosest,
  rowSignature,
  type CopyScope,
  type RowCheck,
} from '../data/foodCheck/compare'
import { LIPID_FIELDS, type AlimentoRow, type AlimentosTable, type CheckField, type RefFood } from '../data/foodCheck/types'
import { LIPID_LABELS, type MealItem } from '../data/types'
import ToggleSwitch from '../components/common/ToggleSwitch'
import MatchPickerModal from '../components/foodCheck/MatchPickerModal'

type MatchState =
  | { kind: 'matched'; food: RefFood; auto: boolean }
  | { kind: 'unmatched'; query: string | null }
  | { kind: 'error'; message: string }
  | { kind: 'skipped' }

/**
 * Categories never looked up automatically: homemade/composite dishes ("Elaborado") have no
 * single USDA equivalent, so a search would only produce a misleading match. They can still
 * be matched by hand.
 */
const SKIPPED_CATEGORIES = new Set(['elaborado'])

type RowStatus = 'pending' | 'deviates' | 'fixed' | 'ok' | 'unmatched' | 'ignored'
type StatusFilter = 'deviates' | 'fixed' | 'ok' | 'unmatched' | 'ignored' | 'all'
type SortKey = 'sheet' | 'name' | 'impact' | 'intake'

interface ViewRow {
  row: AlimentoRow
  /** Grams of this food logged in Registro within the selected scope's window. */
  gramsEaten: number
  /** The window gramsEaten covers (null = the whole log). */
  scopeDays: number | null
  status: RowStatus
  match: MatchState | undefined
  check: RowCheck | null
}

/** Days of log each scope covers, counted back from the latest logged day (null = all time). */
const SCOPE_DAYS: Record<FoodCheckScope, number | null> = { '30': 30, '90': 90, all: null }

const foodKey = (name: string) => name.trim().toLowerCase()

/**
 * Grams eaten per food (keyed by foodKey) over the last `days` of the log, or all of it when
 * `days` is null. The window ends at the latest logged day rather than today, so a log that's a
 * few days behind still reflects what was actually eaten recently.
 */
function recentGramsByFood(meals: MealItem[], days: number | null): Map<string, number> {
  const totals = new Map<string, number>()
  if (meals.length === 0) return totals
  let startIso = ''
  if (days !== null) {
    const latest = meals.reduce((max, m) => (m.date > max ? m.date : max), meals[0].date)
    const start = new Date(latest + 'T00:00:00')
    start.setDate(start.getDate() - (days - 1))
    startIso = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}-${String(start.getDate()).padStart(2, '0')}`
  }
  for (const m of meals) {
    if (m.date < startIso) continue
    const key = foodKey(m.food)
    totals.set(key, (totals.get(key) ?? 0) + m.grams)
  }
  return totals
}

/** Parallel USDA requests while analyzing — enough to be quick, few enough to be polite. */
const CONCURRENCY = 3

const isLipid = (field: CheckField) => (LIPID_FIELDS as readonly string[]).includes(field)

/**
 * Shown the way the Alimentos tab displays them: macros as % (g per 100 g), calories as kcal
 * per 100 g, lipids as % of the fat. Macros arrive here already in g per 100 g; lipids as 0–1.
 */
function formatValue(field: CheckField, value: number | null): string {
  if (value === null) return '—'
  if (field === 'calories') return `${Math.round(value)} kcal`
  if (isLipid(field)) return `${(value * 100).toFixed(value < 0.1 ? 1 : 0)}%`
  return `${value.toFixed(value < 1 ? 2 : 1)}%`
}

/** Finds the food a row should be compared against: a hand-picked match, or USDA's closest hit. */
async function resolveRow(row: AlimentoRow, apiKey: string, signal: AbortSignal): Promise<MatchState | null> {
  const override = useFoodCheckStore.getState().overrides[row.name]
  if (override && 'ignored' in override) return null
  if (override) {
    const food = await completeFood(await getFood(override.fdcId, apiKey, signal), apiKey, signal)
    return { kind: 'matched', food, auto: false }
  }

  if (SKIPPED_CATEGORIES.has(row.category.trim().toLowerCase())) return { kind: 'skipped' }
  const query = buildFoodQuery(row.name)
  if (!query) return { kind: 'unmatched', query: null }
  const results = await searchFoods(query, apiKey, signal)
  const best = pickClosest(results, row)
  if (!best) return { kind: 'unmatched', query }
  return { kind: 'matched', food: await completeFood(best, apiKey, signal), auto: true }
}

export default function FoodCheck() {
  const { t, i18n } = useTranslation()
  const sheetLinkId = useAppStore((s) => s.sheetLinkId)
  const meals = useAppStore((s) => s.meals)
  const {
    apiKey,
    decimalSeparator,
    checkEmptyLipids,
    scope,
    overrides,
    fixed,
    setApiKey,
    setDecimalSeparator,
    setCheckEmptyLipids,
    setScope,
    setOverride,
    setFixed,
  } = useFoodCheckStore()

  const [table, setTable] = useState<AlimentosTable | null>(null)
  const [loadStatus, setLoadStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle')
  const [loadError, setLoadError] = useState<string | null>(null)
  const [matches, setMatches] = useState<Record<string, MatchState>>({})
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [running, setRunning] = useState(false)
  const [runError, setRunError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('deviates')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('sheet')
  const [sortDesc, setSortDesc] = useState(false)
  const [copied, setCopied] = useState<{ rowNumber: number; scope: CopyScope } | null>(null)
  const [pickerRow, setPickerRow] = useState<AlimentoRow | null>(null)
  const [apiKeyDraft, setApiKeyDraft] = useState(apiKey)
  const [cacheCleared, setCacheCleared] = useState(false)
  const matchesRef = useRef(matches)
  matchesRef.current = matches
  const runRef = useRef<AbortController | null>(null)

  const spreadsheetId = sheetLinkId
    ? parseGoogleSheetUrl(getSheetLink(sheetLinkId)?.url ?? '')?.spreadsheetId ?? null
    : null

  const stop = useCallback(() => {
    runRef.current?.abort()
    runRef.current = null
    setRunning(false)
  }, [])

  const analyze = useCallback(
    async (rows: AlimentoRow[]) => {
      stop()
      const controller = new AbortController()
      runRef.current = controller
      setRunError(null)

      // One lookup per distinct food name; anything already resolved this session is skipped
      // (and anything fetched in an earlier session comes straight from the local cache).
      const seen = new Set<string>()
      const queue = rows.filter((r) => {
        const kind = matchesRef.current[r.name]?.kind
        if (seen.has(r.name) || kind === 'matched' || kind === 'skipped') return false
        seen.add(r.name)
        return true
      })
      if (queue.length === 0) return
      setRunning(true)

      const apiKeyAtStart = useFoodCheckStore.getState().apiKey
      const worker = async () => {
        while (queue.length && !controller.signal.aborted) {
          const row = queue.shift()!
          let state: MatchState | null
          try {
            state = await resolveRow(row, apiKeyAtStart, controller.signal)
          } catch (err) {
            if (controller.signal.aborted) return
            if (err instanceof UsdaRateLimitError || err instanceof UsdaAuthError) {
              setRunError(err.message)
              controller.abort()
              return
            }
            state = { kind: 'error', message: (err as Error).message }
          }
          if (controller.signal.aborted) return
          if (state) setMatches((prev) => ({ ...prev, [row.name]: state! }))
        }
      }

      await Promise.all(Array.from({ length: CONCURRENCY }, worker))
      if (runRef.current === controller) {
        runRef.current = null
        setRunning(false)
      }
    },
    [stop]
  )

  /** Re-reads the Alimentos tab and re-checks every food in scope from scratch. */
  const refresh = useCallback(async () => {
    if (!spreadsheetId) return
    stop()
    setLoadStatus('loading')
    setLoadError(null)
    try {
      const result = await loadAlimentos(spreadsheetId)
      // Matches depend on the sheet's values (see pickClosest), so they're re-resolved against
      // the fresh rows — quick, since USDA responses still come from the local cache.
      matchesRef.current = {}
      setMatches({})
      setTable(result)
      setSavedAt(new Date().toISOString())
      setLoadStatus('ready')
    } catch (err) {
      setLoadError((err as Error).message)
      setLoadStatus('error')
    }
  }, [spreadsheetId, stop])

  // Opening the page shows the last saved results for this spreadsheet; only a first visit (or
  // the Refresh button) reads the tab from Google.
  useEffect(() => {
    if (!spreadsheetId) return
    let cancelled = false
    setLoadStatus('loading')
    getCachedResults<MatchState>(spreadsheetId).then((cached) => {
      if (cancelled) return
      // Results cached before percentage columns were read can't copy with the sheet's
      // formatting, so read the tab again once.
      if (!cached || !cached.table.percentColumns) {
        refresh()
        return
      }
      matchesRef.current = cached.matches
      setMatches(cached.matches)
      setTable(cached.table)
      setSavedAt(cached.savedAt)
      setLoadStatus('ready')
    })
    return () => {
      cancelled = true
      runRef.current?.abort()
    }
  }, [spreadsheetId, refresh])

  const gramsByFood = useMemo(() => recentGramsByFood(meals, SCOPE_DAYS[scope]), [meals, scope])

  const scopedRows = useMemo(
    () => (table ? table.rows.filter((r) => scope === 'all' || (gramsByFood.get(foodKey(r.name)) ?? 0) > 0) : []),
    [table, scope, gramsByFood]
  )

  // Look up whatever in scope hasn't been resolved yet — after a refresh, a restore from the
  // cache, or widening the scope.
  useEffect(() => {
    if (scopedRows.length) analyze(scopedRows)
  }, [scopedRows, analyze])

  // Save once a run settles, so the next visit starts from here.
  useEffect(() => {
    if (!spreadsheetId || !table || !savedAt || running) return
    const timer = setTimeout(() => putCachedResults(spreadsheetId, { table, matches, savedAt }), 300)
    return () => clearTimeout(timer)
  }, [spreadsheetId, table, matches, savedAt, running])

  const evaluate = useCallback(
    (row: AlimentoRow, food: RefFood) => checkRow(row, toProfile(food), table?.columns ?? {}, { checkEmptyLipids }),
    [table, checkEmptyLipids]
  )

  const viewRows: ViewRow[] = useMemo(() => {
    return scopedRows.map((row) => {
      const gramsEaten = gramsByFood.get(foodKey(row.name)) ?? 0
      const override = overrides[row.name]
      const match = matches[row.name]
      if (override && 'ignored' in override) return { row, gramsEaten, scopeDays: SCOPE_DAYS[scope], status: 'ignored', match, check: null }
      if (!match) return { row, gramsEaten, scopeDays: SCOPE_DAYS[scope], status: 'pending', match, check: null }
      if (match.kind === 'skipped') return { row, gramsEaten, scopeDays: SCOPE_DAYS[scope], status: 'ignored', match, check: null }
      if (match.kind !== 'matched') return { row, gramsEaten, scopeDays: SCOPE_DAYS[scope], status: 'unmatched', match, check: null }
      const check = evaluate(row, match.food)
      let status: RowStatus = 'ok'
      if (check.flagged.length) status = fixed[row.name] === rowSignature(row) ? 'fixed' : 'deviates'
      return { row, gramsEaten, scopeDays: SCOPE_DAYS[scope], status, match, check }
    })
  }, [scopedRows, matches, overrides, fixed, evaluate, gramsByFood, scope])

  const counts = useMemo(() => {
    const c: Record<RowStatus, number> = { pending: 0, deviates: 0, fixed: 0, ok: 0, unmatched: 0, ignored: 0 }
    for (const v of viewRows) c[v.status]++
    return c
  }, [viewRows])

  const categories = useMemo(
    () => Array.from(new Set(viewRows.map((v) => v.row.category).filter(Boolean))),
    [viewRows]
  )

  const visibleRows = useMemo(() => {
    const needle = search
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
    const filtered = viewRows.filter(
      (v) =>
        (statusFilter === 'all' || v.status === statusFilter) &&
        (!categoryFilter || v.row.category === categoryFilter) &&
        (!needle ||
          v.row.name
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .includes(needle))
    )
    const dir = sortDesc ? -1 : 1
    return [...filtered].sort((a, b) => {
      if (sortKey === 'name') return dir * a.row.name.localeCompare(b.row.name)
      if (sortKey === 'impact') {
        const diff = (a.check?.impact ?? -1) - (b.check?.impact ?? -1)
        if (diff) return dir * diff
      }
      if (sortKey === 'intake') {
        // Most-eaten first; among foods eaten equally (including never), the bigger deviation first.
        const diff = a.gramsEaten - b.gramsEaten || (a.check?.impact ?? -1) - (b.check?.impact ?? -1)
        if (diff) return dir * diff
      }
      return (sortKey === 'sheet' ? dir : 1) * (a.row.rowNumber - b.row.rowNumber)
    })
  }, [viewRows, statusFilter, categoryFilter, search, sortKey, sortDesc])

  const handleSortChange = (key: SortKey) => {
    setSortKey(key)
    // Impact and intake read most naturally biggest-first; name and sheet order read top-down.
    setSortDesc(key === 'impact' || key === 'intake')
  }

  const handleCopy = async (v: ViewRow, scope: CopyScope) => {
    const span = table && copySpan(table, scope)
    if (!table || !v.check || !span) return
    const ok = await copyTextToClipboard(buildCopy(table, v.row, v.check, decimalSeparator, span))
    if (!ok) return
    const entry = { rowNumber: v.row.rowNumber, scope }
    setCopied(entry)
    // Only a copy that carries every fix marks the food fixed — and only after the confirmation
    // shows, since that moves it out of the default filter.
    const fixesAll = spanFixesAll(table, v.check, span)
    setTimeout(() => {
      if (fixesAll) setFixed(v.row.name, rowSignature(v.row))
      setCopied((c) => (c === entry ? null : c))
    }, 1200)
  }

  const reresolve = async (row: AlimentoRow) => {
    const controller = new AbortController()
    try {
      const state = await resolveRow(row, apiKey, controller.signal)
      setMatches((prev) => {
        const next = { ...prev }
        if (state) next[row.name] = state
        else delete next[row.name]
        return next
      })
    } catch (err) {
      setMatches((prev) => ({ ...prev, [row.name]: { kind: 'error', message: (err as Error).message } }))
    }
  }

  const handlePick = async (row: AlimentoRow, food: RefFood) => {
    const complete = await completeFood(food, apiKey)
    setOverride(row.name, { fdcId: complete.fdcId, description: complete.description })
    setMatches((prev) => ({ ...prev, [row.name]: { kind: 'matched', food: complete, auto: false } }))
  }

  const handleUseAutomatic = (row: AlimentoRow) => {
    setOverride(row.name, null)
    reresolve(row)
  }

  const handleIgnore = (row: AlimentoRow) => setOverride(row.name, { ignored: true })

  const handleUnignore = (row: AlimentoRow) => {
    setOverride(row.name, null)
    reresolve(row)
  }

  const handleSaveApiKey = () => {
    setApiKey(apiKeyDraft)
    analyze(scopedRows)
  }

  const handleClearCache = async () => {
    await clearFoodRefCache()
    setCacheCleared(true)
    setTimeout(() => setCacheCleared(false), 1500)
  }

  if (!spreadsheetId) {
    return (
      <div className="page">
        <section className="card">
          <h2>{t('foodCheck.title')}</h2>
          <p className="hint">
            {t('foodCheck.needsLinkedSheet')}
            <Link to="/">{t('bia.importLink')}</Link>
            {t('bia.toSeeIt')}
          </p>
        </section>
      </div>
    )
  }

  const pickerMatch = pickerRow ? matches[pickerRow.name] : undefined
  const statusOptions: StatusFilter[] = ['deviates', 'fixed', 'ok', 'unmatched', 'ignored', 'all']
  const analyzed = scopedRows.length - counts.pending
  const scopeDays = SCOPE_DAYS[scope]

  return (
    <div className="page">
      <section className="card">
        <div className="bia-header">
          <h2>{t('foodCheck.title')}</h2>
          <div className="bia-header-actions">
            {running ? (
              <button className="link-button" onClick={stop} title={t('foodCheck.stopTitle')}>
                <Square size={14} /> <span>{t('foodCheck.stop')}</span>
              </button>
            ) : (
              table &&
              counts.pending + counts.unmatched > 0 && (
                <button className="link-button" onClick={() => analyze(scopedRows)} title={t('foodCheck.resumeTitle')}>
                  <Play size={14} /> <span>{t('foodCheck.resume')}</span>
                </button>
              )
            )}
            <button className="link-button" onClick={refresh} disabled={loadStatus === 'loading'} title={t('foodCheck.refreshTitle')}>
              <RefreshCw size={14} className={loadStatus === 'loading' ? 'spin' : undefined} />{' '}
              <span>{t('foodCheck.refresh')}</span>
            </button>
          </div>
        </div>
        <p className="hint food-check-intro">
          {t('foodCheck.intro', { threshold: Math.round(DEVIATION_THRESHOLD * 100) })}{' '}
          <a href="https://fdc.nal.usda.gov" target="_blank" rel="noreferrer">
            USDA FoodData Central
          </a>
          .
        </p>

        {loadStatus === 'loading' && !table && (
          <p className="hint">
            <LoaderCircle size={14} className="spin" /> {t('foodCheck.loading')}
          </p>
        )}
        {loadStatus === 'error' && (
          <p className="hint food-check-error">
            <TriangleAlert size={14} /> {loadError} {t('foodCheck.shareHint')}
          </p>
        )}

        {table && (
          <>
            <div className="food-check-scope">
              <span className="food-check-scope-label">{t('foodCheck.scope.label')}</span>
              <ToggleSwitch
                className="food-check-scope-toggle"
                toggle={{
                  options: [
                    { value: '30', label: t('foodCheck.scope.days', { days: 30 }) },
                    { value: '90', label: t('foodCheck.scope.days', { days: 90 }) },
                    { value: 'all', label: t('foodCheck.scope.all') },
                  ],
                  value: scope,
                  onChange: (v) => setScope(v as FoodCheckScope),
                }}
              />
              <span className="hint">
                {scopeDays === null
                  ? t('foodCheck.scope.countAll', { count: scopedRows.length })
                  : t('foodCheck.scope.countRecent', { count: scopedRows.length, total: table.rows.length })}
                {savedAt &&
                  ` · ${t('foodCheck.updated', {
                    date: new Date(savedAt).toLocaleString(i18n.language, { dateStyle: 'medium', timeStyle: 'short' }),
                  })}`}
              </span>
            </div>
            <div className="food-check-summary">
              <div className="food-check-left">
                <span className="food-check-left-count">{counts.deviates}</span>
                <span className="food-check-left-label">{t('foodCheck.leftToAdjust', { count: counts.deviates })}</span>
              </div>
              <div className="food-check-summary-chips">
                <span className="delta-chip">{t('foodCheck.counts.fixed', { count: counts.fixed })}</span>
                <span className="delta-chip">{t('foodCheck.counts.ok', { count: counts.ok })}</span>
                <span className="delta-chip">{t('foodCheck.counts.unmatched', { count: counts.unmatched })}</span>
                <span className="delta-chip">{t('foodCheck.counts.ignored', { count: counts.ignored })}</span>
              </div>
            </div>
            {(running || counts.pending > 0) && (
              <div className="food-check-progress">
                <div className="food-check-progress-bar">
                  <span style={{ width: `${(analyzed / Math.max(scopedRows.length, 1)) * 100}%` }} />
                </div>
                <span className="hint">
                  {running && <LoaderCircle size={12} className="spin" />}{' '}
                  {t('foodCheck.progress', { done: analyzed, total: scopedRows.length })}
                </span>
              </div>
            )}
          </>
        )}

        {runError && (
          <p className="hint food-check-error">
            <TriangleAlert size={14} /> {runError}
          </p>
        )}

        <details className="food-check-settings" open={!apiKey && !!runError}>
          <summary>{t('foodCheck.settings.title')}</summary>
          <div className="food-check-settings-body">
            <label className="food-check-field">
              <span>{t('foodCheck.settings.apiKey')}</span>
              <div className="food-check-inline">
                <input
                  type="text"
                  value={apiKeyDraft}
                  onChange={(e) => setApiKeyDraft(e.target.value)}
                  placeholder={__DEV_USDA_API_KEY__ ? t('foodCheck.settings.devKeyPlaceholder') : 'DEMO_KEY'}
                  spellCheck={false}
                  autoComplete="off"
                />
                <button className="food-check-button" onClick={handleSaveApiKey} disabled={apiKeyDraft.trim() === apiKey}>
                  {t('common.save')}
                </button>
              </div>
              <span className="hint">
                {t('foodCheck.settings.apiKeyHint')}{' '}
                <a href="https://fdc.nal.usda.gov/api-key-signup" target="_blank" rel="noreferrer">
                  {t('foodCheck.settings.apiKeySignup')}
                </a>
              </span>
            </label>
            <div className="food-check-field">
              <span>{t('foodCheck.settings.decimalSeparator')}</span>
              <ToggleSwitch
                toggle={{
                  options: [
                    { value: '.', label: '0.19' },
                    { value: ',', label: '0,19' },
                  ],
                  value: decimalSeparator,
                  onChange: (v) => setDecimalSeparator(v as '.' | ','),
                }}
              />
              <span className="hint">{t('foodCheck.settings.decimalSeparatorHint')}</span>
            </div>
            <label className="food-check-checkbox">
              <input type="checkbox" checked={checkEmptyLipids} onChange={(e) => setCheckEmptyLipids(e.target.checked)} />
              <span>{t('foodCheck.settings.checkEmptyLipids')}</span>
            </label>
            <button className="link-button" onClick={handleClearCache}>
              {cacheCleared ? <Check size={14} /> : <RefreshCw size={14} />}{' '}
              <span>{cacheCleared ? t('foodCheck.settings.cacheCleared') : t('foodCheck.settings.clearCache')}</span>
            </button>
            <p className="hint">{t('foodCheck.settings.method')}</p>
          </div>
        </details>
      </section>

      {table && (
        <section className="card">
          <div className="food-check-controls">
            <input
              type="search"
              className="food-check-search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('foodCheck.filters.search')}
              aria-label={t('foodCheck.filters.search')}
            />
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as StatusFilter)} aria-label={t('foodCheck.filters.status')}>
              {statusOptions.map((s) => (
                <option key={s} value={s}>
                  {t(`foodCheck.filters.statuses.${s}`)}
                  {s !== 'all' ? ` (${counts[s]})` : ''}
                </option>
              ))}
            </select>
            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} aria-label={t('foodCheck.filters.category')}>
              <option value="">{t('foodCheck.filters.allCategories')}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <div className="food-check-sort">
              <select value={sortKey} onChange={(e) => handleSortChange(e.target.value as SortKey)} aria-label={t('foodCheck.sort.label')}>
                <option value="sheet">{t('foodCheck.sort.sheet')}</option>
                <option value="name">{t('foodCheck.sort.name')}</option>
                <option value="impact">{t('foodCheck.sort.impact')}</option>
                <option value="intake">{t('foodCheck.sort.intake')}</option>
              </select>
              <button
                className="icon-button"
                onClick={() => setSortDesc((d) => !d)}
                aria-label={sortDesc ? t('foodCheck.sort.desc') : t('foodCheck.sort.asc')}
                title={sortDesc ? t('foodCheck.sort.desc') : t('foodCheck.sort.asc')}
              >
                {sortDesc ? <ArrowDownWideNarrow size={15} /> : <ArrowUpNarrowWide size={15} />}
              </button>
            </div>
          </div>
          <p className="hint food-check-paste-hint">{t('foodCheck.pasteHint')}</p>

          {visibleRows.length === 0 && <p className="hint">{t('foodCheck.empty')}</p>}

          <ul className="food-check-list">
            {visibleRows.map((v) => (
              <FoodCheckRow
                key={v.row.rowNumber}
                view={v}
                table={table}
                copiedScope={copied?.rowNumber === v.row.rowNumber ? copied.scope : null}
                onCopy={(scope) => handleCopy(v, scope)}
                onToggleFixed={() => setFixed(v.row.name, v.status === 'fixed' ? null : rowSignature(v.row))}
                onChangeMatch={() => setPickerRow(v.row)}
                onUnignore={() => handleUnignore(v.row)}
              />
            ))}
          </ul>
        </section>
      )}

      {pickerRow && (
        <MatchPickerModal
          row={pickerRow}
          currentFdcId={pickerMatch?.kind === 'matched' ? pickerMatch.food.fdcId : null}
          isOverridden={!!overrides[pickerRow.name]}
          apiKey={apiKey}
          evaluate={(food) => evaluate(pickerRow, food)}
          onPick={(food) => handlePick(pickerRow, food)}
          onUseAutomatic={() => handleUseAutomatic(pickerRow)}
          onIgnore={() => handleIgnore(pickerRow)}
          onClose={() => setPickerRow(null)}
        />
      )}
    </div>
  )
}

interface FoodCheckRowProps {
  view: ViewRow
  table: AlimentosTable
  copiedScope: CopyScope | null
  onCopy: (scope: CopyScope) => void
  onToggleFixed: () => void
  onChangeMatch: () => void
  onUnignore: () => void
}

const COPY_SCOPES: CopyScope[] = ['macros', 'lipids', 'row']

function FoodCheckRow({ view, table, copiedScope, onCopy, onToggleFixed, onChangeMatch, onUnignore }: FoodCheckRowProps) {
  const { t, i18n } = useTranslation()
  const { row, status, match, check, gramsEaten, scopeDays } = view
  const fieldLabel = (field: CheckField) =>
    isLipid(field) ? LIPID_LABELS[field as keyof typeof LIPID_LABELS] : t(`common.macros.${field}`)
  // Deviating rows show just what's off; rows within tolerance show everything that was compared.
  const shownFields = check ? (check.flagged.length ? check.flagged : check.fields) : []

  return (
    <li className={`food-check-row food-check-row--${status}`}>
      <div className="food-check-row-head">
        <span className="food-check-row-number" title={t('foodCheck.rowTitle')}>
          {row.rowNumber}
        </span>
        <div className="food-check-row-title">
          <strong>{row.name}</strong>
          {row.category && <span className="hint">{row.category}</span>}
          {gramsEaten > 0 && (
            <span className="hint" title={scopeDays === null ? t('foodCheck.eatenTitleAll') : t('foodCheck.eatenTitle', { days: scopeDays })}>
              · {t(scopeDays === null ? 'foodCheck.eatenAll' : 'foodCheck.eaten', { grams: Math.round(gramsEaten).toLocaleString(i18n.language) })}
            </span>
          )}
        </div>
        {check && check.flagged.length > 0 && (
          <span className="food-check-impact" title={t('foodCheck.impactTitle')}>
            {Math.round(check.impact * 100)}%
          </span>
        )}
        {status === 'ok' && (
          <span className="food-check-ok" title={t('foodCheck.filters.statuses.ok')}>
            <CircleCheck size={16} />
          </span>
        )}
      </div>

      <div className="food-check-match">
        {match?.kind === 'skipped' ? (
          <span className="hint">{t('foodCheck.skipped', { category: row.category })}</span>
        ) : status === 'ignored' ? (
          <span className="hint">{t('foodCheck.ignored')}</span>
        ) : match?.kind === 'matched' ? (
          <span className="hint">
            {match.auto ? t('foodCheck.autoMatch') : t('foodCheck.manualMatch')}{' '}
            <a href={fdcFoodUrl(match.food.fdcId)} target="_blank" rel="noreferrer">
              {match.food.description} <ExternalLink size={11} />
            </a>{' '}
            <span className="food-check-datatype">{match.food.dataType}</span>
          </span>
        ) : match?.kind === 'unmatched' ? (
          <span className="hint">
            {match.query ? t('foodCheck.noResults', { query: match.query }) : t('foodCheck.noQuery')}
          </span>
        ) : match?.kind === 'error' ? (
          <span className="hint food-check-error">{match.message}</span>
        ) : (
          <span className="hint">{t('foodCheck.pending')}</span>
        )}
        {status === 'ignored' && match?.kind !== 'skipped' ? (
          <button className="link-button" onClick={onUnignore}>
            <Undo2 size={13} /> <span>{t('foodCheck.unignore')}</span>
          </button>
        ) : (
          <button className="link-button" onClick={onChangeMatch}>
            <Pencil size={13} /> <span>{t('foodCheck.changeMatch')}</span>
          </button>
        )}
      </div>

      {shownFields.length > 0 && (
        <table className="food-check-fields">
          <thead>
            <tr>
              <th>{t('foodCheck.table.per100g')}</th>
              <th>{t('foodCheck.table.sheet')}</th>
              <th>{t('foodCheck.table.usda')}</th>
              <th>{t('foodCheck.table.off')}</th>
            </tr>
          </thead>
          <tbody>
            {shownFields.map((f) => (
              <tr key={f.field} className={f.flagged ? 'food-check-field--flagged' : undefined}>
                <td>{fieldLabel(f.field)}</td>
                <td>{formatValue(f.field, f.sheet)}</td>
                <td>{formatValue(f.field, f.ref)}</td>
                <td>
                  {(f.sheet ?? 0) >= f.ref ? '+' : '−'}
                  {Math.round(f.deviation * 100)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {check && check.flagged.length > 0 && (
        <div className="food-check-row-actions">
          <div className="food-check-copy-group">
            {COPY_SCOPES.map((scope) => {
              const span = copySpan(table, scope)
              // Macros/lipids only when that group has something to fix; the row always.
              if (!span || (scope !== 'row' && !spanHasFixes(table, check, span))) return null
              const title =
                t('foodCheck.pasteInto', {
                  header: table.headers[span.from] || columnLetter(span.from),
                  cell: `${columnLetter(span.from)}${row.rowNumber}`,
                }) + (spanFixesAll(table, check, span) ? ` ${t('foodCheck.marksFixed')}` : '')
              const isCopied = copiedScope === scope
              return (
                <button key={scope} className="food-check-button" onClick={() => onCopy(scope)} title={title}>
                  {isCopied ? <Check size={14} /> : <Copy size={14} />}{' '}
                  <span>{isCopied ? t('foodCheck.copied') : t(`foodCheck.copyScopes.${scope}`)}</span>
                </button>
              )
            })}
          </div>
          <button className="link-button" onClick={onToggleFixed}>
            {status === 'fixed' ? <Undo2 size={13} /> : <CircleCheck size={13} />}{' '}
            <span>{status === 'fixed' ? t('foodCheck.unmarkFixed') : t('foodCheck.markFixed')}</span>
          </button>
        </div>
      )}
    </li>
  )
}
