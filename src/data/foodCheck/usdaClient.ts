import { getCachedFood, getCachedSearch, putCachedFood, putCachedSearch } from '../../db/foodRefCache'
import i18n from '../../i18n'
import type { LipidField, MacroField, RefFood, RefProfile } from './types'

/**
 * USDA FoodData Central (https://fdc.nal.usda.gov) — the US government's reference food
 * composition database. Only its lab-analyzed datasets are searched (Foundation and SR Legacy);
 * branded label data is excluded. Those are also the datasets that carry a fatty-acid
 * breakdown, which the lipid check needs. "Survey (FNDDS)" (prepared dishes) is left out: the
 * GET search endpoint answers 400 when it's in the dataType list.
 */
const API_BASE = 'https://api.nal.usda.gov/fdc/v1'
const DATA_TYPES = 'Foundation,SR Legacy'
export const DEMO_API_KEY = 'DEMO_KEY'

export const fdcFoodUrl = (fdcId: number) => `https://fdc.nal.usda.gov/food-details/${fdcId}/nutrients`

/** Only these USDA nutrient numbers are kept — everything the profile below reads. */
const KEPT_NUTRIENTS = new Set([
  '203', '204', '205', '205.2', '291', '208', '957', '958', // macros & energy
  '605', '606', '645', '646', // trans / saturated / mono / poly totals
  '607', '608', '609', '610', '611', // 4:0 … 12:0
  '617', '674', '628', '630', // 18:1, 18:1 c, 20:1, 22:1 (omega-9)
  '618', '675', '620', '855', // 18:2, 18:2 n-6, 20:4, 20:4 n-6 (omega-6)
  '619', '851', '629', '631', '621', // 18:3, ALA, EPA, DPA, DHA (omega-3)
])

export class UsdaRateLimitError extends Error {}
export class UsdaAuthError extends Error {}

interface RawNutrient {
  nutrientNumber?: string
  number?: string
  value?: number
  amount?: number
  unitName?: string
  nutrient?: { number?: string; unitName?: string }
}

interface RawFood {
  fdcId: number
  description: string
  dataType: string
  foodNutrients?: RawNutrient[]
}

function trimFood(raw: RawFood): RefFood {
  const nutrients: Record<string, number> = {}
  for (const n of raw.foodNutrients ?? []) {
    const number = n.nutrientNumber ?? n.number ?? n.nutrient?.number
    const value = n.value ?? n.amount
    const unit = (n.unitName ?? n.nutrient?.unitName ?? '').toUpperCase()
    if (!number || !KEPT_NUTRIENTS.has(number) || typeof value !== 'number') continue
    if (unit === 'KJ') continue // energy is compared in kcal
    nutrients[number] = value
  }
  return { fdcId: raw.fdcId, description: raw.description, dataType: raw.dataType, nutrients }
}

async function request<T>(path: string, params: Record<string, string>, apiKey: string, signal?: AbortSignal): Promise<T> {
  // Encoded by hand rather than with URLSearchParams, which writes spaces as "+".
  const query = Object.entries({ ...params, api_key: apiKey || __DEV_USDA_API_KEY__ || DEMO_API_KEY })
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join('&')
  const res = await fetch(`${API_BASE}${path}?${query}`, { signal })
  if (res.status === 429) throw new UsdaRateLimitError(i18n.t('foodCheck.errors.rateLimited'))
  if (res.status === 401 || res.status === 403) throw new UsdaAuthError(i18n.t('foodCheck.errors.badApiKey'))
  if (!res.ok) {
    const detail = (await res.text().catch(() => '')).slice(0, 200)
    throw new Error(`${i18n.t('foodCheck.errors.usdaHttp', { status: res.status })} ${detail}`.trim())
  }
  return (await res.json()) as T
}

/**
 * Searches USDA for a query, cached per query. Requires every word first (precise), then
 * falls back to any-word matching if that finds nothing.
 */
export async function searchFoods(query: string, apiKey: string, signal?: AbortSignal): Promise<RefFood[]> {
  const cacheKey = query.trim().toLowerCase()
  const cached = await getCachedSearch(cacheKey)
  if (cached) return cached

  const run = async (requireAllWords: boolean) => {
    const data = await request<{ foods?: RawFood[] }>(
      '/foods/search',
      { query, dataType: DATA_TYPES, pageSize: '10', requireAllWords: String(requireAllWords) },
      apiKey,
      signal
    )
    return (data.foods ?? []).map(trimFood)
  }

  let foods = await run(true)
  if (foods.length === 0) foods = await run(false)
  await putCachedSearch(cacheKey, foods)
  return foods
}

function hasFattyAcids(food: RefFood): boolean {
  return food.nutrients['606'] !== undefined || food.nutrients['645'] !== undefined || food.nutrients['646'] !== undefined
}

/**
 * Returns the food as stored in the foods cache, fetching its full record first when a search
 * result came back without the fatty-acid breakdown the lipid check needs.
 */
export async function completeFood(food: RefFood, apiKey: string, signal?: AbortSignal): Promise<RefFood> {
  const cached = await getCachedFood(food.fdcId)
  if (cached) return cached

  let complete = food
  if (!hasFattyAcids(food) && (food.nutrients['204'] ?? 0) >= 0.5) {
    const raw = await request<RawFood>(`/food/${food.fdcId}`, { format: 'abridged' }, apiKey, signal)
    const detailed = trimFood(raw)
    complete = { ...food, nutrients: { ...food.nutrients, ...detailed.nutrients } }
  }
  await putCachedFood(complete)
  return complete
}

/** A food by id (used for hand-picked matches), from the cache or fetched in full. */
export async function getFood(fdcId: number, apiKey: string, signal?: AbortSignal): Promise<RefFood> {
  const cached = await getCachedFood(fdcId)
  if (cached) return cached
  const food = trimFood(await request<RawFood>(`/food/${fdcId}`, { format: 'abridged' }, apiKey, signal))
  await putCachedFood(food)
  return food
}

const sum = (n: Record<string, number>, ...numbers: string[]) => numbers.reduce((acc, k) => acc + (n[k] ?? 0), 0)
const first = (n: Record<string, number>, ...numbers: string[]) => {
  for (const k of numbers) if (n[k] !== undefined) return n[k]
  return 0
}

/** Below this much fat per 100 g, a fatty-acid share is too noisy to be worth comparing. */
const MIN_FAT_FOR_LIPIDS = 0.5

/**
 * Converts a USDA food into the Alimentos tab's own terms. Lipid shares are fractions of the
 * food's total fatty acids (saturated + mono + poly + trans), matching the sheet's convention
 * where SCFA + MCFA + LCFA add up to 1:
 *   SCFA = 4:0 · MCFA = 6:0–12:0 · LCFA = the rest · Tóx = trans fats
 *   Ω-3 = ALA + EPA + DPA + DHA · Ω-6 = linoleic + arachidonic · Ω-9 = 18:1 + 20:1 + 22:1
 */
export function toProfile(food: RefFood): RefProfile {
  const n = food.nutrients
  const protein = first(n, '203')
  const carbs = first(n, '205', '205.2')
  const fat = first(n, '204')
  const per100g: Record<MacroField, number> = {
    protein,
    carbs,
    fat,
    fiber: first(n, '291'),
    calories: n['208'] ?? n['958'] ?? n['957'] ?? 4 * protein + 4 * carbs + 9 * fat,
  }

  const totalFattyAcids = sum(n, '606', '645', '646', '605')
  if (fat < MIN_FAT_FOR_LIPIDS || !hasFattyAcids(food) || totalFattyAcids <= 0) {
    return { per100g, lipids: null }
  }

  const share = (grams: number) => Math.min(1, Math.max(0, grams / totalFattyAcids))
  const scfa = share(sum(n, '607'))
  const mcfa = share(sum(n, '608', '609', '610', '611'))
  const lipids: Record<LipidField, number> = {
    omega3: share(first(n, '851', '619') + sum(n, '629', '631', '621')),
    omega6: share(first(n, '675', '618') + first(n, '855', '620')),
    omega9: share(first(n, '674', '617') + sum(n, '628', '630')),
    scfa,
    mcfa,
    lcfa: Math.max(0, 1 - scfa - mcfa),
    tox: share(sum(n, '605')),
  }
  return { per100g, lipids }
}
