import { create } from 'zustand'
import { clearSnapshot, loadSnapshot, saveSnapshot } from '../db/snapshotDb'
import {
  addSheetLink,
  clearSheetLinks,
  getSheetLink,
  replaceSheetLink,
  touchSheetLink,
} from '../db/sheetLinkStorage'
import { DemoSource } from '../data/sources/DemoSource'
import { UploadedCsvSource } from '../data/sources/UploadedCsvSource'
import { GoogleSheetLinkSource } from '../data/sources/GoogleSheetLinkSource'
import { sortedDates } from '../data/aggregate/dailyTotals'
import type { DatasetMeta, FoodCatalogItem, MacroKey, MacroTotals, MealItem } from '../data/types'
import { MACRO_KEYS } from '../data/types'

type Status = 'idle' | 'loading' | 'ready' | 'error'

interface AppState {
  status: Status
  error: string | null
  meta: DatasetMeta | null
  meals: MealItem[]
  goalsByDate: Record<string, MacroTotals>
  foodCatalog: FoodCatalogItem[]
  dates: string[]
  selectedDate: string | null
  visibleMacros: Set<MacroKey>
  sheetLinkId: string | null
  loadController: AbortController | null

  loadDemo: () => Promise<void>
  loadUploadedFile: (file: File) => Promise<void>
  restoreUploadedSnapshot: () => Promise<boolean>
  addSheetLinkAndLoad: (url: string, name?: string | null) => Promise<boolean>
  replaceSheetLinkAndLoad: (id: string, url: string) => Promise<boolean>
  continueWithSavedLink: (id: string) => Promise<boolean>
  refreshSheetLink: () => Promise<void>
  cancelLoad: () => void
  reset: () => Promise<void>

  setSelectedDate: (date: string) => void
  stepDate: (direction: 1 | -1) => void
  toggleMacro: (macro: MacroKey) => void
}

export const useAppStore = create<AppState>((set, get) => ({
  status: 'idle',
  error: null,
  meta: null,
  meals: [],
  goalsByDate: {},
  foodCatalog: [],
  dates: [],
  selectedDate: null,
  visibleMacros: new Set(MACRO_KEYS),
  sheetLinkId: null,
  loadController: null,

  loadDemo: async () => {
    const controller = beginLoad(set)
    try {
      const result = await new DemoSource().load(controller.signal)
      if (!isCurrent(get, controller)) return
      applyResult(set, result)
    } catch (err) {
      failLoad(get, set, controller, err)
    } finally {
      endLoad(get, set, controller)
    }
  },

  loadUploadedFile: async (file: File) => {
    const controller = beginLoad(set)
    try {
      const csvText = await file.text()
      const uploadedAt = new Date().toISOString()
      const result = await new UploadedCsvSource(csvText, file.name, uploadedAt).load(
        controller.signal
      )
      if (!isCurrent(get, controller)) return
      applyResult(set, result)
      try {
        await saveSnapshot({ csvText, fileName: file.name, uploadedAt })
      } catch {
        // IndexedDB unavailable — the session still works, it just won't survive a reload.
      }
    } catch (err) {
      failLoad(get, set, controller, err)
    } finally {
      endLoad(get, set, controller)
    }
  },

  restoreUploadedSnapshot: async () => {
    const snapshot = await loadSnapshot()
    if (!snapshot) return false
    const controller = beginLoad(set)
    try {
      const result = await new UploadedCsvSource(
        snapshot.csvText,
        snapshot.fileName,
        snapshot.uploadedAt
      ).load(controller.signal)
      if (!isCurrent(get, controller)) return false
      applyResult(set, result)
      return true
    } catch (err) {
      failLoad(get, set, controller, err)
      return false
    } finally {
      endLoad(get, set, controller)
    }
  },

  addSheetLinkAndLoad: async (url: string, name: string | null = null) => {
    const controller = beginLoad(set)
    try {
      const result = await new GoogleSheetLinkSource(url).load(controller.signal)
      if (!isCurrent(get, controller)) return false
      applyResult(set, result)
      const saved = addSheetLink(url, name)
      set({ sheetLinkId: saved.id })
      return true
    } catch (err) {
      failLoad(get, set, controller, err)
      return false
    } finally {
      endLoad(get, set, controller)
    }
  },

  replaceSheetLinkAndLoad: async (id: string, url: string) => {
    const controller = beginLoad(set)
    try {
      const result = await new GoogleSheetLinkSource(url).load(controller.signal)
      if (!isCurrent(get, controller)) return false
      applyResult(set, result)
      replaceSheetLink(id, url)
      set({ sheetLinkId: id })
      return true
    } catch (err) {
      failLoad(get, set, controller, err)
      return false
    } finally {
      endLoad(get, set, controller)
    }
  },

  continueWithSavedLink: async (id: string) => {
    const link = getSheetLink(id)
    if (!link) return false
    const controller = beginLoad(set)
    try {
      const result = await new GoogleSheetLinkSource(link.url).load(controller.signal)
      if (!isCurrent(get, controller)) return false
      applyResult(set, result)
      touchSheetLink(id)
      set({ sheetLinkId: id })
      return true
    } catch (err) {
      failLoad(get, set, controller, err)
      return false
    } finally {
      endLoad(get, set, controller)
    }
  },

  refreshSheetLink: async () => {
    const id = get().sheetLinkId
    if (!id) return
    await get().continueWithSavedLink(id)
  },

  cancelLoad: () => {
    get().loadController?.abort()
    set({ status: 'idle', error: null, loadController: null })
  },

  reset: async () => {
    try {
      await clearSnapshot()
    } catch {
      // IndexedDB unavailable — nothing to clear.
    }
    clearSheetLinks()
    set({
      status: 'idle',
      error: null,
      meta: null,
      meals: [],
      goalsByDate: {},
      foodCatalog: [],
      dates: [],
      selectedDate: null,
      sheetLinkId: null,
      loadController: null,
    })
  },

  setSelectedDate: (date) => set({ selectedDate: date }),

  stepDate: (direction) => {
    const { dates, selectedDate } = get()
    if (!selectedDate || dates.length === 0) return
    const idx = dates.indexOf(selectedDate)
    const nextIdx = idx + direction
    if (nextIdx < 0 || nextIdx >= dates.length) return
    set({ selectedDate: dates[nextIdx] })
  },

  toggleMacro: (macro) => {
    const next = new Set(get().visibleMacros)
    if (next.has(macro)) next.delete(macro)
    else next.add(macro)
    set({ visibleMacros: next })
  },
}))

type Setter = (partial: Partial<AppState>) => void
type Getter = () => AppState

// Every load* action races a fresh AbortController against user cancellation and
// against a newer load being kicked off before the old one settles. `isCurrent`
// is the guard: if the controller in state has moved on, this call's result is
// stale and must not overwrite whatever happened in the meantime.
function beginLoad(set: Setter): AbortController {
  const controller = new AbortController()
  set({ status: 'loading', error: null, loadController: controller })
  return controller
}

function isCurrent(get: Getter, controller: AbortController): boolean {
  return get().loadController === controller
}

function failLoad(get: Getter, set: Setter, controller: AbortController, err: unknown) {
  if (!isCurrent(get, controller)) return
  if ((err as { name?: string }).name === 'AbortError') return
  set({ status: 'error', error: (err as Error).message })
}

function endLoad(get: Getter, set: Setter, controller: AbortController) {
  if (isCurrent(get, controller)) set({ loadController: null })
}

function applyResult(
  set: (partial: Partial<AppState>) => void,
  result: Awaited<ReturnType<DemoSource['load']>>
) {
  const dates = sortedDates(result.meals)
  set({
    status: 'ready',
    meta: result.meta,
    meals: result.meals,
    goalsByDate: result.goalsByDate,
    foodCatalog: result.foodCatalog,
    dates,
    selectedDate: dates[dates.length - 1] ?? null,
  })
}
