import type { User } from '@supabase/supabase-js'

import { hasPassword } from '@/features/auth/api'
import { isProfileComplete, type Profile } from '@/features/onboarding/api'
import { pendingTouch, touchPath } from '@/features/touch/pendingTouch'

/**
 * Where an authenticated user belongs right now.
 *
 * A password comes first: an account created with a code is not finished
 * until it has one, so the next sign-in never needs a code. A failed profile
 * read deliberately routes to onboarding rather than home: onboarding
 * surfaces the write error, whereas home would hide the problem. Once the
 * account is complete, a Touch Point tapped before signing in takes
 * precedence over Home — that is where they were going.
 */
export function nextStepFor(user: User, profile: Profile | null): string {
  if (!hasPassword(user)) return '/auth/password'
  if (!isProfileComplete(profile)) return '/onboarding'

  const pending = pendingTouch.read()
  return pending ? touchPath(pending) : '/home'
}
