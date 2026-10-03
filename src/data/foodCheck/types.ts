/** Every Alimentos column the check compares against the reference source, in sheet order. */
export const MACRO_FIELDS = ['protein', 'carbs', 'fat', 'fiber', 'calories'] as const
export const LIPID_FIELDS = ['omega3', 'omega6', 'omega9', 'scfa', 'mcfa', 'lcfa', 'tox'] as const
export const CHECK_FIELDS = [...MACRO_FIELDS, ...LIPID_FIELDS] as const

export type MacroField = (typeof MACRO_FIELDS)[number]
export type LipidField = (typeof LIPID_FIELDS)[number]
export type CheckField = (typeof CHECK_FIELDS)[number]

/** A raw gviz cell value: numbers stay numbers (unrounded), text stays text, blanks are null. */
export type SheetCell = string | number | null

export interface AlimentoRow {
  /** 1-based row number in the spreadsheet (header is row 1). */
  rowNumber: number
  name: string
  category: string
  /** Every cell of the row, in the sheet's own column order — what the copy button rebuilds. */
  cells: SheetCell[]
  /**
   * The compared values, in the sheet's own units: macros as per-gram ratios (0.19 = 19 g per
   * 100 g), calories per 100 g, lipids as a share of the fat (0–1). null = empty cell.
   */
  values: Record<CheckField, number | null>
}

export interface AlimentosTable {
  headers: string[]
  /** Which column each compared field lives in, or undefined if the sheet has no such column. */
  columns: Partial<Record<CheckField, number>>
  /**
   * Which columns the sheet formats as percentages (it stores 0.19 and shows 19%), so copied
   * values can be written the same way. Missing on results cached before this was read.
   */
  percentColumns?: boolean[]
  rows: AlimentoRow[]
}

/**
 * A USDA FoodData Central food, trimmed to the nutrients the check reads. `nutrients` is keyed
 * by USDA nutrient number (e.g. "203" = protein), always per 100 g.
 */
export interface RefFood {
  fdcId: number
  description: string
  dataType: string
  nutrients: Record<string, number>
}

/** A reference food translated into the sheet's own columns (per 100 g / share of fat). */
export interface RefProfile {
  per100g: Record<MacroField, number>
  /** null when USDA has no fatty-acid breakdown for this food. */
  lipids: Record<LipidField, number> | null
}
