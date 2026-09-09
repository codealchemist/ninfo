import { deriveFoodCatalog } from '../aggregate/catalogFromLog'
import { parseRegistroCsv } from '../parsers/registroParser'
import type { DatasetMeta } from '../types'
import type { NutritionSource } from './NutritionSource'

export class DemoSource implements NutritionSource {
  async load(signal?: AbortSignal) {
    const res = await fetch('/demo-registro.csv', { signal })
    if (!res.ok) throw new Error('Could not load the demo dataset.')
    const csvText = await res.text()
    const { items, goalsByDate } = parseRegistroCsv(csvText)
    const meta: DatasetMeta = {
      mode: 'demo',
      capabilities: ['meals', 'foodCatalog'],
      loadedAt: new Date().toISOString(),
      label: 'Demo dataset',
    }
    return { meta, meals: items, goalsByDate, foodCatalog: deriveFoodCatalog(items) }
  }
}
