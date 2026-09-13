import { parseLiquidoCsv, type LiquidEntry } from '../parsers/liquidoParser'
import { buildSheetGvizCsvUrlByName } from '../../utils/googleSheetUrl'
import { fetchSheetCsv } from '../../utils/fetchSheetCsv'
import i18n from '../../i18n'

const SHEET_NAME = 'Líquido'

/**
 * Reads the "Líquido" tab from the same workbook as the linked Registro sheet, looked up by
 * name rather than gid — same approach as BioimpedanciaSource. Fetched fresh on every load.
 */
export class LiquidoSource {
  constructor(private spreadsheetId: string) {}

  async load(signal?: AbortSignal): Promise<LiquidEntry[]> {
    const url = buildSheetGvizCsvUrlByName(this.spreadsheetId, SHEET_NAME)

    let csvText: string
    try {
      csvText = await fetchSheetCsv(url, signal)
    } catch (err) {
      if ((err as { name?: string }).name === 'AbortError') throw err
      throw new Error(`${i18n.t('errors.couldNotReachLiquido')} ${i18n.t('errors.shareHintLiquido')}`)
    }

    try {
      return parseLiquidoCsv(csvText)
    } catch (err) {
      throw new Error(`${(err as Error).message} ${i18n.t('errors.shareHintLiquido')}`)
    }
  }
}
