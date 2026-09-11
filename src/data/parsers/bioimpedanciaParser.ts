import Papa from 'papaparse'
import {
  describeSheetContentForDiagnostics,
  HeaderNotFoundError,
  makeYearInferrer,
  parseFechaCell,
  parseNumber,
} from '../../utils/sheetDates'
import i18n from '../../i18n'

export interface BiaEntry {
  date: string // ISO yyyy-mm-dd
  weightKg: number
  bodyFatPct: number
  bodyFatKg: number
  visceralFat: number
  muscleMassPct: number
  muscleMassKg: number
  bmi: number
  notes: string | null
}

/**
 * Parses a raw `Bioimpedancia` tab CSV export. Column layout is fixed, parsed by index rather
 * than by header name (mirrors registroParser.ts) — confirmed against a live export:
 *
 *   A Fecha | B Días | C Peso | D Diff | E x mes | F CGT% | G CGT(kg) | H Diff | I Diff(kg) |
 *   J GV | K Diff | L MM% | M MM(kg) | N Diff | O Diff(kg) | P IMC | Q Diff | R Notes
 *
 * CGT and MM% each carry both a percentage and a derived kg value (their weight-relative
 * absolute mass) — both are read. The sheet's own Diff/"x mes" columns are trend helpers for
 * the spreadsheet itself and aren't parsed; deltas are computed from consecutive entries once
 * loaded instead.
 */
export function parseBioimpedanciaCsv(csvText: string, today: Date = new Date()): BiaEntry[] {
  const { data } = Papa.parse<string[]>(csvText, { skipEmptyLines: false })
  const rows = data as string[][]

  const headerIdx = rows.findIndex((r) => r[0]?.trim() === 'Fecha' && r[2]?.trim() === 'Peso')
  if (headerIdx === -1) {
    throw new HeaderNotFoundError(
      i18n.t('errors.bioimpedanciaHeaderNotFound') + describeSheetContentForDiagnostics(rows)
    )
  }

  const inferYear = makeYearInferrer(today)
  const entries: BiaEntry[] = []

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    const fechaRaw = row[0]?.trim()
    const pesoRaw = row[2]?.trim()
    if (!fechaRaw || !pesoRaw) continue // skip blank/summary rows without a measurement

    const parsedFecha = parseFechaCell(fechaRaw)
    if (!parsedFecha) continue
    const date = inferYear(parsedFecha.monthAbbr, parsedFecha.day)

    entries.push({
      date,
      weightKg: parseNumber(pesoRaw),
      bodyFatPct: parseNumber(row[5]),
      bodyFatKg: parseNumber(row[6]),
      visceralFat: parseNumber(row[9]),
      muscleMassPct: parseNumber(row[11]),
      muscleMassKg: parseNumber(row[12]),
      bmi: parseNumber(row[15]),
      notes: row[17]?.trim() || null,
    })
  }

  return entries
}
