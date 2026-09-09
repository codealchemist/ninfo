import type { DatasetMeta, FoodCatalogItem, MacroTotals, MealItem } from '../types'

export interface NutritionSource {
  load(signal?: AbortSignal): Promise<{
    meta: DatasetMeta
    meals: MealItem[]
    goalsByDate: Record<string, MacroTotals>
    foodCatalog: FoodCatalogItem[]
  }>
}
