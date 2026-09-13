import type { LiquidEntry } from './parsers/liquidoParser'
import { normalizeSearchKey } from '../utils/text'

/** Diacritic/case-insensitive key for matching liquid type labels (e.g. "Café" and "cafe"). */
export function normalizeLiquidKey(type: string): string {
  return normalizeSearchKey(type)
}

/** Real (measured) amount when logged, falling back to the nominal amount otherwise. */
export function amountOfLiquid(entry: LiquidEntry): number {
  return entry.realAmountMl || entry.amountMl
}

/**
 * Each date's total liquid intake — every type counts toward hydration, not just water, so
 * this prefers the sheet's own "Total diario" rollup (present on whichever row the sheet's
 * formula places it for that date) and only falls back to summing each entry's real amount for
 * dates where that rollup isn't available (e.g. older rows logged before the column existed).
 */
export function dailyTotalMlByDate(entries: LiquidEntry[]): Map<string, number> {
  const sheetTotals = new Map<string, number>()
  const summed = new Map<string, number>()
  for (const e of entries) {
    if (e.dailyTotalMl != null) sheetTotals.set(e.date, e.dailyTotalMl)
    summed.set(e.date, (summed.get(e.date) ?? 0) + amountOfLiquid(e))
  }
  for (const [date, total] of summed) {
    if (!sheetTotals.has(date)) sheetTotals.set(date, total)
  }
  return sheetTotals
}
