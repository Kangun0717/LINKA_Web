import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import Button from '@/components/ui/Button'
import Screen from '@/components/ui/Screen'
import { sendLoginCode, verifyLoginCode } from '@/features/auth/api'
import OtpInput, { OTP_LENGTH } from '@/features/auth/components/OtpInput'
import { describeAuthError } from '@/features/auth/errors'
import { pendingEmail } from '@/features/auth/pendingEmail'
import { useCountdown } from '@/hooks/useCountdown'

const RESEND_COOLDOWN_SECONDS = 45

/**
 * Step two of sign-in.
 *
 * Without a pending address there is nothing to verify, so the user goes back
 * to the email step rather than seeing an empty code screen.
 */
export default function VerifyScreen() {
  const [email] = useState(() => pendingEmail.read())

  if (!email) {
    return <Navigate to="/auth" replace />
  }

  return <VerifyForm email={email} />
}

/**
 * Exchanges the six-digit code for a session.
 *
 * Routing after success is left to the session-aware guards — this screen only
 * has to establish the session.
 */
function VerifyForm({ email }: { email: string }) {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const { secondsLeft, start, isRunning } = useCountdown()

  useEffect(() => {
    start(RESEND_COOLDOWN_SECONDS)
  }, [start])

  async function submitCode(value: string) {
    if (value.length !== OTP_LENGTH || verifying) {
      return
    }

    setError(null)
    setNotice(null)
    setVerifying(true)

    try {
      await verifyLoginCode(email, value)
      pendingEmail.clear()
      // AuthProvider picks the new session up; the guards decide where to land.
      navigate('/', { replace: true })
    } catch (cause) {
      setError(describeAuthError(cause, 'That code is not valid. Please try again.'))
      setCode('')
    } finally {
      setVerifying(false)
    }
  }

  async function handleResend() {
    if (isRunning || resending) {
      return
    }

    setError(null)
    setResending(true)

    try {
      await sendLoginCode(email)
      setCode('')
      setNotice('A new code is on its way.')
      start(RESEND_COOLDOWN_SECONDS)
    } catch (cause) {
      setError(describeAuthError(cause, 'We could not resend your code. Please try again.'))
    } finally {
      setResending(false)
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    void submitCode(code)
  }

  return (
    <Screen>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="text-3xl font-light leading-snug tracking-tight text-sand">
            Check your email
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-sand-muted">
            We&rsquo;ve sent a 6-digit code to
            <br />
            <span className="text-sand">{email}</span>
          </p>

          <div className="mt-12">
            <OtpInput
              value={code}
              onChange={(next) => {
                setCode(next)
                setError(null)
              }}
              onComplete={(next) => void submitCode(next)}
              disabled={verifying}
              invalid={Boolean(error)}
              describedBy="otp-status"
            />

            <div id="otp-status" aria-live="polite" className="mt-4 min-h-5">
              {error ? (
                <p role="alert" className="text-sm text-red-300">
                  {error}
                </p>
              ) : null}
              {notice && !error ? <p className="text-sm text-sand-muted">{notice}</p> : null}
            </div>
          </div>
        </div>

        <div className="mt-10 shrink-0 space-y-4">
          <Button type="submit" loading={verifying} disabled={code.length !== OTP_LENGTH}>
            Verify
          </Button>

          <Button variant="quiet" onClick={handleResend} disabled={isRunning || resending}>
            {isRunning ? `Resend code in ${secondsLeft}s` : 'Resend code'}
          </Button>

          <button
            type="button"
            onClick={() => {
              pendingEmail.clear()
              navigate('/auth', { replace: true })
            }}
            className="mx-auto block text-xs text-sand-faint underline-offset-4 hover:underline"
          >
            Use a different email
          </button>
        </div>
      </form>
    </Screen>
  )
}
