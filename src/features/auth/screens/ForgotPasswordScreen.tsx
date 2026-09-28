import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import Button from '@/components/ui/Button'
import Screen from '@/components/ui/Screen'
import TextField from '@/components/ui/TextField'
import { requestPasswordReset } from '@/features/auth/api'
import { toIdentity } from '@/features/auth/identity'
import { describeAuthError } from '@/features/auth/errors'
import { useAuthMessages } from '@/lib/i18n/authMessages'

/**
 * Forgot password → Supabase's recovery email → /auth/reset.
 *
 * The confirmation never says whether an account exists for the address, so
 * this screen cannot be used to find out who has signed up.
 */
export default function ForgotPasswordScreen() {
  const t = useAuthMessages()
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [sentTo, setSentTo] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const identity = toIdentity('email', value)
    if (!identity || identity.kind !== 'email') {
      setError(t.invalid.email)
      return
    }

    setError(null)
    setSending(true)

    try {
      await requestPasswordReset(identity.email)
      setSentTo(identity.email)
    } catch (cause) {
      setError(describeAuthError(cause, t.errors.sendFailed, t.errors))
    } finally {
      setSending(false)
    }
  }

  if (sentTo) {
    return (
      <Screen>
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="text-3xl font-light leading-snug tracking-tight text-sand">{t.forgot.sentTitle}</h1>
          <p role="status" className="mt-4 text-sm leading-relaxed text-sand-muted">
            {t.forgot.sentBody(sentTo)}
          </p>
        </div>
        <Link
          to="/auth/signin"
          replace
          className="mx-auto mt-12 block text-xs text-sand-faint underline-offset-4 hover:underline"
        >
          {t.forgot.back}
        </Link>
      </Screen>
    )
  }

  return (
    <Screen>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="text-3xl font-light leading-snug tracking-tight text-sand">{t.forgot.title}</h1>
          <p className="mt-4 text-sm leading-relaxed text-sand-muted">
            {t.forgot.body}
          </p>

          <div className="mt-12">
            <TextField
              label={t.field.email}
              type="email"
              name="email"
              value={value}
              onChange={(event) => {
                setValue(event.target.value)
                setError(null)
              }}
              error={error}
              placeholder="you@example.com"
              autoComplete="email"
              inputMode="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              required
            />
          </div>
          <p className="mt-6 text-xs leading-relaxed text-sand-faint">
            {t.forgot.phoneNote}
          </p>
        </div>

        <div className="mt-12 shrink-0 space-y-5">
          <Button type="submit" loading={sending} busyLabel={t.busy}>
            {t.forgot.send}
          </Button>
          <Link
            to="/auth/signin"
            replace
            className="mx-auto block text-center text-xs text-sand-faint underline-offset-4 hover:underline"
          >
            {t.forgot.back}
          </Link>
        </div>
      </form>
    </Screen>
  )
}
