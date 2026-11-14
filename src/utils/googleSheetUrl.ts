export interface ParsedGoogleSheetUrl {
  spreadsheetId: string
  /** The tab the link was copied from; null when the link names none (see GoogleSheetLinkSource,
   * which then looks the Registro tab up by name). */
  gid: string | null
}

// Where a spreadsheet ID can appear, across the links people actually copy:
// - Sheets in a browser or the Sheets app: docs.google.com/spreadsheets/d/<id>/edit#gid=…
//   (also with an account segment, /spreadsheets/u/0/d/<id>)
// - Drive app "Copy link": drive.google.com/file/d/<id>/view?usp=drivesdk, or the older
//   drive.google.com/open?id=<id> (and …/uc?id=<id>)
const ID_PATTERNS = [
  /\/spreadsheets\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]{20,})/,
  /drive\.google\.com\/(?:u\/\d+\/)?file\/d\/([a-zA-Z0-9_-]{20,})/,
  /drive\.google\.com\/[^#]*[?&]id=([a-zA-Z0-9_-]{20,})/,
]

/**
 * Pulls the spreadsheet ID and, if present, the tab (gid) out of a Google Sheets or Drive link,
 * e.g. "https://docs.google.com/spreadsheets/d/1AbC.../edit#gid=123456789". The gid is only
 * there when the link was copied while a specific tab was open in Sheets — links from the
 * Drive app never have one.
 */
export function parseGoogleSheetUrl(url: string): ParsedGoogleSheetUrl | null {
  const trimmed = url.trim()
  let spreadsheetId: string | null = null
  for (const pattern of ID_PATTERNS) {
    const match = trimmed.match(pattern)
    if (match) {
      spreadsheetId = match[1]
      break
    }
  }
  if (!spreadsheetId) return null

  const gidMatch = trimmed.match(/[#?&]gid=(\d+)/)
  return { spreadsheetId, gid: gidMatch ? gidMatch[1] : null }
}

/**
 * The Google Visualization "query" endpoint — built specifically for embedding public sheet
 * data in third-party pages, and far more consistently reachable cross-origin from a browser
 * `fetch()` than the plain export endpoint below. Its CSV serialization can still differ
 * subtly from a literal "Download as CSV" though (date/number formatting in particular), so
 * it's tried first but not assumed to always match byte-for-byte.
 */
export function buildSheetGvizCsvUrl({ spreadsheetId, gid }: ParsedGoogleSheetUrl): string {
  const params = new URLSearchParams({ tqx: 'out:csv', gid: gid ?? '0' })
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?${params.toString()}`
}

/**
 * The plain export endpoint — this is byte-for-byte what "File → Download → CSV" produces
 * for one tab, i.e. exactly the format the Registro parser was built and tested against.
 * Used as a fallback since it's historically less consistent cross-origin than gviz above.
 */
export function buildSheetExportCsvUrl({ spreadsheetId, gid }: ParsedGoogleSheetUrl): string {
  const params = new URLSearchParams({ format: 'csv', gid: gid ?? '0' })
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?${params.toString()}`
}

/**
 * Same gviz endpoint as buildSheetGvizCsvUrl, but addressed by tab name instead of gid. Used
 * for tabs (like "Bioimpedancia") that live alongside the main linked sheet — the workbook's
 * spreadsheetId is already known from the Registro link, but each copy of the workbook assigns
 * its own gids, so looking the tab up by name is the only way that generalizes across copies.
 */
export function buildSheetGvizCsvUrlByName(spreadsheetId: string, sheetName: string): string {
  const params = new URLSearchParams({ tqx: 'out:csv', sheet: sheetName })
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?${params.toString()}`
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

/**
 * JSON flavor of buildSheetGvizCsvUrlByName. The CSV output only carries each cell's
 * *formatted* text, which rounds to whatever decimals the column displays — the JSON response
 * carries the raw value next to it, which is what the Alimentos check needs to compare (and
 * copy back) per-gram ratios like 0.0123 exactly. `headers=1` pins row 1 as the header row
 * rather than letting gviz guess.
 */
export function buildSheetGvizJsonUrlByName(spreadsheetId: string, sheetName: string): string {
  const params = new URLSearchParams({ tqx: 'out:json', sheet: sheetName, headers: '1' })
  return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/gviz/tq?${params.toString()}`
}
