import { Navigate, Route, Routes } from 'react-router-dom'
import Welcome from './routes/Welcome'
import DashboardLayout from './routes/DashboardLayout'
import Today from './routes/Today'
import Timeline from './routes/Timeline'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/app" element={<DashboardLayout />}>
        <Route index element={<Navigate to="today" replace />} />
        <Route path="today" element={<Today />} />
        <Route path="timeline" element={<Timeline />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
