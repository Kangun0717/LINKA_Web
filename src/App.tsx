import { Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import AuthProvider from '@/features/auth/AuthProvider'
import EmailScreen from '@/features/auth/screens/EmailScreen'
import VerifyScreen from '@/features/auth/screens/VerifyScreen'
import DoorExperience from '@/features/door/DoorExperience'
import BrandRevealScreen from '@/features/entry/screens/BrandRevealScreen'
import EntryScreen from '@/features/entry/screens/EntryScreen'
import ProfileProvider from '@/features/onboarding/ProfileProvider'
import GuestOnly from '@/routes/GuestOnly'
import OnboardingRoute from '@/routes/OnboardingRoute'
import RequireProfile from '@/routes/RequireProfile'
import RequireSession from '@/routes/RequireSession'
import { HomeScreen, MyWorldPreviewScreen } from '@/routes/lazyScreens'

/** The world's own surface while its chunk arrives — never a dark flash. */
const worldFallback = <div className="h-dvh bg-canvas" />

/**
 * Real-world touch → door → LINKA → email OTP → profile → your own world.
 *
 * The Door is the universal entrance and therefore sits outside the guards: it
 * must render for signed-out and signed-in visitors alike. It decides nothing
 * itself — the destination still comes from `nextStepFor`, and everything
 * behind it is gated by the same guards as before.
 */
export default function App() {
  // Whatever the entrance, fetch My World once the first screen has settled.
  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((run: () => void) => window.setTimeout(run, 1200))
    idle(() => void HomeScreen.preload())
  }, [])

  return (
    <AuthProvider>
      <ProfileProvider>
        <Routes>
          <Route path="/" element={<DoorExperience />} />

          <Route element={<GuestOnly />}>
            <Route path="/auth" element={<EmailScreen />} />
            <Route path="/auth/verify" element={<VerifyScreen />} />
          </Route>

          <Route element={<RequireSession />}>
            <Route path="/onboarding" element={<OnboardingRoute />} />

            <Route element={<RequireProfile />}>
              <Route
                path="/home"
                element={
                  <Suspense fallback={worldFallback}>
                    <HomeScreen />
                  </Suspense>
                }
              />
            </Route>
          </Route>

          {/* Sprint 1A entrance, kept reachable for visual comparison only. */}
          <Route path="/legacy/entry" element={<EntryScreen />} />
          <Route path="/legacy/reveal" element={<BrandRevealScreen />} />

          {MyWorldPreviewScreen && (
            <Route
              path="/preview/my-world"
              element={
                <Suspense fallback={worldFallback}>
                  <MyWorldPreviewScreen />
                </Suspense>
              }
            />
          )}

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ProfileProvider>
    </AuthProvider>
  )
}
