import { toProfile } from './usdaClient'
import {
  CHECK_FIELDS,
  LIPID_FIELDS,
  MACRO_FIELDS,
  type AlimentoRow,
  type AlimentosTable,
  type CheckField,
  type RefFood,
  type RefProfile,
  type SheetCell,
} from './types'

/** A field is flagged when it's off from the reference by more than this fraction. */
export const DEVIATION_THRESHOLD = 0.02

interface FieldRule {
  /** Differences at or below this (in comparison units) are rounding noise, never flagged. */
  absTolerance: number
  /** Deviation is measured against max(|reference|, floor), so near-zero references don't explode. */
  floor: number
  /** Decimals used when writing a corrected value back in the sheet's own units. */
  decimals: number
  /** Sheet units → comparison units (macros are per-gram ratios in the sheet, per-100 g here). */
  scale: number
}

const MACRO_RULE: FieldRule = { absTolerance: 0.1, floor: 1, decimals: 4, scale: 100 }
const LIPID_RULE: FieldRule = { absTolerance: 0.01, floor: 0.05, decimals: 3, scale: 1 }

export const FIELD_RULES: Record<CheckField, FieldRule> = {
  protein: MACRO_RULE,
  carbs: MACRO_RULE,
  fat: MACRO_RULE,
  fiber: MACRO_RULE,
  calories: { absTolerance: 1, floor: 10, decimals: 0, scale: 1 },
  omega3: LIPID_RULE,
  omega6: LIPID_RULE,
  omega9: LIPID_RULE,
  scfa: LIPID_RULE,
  mcfa: LIPID_RULE,
  lcfa: LIPID_RULE,
  tox: LIPID_RULE,
}

const isLipid = (field: CheckField) => (LIPID_FIELDS as readonly string[]).includes(field)

export interface FieldCheck {
  field: CheckField
  /** Sheet value in comparison units (g or kcal per 100 g, or share of fat); null = empty cell. */
  sheet: number | null
  /** Reference value in comparison units. */
  ref: number
  /** |sheet − ref| relative to the reference (see FieldRule.floor). */
  deviation: number
  flagged: boolean
  /** The reference value in the sheet's own units, rounded — what the copy button writes. */
  proposed: number
}

export interface RowCheck {
  fields: FieldCheck[]
  flagged: FieldCheck[]
  /** The largest single-field deviation among the flagged fields (0 when nothing is flagged). */
  impact: number
}

export interface CheckOptions {
  /** Compare empty lipid cells too (as if they were 0) instead of skipping them. */
  checkEmptyLipids: boolean
}

function round(value: number, decimals: number): number {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function checkRow(
  row: AlimentoRow,
  profile: RefProfile,
  columns: AlimentosTable['columns'],
  options: CheckOptions
): RowCheck {
  const fields: FieldCheck[] = []

  for (const field of CHECK_FIELDS) {
    if (columns[field] === undefined) continue
    const rule = FIELD_RULES[field]
    const raw = row.values[field]
    let ref: number
    if (isLipid(field)) {
      if (!profile.lipids) continue
      if (raw === null && !options.checkEmptyLipids) continue
      ref = profile.lipids[field as keyof typeof profile.lipids]
    } else {
      ref = profile.per100g[field as keyof typeof profile.per100g]
    }

    const sheet = raw === null ? null : raw * rule.scale
    const diff = Math.abs((sheet ?? 0) - ref)
    const deviation = diff / Math.max(Math.abs(ref), rule.floor)
    const flagged = deviation > DEVIATION_THRESHOLD && diff > rule.absTolerance
    fields.push({ field, sheet, ref, deviation, flagged, proposed: round(ref / rule.scale, rule.decimals) })
  }

  const flagged = fields.filter((f) => f.flagged)
  const impact = flagged.reduce((max, f) => Math.max(max, f.deviation), 0)
  return { fields, flagged, impact }
}

/** How many of USDA's top search results are considered when auto-matching. */
const CANDIDATES_CONSIDERED = 6

/**
 * Picks the automatic match among USDA's top results: the one closest to the sheet's own
 * macros, with a small penalty for ranking lower in the search. This is what resolves "arroz
 * blanco" to cooked vs. dry rice, or "pollo" to meat-only vs. with skin, the way the sheet
 * meant it — any deviation left after that is a real one. The pick is shown in the UI and can
 * be swapped by hand.
 */
export function pickClosest(candidates: RefFood[], row: AlimentoRow): RefFood | null {
  let best: RefFood | null = null
  let bestScore = Infinity
  candidates.slice(0, CANDIDATES_CONSIDERED).forEach((food, rank) => {
    const ref = toProfile(food).per100g
    const kcal = row.values.calories ?? 0
    let score = Math.abs(ref.calories - kcal) / Math.max(ref.calories, kcal, 50) + rank * 0.05
    for (const field of ['protein', 'carbs', 'fat'] as const) {
      const sheet = (row.values[field] ?? 0) * 100
      score += Math.abs(ref[field] - sheet) / Math.max(ref[field], sheet, 5)
    }
    if (score < bestScore) {
      bestScore = score
      best = food
    }
  })
  return best
}

export type DecimalSeparator = '.' | ','

/**
 * A number as it should be pasted into the sheet. Percentage columns get "19.14%" rather than
 * "0.1914", which Google Sheets parses exactly like typing it: the same stored value, shown as
 * a percentage. toPrecision trims the float noise ×100 introduces (0.0123 × 100 = 1.2300000000000002).
 */
function formatNumber(value: number, separator: DecimalSeparator, percent: boolean): string {
  const text = percent ? `${Number((value * 100).toPrecision(12))}%` : String(value)
  return separator === ',' ? text.replace('.', ',') : text
}

function formatCell(cell: SheetCell, separator: DecimalSeparator, percent: boolean): string {
  if (cell === null) return ''
  if (typeof cell === 'number') return formatNumber(cell, separator, percent)
  return cell.replace(/[\t\r\n]+/g, ' ')
}

/** What a copy button carries over: the macro columns, the lipid columns, or the whole row. */
export type CopyScope = 'macros' | 'lipids' | 'row'

/** An inclusive run of sheet columns (0-based). */
export interface CopySpan {
  from: number
  to: number
}

/**
 * The columns a copy covers. Macros and lipids each span from their first to their last column
 * in the sheet's own order (Proteína…Cal 100g, Omega 3…Tox.), including anything that happens
 * to sit in between, so the copied cells always line up with the sheet when pasted. null when
 * the sheet has none of that group's columns.
 */
export function copySpan(table: AlimentosTable, scope: CopyScope): CopySpan | null {
  if (scope === 'row') return { from: 0, to: table.headers.length - 1 }
  const fields = scope === 'macros' ? MACRO_FIELDS : LIPID_FIELDS
  const cols = fields.map((f) => table.columns[f]).filter((c): c is number => c !== undefined)
  return cols.length ? { from: Math.min(...cols), to: Math.max(...cols) } : null
}

function fixesByColumn(table: AlimentosTable, check: RowCheck): Map<number, number> {
  const fixes = new Map<number, number>()
  for (const f of check.flagged) {
    const col = table.columns[f.field]
    if (col !== undefined) fixes.set(col, f.proposed)
  }
  return fixes
}

/** Whether a span includes every flagged field — i.e. pasting it fixes the whole row. */
export function spanFixesAll(table: AlimentosTable, check: RowCheck, span: CopySpan): boolean {
  return Array.from(fixesByColumn(table, check).keys()).every((col) => col >= span.from && col <= span.to)
}

/** Whether a span includes at least one flagged field — otherwise copying it changes nothing. */
export function spanHasFixes(table: AlimentosTable, check: RowCheck, span: CopySpan): boolean {
  return Array.from(fixesByColumn(table, check).keys()).some((col) => col >= span.from && col <= span.to)
}

/**
 * The span's cells as tab-separated values in the sheet's own column order, with every flagged
 * field replaced by the reference value and everything else copied as-is (percentage columns
 * written as percentages) — pasting it over the span's first cell in Google Sheets applies the
 * fixes in one go.
 */
export function buildCopy(
  table: AlimentosTable,
  row: AlimentoRow,
  check: RowCheck,
  separator: DecimalSeparator,
  span: CopySpan
): string {
  const fixes = fixesByColumn(table, check)
  return row.cells
    .slice(span.from, span.to + 1)
    .map((cell, offset) => {
      const col = span.from + offset
      const percent = table.percentColumns?.[col] ?? false
      const fix = fixes.get(col)
      return fix === undefined ? formatCell(cell, separator, percent) : formatNumber(fix, separator, percent)
    })
    .join('\t')
}

/** Spreadsheet column letter for a 0-based index: 0 → A, 25 → Z, 26 → AA. */
export function columnLetter(index: number): string {
  let letter = ''
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    letter = String.fromCharCode(65 + ((n - 1) % 26)) + letter
  }
  return letter
}

/** Identifies the sheet values a "marked as fixed" flag was set against. */
export function rowSignature(row: AlimentoRow): string {
  return JSON.stringify(CHECK_FIELDS.map((f) => row.values[f]))
}
