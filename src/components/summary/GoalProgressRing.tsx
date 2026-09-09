const SIZE = 72
const STROKE = 7
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface Props {
  label: string
  value: number
  goal: number | null
  unit: string
  colorVar: string
}

export default function GoalProgressRing({ label, value, goal, unit, colorVar }: Props) {
  const pct = goal && goal > 0 ? Math.min(value / goal, 1.5) : 0
  const dash = Math.min(pct, 1) * CIRCUMFERENCE
  const overGoal = goal != null && value > goal
  const diff = goal != null ? value - goal : null
  const diffSign = diff != null && diff >= 0 ? '+' : ''

  return (
    <div className="progress-ring">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--ring-track)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={`var(${colorVar})`}
          strokeWidth={STROKE}
          strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
        <text x="50%" y="47%" textAnchor="middle" className="progress-ring-value">
          {Math.round(value)}
        </text>
        <text x="50%" y="64%" textAnchor="middle" className="progress-ring-unit">
          {unit}
        </text>
      </svg>
      <span className="progress-ring-label">{label}</span>
      {goal != null && (
        <span className={'progress-ring-goal' + (overGoal ? ' progress-ring-goal--over' : '')}>
          / {Math.round(goal)} {unit}
        </span>
      )}
      {diff != null && (
        <span className={'progress-ring-diff' + (overGoal ? ' progress-ring-diff--over' : '')}>
          {diffSign}
          {Math.round(diff)} {unit} vs goal
        </span>
      )}
    </div>
  )
}
