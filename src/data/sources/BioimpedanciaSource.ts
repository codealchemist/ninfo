import { parseBioimpedanciaCsv, type BiaEntry } from '../parsers/bioimpedanciaParser'
import { buildSheetGvizCsvUrlByName } from '../../utils/googleSheetUrl'
import { fetchSheetCsv } from '../../utils/fetchSheetCsv'
import i18n from '../../i18n'

const SHEET_NAME = 'Bioimpedancia'

/**
 * Reads the "Bioimpedancia" tab from the same workbook as the linked Registro sheet, looked
 * up by name rather than gid — each copy of the workbook assigns its own gids, but the tab
 * name is what stays stable across copies. Fetched fresh on every load, same as
 * GoogleSheetLinkSource.
 */
export class BioimpedanciaSource {
  constructor(private spreadsheetId: string) {}

  async load(signal?: AbortSignal): Promise<BiaEntry[]> {
    const url = buildSheetGvizCsvUrlByName(this.spreadsheetId, SHEET_NAME)

    let csvText: string
    try {
      csvText = await fetchSheetCsv(url, signal)
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') throw err
      throw new Error(`${i18n.t('errors.couldNotReachBioimpedancia')} ${i18n.t('errors.shareHintBioimpedancia')}`)
    }

    try {
      return parseBioimpedanciaCsv(csvText)
    } catch (err) {
      throw new Error(`${(err as Error).message} ${i18n.t('errors.shareHintBioimpedancia')}`)
    }
  }
}
