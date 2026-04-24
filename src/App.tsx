import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '@/providers/auth-provider'
import { BabyProvider } from '@/providers/baby-provider'
import { ProtectedRoute } from '@/components/protected-route'
import { AppLayout } from '@/components/app-layout'
import LoginRoute from '@/routes/login'
import OnboardingRoute from '@/routes/onboarding'
import DashboardRoute from '@/routes/dashboard'
import VerlaufRoute from '@/routes/verlauf'
import StatsRoute from '@/routes/stats'
import EinstellungenRoute from '@/routes/einstellungen'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginRoute />} />
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <BabyProvider>
                <OnboardingRoute />
              </BabyProvider>
            </ProtectedRoute>
          }
        />
        <Route
          element={
            <ProtectedRoute>
              <BabyProvider>
                <AppLayout />
              </BabyProvider>
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardRoute />} />
          <Route path="verlauf" element={<VerlaufRoute />} />
          <Route path="stats" element={<StatsRoute />} />
          <Route path="einstellungen" element={<EinstellungenRoute />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  )
}
