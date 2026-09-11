import { useTranslation } from 'react-i18next'

const SIZE = 86
const CENTER = SIZE / 2

const INNER_RADIUS = 30
const INNER_STROKE = 7
const INNER_CIRCUMFERENCE = 2 * Math.PI * INNER_RADIUS

// The overflow ring sits just outside the goal ring, thinner and only drawn once there's
// something to show — a distinct "second ring" rather than a darker overlay on the first.
const OUTER_RADIUS = 37.5
const OUTER_STROKE = 4
const OUTER_CIRCUMFERENCE = 2 * Math.PI * OUTER_RADIUS

interface Props {
  label: string
  value: number
  goal: number | null
  unit: string
  colorVar: string
  /** Label/goal/diff below the dial — always shown in the share-card export, toggleable on screen. */
  showDetails?: boolean
}

export default function GoalProgressRing({ label, value, goal, unit, colorVar, showDetails = true }: Props) {
  const { t } = useTranslation()
  const ratio = goal && goal > 0 ? value / goal : 0
  const innerDash = Math.min(ratio, 1) * INNER_CIRCUMFERENCE
  // Capped at one extra full lap (200% of goal) — beyond that, more precision on the ring
  // itself isn't useful at this size; the exact number is still shown as text below.
  const overflowRatio = Math.max(0, Math.min(ratio - 1, 1))
  const outerDash = overflowRatio * OUTER_CIRCUMFERENCE

  const overGoal = goal != null && value > goal
  const diff = goal != null ? value - goal : null
  const diffSign = diff != null && diff >= 0 ? '+' : ''
  const pctOver = goal != null && ratio > 1 ? Math.round((ratio - 1) * 100) : null
  const pctMissing = goal != null && ratio <= 1 ? Math.round((1 - ratio) * 100) : null

  return (
    <div className="progress-ring">
      <div className="progress-ring-dial">
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <circle
            cx={CENTER}
            cy={CENTER}
            r={INNER_RADIUS}
            fill="none"
            stroke="var(--ring-track)"
            strokeWidth={INNER_STROKE}
          />
          <circle
            cx={CENTER}
            cy={CENTER}
            r={INNER_RADIUS}
            fill="none"
            stroke={`var(${colorVar})`}
            strokeWidth={INNER_STROKE}
            strokeDasharray={`${innerDash} ${INNER_CIRCUMFERENCE}`}
            strokeLinecap="round"
            transform={`rotate(-90 ${CENTER} ${CENTER})`}
          />
          {outerDash > 0 && (
            <>
              <circle
                cx={CENTER}
                cy={CENTER}
                r={OUTER_RADIUS}
                fill="none"
                stroke="var(--ring-track)"
                strokeWidth={OUTER_STROKE}
              />
              <circle
                cx={CENTER}
                cy={CENTER}
                r={OUTER_RADIUS}
                fill="none"
                stroke={`var(${colorVar}-over)`}
                strokeWidth={OUTER_STROKE}
                strokeDasharray={`${outerDash} ${OUTER_CIRCUMFERENCE}`}
                strokeLinecap="round"
                transform={`rotate(-90 ${CENTER} ${CENTER})`}
              />
            </>
          )}
          <text x="50%" y="47%" textAnchor="middle" className="progress-ring-value">
            {Math.round(value)}
          </text>
          <text x="50%" y="64%" textAnchor="middle" className="progress-ring-unit">
            {unit}
          </text>
        </svg>
        {pctMissing != null && (
          <span className="progress-ring-badge progress-ring-badge--under">
            <span className="progress-ring-badge-pct">{t('today.pctMissing', { pct: pctMissing })}</span>
            <span className="progress-ring-badge-value">
              {diffSign}
              {Math.round(diff!)} {unit}
            </span>
          </span>
        )}
        {pctOver != null && (
          <span className="progress-ring-badge progress-ring-badge--over">
            <span className="progress-ring-badge-pct">{t('today.pctOver', { pct: pctOver })}</span>
            <span className="progress-ring-badge-value">
              {diffSign}
              {Math.round(diff!)} {unit}
            </span>
          </span>
        )}
      </div>
      <span className="progress-ring-label">{label}</span>
      {showDetails && (
        <div className="progress-ring-details">
          {goal != null && (
            <span className={'progress-ring-goal' + (overGoal ? ' progress-ring-goal--over' : '')}>
              {Math.round(goal)} {unit}
            </span>
          )}
          {diff != null && (
            <span className={'progress-ring-diff' + (overGoal ? ' progress-ring-diff--over' : '')}>
              {diffSign}
              {Math.round(diff)} {unit} {t('today.vsGoal')}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
