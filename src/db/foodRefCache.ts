import type { AlimentosTable, RefFood } from '../data/foodCheck/types'

/**
 * Local cache of everything fetched from USDA FoodData Central, so a food is only ever
 * requested once per browser: `searches` maps a search query to its result list, `foods` maps
 * an fdcId to that food's nutrients. USDA reference data changes rarely enough that entries
 * never expire; the Food check page has a button to wipe the cache by hand.
 *
 * `results` keeps the Food check page's last state per spreadsheet (the Alimentos tab as read,
 * plus each food's resolved match), so reopening the page shows it instantly; the page's own
 * Refresh button replaces it.
 *
 * A separate database from snapshotDb so neither has to coordinate schema versions.
 */
const DB_NAME = 'ninfo-food-ref'
const SEARCHES = 'searches'
const FOODS = 'foods'
const RESULTS = 'results'

let dbPromise: Promise<IDBDatabase> | null = null

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 2)
      req.onupgradeneeded = () => {
        const db = req.result
        for (const store of [SEARCHES, FOODS, RESULTS]) {
          if (!db.objectStoreNames.contains(store)) db.createObjectStore(store)
        }
      }
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => {
        dbPromise = null
        reject(req.error)
      }
    })
  }
  return dbPromise
}

async function get<T>(store: string, key: IDBValidKey): Promise<T | null> {
  try {
    const db = await openDb()
    return await new Promise<T | null>((resolve, reject) => {
      const req = db.transaction(store, 'readonly').objectStore(store).get(key)
      req.onsuccess = () => resolve((req.result as T | undefined) ?? null)
      req.onerror = () => reject(req.error)
    })
  } catch {
    // IndexedDB unavailable (private mode, blocked storage) — behave as a cache miss.
    return null
  }
}

async function put(store: string, key: IDBValidKey, value: unknown): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(store, 'readwrite')
      tx.objectStore(store).put(value, key)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // Not cached this time; the next run just re-fetches.
  }
}

export const getCachedSearch = (key: string) => get<RefFood[]>(SEARCHES, key)
export const putCachedSearch = (key: string, foods: RefFood[]) => put(SEARCHES, key, foods)
export const getCachedFood = (fdcId: number) => get<RefFood>(FOODS, fdcId)
export const putCachedFood = (food: RefFood) => put(FOODS, food.fdcId, food)

export interface StoredFoodCheck<Match> {
  table: AlimentosTable
  matches: Record<string, Match>
  savedAt: string
}

export const getCachedResults = <Match>(spreadsheetId: string) => get<StoredFoodCheck<Match>>(RESULTS, spreadsheetId)
export const putCachedResults = <Match>(spreadsheetId: string, results: StoredFoodCheck<Match>) =>
  put(RESULTS, spreadsheetId, results)

export async function clearFoodRefCache(): Promise<void> {
  try {
    const db = await openDb()
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction([SEARCHES, FOODS], 'readwrite')
      tx.objectStore(SEARCHES).clear()
      tx.objectStore(FOODS).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch {
    // Nothing to clear.
  }
}
