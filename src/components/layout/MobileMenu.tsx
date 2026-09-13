import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Link, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Activity,
  Check,
  CalendarRange,
  Download,
  LayoutDashboard,
  QrCode as QrCodeIcon,
  RotateCcw,
  Salad,
  Share2,
  X,
} from 'lucide-react'
import type { DatasetMeta } from '../../data/types'
import { setLanguage, type SupportedLanguage } from '../../i18n'
import { useAppStore } from '../../store/appStore'
import { useInstallPrompt } from '../../hooks/useInstallPrompt'
import ToggleSwitch from '../common/ToggleSwitch'

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'EN' },
  { value: 'es', label: 'ES' },
]

interface MobileMenuProps {
  open: boolean
  onClose: () => void
  meta: DatasetMeta | null
  modeLabels: Record<string, string>
  pinnedDate: string | null
  onGoToChipDate: () => void
  onRemoveDateChip: () => void
  onGoToday: () => void
  onShare: () => void
  onShareAsQr: () => void
  shared: boolean
  onReset: () => void
}

export default function MobileMenu({
  open,
  onClose,
  meta,
  modeLabels,
  pinnedDate,
  onGoToChipDate,
  onRemoveDateChip,
  onGoToday,
  onShare,
  onShareAsQr,
  shared,
  onReset,
}: MobileMenuProps) {
  const { t, i18n } = useTranslation()
  const { canInstall, promptInstall } = useInstallPrompt()

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prevOverflow
    }
  }, [open, onClose])

  return createPortal(
    <>
      <div className={'mobile-menu-backdrop' + (open ? ' mobile-menu-backdrop--open' : '')} onClick={onClose} />
      <nav
        className={'mobile-menu' + (open ? ' mobile-menu--open' : '')}
        aria-hidden={!open}
        aria-label={t('mobileMenu.openAria')}
      >
        <div className="mobile-menu-header">
          <Link to="/" className="brand-link" title={t('topBar.backToWelcome')} onClick={onClose}>
            <Salad size={22} />
            <span className="brand-name">Ninfo</span>
          </Link>
          <button className="icon-button icon-button--ghost" onClick={onClose} aria-label={t('common.close')}>
            <X size={16} />
          </button>
        </div>

        <div className="mobile-menu-meta">
          <span className="brand-version">v{__APP_VERSION__}</span>
          {meta && <span className={`mode-badge mode-badge--${meta.mode}`}>{modeLabels[meta.mode]}</span>}
        </div>

        <ToggleSwitch
          toggle={{
            options: LANGUAGE_OPTIONS,
            value: i18n.language,
            onChange: (value) => setLanguage(value as SupportedLanguage),
          }}
        />

        <div className="mobile-menu-section mobile-menu-nav">
          <NavLink
            to="/app/today"
            onClick={() => {
              onGoToday()
              onClose()
            }}
            className={({ isActive }) => (isActive ? 'active' : '')}
          >
            <LayoutDashboard size={16} /> <span>{t('topBar.nav.today')}</span>
          </NavLink>
          <NavLink to="/app/timeline" onClick={onClose} className={({ isActive }) => (isActive ? 'active' : '')}>
            <CalendarRange size={16} /> <span>{t('topBar.nav.timeline')}</span>
          </NavLink>
          <NavLink to="/app/bia" onClick={onClose} className={({ isActive }) => (isActive ? 'active' : '')}>
            <Activity size={16} /> <span>{t('topBar.nav.bia')}</span>
          </NavLink>
        </div>

        {pinnedDate && (
          <div className="mobile-menu-section">
            <span className="date-chip">
              <button
                className="date-chip-label"
                onClick={() => {
                  onGoToChipDate()
                  onClose()
                }}
              >
                {new Date(pinnedDate + 'T00:00:00').toLocaleDateString(i18n.language, { month: 'short', day: 'numeric' })}
              </button>
              <button className="date-chip-close" onClick={onRemoveDateChip} aria-label={t('topBar.clearDateAria')} title={t('topBar.clearDateAria')}>
                <X size={12} />
              </button>
            </span>
          </div>
        )}

        {meta?.mode === 'sheet-link' && (
          <div className="mobile-menu-section mobile-menu-actions">
            <button className="link-button" onClick={onShare} title={t('topBar.shareTitle')}>
              {shared ? <Check size={14} /> : <Share2 size={14} />} <span>{shared ? t('topBar.shareCopied') : t('topBar.share')}</span>
            </button>
            <button className="link-button" onClick={onShareAsQr} title={t('topBar.qrTitle')}>
              <QrCodeIcon size={14} /> <span>{t('topBar.qrCode')}</span>
            </button>
          </div>
        )}

        {canInstall && (
          <div className="mobile-menu-section">
            <button className="link-button mobile-menu-install" onClick={promptInstall} title={t('mobileMenu.installAppTitle')}>
              <Download size={14} /> <span>{t('mobileMenu.installApp')}</span>
            </button>
          </div>
        )}

        <div className="mobile-menu-section">
          <button
            className="link-button"
            onClick={() => {
              onReset()
              onClose()
            }}
            title={t('topBar.startOver')}
          >
            <RotateCcw size={14} /> <span>{t('topBar.startOver')}</span>
          </button>
        </div>
      </nav>
    </>,
    document.body
  )
}
