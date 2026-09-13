const SIZE = 76
const CENTER = SIZE / 2
const RADIUS = 30
const STROKE = 7
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface Props {
  label: string
  pct: number
  color: string
}

/** A single-arc ring showing one liquid type's share of the total intake — same drawing
 * technique as GoalProgressRing, simplified since there's no goal/overflow to track here,
 * just a 0-100% share of a whole. */
export default function LiquidShareGauge({ label, pct, color }: Props) {
  const clamped = Math.min(Math.max(pct, 0), 100)
  const dash = (clamped / 100) * CIRCUMFERENCE

  return (
    <div className="progress-ring">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle cx={CENTER} cy={CENTER} r={RADIUS} fill="none" stroke="var(--ring-track)" strokeWidth={STROKE} />
        <circle
          cx={CENTER}
          cy={CENTER}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeDasharray={`${dash} ${CIRCUMFERENCE}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${CENTER} ${CENTER})`}
        />
        <text x="50%" y="52%" textAnchor="middle" className="progress-ring-value">
          {Math.round(clamped)}%
        </text>
      </svg>
      <span className="progress-ring-label">{label}</span>
    </div>
  )
}
