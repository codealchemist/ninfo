import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Activity, Check, CalendarRange, LayoutDashboard, QrCode as QrCodeIcon, RefreshCw, RotateCcw, Salad, Share2 } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { getSheetLink } from '../../db/sheetLinkStorage'
import { buildShareableAppUrl } from '../../utils/googleSheetUrl'
import { copyTextToClipboard } from '../../utils/clipboard'
import DateNavigator from './DateNavigator'
import MacroFilterChips from './MacroFilterChips'
import ShareQrModal from '../common/ShareQrModal'

const MODE_LABEL: Record<string, string> = {
  demo: 'Demo',
  upload: 'Snapshot',
  'sheet-link': 'Linked',
  google: 'Live',
}

export default function TopBar() {
  const meta = useAppStore((s) => s.meta)
  const status = useAppStore((s) => s.status)
  const reset = useAppStore((s) => s.reset)
  const refreshSheetLink = useAppStore((s) => s.refreshSheetLink)
  const sheetLinkId = useAppStore((s) => s.sheetLinkId)
  const [shared, setShared] = useState(false)
  const [qrUrl, setQrUrl] = useState<string | null>(null)

  const shareUrl = (): string | null => {
    if (!sheetLinkId) return null
    const link = getSheetLink(sheetLinkId)
    return link ? buildShareableAppUrl(link.url) : null
  }

  const handleShare = async () => {
    const url = shareUrl()
    if (!url) return
    const ok = await copyTextToClipboard(url)
    if (ok) {
      setShared(true)
      setTimeout(() => setShared(false), 1500)
    }
  }

  const handleShareAsQr = () => {
    const url = shareUrl()
    if (url) setQrUrl(url)
  }

  return (
    <header className="top-bar">
      <div className="top-bar-row">
        <div className="brand">
          <Link to="/" className="brand-link" title="Back to welcome">
            <Salad size={22} />
            <span className="brand-name">Ninfo</span>
          </Link>
          <span className="brand-version">v{__APP_VERSION__}</span>
          {meta && <span className={`mode-badge mode-badge--${meta.mode}`}>{MODE_LABEL[meta.mode]}</span>}
        </div>
        <nav className="top-nav">
          <NavLink to="/app/today" className={({ isActive }) => (isActive ? 'active' : '')}>
            <LayoutDashboard size={16} /> <span>Today</span>
          </NavLink>
          <NavLink to="/app/timeline" className={({ isActive }) => (isActive ? 'active' : '')}>
            <CalendarRange size={16} /> <span>Timeline</span>
          </NavLink>
          <NavLink to="/app/bia" className={({ isActive }) => (isActive ? 'active' : '')}>
            <Activity size={16} /> <span>BIA</span>
          </NavLink>
        </nav>
        {meta?.mode === 'sheet-link' && (
          <>
            <button
              className="link-button"
              onClick={() => refreshSheetLink()}
              disabled={status === 'loading'}
              title="Re-fetch the latest data from the linked sheet"
            >
              <RefreshCw size={14} className={status === 'loading' ? 'spin' : undefined} />{' '}
              <span>Refresh</span>
            </button>
            <button
              className="link-button"
              onClick={handleShare}
              title="Copy a link that opens this spreadsheet directly in Ninfo"
            >
              {shared ? <Check size={14} /> : <Share2 size={14} />}{' '}
              <span>{shared ? 'Copied!' : 'Share'}</span>
            </button>
            <button
              className="link-button"
              onClick={handleShareAsQr}
              title="Show a QR code that opens this spreadsheet directly in Ninfo"
            >
              <QrCodeIcon size={14} /> <span>QR code</span>
            </button>
          </>
        )}
        <button className="link-button" onClick={reset} title="Start over">
          <RotateCcw size={14} /> <span>Start over</span>
        </button>
      </div>
      <div className="top-bar-row top-bar-row--secondary">
        <DateNavigator />
        <MacroFilterChips />
      </div>
      {qrUrl && <ShareQrModal url={qrUrl} onClose={() => setQrUrl(null)} />}
    </header>
  )
}
