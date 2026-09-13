/** Diacritic/case-insensitive key for loose text matching (search boxes, type lookups). */
export function normalizeSearchKey(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim()
}
