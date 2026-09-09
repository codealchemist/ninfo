import { Link, NavLink } from 'react-router-dom'
import { CalendarRange, LayoutDashboard, RefreshCw, RotateCcw, Salad } from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import DateNavigator from './DateNavigator'
import MacroFilterChips from './MacroFilterChips'

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
        </nav>
        {meta?.mode === 'sheet-link' && (
          <button
            className="link-button"
            onClick={() => refreshSheetLink()}
            disabled={status === 'loading'}
            title="Re-fetch the latest data from the linked sheet"
          >
            <RefreshCw size={14} className={status === 'loading' ? 'spin' : undefined} />{' '}
            <span>Refresh</span>
          </button>
        )}
        <button className="link-button" onClick={reset} title="Start over">
          <RotateCcw size={14} /> <span>Start over</span>
        </button>
      </div>
      <div className="top-bar-row top-bar-row--secondary">
        <DateNavigator />
        <MacroFilterChips />
      </div>
    </header>
  )
}
