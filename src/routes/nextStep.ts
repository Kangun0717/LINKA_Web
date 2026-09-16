import { isProfileComplete, type Profile } from '@/features/onboarding/api'

/**
 * Where an authenticated user belongs right now.
 *
 * A failed profile read deliberately routes to onboarding rather than home:
 * onboarding surfaces the write error, whereas home would hide the problem.
 */
export function nextStepFor(profile: Profile | null): '/home' | '/onboarding' {
  return isProfileComplete(profile) ? '/home' : '/onboarding'
}
