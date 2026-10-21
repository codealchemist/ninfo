import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import { normalizeSearchKey } from '../../utils/text'

const MAX_MATCHES = 8

interface Props {
  foods: string[]
  selectedFood: string | null
  onSelect: (food: string | null) => void
  placeholder?: string
  /** List every food (in the given order) while the box is focused but still empty, so the
   * user can pick by browsing rather than only by typing. */
  showAllWhenEmpty?: boolean
}

/** Autocomplete search box for filtering the timeline/median panels down to a single food —
 * a plain filter-as-you-type list rather than a full combobox, since the food list is short
 * enough (the food catalog) that ranking/fuzzy-matching isn't needed. */
export default function FoodSearchInput({ foods, selectedFood, onSelect, placeholder, showAllWhenEmpty = false }: Props) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)

  if (selectedFood) {
    return (
      <div className="food-search food-search--selected">
        <Search size={14} className="food-search-icon" />
        <span className="food-search-selected-label">{selectedFood}</span>
        <button
          type="button"
          className="food-search-clear"
          onClick={() => onSelect(null)}
          aria-label={t('timeline.clearFoodFilter')}
          title={t('timeline.clearFoodFilter')}
        >
          <X size={14} />
        </button>
      </div>
    )
  }

  const matches = !open
    ? []
    : query.trim().length > 0
      ? foods.filter((f) => normalizeSearchKey(f).includes(normalizeSearchKey(query))).slice(0, MAX_MATCHES)
      : showAllWhenEmpty
        ? foods
        : []
  const placeholderText = placeholder ?? t('timeline.searchFoodPlaceholder')

  return (
    <div className="food-search">
      <Search size={14} className="food-search-icon" />
      <input
        type="text"
        className="food-search-input"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        placeholder={placeholderText}
        aria-label={placeholderText}
      />
      {matches.length > 0 && (
        <ul className="food-search-menu">
          {matches.map((food) => (
            <li key={food}>
              <button
                type="button"
                className="food-search-option"
                // Fires before the input's onBlur would close the menu, since mousedown precedes
                // blur/click — without this, the blur handler runs first and hides the option.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onSelect(food)
                  setQuery('')
                  // Browsing mode stays open, to pick several in a row.
                  setOpen(showAllWhenEmpty)
                }}
              >
                {food}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
