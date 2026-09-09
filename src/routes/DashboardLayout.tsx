import { Navigate, Outlet } from 'react-router-dom'
import { useAppStore } from '../store/appStore'
import TopBar from '../components/layout/TopBar'

export default function DashboardLayout() {
  const status = useAppStore((s) => s.status)

  if (status !== 'ready') {
    return <Navigate to="/" replace />
  }

  return (
    <div className="dashboard">
      <TopBar />
      <main className="dashboard-main">
        <Outlet />
      </main>
    </div>
  )
}
