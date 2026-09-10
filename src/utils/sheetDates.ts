const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
}

export function parseNumber(raw: string | undefined): number {
  if (!raw) return 0
  const cleaned = raw.replace(/[^0-9.-]/g, '')
  const n = parseFloat(cleaned)
  return Number.isFinite(n) ? n : 0
}

/**
 * "Fecha" cells across these sheets only carry a weekday + month + day (e.g. "Thu, Feb 26"),
 * no year — see makeYearInferrer for how the year is recovered.
 */
export function parseFechaCell(raw: string): { monthAbbr: string; day: number } | null {
  const match = raw.match(/([A-Za-z]{3})\s+(\d{1,2})\s*$/)
  if (!match) return null
  return { monthAbbr: match[1], day: parseInt(match[2], 10) }
}

/**
 * We infer the year by walking rows in sheet order (oldest to newest) starting from `today`'s
 * year and rolling forward whenever the month goes backwards (Dec -> Jan). See
 * docs/nutrition-app-proposal.md §10, open question 3.
 */
export function makeYearInferrer(today: Date) {
  let year = today.getFullYear()
  let prevMonth = -1
  return (monthAbbr: string, day: number): string => {
    const month = MONTHS[monthAbbr.toLowerCase()] ?? 1
    if (prevMonth !== -1 && month < prevMonth) year += 1
    prevMonth = month
    const mm = String(month).padStart(2, '0')
    const dd = String(day).padStart(2, '0')
    return `${year}-${mm}-${dd}`
  }
}

/**
 * Surfaces what was actually parsed when a header search comes up empty, so a wrong-tab or
 * wrong-sheet mistake is diagnosable from the error message alone rather than requiring
 * back-and-forth (this is the #1 failure mode for the "import from a link" path, where a URL
 * with no gid silently points at the workbook's first tab instead of the intended one).
 */
export function describeSheetContentForDiagnostics(rows: string[][]): string {
  const nonEmptyRows = rows
    .map((r) => r.filter((cell) => cell?.trim()).map((cell) => cell.trim()))
    .filter((r) => r.length > 0)

  if (nonEmptyRows.length === 0) {
    return ' The file appears to be empty.'
  }

  const preview = nonEmptyRows
    .slice(0, 3)
    .map((r) => r.slice(0, 5).join(', '))
    .join(' | ')

  return ` Found instead: "${preview}" — check that this is the right tab.`
}
