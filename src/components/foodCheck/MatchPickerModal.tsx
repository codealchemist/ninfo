import { useEffect, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ExternalLink, LoaderCircle, Search } from 'lucide-react'
import Modal from '../common/Modal'
import { buildFoodQuery } from '../../data/foodCheck/foodQuery'
import { fdcFoodUrl, searchFoods, toProfile } from '../../data/foodCheck/usdaClient'
import type { RowCheck } from '../../data/foodCheck/compare'
import type { AlimentoRow, RefFood } from '../../data/foodCheck/types'

interface MatchPickerModalProps {
  row: AlimentoRow
  currentFdcId: number | null
  isOverridden: boolean
  apiKey: string
  /** How the sheet row compares against a candidate — shown next to each result. */
  evaluate: (food: RefFood) => RowCheck
  onPick: (food: RefFood) => Promise<void>
  onUseAutomatic: () => void
  onIgnore: () => void
  onClose: () => void
}

export default function MatchPickerModal({
  row,
  currentFdcId,
  isOverridden,
  apiKey,
  evaluate,
  onPick,
  onUseAutomatic,
  onIgnore,
  onClose,
}: MatchPickerModalProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState(() => buildFoodQuery(row.name) ?? '')
  const [results, setResults] = useState<RefFood[] | null>(null)
  const [status, setStatus] = useState<'idle' | 'searching' | 'picking'>('idle')
  const [error, setError] = useState<string | null>(null)

  const search = async (q: string) => {
    if (!q.trim()) return
    setStatus('searching')
    setError(null)
    try {
      setResults(await searchFoods(q, apiKey))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setStatus('idle')
    }
  }

  useEffect(() => {
    search(query)
    // Only the initial query searches on open; later ones run on submit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    search(query)
  }

  const handlePick = async (food: RefFood) => {
    setStatus('picking')
    setError(null)
    try {
      await onPick(food)
      onClose()
    } catch (err) {
      setError((err as Error).message)
      setStatus('idle')
    }
  }

  return (
    <Modal onClose={onClose} className="match-picker-modal">
      <h3>{t('foodCheck.picker.title', { name: row.name })}</h3>
      <p className="hint">{t('foodCheck.picker.hint')}</p>

      <form className="match-picker-search" onSubmit={handleSubmit}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('foodCheck.picker.placeholder')}
          aria-label={t('foodCheck.picker.placeholder')}
          autoFocus
        />
        <button type="submit" disabled={status !== 'idle' || !query.trim()}>
          {status === 'searching' ? <LoaderCircle size={14} className="spin" /> : <Search size={14} />}
          <span>{t('foodCheck.picker.search')}</span>
        </button>
      </form>

      {error && <p className="hint food-check-error">{error}</p>}

      <ul className="match-picker-results">
        {results?.length === 0 && <li className="hint">{t('foodCheck.picker.noResults')}</li>}
        {results?.map((food) => {
          const { per100g } = toProfile(food)
          const check = evaluate(food)
          const selected = food.fdcId === currentFdcId
          return (
            <li key={food.fdcId} className={'match-picker-result' + (selected ? ' match-picker-result--selected' : '')}>
              <button type="button" onClick={() => handlePick(food)} disabled={status !== 'idle'}>
                <span className="match-picker-result-name">
                  {selected && <Check size={13} />} {food.description}
                </span>
                <span className="match-picker-result-meta">
                  {food.dataType} · P {per100g.protein.toFixed(1)} · C {per100g.carbs.toFixed(1)} · G{' '}
                  {per100g.fat.toFixed(1)} · {Math.round(per100g.calories)} kcal
                </span>
                <span className={'match-picker-result-fit' + (check.flagged.length ? ' match-picker-result-fit--off' : '')}>
                  {check.flagged.length
                    ? t('foodCheck.picker.fieldsOff', {
                        count: check.flagged.length,
                        max: Math.round(check.impact * 100),
                      })
                    : t('foodCheck.picker.allWithin')}
                </span>
              </button>
              <a href={fdcFoodUrl(food.fdcId)} target="_blank" rel="noreferrer" title={t('foodCheck.openInUsda')}>
                <ExternalLink size={13} />
              </a>
            </li>
          )
        })}
      </ul>

      <div className="match-picker-actions">
        {isOverridden && (
          <button type="button" className="link-button" onClick={() => { onUseAutomatic(); onClose() }}>
            {t('foodCheck.picker.useAutomatic')}
          </button>
        )}
        <button type="button" className="link-button" onClick={() => { onIgnore(); onClose() }}>
          {t('foodCheck.picker.ignore')}
        </button>
      </div>
    </Modal>
  )
}
