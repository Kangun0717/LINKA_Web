import { getSupabase } from '@/lib/supabase'

/**
 * Supabase auth calls, kept out of presentation components.
 *
 * LINKA authenticates with email OTP only — there is no password anywhere in
 * the product, and no third-party identity providers in this sprint.
 */

/** Send (or re-send) a 6-digit login code to `email`. */
export async function sendLoginCode(email: string): Promise<void> {
  const { error } = await getSupabase().auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true },
  })

  if (error) {
    throw error
  }
}

/** Exchange a 6-digit code for a session. */
export async function verifyLoginCode(email: string, token: string): Promise<void> {
  const { error } = await getSupabase().auth.verifyOtp({
    email,
    token,
    type: 'email',
  })

  if (error) {
    throw error
  }
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabase().auth.signOut()

  if (error) {
    throw error
  }
}
