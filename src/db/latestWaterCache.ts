const STORAGE_KEY = 'ninfo:latest-water-cache'

interface CachedWater {
  date: string
  totalMl: number
}

interface CacheEntry extends CachedWater {
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
    // means the water ring waits for the network fetch next time instead of showing instantly.
  }
}

/**
 * Last known day's water total for a spreadsheet, persisted across sessions/navigations —
 * same idea as latestWeightCache, so the water ring can render immediately on the Today page
 * instead of waiting on a fresh "Líquido" tab fetch every time. See DaySummarySwiper.
 */
export function getCachedLatestWater(spreadsheetId: string): CachedWater | null {
  const entry = readAll().find((e) => e.spreadsheetId === spreadsheetId)
  return entry ? { date: entry.date, totalMl: entry.totalMl } : null
}

export function setCachedLatestWater(spreadsheetId: string, water: CachedWater): void {
  const entries = readAll().filter((e) => e.spreadsheetId !== spreadsheetId)
  entries.push({ spreadsheetId, ...water })
  writeAll(entries.slice(-MAX_ENTRIES))
}
