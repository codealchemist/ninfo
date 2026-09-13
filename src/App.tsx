import { Navigate, Route, Routes } from 'react-router-dom'
import Welcome from './routes/Welcome'
import DashboardLayout from './routes/DashboardLayout'
import Today from './routes/Today'
import Timeline from './routes/Timeline'
import Bia from './routes/Bia'
import Weight from './routes/Weight'
import Liquids from './routes/Liquids'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Welcome />} />
      <Route path="/app" element={<DashboardLayout />}>
        <Route index element={<Navigate to="today" replace />} />
        <Route path="today" element={<Today />} />
        <Route path="timeline" element={<Timeline />} />
        <Route path="bia" element={<Bia />} />
        <Route path="weight" element={<Weight />} />
        <Route path="liquids" element={<Liquids />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
