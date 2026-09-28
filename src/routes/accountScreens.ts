/**
 * Every account screen — create, verify, sign in, recover, choose a password,
 * onboarding — in one chunk. None of them is needed to draw the Door, so they
 * stay off its critical path: the chunk is fetched while the entrance plays,
 * and at once when a URL opens on one of them.
 */
export { default as AuthEntryScreen } from '@/features/auth/screens/AuthEntryScreen'
export { default as ForgotPasswordScreen } from '@/features/auth/screens/ForgotPasswordScreen'
export { default as ResetPasswordScreen } from '@/features/auth/screens/ResetPasswordScreen'
export { default as SignInScreen } from '@/features/auth/screens/SignInScreen'
export { default as SignUpScreen } from '@/features/auth/screens/SignUpScreen'
export { default as VerifyScreen } from '@/features/auth/screens/VerifyScreen'
export { default as OnboardingRoute } from '@/routes/OnboardingRoute'
export { default as PasswordRoute } from '@/routes/PasswordRoute'
