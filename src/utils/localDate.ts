/** Today's date as YYYY-MM-DD in the browser's local timezone. `Date#toISOString` always
 * reports the UTC calendar date, which drifts a day off from the user's actual "today" for a
 * chunk of the day in any timezone other than UTC itself (e.g. it's already tomorrow in UTC
 * while still today locally, west of UTC, in the evening). */
export function todayLocalIso(): string {
  const d = new Date()
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
