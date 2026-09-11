import { forwardRef, useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { ArrowDown, ArrowUp, ArrowUpDown, Check, Copy, Maximize2, Minimize2, X } from 'lucide-react'
import type { Meal, MealItem } from '../../data/types'
import { MACRO_KEYS, type MacroKey } from '../../data/types'
import { formatMealItemsAsText } from '../../data/mealText'
import { copyTextToClipboard } from '../../utils/clipboard'

type SortColumn = MacroKey
type SortDirection = 'asc' | 'desc'

interface Props {
  meal: Meal
  onFlipBack: () => void
}

const MealItemsTable = forwardRef<HTMLDivElement, Props>(function MealItemsTable(
  { meal, onFlipBack },
  ref
) {
  const { t } = useTranslation()
  const [sort, setSort] = useState<{ column: SortColumn; direction: SortDirection } | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [maximized, setMaximized] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    setSelectedIds(new Set())
    setSort(null)
  }, [meal.key])

  useEffect(() => {
    if (!maximized) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      // First Escape clears an active selection; only close once nothing is selected.
      if (selectedIds.size > 0) setSelectedIds(new Set())
      else setMaximized(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [maximized, selectedIds])

  const rows = useMemo(() => {
    if (!sort) return meal.items
    const { column, direction } = sort
    const sorted = [...meal.items].sort((a, b) => a[column] - b[column])
    return direction === 'asc' ? sorted : sorted.reverse()
  }, [meal.items, sort])

  const handleSort = (column: SortColumn, e: React.MouseEvent) => {
    e.stopPropagation()
    setSort((prev) => {
      if (!prev || prev.column !== column) return { column, direction: 'desc' }
      return { column, direction: prev.direction === 'desc' ? 'asc' : 'desc' }
    })
  }

  const toggleRow = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const itemsToCopy: MealItem[] =
      selectedIds.size > 0 ? meal.items.filter((i) => selectedIds.has(i.id)) : meal.items
    const label =
      selectedIds.size > 0
        ? t('meals.table.selectedItems', { count: selectedIds.size, time: meal.time })
        : t('meals.table.itemsAtMeal', { count: meal.items.length, time: meal.time })
    const ok = await copyTextToClipboard(formatMealItemsAsText(itemsToCopy, label))
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  const sortIcon = (column: SortColumn) => {
    if (!sort || sort.column !== column) return <ArrowUpDown size={11} className="sort-icon" />
    return sort.direction === 'asc' ? (
      <ArrowUp size={11} className="sort-icon sort-icon--active" />
    ) : (
      <ArrowDown size={11} className="sort-icon sort-icon--active" />
    )
  }

  const detailsHeading = t('meals.table.detailsHeading', { time: meal.time })
  const selectedSuffix =
    selectedIds.size > 0 ? ` · ${t('meals.table.selectedSuffix', { count: selectedIds.size })}` : ''

  const table = (
    <div className="meal-items-table-scroll">
      <table className="meal-items-table">
        <thead>
          <tr>
            <th className="col-num" />
            <th className="col-food">{t('meals.table.food')}</th>
            {MACRO_KEYS.map((macro) => (
              <th key={macro} onClick={(e) => handleSort(macro, e)} className="sortable-col">
                {t(`common.macros.${macro}`)} {sortIcon(macro)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((item: MealItem, i) => {
            const selected = selectedIds.has(item.id)
            return (
              <tr
                key={item.id}
                className={selected ? 'row-selected' : undefined}
                onClick={(e) => toggleRow(item.id, e)}
              >
                <td className="col-num">{i + 1}</td>
                <td className="col-food">
                  {item.food}
                  {item.quantity !== 1 && <span className="meal-item-qty"> ×{item.quantity}</span>}
                </td>
                <td>{Math.round(item.protein)}g</td>
                <td>{Math.round(item.carbs)}g</td>
                <td>{Math.round(item.fat)}g</td>
                <td>{Math.round(item.fiber)}g</td>
                <td>{Math.round(item.calories)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="meal-items-table-wrap" ref={ref}>
      <div className="meal-items-table-header">
        <span>
          {detailsHeading}
          {selectedSuffix}
        </span>
        <div className="meal-items-table-actions">
          <button
            className="icon-button icon-button--ghost"
            onClick={handleCopy}
            aria-label={t('meals.table.copyAria')}
            title={selectedIds.size > 0 ? t('meals.table.copySelectedTitle') : t('meals.table.copyAllTitle')}
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <button
            className="icon-button icon-button--ghost"
            onClick={(e) => {
              e.stopPropagation()
              setMaximized(true)
            }}
            aria-label={t('meals.table.maximizeAria')}
          >
            <Maximize2 size={14} />
          </button>
          <button
            className="icon-button icon-button--ghost"
            onClick={(e) => {
              e.stopPropagation()
              onFlipBack()
            }}
            aria-label={t('meals.table.backToSummaryAria')}
          >
            <X size={14} />
          </button>
        </div>
      </div>
      {table}

      {maximized &&
        createPortal(
          <div className="meal-items-modal-backdrop" onClick={() => setMaximized(false)}>
            <div className="meal-items-modal" onClick={(e) => e.stopPropagation()}>
              <div className="meal-items-table-header">
                <span>
                  {detailsHeading}
                  {selectedSuffix}
                </span>
                <div className="meal-items-table-actions">
                  <button
                    className="icon-button icon-button--ghost"
                    onClick={handleCopy}
                    aria-label={t('meals.table.copyAria')}
                  >
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                  </button>
                  <button
                    className="icon-button icon-button--ghost"
                    onClick={() => setMaximized(false)}
                    aria-label={t('meals.table.restoreAria')}
                  >
                    <Minimize2 size={14} />
                  </button>
                </div>
              </div>
              {table}
            </div>
          </div>,
          document.body
        )}
    </div>
  )
})

export default MealItemsTable
