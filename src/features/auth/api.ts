import type { User } from '@supabase/supabase-js'

import { env } from '@/lib/env'
import { getSupabase } from '@/lib/supabase'

/**
 * Supabase auth calls, kept out of presentation components.
 *
 * Three separate things, never mixed:
 *   - Create account: a 6-digit code proves the email (or phone) is yours,
 *     then you choose a password for that same account.
 *   - Sign in: email/phone + password. No code every time.
 *   - Recovery: Supabase's password-reset email link.
 *
 * Passwords only ever go to Supabase Auth. LINKA never stores one.
 */

export type Identity = { kind: 'email'; email: string } | { kind: 'phone'; phone: string }

/** Send (or re-send) a 6-digit code. Creates the account if it does not exist yet. */
export async function sendSignUpCode(identity: Identity): Promise<void> {
  const { auth } = await getSupabase()
  const { error } = await auth.signInWithOtp(
    identity.kind === 'email'
      ? { email: identity.email, options: { shouldCreateUser: true } }
      : { phone: identity.phone, options: { shouldCreateUser: true, channel: 'sms' } },
  )

  if (error) throw error
}

/**
 * Exchange a 6-digit code for a session. If the address already had an
 * account, this signs into that account — a second one is never created.
 */
export async function verifyCode(identity: Identity, token: string): Promise<void> {
  const { auth } = await getSupabase()
  const { error } = await auth.verifyOtp(
    identity.kind === 'email'
      ? { email: identity.email, token, type: 'email' }
      : { phone: identity.phone, token, type: 'sms' },
  )

  if (error) throw error
}

export async function signInWithPassword(identity: Identity, password: string): Promise<void> {
  const { auth } = await getSupabase()
  const { data, error } = await auth.signInWithPassword(
    identity.kind === 'email'
      ? { email: identity.email, password }
      : { phone: identity.phone, password },
  )

  if (error) throw error

  // A password that works is a password that is set — record it for an account
  // whose password was set outside this flow (e.g. from the dashboard).
  if (data.user && !hasPassword(data.user)) {
    await auth.updateUser({ data: { password_set: true } })
  }
}

/** Set (or replace) the signed-in user's password. */
export async function setPassword(password: string): Promise<void> {
  const { auth } = await getSupabase()
  const { error } = await auth.updateUser({ password, data: { password_set: true } })

  if (error) throw error
}

/**
 * Send Supabase's password-recovery email. The link returns to /auth/reset,
 * which must be listed under Auth → URL Configuration → Redirect URLs.
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const { auth } = await getSupabase()
  const { error } = await auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset`,
  })

  if (error) throw error
}

export async function signOut(): Promise<void> {
  const { auth } = await getSupabase()
  const { error } = await auth.signOut()

  if (error) throw error
}

/**
 * Whether this account has chosen a password.
 *
 * Supabase does not expose that to the client, so LINKA records it in the
 * user's own metadata whenever a password is set or used. It is a routing
 * hint, not a security boundary: the worst a user can do by editing it is
 * skip being asked to choose a password.
 */
export function hasPassword(user: User): boolean {
  return user.user_metadata?.password_set === true
}

export type AuthCapabilities = { email: boolean; phone: boolean }

let capabilities: Promise<AuthCapabilities> | null = null

/**
 * Which sign-in methods the project has switched on, from Auth's public
 * settings endpoint. Phone needs an SMS provider configured in Supabase; until
 * it is, the phone option says so instead of pretending to send a code.
 */
export function fetchAuthCapabilities(): Promise<AuthCapabilities> {
  capabilities ??= fetch(`${env.supabaseUrl()}/auth/v1/settings`, {
    headers: { apikey: env.supabasePublishableKey() },
  })
    .then((response) => (response.ok ? response.json() : Promise.reject(response)))
    .then((settings: { external?: { email?: boolean; phone?: boolean } }) => ({
      email: settings.external?.email !== false,
      phone: settings.external?.phone === true,
    }))
    .catch(() => {
      capabilities = null
      return { email: true, phone: false }
    })

  return capabilities
}
