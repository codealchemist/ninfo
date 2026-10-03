import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Welcome from './routes/Welcome'
import DashboardLayout from './routes/DashboardLayout'
import Today from './routes/Today'
import Timeline from './routes/Timeline'
import Bia from './routes/Bia'
import Weight from './routes/Weight'
import Liquids from './routes/Liquids'
import Report from './routes/Report'

// Dev-only tool. A dynamic import behind import.meta.env.DEV (false in builds) keeps the page and
// its store out of the production bundle entirely — a static import would still pull in the
// store's module-level side effects.
const FoodCheck = import.meta.env.DEV ? lazy(() => import('./routes/FoodCheck')) : null

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
        <Route path="report" element={<Report />} />
        {FoodCheck && (
          <Route
            path="food-check"
            element={
              <Suspense fallback={null}>
                <FoodCheck />
              </Suspense>
            }
          />
        )}
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
