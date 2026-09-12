import { useTranslation } from 'react-i18next'
import { LoaderCircle, TriangleAlert } from 'lucide-react'
import { useAppStore } from '../../store/appStore'

export default function LoadingModal() {
  const { t } = useTranslation()
  const status = useAppStore((s) => s.status)
  const error = useAppStore((s) => s.error)
  const meta = useAppStore((s) => s.meta)
  const cancelLoad = useAppStore((s) => s.cancelLoad)
  // A refresh re-loads an already-loaded dataset in place, rather than the first load of one —
  // worth a distinct message since the user is still looking at (now stale) data underneath.
  const isRefresh = meta !== null

  if (status !== 'loading' && status !== 'error') return null

  return (
    <div className="load-modal-backdrop">
      <div className="load-modal" role="alertdialog" aria-modal="true">
        {status === 'loading' ? (
          <>
            <LoaderCircle size={32} className="spin" />
            <p>{t(isRefresh ? 'common.refreshingData' : 'common.loadingYourData')}</p>
            <button onClick={cancelLoad}>
              {t('common.cancel')}
            </button>
          </>
        ) : (
          <>
            <TriangleAlert size={32} className="load-modal-error-icon" />
            <p className="load-modal-error">{error}</p>
            <button onClick={cancelLoad}>
              {t('common.close')}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
