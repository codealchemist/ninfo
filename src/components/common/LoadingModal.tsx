import { LoaderCircle, TriangleAlert } from 'lucide-react'
import { useAppStore } from '../../store/appStore'

export default function LoadingModal() {
  const status = useAppStore((s) => s.status)
  const error = useAppStore((s) => s.error)
  const cancelLoad = useAppStore((s) => s.cancelLoad)

  if (status !== 'loading' && status !== 'error') return null

  return (
    <div className="load-modal-backdrop">
      <div className="load-modal" role="alertdialog" aria-modal="true">
        {status === 'loading' ? (
          <>
            <LoaderCircle size={32} className="spin" />
            <p>Loading your data…</p>
            <button onClick={cancelLoad}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <TriangleAlert size={32} className="load-modal-error-icon" />
            <p className="load-modal-error">{error}</p>
            <button onClick={cancelLoad}>
              Close
            </button>
          </>
        )}
      </div>
    </div>
  )
}
