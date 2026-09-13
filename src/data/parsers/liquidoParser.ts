import Papa from 'papaparse'
import {
  describeSheetContentForDiagnostics,
  HeaderNotFoundError,
  makeYearInferrer,
  parseFechaCell,
  parseNumber,
} from '../../utils/sheetDates'
import i18n from '../../i18n'

export interface LiquidEntry {
  date: string // ISO yyyy-mm-dd
  startTime: string | null
  endTime: string | null
  duration: string | null
  liquidType: string
  amountMl: number
  realAmountMl: number
  /** The sheet's own "Total diario" rollup (column I) — present only on whichever row the
   * sheet's formula places it for a given date (typically its last row), null everywhere else.
   * Preferred over summing entries client-side when available — see liquidUtils.dailyTotalMlByDate. */
  dailyTotalMl: number | null
  notes: string | null
}

/**
 * Parses a raw "Líquido" tab CSV export — a per-drink log, column layout fixed by index
 * (mirrors bioimpedanciaParser.ts):
 *
 *   A Fecha | B Hora inicio | C Hora fin | D Duración | E Líquido | F Cantidad |
 *   G Cantidad real | H ml/h | I Total diario | J Notes
 *
 * The sheet's own "ml/h" column is a trend helper for the spreadsheet itself and isn't parsed.
 *
 * This tab has a summary row above the real header (Tiempo/ML-per-hora/TOTAL HOY), which
 * throws off the gviz endpoint's own header auto-detection (see LiquidoSource — it's fetched
 * by name, so there's no gid to fall back to the plain export endpoint the way Registro does):
 * gviz picks that summary row as the canonical header for per-column type inference, then
 * coerces every other row's cells to each column's inferred type for serialization — the real
 * header row's date/time/number-column labels don't fit those types and come back blank,
 * leaving only genuinely text-typed columns (Líquido, Notes) intact. So the header row is
 * detected via the "Líquido" label alone rather than requiring "Fecha" to survive too.
 */
export function parseLiquidoCsv(csvText: string, today: Date = new Date()): LiquidEntry[] {
  const { data } = Papa.parse<string[]>(csvText, { skipEmptyLines: false })
  const rows = data as string[][]

  const headerIdx = rows.findIndex((r) => r[4]?.trim() === 'Líquido')
  if (headerIdx === -1) {
    throw new HeaderNotFoundError(i18n.t('errors.liquidoHeaderNotFound') + describeSheetContentForDiagnostics(rows))
  }

  const inferYear = makeYearInferrer(today)
  const entries: LiquidEntry[] = []

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    const fechaRaw = row[0]?.trim()
    const liquidType = row[4]?.trim()
    if (!fechaRaw || !liquidType) continue // skip blank/summary rows without an entry

    const parsedFecha = parseFechaCell(fechaRaw)
    if (!parsedFecha) continue
    const date = inferYear(parsedFecha.monthAbbr, parsedFecha.day)

    const dailyTotalRaw = row[8]?.trim()

    entries.push({
      date,
      startTime: row[1]?.trim() || null,
      endTime: row[2]?.trim() || null,
      duration: row[3]?.trim() || null,
      liquidType,
      amountMl: parseNumber(row[5]),
      realAmountMl: parseNumber(row[6]),
      dailyTotalMl: dailyTotalRaw ? parseNumber(dailyTotalRaw) : null,
      notes: row[9]?.trim() || null,
    })
  }

  return entries
}
