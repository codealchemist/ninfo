import type { FoodCatalogItem, MealItem } from '../types'

/**
 * Derives a lightweight food catalog from the log itself, for sources (CSV upload, demo)
 * that don't have access to the richer `Alimentos` master tab. Per-gram macro ratios are
 * averaged across every observed serving of that food.
 */
export function deriveFoodCatalog(items: MealItem[]): FoodCatalogItem[] {
  const byFood = new Map<string, MealItem[]>()
  for (const item of items) {
    const bucket = byFood.get(item.food)
    if (bucket) bucket.push(item)
    else byFood.set(item.food, [item])
  }

  const catalog: FoodCatalogItem[] = []
  for (const [food, servings] of byFood) {
    let gramsSum = 0
    let proteinSum = 0
    let carbsSum = 0
    let fatSum = 0
    let fiberSum = 0
    let caloriesSum = 0
    for (const s of servings) {
      gramsSum += s.grams
      proteinSum += s.protein
      carbsSum += s.carbs
      fatSum += s.fat
      fiberSum += s.fiber
      caloriesSum += s.calories
    }
    const perGram = gramsSum > 0 ? gramsSum : 1
    catalog.push({
      food,
      foodType: servings[0].foodType,
      sampleCount: servings.length,
      avgProteinPerGram: proteinSum / perGram,
      avgCarbsPerGram: carbsSum / perGram,
      avgFatPerGram: fatSum / perGram,
      avgFiberPerGram: fiberSum / perGram,
      avgCaloriesPerGram: caloriesSum / perGram,
    })
  }
  return catalog.sort((a, b) => b.sampleCount - a.sampleCount)
}
