import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Check,
  Download,
  FlaskConical,
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
import LoadingModal from '../components/common/LoadingModal'

export default function Welcome() {
  const navigate = useNavigate()
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
          </div>
          <p className='welcome-tagline'>
            Turn your daily food log into a real nutrition dashboard —
            today's meals, macro trends, and AI-assisted insights.
          </p>
          <ul className='welcome-features'>
            <li className='welcome-feature'>
              <Check size={14} />
              <span>Parsed entirely in your browser — nothing is ever uploaded</span>
            </li>
            <li className='welcome-feature'>
              <Check size={14} />
              <span>Link a live Google Sheet and refresh it in one click</span>
            </li>
            <li className='welcome-feature'>
              <Check size={14} />
              <span>Macro, fat-quality, and glycemic-risk breakdowns — not just calories</span>
            </li>
          </ul>
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
                <strong>Continue with your data</strong>
                <span>
                  {snapshotInfo.fileName} — uploaded{' '}
                  {new Date(snapshotInfo.uploadedAt).toLocaleString()}
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
                      placeholder='Name this sheet'
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                    />
                    <button type='submit'>Save</button>
                    <button
                      type='button'
                      className='button-secondary'
                      onClick={() => setRenamingId(null)}
                    >
                      Cancel
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
                    <strong>{link.name || 'Continue with linked sheet'}</strong>
                    <span>
                      Last loaded {new Date(link.loadedAt).toLocaleString()} —
                      will re-fetch the latest data
                    </span>
                  </div>
                </button>
                <div className='saved-link-actions'>
                  {links.length > 1 && (
                    <button
                      className='icon-button icon-button--ghost'
                      onClick={() => handleStartRename(link)}
                      disabled={busy}
                      aria-label='Rename this sheet'
                      title='Rename'
                    >
                      <Pencil size={14} />
                    </button>
                  )}
                  <button
                    className='icon-button icon-button--ghost'
                    onClick={() => handleRemoveLink(link.id)}
                    disabled={busy}
                    aria-label='Remove this sheet'
                    title='Remove'
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
              <strong>Try the demo</strong>
              <span>
                Explore every report with a bundled sample dataset — no account
                needed.
              </span>
            </div>
          </button>

          <button
            className='option-card'
            onClick={() => fileInputRef.current?.click()}
            disabled={busy}
          >
            <Upload size={20} />
            <div>
              <strong>Upload your CSV</strong>
              <span>
                Export your spreadsheet's "Registro" tab as CSV and drop it here —
                parsed entirely in your browser, never uploaded anywhere.
              </span>
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
              <strong>Import from a shared link</strong>
              <span>
                Open your spreadsheet, click the "Registro" tab, then copy the URL
                straight from your browser's address bar (it should end in
                "#gid=..." once Registro is open). The sheet must be shared as
                "Anyone with the link can view" — we'll re-fetch it fresh each
                time you come back, no login needed.
              </span>
              <div className='option-card-form-row'>
                <input
                  type='url'
                  inputMode='url'
                  placeholder='https://docs.google.com/spreadsheets/d/...'
                  value={linkInput}
                  onChange={e => setLinkInput(e.target.value)}
                  disabled={busy}
                  required
                />
                <button type='submit' disabled={busy || !linkInput.trim()}>
                  Import
                </button>
              </div>
              {links.length > 0 && (
                <div className='option-card-form-row option-card-form-row--secondary'>
                  <select
                    value={replaceTarget}
                    onChange={e => handleReplaceTargetChange(e.target.value)}
                    disabled={busy}
                  >
                    <option value='new'>Add as a new sheet</option>
                    {links.map(link => (
                      <option key={link.id} value={link.id}>
                        Replace:{' '}
                        {link.name ||
                          `sheet from ${new Date(link.loadedAt).toLocaleDateString()}`}
                      </option>
                    ))}
                  </select>
                  <input
                    type='text'
                    placeholder='Name this sheet (optional)'
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
              <strong>Download sample spreadsheet</strong>
              <span>
                No data yet? Grab a template with the right tabs and columns, fill
                in your own meals, then export its "Registro" tab as CSV and
                upload it above.
              </span>
            </div>
          </a>

          <button
            className='option-card option-card--disabled'
            disabled
            title='Coming soon'
          >
            <LogIn size={20} />
            <div>
              <strong>Sign in with Google</strong>
              <span>
                Connect your companion spreadsheet for reports that stay live.
                Coming soon.
              </span>
            </div>
          </button>
        </div>
      </div>
      <LoadingModal />
    </div>
  )
}
