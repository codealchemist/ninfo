import Papa from 'papaparse'
import {
  describeSheetContentForDiagnostics,
  HeaderNotFoundError,
  makeYearInferrer,
  parseFechaCell,
  parseNumber,
} from '../../utils/sheetDates'
import i18n from '../../i18n'

export interface WeightEntry {
  date: string // ISO yyyy-mm-dd
  weightKg: number
  notes: string | null
}

/**
 * Parses a raw "Peso" tab CSV export — a plain manual weigh-in log, column layout fixed by
 * index (mirrors bioimpedanciaParser.ts): A Fecha | B Peso | C Notas.
 *
 * If this tab has a summary row above the real header (as the "Líquido" tab does), the gviz
 * endpoint's header auto-detection can blank the date/number-typed header labels ("Fecha",
 * "Peso") when serializing — see liquidoParser.ts for the full explanation. "Notas" alone
 * (a text-typed column, immune to that coercion) is accepted as a fallback signature so this
 * still finds the header row if that happens here too.
 */
export function parsePesoCsv(csvText: string, today: Date = new Date()): WeightEntry[] {
  const { data } = Papa.parse<string[]>(csvText, { skipEmptyLines: false })
  const rows = data as string[][]

  const headerIdx = rows.findIndex(
    (r) => (r[0]?.trim() === 'Fecha' && r[1]?.trim() === 'Peso') || r[2]?.trim() === 'Notas'
  )
  if (headerIdx === -1) {
    throw new HeaderNotFoundError(i18n.t('errors.pesoHeaderNotFound') + describeSheetContentForDiagnostics(rows))
  }

  const inferYear = makeYearInferrer(today)
  const entries: WeightEntry[] = []

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    const fechaRaw = row[0]?.trim()
    const pesoRaw = row[1]?.trim()
    if (!fechaRaw || !pesoRaw) continue // skip blank/summary rows without a measurement

    const parsedFecha = parseFechaCell(fechaRaw)
    if (!parsedFecha) continue
    const date = inferYear(parsedFecha.monthAbbr, parsedFecha.day)

    entries.push({
      date,
      weightKg: parseNumber(pesoRaw),
      notes: row[2]?.trim() || null,
    })
  }

  return entries
}
