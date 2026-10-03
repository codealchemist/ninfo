import { buildSheetGvizJsonUrlByName } from '../../utils/googleSheetUrl'
import i18n from '../../i18n'
import { CHECK_FIELDS, type AlimentoRow, type AlimentosTable, type CheckField, type SheetCell } from './types'

const SHEET_NAME = 'Alimentos'

interface GvizCell {
  v: string | number | boolean | null
  f?: string
}

interface GvizResponse {
  status: 'ok' | 'warning' | 'error'
  errors?: Array<{ message?: string; detailed_message?: string }>
  table?: {
    cols: Array<{ label?: string; pattern?: string }>
    rows: Array<{ c: Array<GvizCell | null> | null }>
  }
}

export function normalizeHeader(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

const HEADER_ALIASES: Record<string, CheckField | 'name' | 'category'> = {
  alimento: 'name',
  categoria: 'category',
  proteina: 'protein',
  carbs: 'carbs',
  carbohidratos: 'carbs',
  grasa: 'fat',
  fibra: 'fiber',
  'cal 100g': 'calories',
  calorias: 'calories',
  'omega 3': 'omega3',
  'omega 6': 'omega6',
  'omega 9': 'omega9',
  scfa: 'scfa',
  mcfa: 'mcfa',
  lcfa: 'lcfa',
  tox: 'tox',
}

/**
 * gviz types each column by its majority content, so a number typed as text in the sheet can
 * still arrive as a string. Accepts either decimal separator ("0,19" or "0.19"), and reads a
 * percentage ("19%") as the fraction a %-formatted cell actually stores (0.19).
 */
function toNumber(cell: SheetCell): number | null {
  if (cell === null || cell === '') return null
  if (typeof cell === 'number') return Number.isFinite(cell) ? cell : null
  const trimmed = cell.trim()
  const isPercent = trimmed.endsWith('%')
  const bare = trimmed.replace(/%$/, '').trim()
  const normalized = bare.includes(',') && !bare.includes('.') ? bare.replace(',', '.') : bare.replace(/,/g, '')
  const n = parseFloat(normalized)
  if (!Number.isFinite(n)) return null
  return isPercent ? n / 100 : n
}

function toCell(cell: GvizCell | null | undefined): SheetCell {
  const v = cell?.v
  if (v === null || v === undefined) return null
  if (typeof v === 'boolean') return String(v)
  return v
}

/** Parses the gviz JSONP-style body (`google.visualization.Query.setResponse({...});`). */
function parseGvizBody(text: string): GvizResponse {
  if (/^\s*<(!doctype|html)/i.test(text)) throw new Error(i18n.t('errors.signInPage'))
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end <= start) throw new Error(i18n.t('foodCheck.errors.badResponse'))
  return JSON.parse(text.slice(start, end + 1)) as GvizResponse
}

export function parseAlimentosGviz(text: string): AlimentosTable {
  const response = parseGvizBody(text)
  if (response.status === 'error' || !response.table) {
    const detail = response.errors?.[0]?.detailed_message ?? response.errors?.[0]?.message ?? ''
    throw new Error(`${i18n.t('foodCheck.errors.badResponse')} ${detail}`.trim())
  }

  let headers = response.table.cols.map((c) => c.label?.trim() ?? '')
  let dataRows = response.table.rows.map((r) => (r.c ?? []).map(toCell))
  let displayRows = response.table.rows.map((r) => (r.c ?? []).map((c) => c?.f ?? null))

  // headers=1 normally lands the header row in the column labels, but fall back to the first
  // data row if gviz still put it there.
  const hasNameHeader = (hs: string[]) => hs.some((h) => HEADER_ALIASES[normalizeHeader(h)] === 'name')
  if (!hasNameHeader(headers) && dataRows[0] && hasNameHeader(dataRows[0].map((c) => String(c ?? '')))) {
    headers = dataRows[0].map((c) => String(c ?? ''))
    dataRows = dataRows.slice(1)
    displayRows = displayRows.slice(1)
  }

  // A column is a percentage column if its number format says so, or if most of its numbers
  // are displayed with a "%" (gviz doesn't always report the pattern).
  const percentColumns = headers.map((_, col) => {
    if (response.table!.cols[col]?.pattern?.includes('%')) return true
    let numeric = 0
    let percent = 0
    dataRows.forEach((cells, i) => {
      if (typeof cells[col] !== 'number') return
      numeric++
      if (displayRows[i][col]?.trim().endsWith('%')) percent++
    })
    return numeric > 0 && percent / numeric > 0.5
  })

  const columns: Partial<Record<CheckField | 'name' | 'category', number>> = {}
  headers.forEach((h, i) => {
    const key = HEADER_ALIASES[normalizeHeader(h)]
    if (key && columns[key] === undefined) columns[key] = i
  })

  const nameCol = columns.name
  if (nameCol === undefined) throw new Error(i18n.t('foodCheck.errors.headerNotFound'))

  const rows: AlimentoRow[] = []
  dataRows.forEach((cells, i) => {
    const name = String(cells[nameCol] ?? '').trim()
    if (!name) return
    const values = {} as Record<CheckField, number | null>
    for (const field of CHECK_FIELDS) {
      const col = columns[field]
      values[field] = col === undefined ? null : toNumber(cells[col] ?? null)
    }
    // Pad short rows so every row lines up with the header when copied back.
    const padded = headers.map((_, c) => cells[c] ?? null)
    rows.push({
      rowNumber: i + 2,
      name,
      category: columns.category === undefined ? '' : String(cells[columns.category] ?? '').trim(),
      cells: padded,
      values,
    })
  })

  const { name: _name, category: _category, ...fieldColumns } = columns
  return { headers, columns: fieldColumns, percentColumns, rows }
}

/**
 * Reads the "Alimentos" tab from the same workbook as the linked Registro sheet, looked up by
 * name (same approach as BioimpedanciaSource). Always hits the network; the Food check page
 * keeps the result in foodRefCache and only calls this on a first visit or its Refresh button.
 */
export async function loadAlimentos(spreadsheetId: string, signal?: AbortSignal): Promise<AlimentosTable> {
  let text: string
  try {
    const res = await fetch(buildSheetGvizJsonUrlByName(spreadsheetId, SHEET_NAME), { signal })
    if (!res.ok) throw new Error(i18n.t('errors.httpError', { status: res.status }))
    text = await res.text()
  } catch (err) {
    if ((err as { name?: string }).name === 'AbortError') throw err
    throw new Error(`${i18n.t('foodCheck.errors.couldNotReach')} ${(err as Error).message}`)
  }
  return parseAlimentosGviz(text)
}
