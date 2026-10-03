import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import type { DecimalSeparator } from '../data/foodCheck/compare'

/** Which foods get checked: those eaten in the last 30 or 90 days of the log, or all of them. */
export type FoodCheckScope = '30' | '90' | 'all'

/** A hand-picked USDA match for a food, or a request to skip that food entirely. */
export type MatchOverride = { fdcId: number; description: string } | { ignored: true }

interface FoodCheckState {
  /** api.data.gov key for USDA FoodData Central; empty means the shared, heavily rate-limited DEMO_KEY. */
  apiKey: string
  decimalSeparator: DecimalSeparator
  checkEmptyLipids: boolean
  scope: FoodCheckScope
  /** Keyed by food name, so choices survive rows moving around in the sheet. */
  overrides: Record<string, MatchOverride>
  /** Food name → the sheet values (rowSignature) it was marked fixed against. */
  fixed: Record<string, string>
  setApiKey: (apiKey: string) => void
  setDecimalSeparator: (separator: DecimalSeparator) => void
  setCheckEmptyLipids: (value: boolean) => void
  setScope: (scope: FoodCheckScope) => void
  setOverride: (name: string, override: MatchOverride | null) => void
  setFixed: (name: string, signature: string | null) => void
}

export const useFoodCheckStore = create<FoodCheckState>()(
  persist(
    (set) => ({
      apiKey: '',
      decimalSeparator: '.',
      checkEmptyLipids: false,
      scope: '30',
      overrides: {},
      fixed: {},
      setApiKey: (apiKey) => set({ apiKey: apiKey.trim() }),
      setDecimalSeparator: (decimalSeparator) => set({ decimalSeparator }),
      setCheckEmptyLipids: (checkEmptyLipids) => set({ checkEmptyLipids }),
      setScope: (scope) => set({ scope }),
      setOverride: (name, override) =>
        set((s) => {
          const overrides = { ...s.overrides }
          if (override) overrides[name] = override
          else delete overrides[name]
          return { overrides }
        }),
      setFixed: (name, signature) =>
        set((s) => {
          const fixed = { ...s.fixed }
          if (signature) fixed[name] = signature
          else delete fixed[name]
          return { fixed }
        }),
    }),
    { name: 'ninfo:food-check', storage: createJSONStorage(() => localStorage) }
  )
)
