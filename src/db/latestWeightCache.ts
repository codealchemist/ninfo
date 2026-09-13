const STORAGE_KEY = 'ninfo:latest-weight-cache'

interface CachedWeight {
  date: string
  weightKg: number
}

interface CacheEntry extends CachedWeight {
  spreadsheetId: string
}

// Small — one entry per spreadsheet is all this is for, but capped in case a user cycles
// through many linked sheets over time.
const MAX_ENTRIES = 20

function readAll(): CacheEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(entries: CacheEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // localStorage unavailable (private browsing, disabled storage, etc.) — non-fatal, it just
    // means the water goal waits for the network fetch next time instead of showing instantly.
  }
}

/**
 * Last known weight for a spreadsheet, persisted across sessions/navigations so pages that need
 * a quick water-intake goal (35ml/kg) can render it immediately instead of waiting on a fresh
 * "Peso" tab fetch every time — see DaySummarySwiper.
 */
export function getCachedLatestWeight(spreadsheetId: string): CachedWeight | null {
  const entry = readAll().find((e) => e.spreadsheetId === spreadsheetId)
  return entry ? { date: entry.date, weightKg: entry.weightKg } : null
}

export function setCachedLatestWeight(spreadsheetId: string, weight: CachedWeight): void {
  const entries = readAll().filter((e) => e.spreadsheetId !== spreadsheetId)
  entries.push({ spreadsheetId, ...weight })
  writeAll(entries.slice(-MAX_ENTRIES))
}
