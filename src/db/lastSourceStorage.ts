const STORAGE_KEY = 'ninfo:last-source'

/** Which data source the user last loaded, so a reload can reopen it without the Welcome step. */
export type LastSource =
  | { kind: 'demo' }
  | { kind: 'upload' } // the CSV itself lives in IndexedDB (see snapshotDb)
  | { kind: 'sheet-link'; id: string } // see sheetLinkStorage

export function getLastSource(): LastSource | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as LastSource
    if (parsed.kind === 'demo' || parsed.kind === 'upload') return parsed
    if (parsed.kind === 'sheet-link' && typeof parsed.id === 'string') return parsed
    return null
  } catch {
    return null
  }
}

export function setLastSource(source: LastSource): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(source))
  } catch {
    // localStorage unavailable (private browsing, disabled storage, etc.) — non-fatal, a reload
    // just goes through Welcome again.
  }
}

export function clearLastSource(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing to clear.
  }
}
