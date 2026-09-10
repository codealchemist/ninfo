/**
 * Fetches a Google Sheets CSV export URL and validates the response is actually CSV.
 *
 * A "200 OK" HTML page (sign-in prompt, "request access", etc.) is what Google serves —
 * instead of an error status — when a sheet isn't actually viewable by anyone with the link,
 * despite the URL otherwise looking right. Catch that here with a precise message, rather
 * than letting it fall through to a CSV parser and produce a confusing "found instead:
 * <!DOCTYPE html..." diagnostic.
 */
export async function fetchSheetCsv(url: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`Google Sheets returned an error (${res.status}).`)
  const text = await res.text()

  if (/^\s*<(!doctype|html)/i.test(text)) {
    throw new Error(
      'Google returned a sign-in page instead of your spreadsheet — this sheet isn\'t ' +
        'actually shared as "Anyone with the link can view" yet (File → Share → General access).'
    )
  }

  return text
}
