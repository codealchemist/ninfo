import { deriveFoodCatalog } from '../aggregate/catalogFromLog'
import { parseRegistroCsv } from '../parsers/registroParser'
import type { DatasetMeta } from '../types'
import type { NutritionSource } from './NutritionSource'

/**
 * Wraps a `Registro`-tab CSV the user picked/dropped themselves — parsed entirely
 * client-side, never uploaded anywhere. See docs/nutrition-app-proposal.md §5.2.
 */
export class UploadedCsvSource implements NutritionSource {
  constructor(
    private csvText: string,
    private fileName: string,
    private uploadedAt: string
  ) {}

  async load(_signal?: AbortSignal) {
    const { items, goalsByDate } = parseRegistroCsv(this.csvText)
    const meta: DatasetMeta = {
      mode: 'upload',
      capabilities: ['meals', 'foodCatalog'],
      loadedAt: this.uploadedAt,
      label: this.fileName,
    }
    return { meta, meals: items, goalsByDate, foodCatalog: deriveFoodCatalog(items) }
  }
}
