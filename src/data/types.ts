export interface MealItem {
  id: string
  date: string // ISO yyyy-mm-dd
  time: string // HH:MM, 24h
  food: string
  quantity: number
  foodType: string
  grams: number
  protein: number
  carbs: number
  fat: number
  fiber: number
  calories: number
  fastingSincePrev: string | null // raw "Ayuno" value, e.g. "02:40"
  lipids: LipidTotals
}

/** Fat-quality breakdown, in grams — per-item columns 39-45 of the Registro sheet. */
export interface LipidTotals {
  omega3: number
  omega6: number
  omega9: number
  scfa: number // short-chain fatty acids
  mcfa: number // medium-chain fatty acids
  lcfa: number // long-chain fatty acids
  tox: number // "Tóx" in the source sheet
}

export interface Meal {
  key: string // `${date}T${time}`
  date: string
  time: string
  items: MealItem[]
  totals: MacroTotals
  lipids: LipidTotals
}

export interface MacroTotals {
  protein: number
  carbs: number
  fat: number
  fiber: number
  calories: number
}

export const LIPID_LABELS: Record<keyof LipidTotals, string> = {
  omega3: 'Ω-3',
  omega6: 'Ω-6',
  omega9: 'Ω-9',
  scfa: 'SCFA',
  mcfa: 'MCFA',
  lcfa: 'LCFA',
  tox: 'Tóx',
}

export interface DayGoals extends MacroTotals {}

export interface DailyAggregate {
  date: string
  totals: MacroTotals
  goals: DayGoals | null
  mealCount: number
}

export const MACRO_KEYS = ['protein', 'carbs', 'fat', 'fiber', 'calories'] as const
export type MacroKey = (typeof MACRO_KEYS)[number]

export const MACRO_UNITS: Record<MacroKey, string> = {
  protein: 'g',
  carbs: 'g',
  fat: 'g',
  fiber: 'g',
  calories: 'kcal',
}

export interface FoodCatalogItem {
  food: string
  foodType: string
  sampleCount: number
  avgProteinPerGram: number
  avgCarbsPerGram: number
  avgFatPerGram: number
  avgFiberPerGram: number
  avgCaloriesPerGram: number
}

export type SourceCapability = 'meals' | 'foodCatalog' | 'liquids' | 'weight' | 'profile'

export interface DatasetMeta {
  mode: 'demo' | 'upload' | 'sheet-link' | 'google'
  capabilities: SourceCapability[]
  loadedAt: string
  label: string
}

export interface NutritionDataset {
  meta: DatasetMeta
  meals: MealItem[]
  foodCatalog: FoodCatalogItem[]
}
