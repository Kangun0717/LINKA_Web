import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'

import Button from '@/components/ui/Button'
import Screen from '@/components/ui/Screen'
import TextField from '@/components/ui/TextField'
import { signInWithPassword } from '@/features/auth/api'
import { IdentityField, MethodSwitch } from '@/features/auth/components/IdentityField'
import { toIdentity, usePhoneAvailable, type IdentityMethod } from '@/features/auth/identity'
import { describeAuthError } from '@/features/auth/errors'
import { doorSession } from '@/features/door/doorSession'
import { useAuthMessages } from '@/lib/i18n/authMessages'

/**
 * Sign in: email or phone, and your password. No code.
 *
 * Routing after success is left to the session-aware guards, exactly as after
 * verifying a code.
 */
export default function SignInScreen() {
  const phoneAvailable = usePhoneAvailable()
  const t = useAuthMessages()
  const [method, setMethod] = useState<IdentityMethod>('email')
  const [value, setValue] = useState('')
  const [password, setPassword] = useState('')
  const [identityError, setIdentityError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [signingIn, setSigningIn] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const identity = toIdentity(method, value)
    if (!identity) {
      setIdentityError(t.invalid[method])
      return
    }
    if (!password) {
      setError(t.invalid.password)
      return
    }

    setIdentityError(null)
    setError(null)
    setSigningIn(true)

    try {
      await signInWithPassword(identity, password)
      // The session arrives through AuthProvider and GuestOnly routes onward;
      // this screen stays in its busy state until it does.
      doorSession.clear()
    } catch (cause) {
      setError(describeAuthError(cause, t.errors.signInFailed, t.errors))
      setSigningIn(false)
    }
  }

  return (
    <Screen>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="text-3xl font-light leading-snug tracking-tight text-sand">{t.signIn.title}</h1>

          <div className="mt-10">
            <MethodSwitch
              method={method}
              onChange={(next) => {
                setMethod(next)
                setValue('')
                setIdentityError(null)
                setError(null)
              }}
            />
          </div>

          <div className="mt-8 space-y-8">
            <IdentityField
              method={method}
              value={value}
              onChange={(next) => {
                setValue(next)
                setIdentityError(null)
              }}
              error={identityError}
              phoneAvailable={phoneAvailable}
            />
            <TextField
              label={t.field.password}
              type="password"
              name="password"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value)
                setError(null)
              }}
              error={error}
              autoComplete="current-password"
              required
            />
          </div>

          <Link
            to="/auth/forgot"
            className="mt-5 self-start text-xs text-sand-faint underline-offset-4 hover:text-sand-muted hover:underline"
          >
            {t.signIn.forgot}
          </Link>
        </div>

        <div className="mt-12 shrink-0 space-y-5">
          <Button type="submit" loading={signingIn} busyLabel={t.busy} disabled={method === 'phone' && phoneAvailable !== true}>
            {t.signIn.submit}
          </Button>
          <p className="text-center text-xs text-sand-faint">
            {t.signIn.newHere}{' '}
            <Link to="/auth/signup" replace className="text-sand-muted underline-offset-4 hover:underline">
              {t.signIn.create}
            </Link>
          </p>
        </div>
      </form>
    </Screen>
  )
}
