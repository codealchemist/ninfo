import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Search, X } from 'lucide-react'
import { normalizeSearchKey } from '../../utils/text'

const MAX_MATCHES = 8

interface Props {
  foods: string[]
  selectedFood: string | null
  onSelect: (food: string | null) => void
}

/** Autocomplete search box for filtering the timeline/median panels down to a single food —
 * a plain filter-as-you-type list rather than a full combobox, since the food list is short
 * enough (the food catalog) that ranking/fuzzy-matching isn't needed. */
export default function FoodSearchInput({ foods, selectedFood, onSelect }: Props) {
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

  const matches =
    open && query.trim().length > 0
      ? foods.filter((f) => normalizeSearchKey(f).includes(normalizeSearchKey(query))).slice(0, MAX_MATCHES)
      : []

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
        placeholder={t('timeline.searchFoodPlaceholder')}
        aria-label={t('timeline.searchFoodPlaceholder')}
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
                  setOpen(false)
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
