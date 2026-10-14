import type { Meal } from '../data/types'

/**
 * Where AI analysis can be shown. Days and meals get dynamic ids; every other panel is fixed.
 * The descriptions are model-facing (returned by get_app_overview), so they say what each panel
 * shows in the app.
 */
export const PANEL_TARGETS = {
  'timeline:chart': 'Timeline page, macro chart: daily protein/carbs/fat/fiber/calories over the selected range.',
  'timeline:medians': 'Timeline page, median panel: median daily macros, protein per kg, fasting, water and mTORC1 pulses per day.',
  'bia:summary': 'BIA page, latest bioimpedance measurement (weight, body fat, visceral fat, muscle mass, BMI).',
  'bia:trends': 'BIA page, bioimpedance trend charts.',
  'bia:history': 'BIA page, table of every bioimpedance measurement.',
  'weight:summary': 'Weight page, latest weigh-in and recent change.',
  'weight:trends': 'Weight page, weight trend chart.',
  'weight:history': 'Weight page, table of every weigh-in.',
  'liquids:summary': "Liquids page, the selected day's drinks and water against the goal.",
  'liquids:trends': 'Liquids page, daily liquid intake trend chart.',
  'liquids:history': 'Liquids page, table of every logged drink.',
} as const

export type PanelTarget = keyof typeof PANEL_TARGETS

export const dayTarget = (date: string) => `day:${date}`
export const mealTarget = (meal: Pick<Meal, 'key'>) => `meal:${meal.key}`

export const isPanelTarget = (target: string): target is PanelTarget => target in PANEL_TARGETS
