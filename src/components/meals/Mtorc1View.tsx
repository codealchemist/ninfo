import { forwardRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, Info, X } from 'lucide-react'
import type { Meal } from '../../data/types'
import { MTORC1_THRESHOLDS, estimateLeucine, type FeedingWindow } from '../../data/mtorc1'
import Mtorc1Badge, { mtorc1Tone } from './Mtorc1Badge'

// The leucine gauge's full scale — far enough past the full trigger that both threshold ticks
// sit comfortably inside it. Bigger meals just pin the fill at 100% (the value is still shown).
const GAUGE_MAX_LEUCINE = 4

interface Props {
  meal: Meal
  window: FeedingWindow
  onFlipBack: () => void
}

const round = (n: number) => Math.round(n * 10) / 10

type Section = 'why' | 'meaning' | 'sources'

/** A collapsible row: the header toggles it; the parent keeps at most one open at a time. */
function Disclosure({
  title,
  open,
  onToggle,
  children,
}: {
  title: React.ReactNode
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="mtorc1-disclosure">
      <button
        className="mtorc1-disclosure-header"
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        aria-expanded={open}
      >
        <span>{title}</span>
        <ChevronDown size={14} className={open ? 'chevron chevron--open' : 'chevron'} />
      </button>
      {open && <div className="mtorc1-disclosure-body">{children}</div>}
    </div>
  )
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`
}

type CheckState = 'pass' | 'fail' | 'info'

const CHECK_ICONS = { pass: Check, fail: X, info: Info }

function CheckRow({ state, children }: { state: CheckState; children: React.ReactNode }) {
  const Icon = CHECK_ICONS[state]
  return (
    <li className={`mtorc1-check mtorc1-check--${state}`}>
      <Icon size={14} className="mtorc1-check-icon" />
      <span>{children}</span>
    </li>
  )
}

/** The meal card's back face when flipped via the mTORC1 badge: why we think it fired, and what that means. */
const Mtorc1View = forwardRef<HTMLDivElement, Props>(function Mtorc1View({ meal, window, onFlipBack }, ref) {
  const { t } = useTranslation()
  const th = MTORC1_THRESHOLDS
  // Only the big icon is always on; "Why", the status explanation and the sources open one at
  // a time (starting on "Why"), so the back face stays about the size of the front instead of
  // growing to show everything at once.
  const [openSection, setOpenSection] = useState<Section | null>('why')
  const toggleSection = (section: Section) => setOpenSection((open) => (open === section ? null : section))

  const gaugePct = (grams: number) => `${Math.min(grams / GAUGE_MAX_LEUCINE, 1) * 100}%`
  const proteinState: CheckState = window.protein >= window.proteinThreshold ? 'pass' : 'fail'
  const timingState: CheckState =
    window.minutesSincePreviousPulse === null || window.minutesSincePreviousPulse >= th.refractoryMinutes
      ? 'pass'
      : 'fail'

  const otherMeals = window.meals.filter((m) => m.key !== meal.key)
  const topSources = window.meals
    .flatMap((m) => m.items)
    .map((item) => ({ food: item.food, protein: item.protein, leucine: estimateLeucine(item) }))
    .filter((s) => s.leucine >= 0.05)
    .sort((a, b) => b.leucine - a.leucine)
    .slice(0, 3)

  return (
    <div className="meal-items-table-wrap" ref={ref}>
      <div className="meal-items-table-header">
        <span>{t('meals.mtorc1.title')}</span>
        <div className="meal-items-table-actions">
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

      <div className={`mtorc1-view mtorc1-tone--${mtorc1Tone(window)}`}>
        <div className="mtorc1-view-hero">
          <span className="mtorc1-view-tile" title={t(`meals.mtorc1.status.${window.status}`)}>
            <Mtorc1Badge window={window} size={40} />
          </span>
          <div className="mtorc1-view-hero-text">
            <span className="mtorc1-view-hero-value">
              ≈{round(window.leucine)} g <span className="mtorc1-view-hero-unit">{t('meals.mtorc1.leucineUnit')}</span>
            </span>
            <span className="mtorc1-view-hero-level">{t(`meals.mtorc1.level.${mtorc1Tone(window)}`)}</span>
          </div>
        </div>

        <Disclosure
          title={<strong>{t('meals.mtorc1.whyTitle')}</strong>}
          open={openSection === 'why'}
          onToggle={() => toggleSection('why')}
        >
          <div className="mtorc1-gauge">
            <span>{t('meals.mtorc1.gaugeLabel')}</span>
            <div className="mtorc1-gauge-track">
              <div className="mtorc1-gauge-fill" style={{ width: gaugePct(window.leucine) }} />
              <span className="mtorc1-gauge-tick" style={{ left: gaugePct(th.partialLeucineGrams) }} />
              <span className="mtorc1-gauge-tick" style={{ left: gaugePct(th.fullLeucineGrams) }} />
            </div>
            <div className="mtorc1-gauge-labels">
              <span className="mtorc1-gauge-label--partial" style={{ left: gaugePct(th.partialLeucineGrams) }}>
                {t('meals.mtorc1.gaugePartial', { grams: th.partialLeucineGrams })}
              </span>
              <span className="mtorc1-gauge-label--full" style={{ left: gaugePct(th.fullLeucineGrams) }}>
                {t('meals.mtorc1.gaugeFull', { grams: th.fullLeucineGrams })}
              </span>
            </div>
          </div>
          <ul className="mtorc1-checks">
            <CheckRow state={proteinState}>
              {window.weightKg
                ? t('meals.mtorc1.checks.proteinPerKg', {
                    grams: Math.round(window.protein),
                    needed: Math.round(window.proteinThreshold),
                    perKg: th.proteinPerKg,
                    kg: round(window.weightKg),
                  })
                : t('meals.mtorc1.checks.proteinFallback', {
                    grams: Math.round(window.protein),
                    needed: th.fallbackProteinGrams,
                  })}
            </CheckRow>
            <CheckRow state={timingState}>
              {window.previousPulseStart === null || window.minutesSincePreviousPulse === null
                ? t('meals.mtorc1.checks.firstOfDay')
                : t('meals.mtorc1.checks.sincePrevious', {
                    duration: formatDuration(window.minutesSincePreviousPulse),
                    time: window.previousPulseStart,
                    hours: th.refractoryMinutes / 60,
                  })}
            </CheckRow>
            {otherMeals.length > 0 && (
              <CheckRow state="info">
                {t('meals.mtorc1.checks.merged', {
                  times: otherMeals.map((m) => m.time).join(', '),
                  minutes: th.mergeWindowMinutes,
                })}
              </CheckRow>
            )}
          </ul>
        </Disclosure>

        <Disclosure
          title={<strong>{t('meals.mtorc1.meaningTitle')}</strong>}
          open={openSection === 'meaning'}
          onToggle={() => toggleSection('meaning')}
        >
          <p className="mtorc1-view-meaning">{t(`meals.mtorc1.meaning.${window.status}`)}</p>
          <p className="mtorc1-view-footnote">{t('meals.mtorc1.footnote')}</p>
        </Disclosure>

        {topSources.length > 0 && (
          <Disclosure
            title={<strong>{t('meals.mtorc1.sourcesTitle')}</strong>}
            open={openSection === 'sources'}
            onToggle={() => toggleSection('sources')}
          >
            <ul className="mtorc1-sources">
              {topSources.map((s, i) => (
                <li key={i}>
                  <span className="mtorc1-source-food">{s.food}</span>
                  <span className="mtorc1-source-value">
                    {t('meals.mtorc1.sourceValue', { leucine: round(s.leucine), protein: Math.round(s.protein) })}
                  </span>
                </li>
              ))}
            </ul>
          </Disclosure>
        )}
      </div>
    </div>
  )
})

export default Mtorc1View
