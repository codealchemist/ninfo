import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  Check,
  Download,
  FlaskConical,
  Github,
  Heart,
  Link2,
  LogIn,
  Pencil,
  Salad,
  Trash2,
  Upload
} from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { loadSnapshot } from '../db/snapshotDb'
import {
  listSheetLinks,
  removeSheetLink,
  renameSheetLink,
  type StoredSheetLink
} from '../db/sheetLinkStorage'
import { setLanguage, type SupportedLanguage } from '../i18n'
import LoadingModal from '../components/common/LoadingModal'
import ToggleSwitch from '../components/common/ToggleSwitch'

const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'EN' },
  { value: 'es', label: 'ES' }
]

export default function Welcome() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const loadDemo = useAppStore(s => s.loadDemo)
  const loadUploadedFile = useAppStore(s => s.loadUploadedFile)
  const restoreUploadedSnapshot = useAppStore(s => s.restoreUploadedSnapshot)
  const addSheetLinkAndLoad = useAppStore(s => s.addSheetLinkAndLoad)
  const replaceSheetLinkAndLoad = useAppStore(s => s.replaceSheetLinkAndLoad)
  const continueWithSavedLink = useAppStore(s => s.continueWithSavedLink)
  const status = useAppStore(s => s.status)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [snapshotInfo, setSnapshotInfo] = useState<{
    fileName: string
    uploadedAt: string
  } | null>(null)
  const [links, setLinks] = useState<StoredSheetLink[]>([])
  const [linkInput, setLinkInput] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [replaceTarget, setReplaceTarget] = useState('new')
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const handledSharedLink = useRef(false)

  const refreshLinkList = () => setLinks(listSheetLinks())

  useEffect(() => {
    loadSnapshot()
      .then(s => {
        if (s)
          setSnapshotInfo({ fileName: s.fileName, uploadedAt: s.uploadedAt })
      })
      .catch(() => {
        // IndexedDB unavailable (private browsing, disabled storage, etc.) — fall back silently.
      })
    refreshLinkList()
  }, [])

  // A link shared via the "Share" action lands here as ?sheet=<url> — import it the same way
  // a pasted URL would be, so opening a shared link is a one-click path straight into the app.
  useEffect(() => {
    const sharedUrl = searchParams.get('sheet')
    if (!sharedUrl || handledSharedLink.current) return
    handledSharedLink.current = true
    setLinkInput(sharedUrl)
    addSheetLinkAndLoad(sharedUrl, null).then(ok => {
      if (ok) goToApp()
    })
  }, [searchParams])

  const goToApp = () => navigate('/app/today')

  const handleDemo = async () => {
    await loadDemo()
    goToApp()
  }

  const handleFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    await loadUploadedFile(file)
    goToApp()
  }

  const handleContinueSnapshot = async () => {
    const ok = await restoreUploadedSnapshot()
    if (ok) goToApp()
  }

  const handleContinueLink = async (id: string) => {
    const ok = await continueWithSavedLink(id)
    if (ok) goToApp()
  }

  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = linkInput.trim()
    if (!url) return

    let ok: boolean
    if (replaceTarget === 'new') {
      ok = await addSheetLinkAndLoad(url, nameInput.trim() || null)
    } else {
      ok = await replaceSheetLinkAndLoad(replaceTarget, url)
      if (ok) renameSheetLink(replaceTarget, nameInput.trim())
    }
    if (ok) goToApp()
  }

  const handleReplaceTargetChange = (value: string) => {
    setReplaceTarget(value)
    setNameInput(
      value === 'new' ? '' : (links.find(l => l.id === value)?.name ?? '')
    )
  }

  const handleStartRename = (link: StoredSheetLink) => {
    setRenamingId(link.id)
    setRenameValue(link.name ?? '')
  }

  const handleRenameSubmit = (e: React.FormEvent, id: string) => {
    e.preventDefault()
    renameSheetLink(id, renameValue)
    refreshLinkList()
    setRenamingId(null)
  }

  const handleRemoveLink = (id: string) => {
    removeSheetLink(id)
    refreshLinkList()
    if (replaceTarget === id) handleReplaceTargetChange('new')
  }

  const busy = status === 'loading'

  return (
    <div className='welcome'>
      <div className='welcome-card'>
        <aside className='welcome-brand'>
          <div className='welcome-header'>
            <Salad size={32} strokeWidth={1.75} />
            <h1>Ninfo</h1>
            <span className='brand-version'>v{__APP_VERSION__}</span>
            <ToggleSwitch
              toggle={{
                options: LANGUAGE_OPTIONS,
                value: i18n.language,
                onChange: value => setLanguage(value as SupportedLanguage)
              }}
            />
          </div>
          <p className='welcome-tagline'>{t('welcome.tagline')}</p>
          <ul className='welcome-features'>
            <li className='welcome-feature'>
              <Check size={14} />
              <span>{t('welcome.features.local')}</span>
            </li>
            <li className='welcome-feature'>
              <Check size={14} />
              <span>{t('welcome.features.liveSheet')}</span>
            </li>
            <li className='welcome-feature'>
              <Check size={14} />
              <span>{t('welcome.features.breakdowns')}</span>
            </li>
          </ul>
          <div className='welcome-links'>
            <a
              className='welcome-link'
              href='https://github.com/codealchemist/ninfo'
              target='_blank'
              rel='noopener noreferrer'
              aria-label={t('welcome.githubAria')}
              title={t('welcome.githubTitle')}
            >
              <Github size={16} />
            </a>
            <a
              className='welcome-link'
              href='https://albertomiranda.com.ar'
              target='_blank'
              rel='noopener noreferrer'
              aria-label={t('welcome.websiteAria')}
              title={t('welcome.websiteTitle')}
            >
              <Heart size={16} />
            </a>
          </div>
        </aside>

        <div className='welcome-actions'>
          {snapshotInfo && (
            <button
              className='option-card option-card--highlight'
              onClick={handleContinueSnapshot}
              disabled={busy}
            >
              <Upload size={20} />
              <div>
                <strong>{t('welcome.continueWithData')}</strong>
                <span>
                  {t('welcome.uploadedAt', {
                    fileName: snapshotInfo.fileName,
                    date: new Date(snapshotInfo.uploadedAt).toLocaleString(
                      i18n.language
                    )
                  })}
                </span>
              </div>
            </button>
          )}

          {links.map(link =>
            renamingId === link.id ? (
              <form
                key={link.id}
                className='option-card option-card--form'
                onSubmit={e => handleRenameSubmit(e, link.id)}
              >
                <Link2 size={20} />
                <div className='option-card-form-body'>
                  <div className='option-card-form-row'>
                    <input
                      autoFocus
                      type='text'
                      placeholder={t('welcome.namePlaceholder')}
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                    />
                    <button type='submit'>{t('common.save')}</button>
                    <button
                      type='button'
                      className='button-secondary'
                      onClick={() => setRenamingId(null)}
                    >
                      {t('common.cancel')}
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div className='saved-link-row' key={link.id}>
                <button
                  className='option-card option-card--highlight saved-link-main'
                  onClick={() => handleContinueLink(link.id)}
                  disabled={busy}
                >
                  <Link2 size={20} />
                  <div>
                    <strong>
                      {link.name || t('welcome.continueLinkedSheetDefault')}
                    </strong>
                    <span>
                      {t('welcome.lastLoaded', {
                        date: new Date(link.loadedAt).toLocaleString(
                          i18n.language
                        )
                      })}
                    </span>
                  </div>
                </button>
                <div className='saved-link-actions'>
                  {links.length > 1 && (
                    <button
                      className='icon-button icon-button--ghost'
                      onClick={() => handleStartRename(link)}
                      disabled={busy}
                      aria-label={t('welcome.renameAria')}
                      title={t('welcome.renameTitle')}
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  <button
                    className='icon-button icon-button--ghost'
                    onClick={() => handleRemoveLink(link.id)}
                    disabled={busy}
                    aria-label={t('welcome.removeAria')}
                    title={t('welcome.removeTitle')}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )
          )}

          <button className='option-card' onClick={handleDemo} disabled={busy}>
            <FlaskConical size={20} />
            <div>
              <strong>{t('welcome.tryDemo')}</strong>
              <span>{t('welcome.tryDemoDesc')}</span>
            </div>
          </button>

          <button
            className='option-card'
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
          >
            <Upload size={20} />
            <div>
              <strong>{t('welcome.uploadCsv')}</strong>
              <span>{t('welcome.uploadCsvDesc')}</span>
            </div>
          </button>
          <input
            ref={fileInputRef}
            type='file'
            accept='.csv,text/csv'
            hidden
            onChange={handleFileChosen}
          />

          <form
            className='option-card option-card--form'
            onSubmit={handleLinkSubmit}
          >
            <Link2 size={20} />
            <div className='option-card-form-body'>
              <strong>{t('welcome.importFromLink')}</strong>
              <span>{t('welcome.importFromLinkDesc')}</span>
              <div className='option-card-form-row'>
                <input
                  type='url'
                  inputMode='url'
                  placeholder={t('welcome.urlPlaceholder')}
                  value={linkInput}
                  onChange={e => setLinkInput(e.target.value)}
                  disabled={busy}
                  required
                />
                <button type='submit' disabled={busy || !linkInput.trim()}>
                  {t('welcome.import')}
                </button>
              </div>
              {links.length > 0 && (
                <div className='option-card-form-row option-card-form-row--secondary'>
                  <select
                    value={replaceTarget}
                    onChange={e => handleReplaceTargetChange(e.target.value)}
                    disabled={busy}
                  >
                    <option value='new'>{t('welcome.addAsNewSheet')}</option>
                    {links.map(link => (
                      <option key={link.id} value={link.id}>
                        {t('welcome.replacePrefix')}
                        {link.name ||
                          t('welcome.sheetFromDate', {
                            date: new Date(link.loadedAt).toLocaleDateString(
                              i18n.language
                            )
                          })}
                      </option>
                    ))}
                  </select>
                  <input
                    type='text'
                    placeholder={t('welcome.nameOptionalPlaceholder')}
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    disabled={busy}
                  />
                </div>
              )}
            </div>
          </form>

          <a
            className='option-card'
            href='/sample-spreadsheet.xlsx'
            download='Alimentación-Sample.xlsx'
          >
            <Download size={20} />
            <div>
              <strong>{t('welcome.downloadSample')}</strong>
              <span>{t('welcome.downloadSampleDesc')}</span>
            </div>
          </a>

          <button
            className='option-card option-card--disabled'
            disabled
            title={t('welcome.comingSoon')}
          >
            <LogIn size={20} />
            <div>
              <strong>{t('welcome.signInGoogle')}</strong>
              <span>{t('welcome.signInGoogleDesc')}</span>
            </div>
          </button>
        </div>
      </div>
      <LoadingModal />
    </div>
  )
}
