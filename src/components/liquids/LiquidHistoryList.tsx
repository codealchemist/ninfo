import { List, type RowComponentProps } from 'react-window'
import { useTranslation } from 'react-i18next'
import type { LiquidEntry } from '../../data/parsers/liquidoParser'

const ROW_HEIGHT = 36
const MAX_LIST_HEIGHT = 360

function fmtAmount(value: number): string {
  return Math.round(value).toLocaleString()
}

/** Real (measured) amount when logged, falling back to the nominal amount otherwise. */
function amountOf(entry: LiquidEntry): number {
  return entry.realAmountMl || entry.amountMl
}

interface RowProps {
  rows: LiquidEntry[]
  locale: string
}

function LiquidRow({ index, style, rows, locale }: RowComponentProps<RowProps>) {
  const e = rows[index]
  const date = new Date(e.date + 'T00:00:00').toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="virtual-row" style={style}>
      <span className="virtual-col virtual-col-date">{date}</span>
      <span className="virtual-col virtual-col-time">{[e.startTime, e.endTime].filter(Boolean).join(' – ') || '—'}</span>
      <span className="virtual-col virtual-col-duration">{e.duration ?? ''}</span>
      <span className="virtual-col virtual-col-type">{e.liquidType}</span>
      <span className="virtual-col virtual-col-amount">{fmtAmount(amountOf(e))} ml</span>
      <span className="virtual-col virtual-col-notes">{e.notes ?? ''}</span>
    </div>
  )
}

interface Props {
  entries: LiquidEntry[]
}

/** Virtualized so a long log (potentially years of entries) only ever renders the rows
 * actually in view, with the panel itself capped to a fixed height that scrolls internally. */
export default function LiquidHistoryList({ entries }: Props) {
  const { t, i18n } = useTranslation()
  const listHeight = Math.min(MAX_LIST_HEIGHT, Math.max(entries.length, 1) * ROW_HEIGHT)

  return (
    <div className="virtual-table">
      <div className="virtual-row virtual-row--header">
        <span className="virtual-col virtual-col-date">{t('bia.table.date')}</span>
        <span className="virtual-col virtual-col-time">{t('liquid.table.time')}</span>
        <span className="virtual-col virtual-col-duration">{t('liquid.table.duration')}</span>
        <span className="virtual-col virtual-col-type">{t('liquid.table.type')}</span>
        <span className="virtual-col virtual-col-amount">{t('liquid.table.amount')}</span>
        <span className="virtual-col virtual-col-notes">{t('bia.table.notes')}</span>
      </div>
      <List
        rowComponent={LiquidRow}
        rowCount={entries.length}
        rowHeight={ROW_HEIGHT}
        rowProps={{ rows: entries, locale: i18n.language }}
        style={{ height: listHeight, width: '100%' }}
      />
    </div>
  )
}
