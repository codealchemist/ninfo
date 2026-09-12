import type { WarningStamp } from '../../data/warningStamps'

interface Props {
  warnings: WarningStamp[]
}

/** A hexagon "stamp" per warning, text wrapping newspaper-style beside then below it. */
export default function WarningStampList({ warnings }: Props) {
  return (
    <div className="warning-stamp-list">
      {warnings.map((warning) => (
        <div key={warning.key} className="warning-stamp-row">
          <div className="warning-stamp-hex">{warning.stamp}</div>
          <p className="warning-stamp-text">{warning.description}</p>
        </div>
      ))}
    </div>
  )
}
