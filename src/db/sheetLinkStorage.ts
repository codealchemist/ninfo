const STORAGE_KEY = 'nutriport:sheet-links'

export interface StoredSheetLink {
  id: string
  url: string
  name: string | null
  loadedAt: string
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function readAll(): StoredSheetLink[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(links: StoredSheetLink[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links))
  } catch {
    // localStorage unavailable (private browsing, disabled storage, etc.) — non-fatal.
  }
}

/** Most recently used first. */
export function listSheetLinks(): StoredSheetLink[] {
  return readAll().sort((a, b) => b.loadedAt.localeCompare(a.loadedAt))
}

export function getSheetLink(id: string): StoredSheetLink | null {
  return readAll().find((l) => l.id === id) ?? null
}

export function addSheetLink(url: string, name: string | null = null): StoredSheetLink {
  const link: StoredSheetLink = { id: makeId(), url, name, loadedAt: new Date().toISOString() }
  writeAll([...readAll(), link])
  return link
}

export function replaceSheetLink(id: string, url: string): void {
  const links = readAll()
  const idx = links.findIndex((l) => l.id === id)
  if (idx === -1) return
  links[idx] = { ...links[idx], url, loadedAt: new Date().toISOString() }
  writeAll(links)
}

export function touchSheetLink(id: string): void {
  const links = readAll()
  const idx = links.findIndex((l) => l.id === id)
  if (idx === -1) return
  links[idx] = { ...links[idx], loadedAt: new Date().toISOString() }
  writeAll(links)
}

export function renameSheetLink(id: string, name: string): void {
  const links = readAll()
  const idx = links.findIndex((l) => l.id === id)
  if (idx === -1) return
  links[idx] = { ...links[idx], name: name.trim() || null }
  writeAll(links)
}

export function removeSheetLink(id: string): void {
  writeAll(readAll().filter((l) => l.id !== id))
}

export function clearSheetLinks(): void {
  writeAll([])
}
