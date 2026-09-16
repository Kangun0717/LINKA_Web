import { Navigate, Route, Routes } from 'react-router-dom'

import AuthProvider from '@/features/auth/AuthProvider'
import EmailScreen from '@/features/auth/screens/EmailScreen'
import VerifyScreen from '@/features/auth/screens/VerifyScreen'
import BrandRevealScreen from '@/features/entry/screens/BrandRevealScreen'
import EntryScreen from '@/features/entry/screens/EntryScreen'
import HomeScreen from '@/features/home/screens/HomeScreen'
import ProfileProvider from '@/features/onboarding/ProfileProvider'
import GuestOnly from '@/routes/GuestOnly'
import OnboardingRoute from '@/routes/OnboardingRoute'
import RequireProfile from '@/routes/RequireProfile'
import RequireSession from '@/routes/RequireSession'

/**
 * Real-world touch → door → LINKA → email OTP → profile → your own world.
 *
 * The guards, not the screens, decide where someone lands, so each screen can
 * stay a plain piece of presentation.
 */
export default function App() {
  return (
    <AuthProvider>
      <ProfileProvider>
        <Routes>
          <Route element={<GuestOnly />}>
            <Route path="/" element={<EntryScreen />} />
            <Route path="/reveal" element={<BrandRevealScreen />} />
            <Route path="/auth" element={<EmailScreen />} />
            <Route path="/auth/verify" element={<VerifyScreen />} />
          </Route>

          <Route element={<RequireSession />}>
            <Route path="/onboarding" element={<OnboardingRoute />} />

            <Route element={<RequireProfile />}>
              <Route path="/home" element={<HomeScreen />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ProfileProvider>
    </AuthProvider>
  )
}
