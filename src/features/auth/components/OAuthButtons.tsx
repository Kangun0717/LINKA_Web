import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import Button from '@/components/ui/Button'
import { fetchAuthCapabilities, signInWithOAuth, type OAuthProvider } from '@/features/auth/api'
import { describeAuthError } from '@/features/auth/errors'
import { useAuthMessages } from '@/lib/i18n/authMessages'

/**
 * Google and Apple, offered on the same screens as email. Google is always
 * present; Apple only once the project has switched it on.
 */
export default function OAuthButtons() {
  const t = useAuthMessages()
  const [searchParams, setSearchParams] = useSearchParams()
  const [apple, setApple] = useState(false)
  const [busy, setBusy] = useState<OAuthProvider | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    void fetchAuthCapabilities().then((next) => {
      if (active) setApple(next.apple)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (!searchParams.get('error')) return
    setError(t.errors.oauthFailed)
    const cleaned = new URLSearchParams(searchParams)
    cleaned.delete('error')
    cleaned.delete('error_description')
    cleaned.delete('error_code')
    setSearchParams(cleaned, { replace: true })
  }, [searchParams, setSearchParams, t.errors.oauthFailed])

  async function start(provider: OAuthProvider) {
    setError(null)
    setBusy(provider)
    try {
      await signInWithOAuth(provider)
    } catch (cause) {
      setError(describeAuthError(cause, t.errors.oauthFailed, t.errors))
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      <p className="flex items-center gap-3 text-[0.62rem] uppercase tracking-[0.22em] text-sand-faint">
        <span className="h-px flex-1 bg-sand/15" />
        {t.oauth.or}
        <span className="h-px flex-1 bg-sand/15" />
      </p>
      <Button
        type="button"
        variant="quiet"
        loading={busy === 'google'}
        busyLabel={t.busy}
        disabled={busy !== null && busy !== 'google'}
        onClick={() => void start('google')}
        className="gap-3 ring-1 ring-sand/20 hover:ring-sand/40"
      >
        <GoogleMark />
        {t.oauth.google}
      </Button>
      {apple ? (
        <Button
          type="button"
          variant="quiet"
          loading={busy === 'apple'}
          busyLabel={t.busy}
          disabled={busy !== null && busy !== 'apple'}
          onClick={() => void start('apple')}
          className="gap-3 ring-1 ring-sand/20 hover:ring-sand/40"
        >
          <AppleMark />
          {t.oauth.apple}
        </Button>
      ) : null}
      {error ? <p className="text-center text-xs leading-relaxed text-sand-muted">{error}</p> : null}
    </div>
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" className="size-4 shrink-0" aria-hidden>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.33-1.58-5.04-3.71H.96v2.33A9 9 0 0 0 9 18Z" />
      <path fill="#FBBC05" d="M3.96 10.71A5.41 5.41 0 0 1 3.66 9c0-.6.1-1.17.3-1.71V4.96H.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l3-2.33Z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.34l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.96l3 2.33C4.67 5.16 6.66 3.58 9 3.58Z" />
    </svg>
  )
}

function AppleMark() {
  return (
    <svg viewBox="0 0 18 18" className="size-4 shrink-0" fill="currentColor" aria-hidden>
      <path d="M12.62 4.7c.76-.9 1.27-2.16 1.13-3.42-1.1.07-2.42.76-3.2 1.67-.7.82-1.31 2.13-1.15 3.37 1.22.06 2.47-.62 3.22-1.62ZM15.5 13.1c.7-1.02.7-2.18.7-2.22-.04-1.4-.88-2.2-1.64-2.8-.83-.66-1.9-1.17-3.06-1.14-1.2.04-2.3.73-2.9.73-.63 0-1.6-.7-2.64-.68-1.36.02-2.61.8-3.31 2.04-1.42 2.46-.36 6.1 1.02 8.1.67.97 1.48 2.06 2.54 2.02 1.02-.04 1.4-.66 2.64-.66 1.22 0 1.57.66 2.64.64 1.1-.02 1.79-1 2.46-1.98.77-1.12 1.09-2.2 1.1-2.26-.02-.01-2.13-.82-2.15-3.25-.01-2.04 1.67-3.02 1.75-3.07-.96-1.4-2.45-1.56-2.98-1.58-1.36-.1-2.5.74-3.2.74Z" />
    </svg>
  )
}
