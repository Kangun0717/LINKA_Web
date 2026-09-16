import { isAuthApiError } from '@supabase/supabase-js'

/**
 * Turn a Supabase auth failure into something a person can act on.
 *
 * Raw Supabase messages are never shown as-is: they leak implementation detail
 * and read badly in a screen this quiet.
 */
export function describeAuthError(error: unknown, fallback: string): string {
  if (isAuthApiError(error)) {
    switch (error.code) {
      case 'otp_expired':
        return 'That code has expired. Request a new one below.'
      case 'otp_disabled':
        return 'Email sign-in is not enabled for this project yet.'
      case 'over_email_send_rate_limit':
      case 'over_request_rate_limit':
        return 'Too many attempts. Please wait a moment and try again.'
      case 'validation_failed':
        return 'That email address does not look right.'
      default:
        break
    }

    if (error.status === 403 || error.status === 401) {
      return 'That code is not valid. Check the six digits and try again.'
    }
  }

  if (error instanceof Error && error.message.includes('Failed to fetch')) {
    return 'We could not reach LINKA. Check your connection and try again.'
  }

  return fallback
}
