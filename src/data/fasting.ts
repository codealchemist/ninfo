/** "02:40" -> 160. Null if missing/unparsable (e.g. the very first logged day, which has no
 * previous meal to measure a fast from). */
export function parseFastingMinutes(value: string | null): number | null {
  if (!value) return null
  const [h, m] = value.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return null
  return h * 60 + m
}

export function formatFastingMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = Math.round(totalMinutes % 60)
  return `${h}h ${m}m`
}
