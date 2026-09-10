import Papa from 'papaparse'
import type { MacroTotals, MealItem } from '../types'
import {
  describeSheetContentForDiagnostics,
  makeYearInferrer,
  parseFechaCell,
  parseNumber,
} from '../../utils/sheetDates'

function parseHoraCell(raw: string): string {
  const trimmed = raw.trim()
  const match = trimmed.match(/^(\d{1,2}):(\d{2})/)
  if (!match) return '00:00'
  return `${match[1].padStart(2, '0')}:${match[2]}`
}

export interface ParsedRegistro {
  items: MealItem[]
  /** Daily macro goals, keyed by ISO date, forward-filled from the sparse goal columns. */
  goalsByDate: Record<string, MacroTotals>
}

/**
 * Parses a raw `Registro` tab CSV export (Google Sheets "Download as CSV" of that one tab).
 * Column layout is fixed (see docs/nutrition-app-proposal.md §2/§3.2) — parsed by index rather
 * than by header name, since the sheet reuses column names (Proteína/Carbs/... appear 3 times
 * for per-item, daily-total, and goal columns respectively).
 */
export function parseRegistroCsv(csvText: string, today: Date = new Date()): ParsedRegistro {
  const { data } = Papa.parse<string[]>(csvText, { skipEmptyLines: false })
  const rows = data as string[][]

  const headerIdx = rows.findIndex(
    (r) => r[1]?.trim() === 'Fecha' && r[2]?.trim() === 'Hora' && r[3]?.trim() === 'Alimento'
  )
  if (headerIdx === -1) {
    throw new Error(
      'Could not find the Registro header row (expected Fecha/Hora/Alimento columns).' +
        describeSheetContentForDiagnostics(rows)
    )
  }

  const inferYear = makeYearInferrer(today)
  const items: MealItem[] = []
  const goalsByDate: Record<string, MacroTotals> = {}
  let lastDate = ''

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i]
    const food = row[3]?.trim()
    if (!food) continue // skip trailing/blank/summary rows without a food item

    const fechaRaw = row[1]?.trim()
    let date = lastDate
    if (fechaRaw) {
      const parsed = parseFechaCell(fechaRaw)
      if (parsed) {
        date = inferYear(parsed.monthAbbr, parsed.day)
        lastDate = date
      }
    }
    if (!date) continue // no date context yet, can't place this row

    const time = parseHoraCell(row[2] ?? '')
    const ayuno = row[12]?.trim()

    items.push({
      id: `${date}T${time}-${i}`,
      date,
      time,
      food,
      quantity: parseNumber(row[4]),
      foodType: row[5]?.trim() || 'Otro',
      grams: parseNumber(row[6]),
      protein: parseNumber(row[7]),
      carbs: parseNumber(row[8]),
      fat: parseNumber(row[9]),
      fiber: parseNumber(row[10]),
      calories: parseNumber(row[11]),
      fastingSincePrev: ayuno ? ayuno : null,
      lipids: {
        omega3: parseNumber(row[39]),
        omega6: parseNumber(row[40]),
        omega9: parseNumber(row[41]),
        scfa: parseNumber(row[42]),
        mcfa: parseNumber(row[43]),
        lcfa: parseNumber(row[44]),
        tox: parseNumber(row[45]),
      },
    })

    // Goal columns (24-28) are only populated on a day's last row — capture whenever present.
    if (row[24]?.trim()) {
      goalsByDate[date] = {
        protein: parseNumber(row[24]),
        carbs: parseNumber(row[25]),
        fat: parseNumber(row[26]),
        fiber: parseNumber(row[27]),
        calories: parseNumber(row[28]),
      }
    }
  }

  forwardFillGoals(items, goalsByDate)

  return { items, goalsByDate }
}

/** Fills in goals for days that had no goal row, using the nearest earlier (or, failing that, later) day's goals. */
function forwardFillGoals(items: MealItem[], goalsByDate: Record<string, MacroTotals>) {
  const dates = Array.from(new Set(items.map((i) => i.date))).sort()
  let lastKnown: MacroTotals | null = null
  for (const date of dates) {
    if (goalsByDate[date]) {
      lastKnown = goalsByDate[date]
    } else if (lastKnown) {
      goalsByDate[date] = lastKnown
    }
  }
  if (!dates.some((d) => goalsByDate[d])) return
  let nextKnown: MacroTotals | null = null
  for (let i = dates.length - 1; i >= 0; i--) {
    const date = dates[i]
    if (goalsByDate[date]) {
      nextKnown = goalsByDate[date]
    } else if (nextKnown) {
      goalsByDate[date] = nextKnown
    }
  }
}
