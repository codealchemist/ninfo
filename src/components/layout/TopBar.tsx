import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  Check,
  CalendarRange,
  Droplet,
  FileDown,
  LayoutDashboard,
  Menu,
  QrCode as QrCodeIcon,
  RefreshCw,
  RotateCcw,
  Salad,
  Scale,
  Share2,
  X,
} from 'lucide-react'
import { useAppStore } from '../../store/appStore'
import { getSheetLink } from '../../db/sheetLinkStorage'
import { buildShareableAppUrl } from '../../utils/googleSheetUrl'
import { copyTextToClipboard } from '../../utils/clipboard'
import { setLanguage, type SupportedLanguage } from '../../i18n'
import MobileMenu from './MobileMenu'
import ShareQrModal from '../common/ShareQrModal'
import ToggleSwitch from '../common/ToggleSwitch'

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'EN' },
  { value: 'es', label: 'ES' },
]

export default function TopBar() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const meta = useAppStore((s) => s.meta)
  const status = useAppStore((s) => s.status)
  const reset = useAppStore((s) => s.reset)
  const refreshSheetLink = useAppStore((s) => s.refreshSheetLink)
  const sheetLinkId = useAppStore((s) => s.sheetLinkId)
  const pinnedDate = useAppStore((s) => s.pinnedDate)
  const setSelectedDate = useAppStore((s) => s.setSelectedDate)
  const goToToday = useAppStore((s) => s.goToToday)
  const clearPinnedDate = useAppStore((s) => s.clearPinnedDate)
  const [shared, setShared] = useState(false)
  const [qrUrl, setQrUrl] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)

  const handleGoToChipDate = () => {
    if (pinnedDate) setSelectedDate(pinnedDate)
    navigate('/app/today')
  }

  const handleRemoveDateChip = () => {
    clearPinnedDate()
    goToToday()
    navigate('/app/today')
  }

  const modeLabels: Record<string, string> = {
    demo: t('topBar.modeLabels.demo'),
    upload: t('topBar.modeLabels.upload'),
    'sheet-link': t('topBar.modeLabels.sheetLink'),
    google: t('topBar.modeLabels.google'),
  }

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
      <div className="top-bar-mobile-row">
        <div className="top-bar-mobile-brand">
          <button className="hamburger-button" onClick={() => setMenuOpen(true)} aria-label={t('mobileMenu.openAria')}>
            <Menu size={20} />
          </button>
          <Link to="/" className="brand-link" title={t('topBar.backToWelcome')}>
            <Salad size={20} />
            <span className="brand-name">Ninfo</span>
          </Link>
        </div>
        <div className="top-bar-mobile-actions">
          <NavLink
            to="/app/today"
            onClick={() => goToToday()}
            className={({ isActive }) => 'mobile-nav-icon' + (isActive ? ' active' : '')}
            aria-label={t('topBar.nav.today')}
            title={t('topBar.nav.today')}
          >
            <LayoutDashboard size={18} />
          </NavLink>
          <NavLink
            to="/app/timeline"
            className={({ isActive }) => 'mobile-nav-icon' + (isActive ? ' active' : '')}
            aria-label={t('topBar.nav.timeline')}
            title={t('topBar.nav.timeline')}
          >
            <CalendarRange size={18} />
          </NavLink>
          <NavLink
            to="/app/bia"
            className={({ isActive }) => 'mobile-nav-icon' + (isActive ? ' active' : '')}
            aria-label={t('topBar.nav.bia')}
            title={t('topBar.nav.bia')}
          >
            <Activity size={18} />
          </NavLink>
          <NavLink
            to="/app/weight"
            className={({ isActive }) => 'mobile-nav-icon' + (isActive ? ' active' : '')}
            aria-label={t('topBar.nav.weight')}
            title={t('topBar.nav.weight')}
          >
            <Scale size={18} />
          </NavLink>
          <NavLink
            to="/app/liquids"
            className={({ isActive }) => 'mobile-nav-icon' + (isActive ? ' active' : '')}
            aria-label={t('topBar.nav.liquids')}
            title={t('topBar.nav.liquids')}
          >
            <Droplet size={18} />
          </NavLink>
          {meta?.mode === 'sheet-link' && (
            <button
              className="icon-button icon-button--ghost"
              onClick={() => refreshSheetLink()}
              disabled={status === 'loading'}
              aria-label={t('topBar.refreshTitle')}
              title={t('topBar.refreshTitle')}
            >
              <RefreshCw size={16} className={status === 'loading' ? 'spin' : undefined} />
            </button>
          )}
        </div>
      </div>
      <div className="top-bar-row">
        <div className="brand">
          <Link to="/" className="brand-link" title={t('topBar.backToWelcome')}>
            <Salad size={22} />
            <span className="brand-name">Ninfo</span>
          </Link>
          <span className="brand-version">v{__APP_VERSION__}</span>
          {meta && <span className={`mode-badge mode-badge--${meta.mode}`}>{modeLabels[meta.mode]}</span>}
          <ToggleSwitch
            toggle={{
              options: LANGUAGE_OPTIONS,
              value: i18n.language,
              onChange: (value) => setLanguage(value as SupportedLanguage),
            }}
          />
        </div>
        <nav className="top-nav">
          <NavLink to="/app/today" onClick={() => goToToday()} className={({ isActive }) => (isActive ? 'active' : '')}>
            <LayoutDashboard size={16} /> <span>{t('topBar.nav.today')}</span>
          </NavLink>
          {pinnedDate && (
            <span className="date-chip">
              <button className="date-chip-label" onClick={handleGoToChipDate}>
                {new Date(pinnedDate + 'T00:00:00').toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })}
              </button>
              <button
                className="date-chip-close"
                onClick={handleRemoveDateChip}
                aria-label={t('topBar.clearDateAria')}
                title={t('topBar.clearDateAria')}
              >
                <X size={12} />
              </button>
            </span>
          )}
          <NavLink to="/app/timeline" className={({ isActive }) => (isActive ? 'active' : '')}>
            <CalendarRange size={16} /> <span>{t('topBar.nav.timeline')}</span>
          </NavLink>
          <NavLink to="/app/bia" className={({ isActive }) => (isActive ? 'active' : '')}>
            <Activity size={16} /> <span>{t('topBar.nav.bia')}</span>
          </NavLink>
          <NavLink to="/app/weight" className={({ isActive }) => (isActive ? 'active' : '')}>
            <Scale size={16} /> <span>{t('topBar.nav.weight')}</span>
          </NavLink>
          <NavLink to="/app/liquids" className={({ isActive }) => (isActive ? 'active' : '')}>
            <Droplet size={16} /> <span>{t('topBar.nav.liquids')}</span>
          </NavLink>
          <NavLink to="/app/report" className={({ isActive }) => (isActive ? 'active' : '')}>
            <FileDown size={16} /> <span>{t('topBar.nav.report')}</span>
          </NavLink>
        </nav>
        {meta?.mode === 'sheet-link' && (
          <>
            <button
              className="link-button"
              onClick={() => refreshSheetLink()}
              disabled={status === 'loading'}
              title={t('topBar.refreshTitle')}
            >
              <RefreshCw size={14} className={status === 'loading' ? 'spin' : undefined} />{' '}
              <span>{t('topBar.refresh')}</span>
            </button>
            <button
              className="link-button"
              onClick={handleShare}
              title={t('topBar.shareTitle')}
            >
              {shared ? <Check size={14} /> : <Share2 size={14} />}{' '}
              <span>{shared ? t('topBar.shareCopied') : t('topBar.share')}</span>
            </button>
            <button
              className="link-button"
              onClick={handleShareAsQr}
              title={t('topBar.qrTitle')}
            >
              <QrCodeIcon size={14} /> <span>{t('topBar.qrCode')}</span>
            </button>
          </>
        )}
        <button className="link-button" onClick={reset} title={t('topBar.startOver')}>
          <RotateCcw size={14} /> <span>{t('topBar.startOver')}</span>
        </button>
      </div>
      {qrUrl && <ShareQrModal url={qrUrl} onClose={() => setQrUrl(null)} />}
      <MobileMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        meta={meta}
        modeLabels={modeLabels}
        pinnedDate={pinnedDate}
        onGoToChipDate={handleGoToChipDate}
        onRemoveDateChip={handleRemoveDateChip}
        onGoToday={goToToday}
        onShare={handleShare}
        onShareAsQr={handleShareAsQr}
        shared={shared}
        onReset={reset}
      />
    </header>
  )
}
