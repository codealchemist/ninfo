import { useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, Copy, Image as ImageIcon, X } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { MACRO_KEYS, type MacroKey, type MacroTotals } from '../../data/types'
import {
  FOOD_PICKER_DAYS,
  FOOD_TRACKER_RANGES,
  foodPeriodStats,
  recentFoods,
  shiftIsoDate,
  type FoodPeriodStats,
  type FoodTrackerRange,
} from '../../data/foodTracker'
import { formatFoodTrackerAsText } from '../../data/foodTrackerText'
import { copyElementAsImage, copyTextToClipboard } from '../../utils/clipboard'
import FoodSearchInput from '../charts/FoodSearchInput'

const COLOR_VARS: Record<MacroKey, string> = {
  protein: '--macro-protein',
  carbs: '--macro-carbs',
  fat: '--macro-fat',
  fiber: '--macro-fiber',
  calories: '--macro-calories',
}

const STORAGE_KEY = 'ninfo:food-tracker'
const MAX_STRIP_DAYS = 30
/** Days per row in the eaten-days strip: 7d and 15d fit on one row, 30d takes two. */
const STRIP_ROW_DAYS = 15

const isWeekend = (iso: string) => {
  const day = new Date(`${iso}T12:00:00`).getDay()
  return day === 0 || day === 6
}

interface Saved {
  open: boolean
  foods: string[]
  range: FoodTrackerRange
}

const DEFAULTS: Saved = { open: true, foods: [], range: 7 }

/** The tracked foods and view settings, remembered per browser — a convenience, so a missing
 * or unreadable entry just falls back to the defaults. */
function loadSaved(): Saved {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<Saved>
    return {
      open: typeof parsed.open === 'boolean' ? parsed.open : DEFAULTS.open,
      foods: Array.isArray(parsed.foods) ? parsed.foods.filter((f) => typeof f === 'string') : DEFAULTS.foods,
      range: FOOD_TRACKER_RANGES.includes(parsed.range as FoodTrackerRange) ? (parsed.range as FoodTrackerRange) : DEFAULTS.range,
    }
  } catch {
    return DEFAULTS
  }
}

function save(value: Saved) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Storage unavailable (private browsing etc.) — the panel still works for this visit.
  }
}

/** A copy-as-text and copy-as-image pair; each flashes a check once its copy succeeded. Marked
 * .image-export-exclude so the buttons never appear in the images they make. */
function CopyButtons({
  getText,
  imageRef,
  textLabel,
  imageLabel,
  size = 14,
  className = 'icon-button icon-button--ghost',
}: {
  getText: () => string
  imageRef: RefObject<HTMLElement | null>
  textLabel: string
  imageLabel: string
  size?: number
  className?: string
}) {
  const [copied, setCopied] = useState<'text' | 'image' | null>(null)
  const flash = (kind: 'text' | 'image', ok: boolean) => {
    if (!ok) return
    setCopied(kind)
    setTimeout(() => setCopied(null), 1500)
  }
  return (
    <span className="food-tracker-copy image-export-exclude">
      <button
        className={className}
        onClick={async (e) => {
          e.stopPropagation()
          flash('text', await copyTextToClipboard(getText()))
        }}
        aria-label={textLabel}
        title={textLabel}
      >
        {copied === 'text' ? <Check size={size} /> : <Copy size={size} />}
      </button>
      <button
        className={className}
        onClick={async (e) => {
          e.stopPropagation()
          if (imageRef.current) flash('image', await copyElementAsImage(imageRef.current))
        }}
        aria-label={imageLabel}
        title={imageLabel}
      >
        {copied === 'image' ? <Check size={size} /> : <ImageIcon size={size} />}
      </button>
    </span>
  )
}

function formatShortDate(iso: string, locale: string): string {
  return new Date(`${iso}T00:00:00`).toLocaleDateString(locale, { month: 'short', day: 'numeric' })
}

/**
 * Collapsible Today-page panel that follows chosen foods over a period ending on the selected
 * day: one mini card per food with how many times it was eaten and the median share of the
 * day's macros it supplied, over the period's logged days. Foods are picked from those eaten in the
 * last 30 days.
 */
export default function FoodTracker() {
  const { t, i18n } = useTranslation()
  const meals = useAppStore((s) => s.meals)
  const selectedDate = useAppStore((s) => s.selectedDate)
  const [saved, setSaved] = useState<Saved>(loadSaved)
  const panelRef = useRef<HTMLElement>(null)
  const { open, foods, range } = saved

  useEffect(() => save(saved), [saved])
  const update = (patch: Partial<Saved>) => setSaved((s) => ({ ...s, ...patch }))

  const endDate = selectedDate ?? ''
  const pickable = useMemo(
    () => (endDate ? recentFoods(meals, endDate).filter((f) => !foods.includes(f)) : []),
    [meals, endDate, foods]
  )
  const stats = useMemo(
    () => new Map(foods.map((food) => [food, foodPeriodStats(meals, food, endDate, range)])),
    [meals, foods, endDate, range]
  )

  if (!selectedDate) return null

  // One cell per day in the card's eaten-days strip — only for short periods, where the cells
  // stay big enough to read.
  const periodDates =
    range !== 0 && range <= MAX_STRIP_DAYS
      ? Array.from({ length: range }, (_, i) => shiftIsoDate(endDate, i - (range - 1)))
      : null

  const periodHint =
    range === 0
      ? t('foodTracker.periodAll', { end: formatShortDate(endDate, i18n.language) })
      : t('foodTracker.period', {
          start: formatShortDate(shiftIsoDate(endDate, -(range - 1)), i18n.language),
          end: formatShortDate(endDate, i18n.language),
        })
  // Text exports name the range too ("7d"), since the dates alone don't say how long it is.
  const periodLabel = range === 0 ? periodHint : `${periodHint} (${t('timeline.rangeDays', { count: range })})`
  const textFor = (entries: string[]) => () =>
    formatFoodTrackerAsText(periodLabel, entries.map((food) => [food, stats.get(food)!]))

  // The whole-panel image is the panel itself minus its controls (marked .image-export-exclude):
  // title, period and cards.
  return (
    <section className="card food-tracker" ref={panelRef}>
      <div className="food-tracker-header">
        <button className="food-tracker-toggle" onClick={() => update({ open: !open })} aria-expanded={open}>
          <ChevronDown size={16} className={'image-export-exclude ' + (open ? 'chevron chevron--open' : 'chevron')} />
          <h2>{t('foodTracker.title')}</h2>
          {!open && foods.length > 0 && <span className="food-tracker-count">{foods.length}</span>}
        </button>
        {open && foods.length > 0 && (
          <CopyButtons
            getText={textFor(foods)}
            imageRef={panelRef}
            textLabel={t('foodTracker.copyAllText')}
            imageLabel={t('foodTracker.copyAllImage')}
          />
        )}
      </div>

      {open && (
        <div className="food-tracker-body">
          <div className="food-tracker-controls image-export-exclude">
            <FoodSearchInput
              foods={pickable}
              selectedFood={null}
              onSelect={(food) => food && update({ foods: [...foods, food] })}
              placeholder={t('foodTracker.addPlaceholder', { days: FOOD_PICKER_DAYS })}
              showAllWhenEmpty
            />
            <div className="range-buttons">
              {FOOD_TRACKER_RANGES.map((r) => (
                <button
                  key={r}
                  className={'range-button' + (range === r ? ' range-button--active' : '')}
                  onClick={() => update({ range: r })}
                >
                  {r === 0 ? t('timeline.all') : t('timeline.rangeDays', { count: r })}
                </button>
              ))}
            </div>
          </div>

          <p className="hint">
            {periodHint} · {t('foodTracker.shareHint')}
          </p>

          {foods.length === 0 ? (
            <p className="hint">{t('foodTracker.empty')}</p>
          ) : (
            <div className="food-tracker-grid">
              {foods.map((food) => (
                <FoodMiniCard
                  key={food}
                  food={food}
                  stats={stats.get(food)!}
                  periodDates={periodDates}
                  getText={textFor([food])}
                  onRemove={() => update({ foods: foods.filter((f) => f !== food) })}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  )
}

/** Columns for the back face's day grid, so the squares fill the card: 7d → 4, 15d → 5, 30d → 6. */
const backColumns = (days: number) => (days <= 7 ? 4 : days <= 15 ? 5 : 6)

/**
 * One tracked food. Front: times eaten, the eaten-days strip and the macro shares. Clicking it
 * (when the period is short enough to have a strip) flips it to a bigger day grid that labels
 * each day with its date and how many meals included the food. Both faces share one grid cell,
 * so the card keeps the taller face's height while flipping.
 */
function FoodMiniCard({
  food,
  stats,
  periodDates,
  getText,
  onRemove,
}: {
  food: string
  stats: FoodPeriodStats
  periodDates: string[] | null
  getText: () => string
  onRemove: () => void
}) {
  const { t, i18n } = useTranslation()
  const frontRef = useRef<HTMLDivElement>(null)
  const backRef = useRef<HTMLDivElement>(null)
  const [flipped, setFlipped] = useState(false)
  // ✕ asks first: an overlay on the card with Cancel (focused) and Remove.
  const [confirmingRemove, setConfirmingRemove] = useState(false)
  useEffect(() => {
    if (!confirmingRemove) return
    // Capture + preventDefault, like Modal: Escape cancels this before anything else handles it.
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      e.preventDefault()
      setConfirmingRemove(false)
    }
    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [confirmingRemove])
  const canFlip = periodDates !== null
  // A longer period has no day grid to show, so drop back to the front.
  const isFlipped = flipped && canFlip
  const toggle = () => canFlip && setFlipped((f) => !f)
  // 30d squares are too narrow for "Sat 18", so they get a single letter.
  const weekdayFormat = periodDates && periodDates.length > 15 ? 'narrow' : 'short'
  const weekdayName = (date: string) =>
    new Date(`${date}T12:00:00`).toLocaleDateString(i18n.language, { weekday: weekdayFormat }).replace(/\.$/, '')
  const dateTitle = (date: string) =>
    new Date(`${date}T12:00:00`).toLocaleDateString(i18n.language, { weekday: 'short', month: 'short', day: 'numeric' })

  // Copy buttons bottom-left with a flip hint on the right, like the meal cards' footer — and
  // out of the header, so the name gets its width. Left out of the copied image.
  const footer = (imageRef: RefObject<HTMLDivElement | null>, hint: string | null) => (
    <div className="food-mini-card-footer image-export-exclude">
      <CopyButtons
        getText={getText}
        imageRef={imageRef}
        textLabel={t('foodTracker.copyText', { food })}
        imageLabel={t('foodTracker.copyImage', { food })}
        size={13}
        className="food-search-clear"
      />
      {hint && <span className="food-mini-card-hint">{hint}</span>}
    </div>
  )

  const header = (
    <div className="food-mini-card-header">
      <span className="food-mini-card-name" title={food}>
        {food}
      </span>
      <button
        className="food-search-clear image-export-exclude"
        onClick={(e) => {
          e.stopPropagation()
          setConfirmingRemove(true)
        }}
        aria-label={t('foodTracker.remove', { food })}
        title={t('foodTracker.remove', { food })}
      >
        <X size={13} />
      </button>
    </div>
  )

  return (
    <div
      className={'food-mini-card-flip' + (canFlip ? ' food-mini-card-flip--interactive' : '')}
      onClick={toggle}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
          e.preventDefault()
          toggle()
        }
      }}
      role={canFlip ? 'button' : undefined}
      tabIndex={canFlip ? 0 : undefined}
      aria-pressed={canFlip ? isFlipped : undefined}
      aria-label={canFlip ? t(isFlipped ? 'foodTracker.showSummary' : 'foodTracker.showDays', { food }) : undefined}
    >
      <div className={'food-mini-card-inner' + (isFlipped ? ' food-mini-card-inner--flipped' : '')}>
        <div className="food-mini-card food-mini-card-face" ref={frontRef} aria-hidden={isFlipped}>
          {header}

          <div className="food-mini-card-summary">
            <span className={'food-mini-card-times' + (stats.times === 0 ? ' food-mini-card-times--zero' : '')}>
              {stats.times}
              <span className="food-mini-card-times-unit">{t('foodTracker.timesUnit', { count: stats.times })}</span>
            </span>
          </div>

          {periodDates && (
            <div
              className="food-mini-card-strip"
              style={{ gridTemplateColumns: `repeat(${Math.min(periodDates.length, STRIP_ROW_DAYS)}, 1fr)` }}
              aria-hidden="true"
            >
              {periodDates.map((date) => (
                <span
                  key={date}
                  className={
                    'food-mini-card-strip-day' +
                    (stats.timesByDate.has(date) ? ' food-mini-card-strip-day--eaten' : '')
                  }
                  title={dateTitle(date)}
                />
              ))}
            </div>
          )}

          {stats.times === 0 ? (
            <p className="food-mini-card-empty">{t('foodTracker.notEaten')}</p>
          ) : (
            <MacroRows values={stats.medianSharePct} />
          )}
          {footer(frontRef, canFlip ? t('foodTracker.daysHint') : null)}
        </div>

        {periodDates && (
          <div className="food-mini-card food-mini-card-face food-mini-card-face--back" ref={backRef} aria-hidden={!isFlipped}>
            {header}
            <div
              className="food-mini-card-days"
              style={{ gridTemplateColumns: `repeat(${backColumns(periodDates.length)}, 1fr)` }}
            >
              {periodDates.map((date) => {
                const times = stats.timesByDate.get(date) ?? 0
                return (
                  <span
                    key={date}
                    className={
                      'food-mini-card-day' +
                      (isWeekend(date) ? ' food-mini-card-day--weekend' : '') +
                      (times > 0 ? ' food-mini-card-day--eaten' : '')
                    }
                    title={`${dateTitle(date)}: ${times} ${t('foodTracker.timesUnit', { count: times })}`}
                  >
                    <span className="food-mini-card-day-date">{Number(date.slice(8))}</span>
                    <span className="food-mini-card-day-times">{times > 0 ? `${times}×` : ''}</span>
                    <span className="food-mini-card-day-name">{weekdayName(date)}</span>
                  </span>
                )
              })}
            </div>
            {footer(backRef, t('foodTracker.summaryHint'))}
          </div>
        )}
      </div>

      {confirmingRemove && (
        <div
          className="food-mini-card-confirm"
          role="alertdialog"
          aria-label={t('foodTracker.removeConfirm', { food })}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <p>{t('foodTracker.removeConfirm', { food })}</p>
          <div className="food-mini-card-confirm-actions">
            <button className="range-button" onClick={() => setConfirmingRemove(false)} autoFocus>
              {t('foodTracker.cancel')}
            </button>
            <button className="range-button food-mini-card-confirm-remove" onClick={onRemove}>
              {t('foodTracker.removeAction')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MacroRows({ values }: { values: MacroTotals | null }) {
  const { t } = useTranslation()
  if (!values) return <p className="food-mini-card-empty">—</p>
  return (
    <ul className="food-mini-card-macros">
      {MACRO_KEYS.map((key) => {
        const pct = Math.round(values[key])
        return (
          <li key={key} className={pct === 0 ? 'food-mini-card-macro-row--zero' : undefined}>
            <span className="food-mini-card-macro">{t(`common.macros.${key}`)}</span>
            <span className="food-mini-card-bar">
              <span
                className="food-mini-card-bar-fill"
                style={{ width: `${Math.min(values[key], 100)}%`, background: `var(${COLOR_VARS[key]})` }}
              />
            </span>
            <span className="food-mini-card-value">{pct}%</span>
          </li>
        )
      })}
    </ul>
  )
}
