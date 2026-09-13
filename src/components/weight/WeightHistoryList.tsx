import { List, type RowComponentProps } from 'react-window'
import { useTranslation } from 'react-i18next'
import type { WeightEntry } from '../../data/parsers/pesoParser'

const ROW_HEIGHT = 36
const MAX_LIST_HEIGHT = 360

function fmtWeight(value: number): string {
  return value.toFixed(1)
}

interface RowProps {
  rows: WeightEntry[]
  locale: string
}

function WeightRow({ index, style, rows, locale }: RowComponentProps<RowProps>) {
  const e = rows[index]
  const date = new Date(e.date + 'T00:00:00').toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="virtual-row" style={style}>
      <span className="virtual-col virtual-col-date">{date}</span>
      <span className="virtual-col virtual-col-weight">{fmtWeight(e.weightKg)} kg</span>
      <span className="virtual-col virtual-col-notes">{e.notes ?? ''}</span>
    </div>
  )
}

interface Props {
  entries: WeightEntry[]
}

/** Virtualized so a long log (potentially years of measurements) only ever renders the rows
 * actually in view, with the panel itself capped to a fixed height that scrolls internally —
 * same approach as LiquidHistoryList. */
export default function WeightHistoryList({ entries }: Props) {
  const { t, i18n } = useTranslation()
  const listHeight = Math.min(MAX_LIST_HEIGHT, Math.max(entries.length, 1) * ROW_HEIGHT)

  return (
    <div className="virtual-table">
      <div className="virtual-row virtual-row--header">
        <span className="virtual-col virtual-col-date">{t('bia.table.date')}</span>
        <span className="virtual-col virtual-col-weight">{t('weight.metrics.weight')}</span>
        <span className="virtual-col virtual-col-notes">{t('bia.table.notes')}</span>
      </div>
      <List
        rowComponent={WeightRow}
        rowCount={entries.length}
        rowHeight={ROW_HEIGHT}
        rowProps={{ rows: entries, locale: i18n.language }}
        style={{ height: listHeight, width: '100%' }}
      />
    </div>
  )
}
