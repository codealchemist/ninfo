import type { WeightEntry } from './parsers/pesoParser'

/** Last weigh-in at or before the given date, from an ascending-by-date list — so a past day's
 * weight-based figures (water goal, per-kg views, mTORC1 protein check) reflect the weight known
 * at the time, not today's. */
export function weightAtOrBefore(sortedEntries: WeightEntry[], date: string): WeightEntry | null {
  let result: WeightEntry | null = null
  for (const e of sortedEntries) {
    if (e.date <= date) result = e
    else break
  }
  return result
}
