import { Navigate, Outlet } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import TopBar from '../components/layout/TopBar'
import LoadingModal from '../components/common/LoadingModal'

export default function DashboardLayout() {
  const status = useAppStore((s) => s.status)
  const meta = useAppStore((s) => s.meta)

  // Once a dataset has loaded, a later refresh (or a refresh that fails) keeps the dashboard
  // mounted with its last-known data underneath — only a dataset that never loaded sends the
  // user back to Welcome to pick a source.
  if (!meta && status !== 'loading') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="dashboard">
      <TopBar />
      <main className="dashboard-main">
        <Outlet />
      </main>
      <LoadingModal />
    </div>
  )
}
