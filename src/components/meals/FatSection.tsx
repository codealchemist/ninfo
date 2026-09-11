import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown } from 'lucide-react'
import type { LipidTotals } from '../../data/types'
import { LIPID_LABELS } from '../../data/types'
import type { FatBreakdown } from '../../data/lipidAnalysis'
import TwoValueDial from './TwoValueDial'

const round = (n: number) => Math.round(n * 10) / 10

function formatRatio(a: number, b: number): string {
  if (a === 0 && b === 0) return '–'
  if (b === 0) return '∞'
  return `${round(a / b)}:1`
}

interface Props {
  lipids: LipidTotals
  breakdown: FatBreakdown
}

export default function FatSection({ lipids, breakdown }: Props) {
  const { t } = useTranslation()
  const [detailsOpen, setDetailsOpen] = useState(false)

  return (
    <div
      className="fat-section"
      onClick={(e) => {
        e.stopPropagation()
        setDetailsOpen((o) => !o)
      }}
    >
      <div className="fat-dials-row">
        <div className="fat-dial-row">
          <TwoValueDial
            valueA={breakdown.saturated}
            valueB={breakdown.unsaturated}
            colorA="var(--fat-saturated)"
            colorB="var(--fat-unsaturated)"
            centerLabel={formatRatio(breakdown.saturated, breakdown.unsaturated)}
            title={t('meals.fatSection.ratioTitleSatUnsat', {
              a: round(breakdown.saturated),
              b: round(breakdown.unsaturated),
            })}
          />
          <div className="fat-dial-legend">
            <LegendItem
              colorVar="--fat-saturated"
              label={t('meals.fatSection.saturated')}
              value={`${round(breakdown.saturated)}g`}
            />
            <LegendItem
              colorVar="--fat-unsaturated"
              label={t('meals.fatSection.unsaturated')}
              value={`${round(breakdown.unsaturated)}g`}
            />
          </div>
        </div>

        <div className="fat-dial-row">
          <TwoValueDial
            valueA={breakdown.omega6}
            valueB={breakdown.omega3}
            colorA="var(--fat-omega6)"
            colorB="var(--fat-omega3)"
            centerLabel={formatRatio(breakdown.omega6, breakdown.omega3)}
            title={t('meals.fatSection.ratioTitleOmega', {
              a: round(breakdown.omega6),
              b: round(breakdown.omega3),
            })}
          />
          <div className="fat-dial-legend">
            <LegendItem colorVar="--fat-omega6" label={LIPID_LABELS.omega6} value={`${round(breakdown.omega6)}g`} />
            <LegendItem colorVar="--fat-omega3" label={LIPID_LABELS.omega3} value={`${round(breakdown.omega3)}g`} />
          </div>
        </div>
      </div>

      <div className="fat-section-hint">
        <span>{breakdown.trans > 0 ? t('meals.fatSection.transHint', { grams: round(breakdown.trans) }) : ''}</span>
        <ChevronDown size={12} className={detailsOpen ? 'chevron chevron--open' : 'chevron'} />
      </div>

      {detailsOpen && (
        <div className="fat-details-panel" onClick={(e) => e.stopPropagation()}>
          <FatDetailsList lipids={lipids} />
        </div>
      )}
    </div>
  )
}

function LegendItem({ colorVar, label, value }: { colorVar: string; label: string; value: string }) {
  return (
    <div className="fat-legend-item">
      <span className="fat-legend-swatch" style={{ background: `var(${colorVar})` }} />
      <span className="fat-legend-label">{label}</span>
      <span className="fat-legend-value">{value}</span>
    </div>
  )
}

function FatDetailsList({ lipids }: { lipids: LipidTotals }) {
  const { t } = useTranslation()
  const groups: Array<{ heading: string; keys: Array<keyof LipidTotals> }> = [
    { heading: t('meals.fatSection.unsaturated'), keys: ['omega3', 'omega6', 'omega9'] },
    { heading: t('meals.fatSection.saturated'), keys: ['scfa', 'mcfa', 'lcfa'] },
    { heading: t('meals.fatSection.trans'), keys: ['tox'] },
  ]

  return (
    <div className="fat-details-list">
      {groups.map((group) => (
        <div key={group.heading} className="fat-details-group">
          <div className="fat-details-heading">{group.heading}</div>
          {group.keys.map((key) => (
            <div className="fat-details-row" key={key}>
              <span>{LIPID_LABELS[key]}</span>
              <span>{round(lipids[key])} g</span>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
