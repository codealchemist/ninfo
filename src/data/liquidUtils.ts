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
