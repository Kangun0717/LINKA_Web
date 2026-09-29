import { Suspense, useEffect } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import AuthProvider from '@/features/auth/AuthProvider'
import DoorExperience from '@/features/door/DoorExperience'
import BrandRevealScreen from '@/features/entry/screens/BrandRevealScreen'
import EntryScreen from '@/features/entry/screens/EntryScreen'
import ProfileProvider from '@/features/onboarding/ProfileProvider'
import LocaleProvider from '@/lib/i18n/LocaleProvider'
import GuestOnly from '@/routes/GuestOnly'
import MemberOrGuest from '@/routes/MemberOrGuest'
import SurfaceSync from '@/routes/SurfaceSync'
import RequirePassword from '@/routes/RequirePassword'
import RequireSession from '@/routes/RequireSession'
import {
  AuthEntryScreen,
  EmergencyDemoScreen,
  ForgotPasswordScreen,
  OnboardingRoute,
  PasswordRoute,
  ResetPasswordScreen,
  SignInScreen,
  SignUpScreen,
  VerifyScreen,
  HomeScreen,
  MeScreen,
  MomentScreen,
  MomentsScreen,
  MyWorldPreviewScreen,
  PlaceScreen,
  SuggestScreen,
  TouchScreen,
} from '@/routes/lazyScreens'

/** The world's own surface while its chunk arrives — never a dark flash. */
const worldFallback = <div className="h-dvh bg-canvas" />
const pageFallback = <div className="h-dvh bg-paper-lit" />

/**
 * Real-world touch → door → LINKA → create account (code → password) or sign
 * in (password) → profile → your own world.
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
    idle(() => {
      AuthEntryScreen.warm()
      HomeScreen.warm()
      MomentsScreen.warm()
      MeScreen.warm()
    })
  }, [])

  return (
    <AuthProvider>
      <ProfileProvider>
        <LocaleProvider>
          <SurfaceSync />
          <Suspense fallback={pageFallback}>
            <Routes>
              <Route path="/" element={<DoorExperience />} />

              {/* A physical NFC tag's URL. Outside the guards: it shows the place
                  first and handles its own sign-in detour and return. */}
              <Route
                path="/t/:publicId"
                element={
                  <Suspense fallback={<div className="h-dvh bg-paper" />}>
                    <TouchScreen />
                  </Suspense>
                }
              />

              {/* The public page of a place: shared links and printed QR codes. Open to
                  everyone, signed in or not, and it never records anything. */}
              <Route
                path="/place/:slug"
                element={
                  <Suspense fallback={<div className="h-dvh bg-paper" />}>
                    <PlaceScreen />
                  </Suspense>
                }
              />

              <Route element={<GuestOnly />}>
                <Route path="/auth" element={<AuthEntryScreen />} />
                <Route path="/auth/signup" element={<SignUpScreen />} />
                <Route path="/auth/verify" element={<VerifyScreen />} />
                <Route path="/auth/signin" element={<SignInScreen />} />
                <Route path="/auth/forgot" element={<ForgotPasswordScreen />} />
              </Route>

              {/* The recovery link's session is read on arrival, so no guard may run first. */}
              <Route path="/auth/reset" element={<ResetPasswordScreen />} />

              <Route element={<RequireSession />}>
                <Route path="/auth/password" element={<PasswordRoute />} />

                <Route element={<RequirePassword />}>
                  <Route path="/onboarding" element={<OnboardingRoute />} />

                </Route>
              </Route>

              {/* Open to guests too: the public map, and Moments / Me (which gate a guest). */}
              <Route element={<MemberOrGuest />}>
                <Route
                  path="/home"
                  element={
                    <Suspense fallback={worldFallback}>
                      <HomeScreen />
                    </Suspense>
                  }
                />
                <Route
                  path="/moments"
                  element={
                    <Suspense fallback={pageFallback}>
                      <MomentsScreen />
                    </Suspense>
                  }
                />
                <Route
                  path="/moments/:id"
                  element={
                    <Suspense fallback={pageFallback}>
                      <MomentScreen />
                    </Suspense>
                  }
                />
                <Route
                  path="/me"
                  element={
                    <Suspense fallback={pageFallback}>
                      <MeScreen />
                    </Suspense>
                  }
                />
                <Route
                  path="/me/suggest"
                  element={
                    <Suspense fallback={pageFallback}>
                      <SuggestScreen />
                    </Suspense>
                  }
                />
              </Route>

              {/* Sprint 1A entrance, kept reachable for visual comparison only. */}
              <Route path="/legacy/entry" element={<EntryScreen />} />
              <Route path="/legacy/reveal" element={<BrandRevealScreen />} />

              {EmergencyDemoScreen && (
                <Route
                  path="/preview/emergency"
                  element={
                    <Suspense fallback={pageFallback}>
                      <EmergencyDemoScreen />
                    </Suspense>
                  }
                />
              )}

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
          </Suspense>
        </LocaleProvider>
      </ProfileProvider>
    </AuthProvider>
  )
}
