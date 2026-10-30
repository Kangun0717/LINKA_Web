import type { AuthMessages } from '@/lib/i18n/authMessages'

/**
 * supabase-js's own `isAuthApiError`, structurally — importing it would put the
 * whole client back on the Door's critical path.
 */
function isAuthApiError(error: unknown): error is { code?: string; status?: number } {
  return (
    typeof error === 'object' &&
    error !== null &&
    (error as { name?: unknown }).name === 'AuthApiError'
  )
}

/**
 * Turn a Supabase auth failure into something a person can act on.
 *
 * Raw Supabase messages are never shown as-is: they leak implementation detail
 * and read badly in a screen this quiet.
 */
export function describeAuthError(error: unknown, fallback: string, t: AuthMessages['errors']): string {
  if (isAuthApiError(error)) {
    switch (error.code) {
      case 'otp_expired':
        return t.codeExpired
      case 'otp_disabled':
        return t.otpDisabled
      case 'over_email_send_rate_limit':
      case 'over_request_rate_limit':
        return t.rateLimited
      case 'over_sms_send_rate_limit':
        return t.smsRateLimited
      case 'validation_failed':
        return t.invalidInput
      case 'invalid_credentials':
        return t.wrongPassword
      case 'email_not_confirmed':
      case 'phone_not_confirmed':
        return t.notConfirmed
      case 'weak_password':
        return t.weakPassword
      case 'same_password':
        return t.samePassword
      case 'phone_provider_disabled':
      case 'sms_send_failed':
        return t.phoneUnavailable
      case 'oauth_provider_not_supported':
      case 'provider_disabled':
        return t.oauthUnavailable
      case 'reauthentication_needed':
        return t.reauth
      default:
        break
    }

    if (error.status === 403 || error.status === 401) {
      return t.codeInvalid
    }
  }

  if (error instanceof Error && error.message.includes('Failed to fetch')) {
    return t.offline
  }

  return fallback
}
