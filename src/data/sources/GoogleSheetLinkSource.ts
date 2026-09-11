import { deriveFoodCatalog } from '../aggregate/catalogFromLog'
import { parseRegistroCsv } from '../parsers/registroParser'
import type { DatasetMeta } from '../types'
import {
  buildSheetExportCsvUrl,
  buildSheetGvizCsvUrl,
  parseGoogleSheetUrl,
} from '../../utils/googleSheetUrl'
import { fetchSheetCsv } from '../../utils/fetchSheetCsv'
import { HeaderNotFoundError } from '../../utils/sheetDates'
import i18n from '../../i18n'
import type { NutritionSource } from './NutritionSource'

/**
 * Reads a `Registro` tab straight from a shared Google Sheets link — no OAuth, no picker.
 * Only works for spreadsheets shared as "Anyone with the link can view", and is fetched
 * fresh every time load() runs (see appStore's refreshSheetLink), which is what makes this
 * a meaningfully "live" source without the OAuth backend the full Google sign-in needs.
 *
 * Two export endpoints are tried, in order: the gviz visualization endpoint (more reliably
 * reachable cross-origin, but its CSV serialization can differ subtly from a literal
 * "Download as CSV") and the plain export endpoint (byte-for-byte what the parser was built
 * against, but historically less consistent cross-origin). If a fetch *succeeds* but the
 * content doesn't parse as a Registro tab, that's most likely the wrong tab (no gid in the
 * URL defaults to the first tab, which usually isn't Registro) rather than a format issue —
 * both endpoints would fail identically in that case, which the final error message covers.
 */
export class GoogleSheetLinkSource implements NutritionSource {
  constructor(private shareUrl: string) {}

  async load(signal?: AbortSignal) {
    const parsed = parseGoogleSheetUrl(this.shareUrl)
    if (!parsed) {
      throw new Error(i18n.t('errors.notGoogleSheetLink'))
    }

    const attempts = [buildSheetGvizCsvUrl(parsed), buildSheetExportCsvUrl(parsed)]
    let lastError: Error | null = null

    for (const url of attempts) {
      let csvText: string
      try {
        csvText = await fetchSheetCsv(url, signal)
      } catch (err) {
        if ((err as { name?: string }).name === 'AbortError') throw err
        lastError = err as Error
        continue
      }

      try {
        const { items, goalsByDate } = parseRegistroCsv(csvText)
        const meta: DatasetMeta = {
          mode: 'sheet-link',
          capabilities: ['meals', 'foodCatalog'],
          loadedAt: new Date().toISOString(),
          label: 'Linked spreadsheet',
        }
        return { meta, meals: items, goalsByDate, foodCatalog: deriveFoodCatalog(items) }
      } catch (err) {
        // Fetch worked but this didn't look like a Registro tab — try the other endpoint
        // before giving up, in case it was a gviz-vs-export formatting difference.
        lastError = err as Error
      }
    }

    if (lastError) {
      // The header-not-found case is genuinely ambiguous (wrong tab vs. wrong sheet vs.
      // something else) so it gets the full hint appended; the sign-in-page and HTTP-status
      // errors above are already specific and self-explanatory — don't dilute those. Checked
      // by error type rather than matching message text, since that text is translated.
      const isAmbiguous = lastError instanceof HeaderNotFoundError
      throw new Error(isAmbiguous ? `${lastError.message} ${i18n.t('errors.shareHintRegistro')}` : lastError.message)
    }
    throw new Error(`${i18n.t('errors.couldNotReachSheet')} ${i18n.t('errors.shareHintRegistro')}`)
  }
}
