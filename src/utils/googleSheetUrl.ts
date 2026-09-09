export interface ParsedGoogleSheetUrl {
  spreadsheetId: string
  gid: string
}

/**
 * Pulls the spreadsheet ID and tab (gid) out of a standard Google Sheets share link, e.g.
 * "https://docs.google.com/spreadsheets/d/1AbC.../edit?usp=sharing#gid=123456789". The gid
 * is only present when the link was copied while a specific tab was open — if it's missing
 * we fall back to gid=0 (the first tab), which is very likely NOT the "Registro" tab in a
 * multi-tab workbook (see docs/nutrition-app-proposal.md §3.1 — Registro is typically the
 * 4th tab, not the 1st), so callers should tell users to open the Registro tab before copying.
 */
export function parseGoogleSheetUrl(url: string): ParsedGoogleSheetUrl | null {
  const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/)
  if (!idMatch) return null

  const gidMatch = url.match(/[#?&]gid=(\d+)/)

  return { spreadsheetId: idMatch[1], gid: gidMatch ? gidMatch[1] : '0' }
}

/**
 * The Google Visualization "query" endpoint — built specifically for embedding public sheet
 * data in third-party pages, and far more consistently reachable cross-origin from a browser
 * `fetch()` than the plain export endpoint below. Its CSV serialization can still differ
 * subtly from a literal "Download as CSV" though (date/number formatting in particular), so
 * it's tried first but not assumed to always match byte-for-byte.
 */
export function buildSheetGvizCsvUrl({ spreadsheetId, gid }: ParsedGoogleSheetUrl): string {
  const params = new URLSearchParams({ tqx: 'out:csv', gid })
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?${params.toString()}`
}

/**
 * The plain export endpoint — this is byte-for-byte what "File → Download → CSV" produces
 * for one tab, i.e. exactly the format the Registro parser was built and tested against.
 * Used as a fallback since it's historically less consistent cross-origin than gviz above.
 */
export function buildSheetExportCsvUrl({ spreadsheetId, gid }: ParsedGoogleSheetUrl): string {
  const params = new URLSearchParams({ format: 'csv', gid })
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?${params.toString()}`
}

/**
 * Builds a link back into this app that, when opened, imports the given Google Sheet link
 * automatically — the same "Import from a shared link" flow as pasting the URL into the
 * welcome screen's form. This is what the "Share" action hands out, so the dashboard for a
 * linked sheet can be forwarded to someone else without them needing the sheet URL in hand.
 */
export function buildShareableAppUrl(sheetUrl: string): string {
  const url = new URL('/', window.location.origin)
  url.searchParams.set('sheet', sheetUrl)
  return url.toString()
}
