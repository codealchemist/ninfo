import Papa from 'papaparse'
import {
  describeSheetContentForDiagnostics,
  makeYearInferrer,
  parseFechaCell,
  parseNumber,
} from '../../utils/sheetDates'

export interface BiaEntry {
  date: string // ISO yyyy-mm-dd
  weightKg: number
  bodyFatPct: number
  visceralFat: number
  muscleMassPct: number
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
 * Only the primary value of each metric is read (percentages for CGT/MM%, not their derived
 * kg columns) — the sheet's own Diff/"x mes" columns are trend helpers for the spreadsheet
 * itself and aren't parsed; deltas are computed from consecutive entries once loaded instead.
 */
export function parseBioimpedanciaCsv(csvText: string, today: Date = new Date()): BiaEntry[] {
  const { data } = Papa.parse<string[]>(csvText, { skipEmptyLines: false })
  const rows = data as string[][]

  const headerIdx = rows.findIndex((r) => r[0]?.trim() === 'Fecha' && r[2]?.trim() === 'Peso')
  if (headerIdx === -1) {
    throw new Error(
      'Could not find the Bioimpedancia header row (expected Fecha/Peso columns).' +
        describeSheetContentForDiagnostics(rows)
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
      visceralFat: parseNumber(row[9]),
      muscleMassPct: parseNumber(row[11]),
      bmi: parseNumber(row[15]),
      notes: row[17]?.trim() || null,
    })
  }

  return entries
}
