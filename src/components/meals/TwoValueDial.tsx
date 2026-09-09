const SIZE = 64
const STROKE = 8
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

interface Props {
  valueA: number
  valueB: number
  colorA: string
  colorB: string
  centerLabel: string
  title: string
}

/** A small donut gauge splitting valueA vs valueB as two arcs. */
export default function TwoValueDial({ valueA, valueB, colorA, colorB, centerLabel, title }: Props) {
  const total = valueA + valueB
  const arcA = total > 0 ? (valueA / total) * CIRCUMFERENCE : 0

  return (
    <div className="fat-dial" title={title}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        {total > 0 ? (
          <>
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={colorB}
              strokeWidth={STROKE}
            />
            <circle
              cx={SIZE / 2}
              cy={SIZE / 2}
              r={RADIUS}
              fill="none"
              stroke={colorA}
              strokeWidth={STROKE}
              strokeDasharray={`${arcA} ${CIRCUMFERENCE}`}
              strokeLinecap="butt"
              transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            />
          </>
        ) : (
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={RADIUS}
            fill="none"
            stroke="var(--ring-track)"
            strokeWidth={STROKE}
          />
        )}
        <text x="50%" y="53%" textAnchor="middle" className="fat-dial-label">
          {centerLabel}
        </text>
      </svg>
    </div>
  )
}
