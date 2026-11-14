import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import Button from '@/components/ui/Button'
import Screen from '@/components/ui/Screen'
import { sendSignUpCode } from '@/features/auth/api'
import { IdentityField, MethodSwitch } from '@/features/auth/components/IdentityField'
import OAuthButtons from '@/features/auth/components/OAuthButtons'
import { toIdentity, usePhoneAvailable, type IdentityMethod } from '@/features/auth/identity'
import { describeAuthError } from '@/features/auth/errors'
import { pendingIdentity } from '@/features/auth/pendingIdentity'
import { useAuthMessages } from '@/lib/i18n/authMessages'

/**
 * Create account, step one: where to send the 6-digit code.
 *
 * The code proves the address is yours; the password comes right after it.
 */
export default function SignUpScreen() {
  const navigate = useNavigate()
  const phoneAvailable = usePhoneAvailable()
  const t = useAuthMessages()
  const [method, setMethod] = useState<IdentityMethod>('email')
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const identity = toIdentity(method, value)
    if (!identity) {
      setError(t.invalid[method])
      return
    }

    setError(null)
    setSending(true)

    try {
      await sendSignUpCode(identity)
      pendingIdentity.write(identity)
      navigate('/auth/verify')
    } catch (cause) {
      setError(describeAuthError(cause, t.errors.sendFailed, t.errors))
    } finally {
      setSending(false)
    }
  }

  return (
    <Screen>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="text-3xl font-light leading-snug tracking-tight text-sand">{t.signUp.title}</h1>
          <p className="mt-4 text-sm leading-relaxed text-sand-muted">
            {t.signUp.body}
          </p>

          <div className="mt-10">
            <MethodSwitch
              method={method}
              onChange={(next) => {
                setMethod(next)
                setValue('')
                setError(null)
              }}
            />
          </div>

          <div className="mt-8">
            <IdentityField
              method={method}
              value={value}
              onChange={(next) => {
                setValue(next)
                setError(null)
              }}
              error={error}
              phoneAvailable={phoneAvailable}
            />
          </div>
        </div>

        <div className="mt-12 shrink-0 space-y-5">
          <Button type="submit" loading={sending} busyLabel={t.busy} disabled={method === 'phone' && phoneAvailable !== true}>
            {t.signUp.send}
          </Button>
          <OAuthButtons />
          <p className="text-center text-xs text-sand-faint">
            {t.signUp.already}{' '}
            <Link to="/auth/signin" replace className="text-sand-muted underline-offset-4 hover:underline">
              {t.signUp.signIn}
            </Link>
          </p>
        </div>
      </form>
    </Screen>
  )
}
