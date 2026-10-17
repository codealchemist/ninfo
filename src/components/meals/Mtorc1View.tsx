import { forwardRef, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, ChevronDown, Copy, Image as ImageIcon, X } from 'lucide-react'
import type { Meal } from '../../data/types'
import { MTORC1_THRESHOLDS, type FeedingWindow } from '../../data/mtorc1'
import {
  formatDuration,
  formatMtorc1AsText,
  mtorc1ExportTitle,
  mtorc1TopSources,
  roundTenth as round,
} from '../../data/mtorc1Text'
import { copyElementAsImage, copyTextToClipboard } from '../../utils/clipboard'
import Mtorc1Badge, { mtorc1Tone } from './Mtorc1Badge'

// The leucine gauge's full scale — far enough past the full trigger that both threshold ticks
// sit comfortably inside it. Bigger meals just pin the fill at 100% (the value is still shown).
const GAUGE_MAX_LEUCINE = 4

interface Props {
  meal: Meal
  window: FeedingWindow
  onFlipBack: () => void
}

const pct = (value: number, max: number) => `${Math.min(value / max, 1) * 100}%`

interface GaugeTick {
  at: number
  label: string
  /** Which side of the tick its label hangs off — away from a neighboring tick's label. */
  hang: 'left' | 'right'
}

/** A bar filled to `value` of `max`, with threshold ticks — used for leucine, protein and time
 * since the previous pulse. */
function Gauge({
  label,
  valueLabel,
  value,
  max,
  ticks,
  failed = false,
}: {
  label: string
  valueLabel: string
  value: number
  max: number
  ticks: GaugeTick[]
  failed?: boolean
}) {
  return (
    <div className={'mtorc1-gauge' + (failed ? ' mtorc1-gauge--failed' : '')}>
      <div className="mtorc1-gauge-heading">
        <span>{label}</span>
        <span className="mtorc1-gauge-value">{valueLabel}</span>
      </div>
      <div className="mtorc1-gauge-track">
        <div className="mtorc1-gauge-fill" style={{ width: pct(value, max) }} />
        {ticks.map((tick, i) => (
          <span key={i} className="mtorc1-gauge-tick" style={{ left: pct(tick.at, max) }} />
        ))}
      </div>
      <div className="mtorc1-gauge-labels">
        {ticks.map((tick, i) => (
          <span key={i} className={`mtorc1-gauge-label--${tick.hang}`} style={{ left: pct(tick.at, max) }}>
            {tick.label}
          </span>
        ))}
      </div>
    </div>
  )
}

type Section = 'why' | 'sources' | 'meaning'

/** A collapsible row; the parent keeps at most one open, so the back face never outgrows the card. */
function Disclosure({
  title,
  open,
  onToggle,
  children,
}: {
  title: string
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
        <strong>{title}</strong>
        <ChevronDown size={14} className={open ? 'chevron chevron--open' : 'chevron'} />
      </button>
      {open && <div className="mtorc1-disclosure-body">{children}</div>}
    </div>
  )
}

// The pieces below are shared by the card's back face and its copy-as-image rendition, so the
// two always match; each arranges them its own way (accordion on screen, all open in the image).

/** Tile, estimated leucine and level. `compact` is the in-card size (see .mtorc1-view--screen). */
function Hero({ window, compact = false }: { window: FeedingWindow; compact?: boolean }) {
  const { t } = useTranslation()
  return (
    <div className="mtorc1-view-hero">
      <span className="mtorc1-view-tile" title={t(`meals.mtorc1.status.${window.status}`)}>
        <Mtorc1Badge window={window} size={compact ? 22 : 40} />
      </span>
      <div className="mtorc1-view-hero-text">
        <span className="mtorc1-view-hero-value">
          ≈{round(window.leucine)} g <span className="mtorc1-view-hero-unit">{t('meals.mtorc1.leucineUnit')}</span>
        </span>
        <span className="mtorc1-view-hero-level">{t(`meals.mtorc1.level.${mtorc1Tone(window)}`)}</span>
      </div>
    </div>
  )
}

/** "Why" as gauges: leucine, protein and time since the previous pulse. `withMergedNote` adds
 * the merged-meals note, on screen only since it wraps. */
function WhyGauges({ meal, window, withMergedNote = false }: { meal: Meal; window: FeedingWindow; withMergedNote?: boolean }) {
  const { t } = useTranslation()
  const th = MTORC1_THRESHOLDS
  const minutes = window.minutesSincePreviousPulse
  const otherMeals = window.meals.filter((m) => m.key !== meal.key)
  return (
    <>
      <Gauge
        label={t('meals.mtorc1.gaugeLabel')}
        valueLabel={`≈${round(window.leucine)} g`}
        value={window.leucine}
        max={GAUGE_MAX_LEUCINE}
        ticks={[
          { at: th.partialLeucineGrams, label: t('meals.mtorc1.gaugePartial', { grams: th.partialLeucineGrams }), hang: 'left' },
          { at: th.fullLeucineGrams, label: t('meals.mtorc1.gaugeFull', { grams: th.fullLeucineGrams }), hang: 'right' },
        ]}
      />
      <Gauge
        label={t('common.macros.protein')}
        valueLabel={`${Math.round(window.protein)} g`}
        value={window.protein}
        max={window.proteinThreshold * 2}
        ticks={[
          { at: window.proteinThreshold, label: t('meals.mtorc1.gaugeFull', { grams: Math.round(window.proteinThreshold) }), hang: 'right' },
        ]}
        failed={window.protein < window.proteinThreshold}
      />
      {window.previousPulseStart === null || minutes === null ? (
        <p className="mtorc1-note">{t('meals.mtorc1.checks.firstOfDay')}</p>
      ) : (
        <Gauge
          label={t('meals.mtorc1.gaugeSincePulse', { time: window.previousPulseStart })}
          valueLabel={formatDuration(minutes)}
          value={minutes}
          max={th.refractoryMinutes * 2}
          ticks={[{ at: th.refractoryMinutes, label: t('meals.mtorc1.gaugeNewPulse', { hours: th.refractoryMinutes / 60 }), hang: 'right' }]}
          failed={minutes < th.refractoryMinutes}
        />
      )}
      {withMergedNote && otherMeals.length > 0 && (
        <p className="mtorc1-note mtorc1-note--muted">
          {t('meals.mtorc1.checks.merged', {
            times: otherMeals.map((m) => m.time).join(', '),
            minutes: th.mergeWindowMinutes,
          })}
        </p>
      )}
    </>
  )
}

function SourcesList({ window }: { window: FeedingWindow }) {
  const { t } = useTranslation()
  return (
    <ul className="mtorc1-sources">
      {mtorc1TopSources(window).map((s, i) => (
        <li key={i}>
          <span className="mtorc1-source-food" title={s.food}>
            {s.food}
          </span>
          <span className="mtorc1-source-value">
            {t('meals.mtorc1.sourceValue', { leucine: round(s.leucine), protein: Math.round(s.protein) })}
          </span>
        </li>
      ))}
    </ul>
  )
}

/** The meal card's back face when flipped via the mTORC1 badge: why we think it fired, and what that means. */
const Mtorc1View = forwardRef<HTMLDivElement, Props>(function Mtorc1View({ meal, window, onFlipBack }, ref) {
  const { t } = useTranslation()
  const tone = mtorc1Tone(window)
  const hasSources = mtorc1TopSources(window).length > 0
  // Accordion: opening a section closes the others, starting on "Why".
  const [openSection, setOpenSection] = useState<Section | null>('why')
  const toggleSection = (section: Section) => setOpenSection((open) => (open === section ? null : section))

  // Text carries everything (including "What it means"); the image is the body as shown,
  // rendered off-screen at a fixed width so it doesn't depend on the card's size.
  const imageRef = useRef<HTMLDivElement>(null)
  const [textCopied, setTextCopied] = useState(false)
  const [imageCopied, setImageCopied] = useState(false)
  const flash = (setCopied: (v: boolean) => void, ok: boolean) => {
    if (!ok) return
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }
  const handleCopyText = async (e: React.MouseEvent) => {
    e.stopPropagation()
    flash(setTextCopied, await copyTextToClipboard(formatMtorc1AsText(meal, window, tone)))
  }
  const handleCopyImage = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!imageRef.current) return
    flash(setImageCopied, await copyElementAsImage(imageRef.current))
  }

  return (
    <div className="meal-items-table-wrap" ref={ref}>
      <div className="meal-items-table-header">
        <span>{t('meals.mtorc1.title')}</span>
        <div className="meal-items-table-actions">
          <button
            className="icon-button icon-button--ghost"
            onClick={handleCopyText}
            aria-label={t('meals.mtorc1.copyTextAria')}
            title={t('meals.mtorc1.copyTextTitle')}
          >
            {textCopied ? <Check size={14} /> : <Copy size={14} />}
          </button>
          <button
            className="icon-button icon-button--ghost"
            onClick={handleCopyImage}
            aria-label={t('meals.mtorc1.copyImageAria')}
            title={t('meals.mtorc1.copyImageTitle')}
          >
            {imageCopied ? <Check size={14} /> : <ImageIcon size={14} />}
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

      <div className={`mtorc1-view mtorc1-view--screen mtorc1-tone--${tone}`}>
        <Hero window={window} compact />
        <Disclosure title={t('meals.mtorc1.whyTitle')} open={openSection === 'why'} onToggle={() => toggleSection('why')}>
          <WhyGauges meal={meal} window={window} withMergedNote />
        </Disclosure>
        {hasSources && (
          <Disclosure
            title={t('meals.mtorc1.sourcesTitle')}
            open={openSection === 'sources'}
            onToggle={() => toggleSection('sources')}
          >
            <SourcesList window={window} />
          </Disclosure>
        )}
        <Disclosure
          title={t('meals.mtorc1.meaningTitle')}
          open={openSection === 'meaning'}
          onToggle={() => toggleSection('meaning')}
        >
          <p className="mtorc1-view-meaning">{t(`meals.mtorc1.meaning.${window.status}`)}</p>
          <p className="mtorc1-view-footnote">{t('meals.mtorc1.footnote')}</p>
        </Disclosure>
      </div>

      <div className="day-summary-share-offscreen" aria-hidden="true">
        <div ref={imageRef} className={`card mtorc1-view mtorc1-share mtorc1-tone--${tone}`}>
          <div className="mtorc1-share-title">{mtorc1ExportTitle(meal)}</div>
          <Hero window={window} />
          <div className="mtorc1-section">
            <strong>{t('meals.mtorc1.whyTitle')}</strong>
            <WhyGauges meal={meal} window={window} />
          </div>
          {hasSources && (
            <div className="mtorc1-section">
              <strong>{t('meals.mtorc1.sourcesTitle')}</strong>
              <SourcesList window={window} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
})

export default Mtorc1View
