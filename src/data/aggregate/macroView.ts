import { MACRO_UNITS, type MacroKey } from '../types'

export const MACRO_VIEWS = ['macros', 'perKg', 'kcalPct'] as const
export type MacroView = (typeof MACRO_VIEWS)[number]

// Standard (Atwater/USDA) kcal-per-gram factors, used only to turn a macro's grams into its
// share of the total calories for the "kcal %" view.
const KCAL_PER_GRAM: Partial<Record<MacroKey, number>> = {
  protein: 4,
  carbs: 4,
  fat: 9,
  fiber: 2,
}

export interface MacroViewRing {
  value: number
  goal: number | null
  unit: string
  decimals: number
}

/** Reshapes one macro's (value, goal) pair per the active view: raw grams (the default), grams
 * per kg of body weight, or this macro's share of the total calories. The goal ring only makes
 * sense in the first two (a per-macro % doesn't have its own separate goal), so "kcal %" fills
 * the ring against a flat 100% instead. */
export function macroViewRing(
  view: MacroView,
  macro: MacroKey,
  rawValue: number,
  rawGoal: number | null,
  totalCalories: number | null,
  weightKg: number | null
): MacroViewRing {
  if (view === 'perKg') {
    const unit = macro === 'calories' ? 'kcal/kg' : 'g/kg'
    // Grams per kg are small enough that rounding to a whole number throws away most of the
    // signal (e.g. 1.6 vs. 2.1 g/kg both round to 2) — kcal/kg has no such problem.
    const decimals = macro === 'calories' ? 0 : 1
    if (!weightKg) return { value: 0, goal: null, unit, decimals }
    const goal = rawGoal != null ? rawGoal / weightKg : null
    return { value: rawValue / weightKg, goal, unit, decimals }
  }
  if (view === 'kcalPct') {
    if (macro === 'calories') return { value: 100, goal: 100, unit: '%', decimals: 0 }
    if (!totalCalories) return { value: 0, goal: 100, unit: '%', decimals: 0 }
    const pct = ((rawValue * (KCAL_PER_GRAM[macro] ?? 0)) / totalCalories) * 100
    return { value: pct, goal: 100, unit: '%', decimals: 0 }
  }
  return { value: rawValue, goal: rawGoal, unit: MACRO_UNITS[macro], decimals: 0 }
}
