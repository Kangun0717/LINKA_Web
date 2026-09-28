import { useEffect, useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import Button from '@/components/ui/Button'
import Screen from '@/components/ui/Screen'
import { sendSignUpCode, verifyCode, type Identity } from '@/features/auth/api'
import OtpInput, { OTP_LENGTH } from '@/features/auth/components/OtpInput'
import { describeAuthError } from '@/features/auth/errors'
import { describeIdentity, pendingIdentity } from '@/features/auth/pendingIdentity'
import { doorSession } from '@/features/door/doorSession'
import { useCountdown } from '@/hooks/useCountdown'
import { useAuthMessages } from '@/lib/i18n/authMessages'

const RESEND_COOLDOWN_SECONDS = 45

/**
 * Create account, step two.
 *
 * Without a pending address there is nothing to verify, so the user goes back
 * to the first step rather than seeing an empty code screen.
 */
export default function VerifyScreen() {
  const [identity] = useState(() => pendingIdentity.read())

  if (!identity) {
    return <Navigate to="/auth/signup" replace />
  }

  return <VerifyForm identity={identity} />
}

/**
 * Exchanges the six-digit code for a session.
 *
 * Routing after success is left to the session-aware guards — next, for a new
 * account, is choosing a password.
 */
function VerifyForm({ identity }: { identity: Identity }) {
  const navigate = useNavigate()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [resending, setResending] = useState(false)
  const { secondsLeft, start, isRunning } = useCountdown()
  const t = useAuthMessages()

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
      await verifyCode(identity, value)
      pendingIdentity.clear()
      doorSession.clear()
      // GuestOnly routes onward once AuthProvider has the session.
    } catch (cause) {
      setError(describeAuthError(cause, t.errors.codeInvalid, t.errors))
      setCode('')
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
      await sendSignUpCode(identity)
      setCode('')
      setNotice(t.verify.newCode)
      start(RESEND_COOLDOWN_SECONDS)
    } catch (cause) {
      setError(describeAuthError(cause, t.errors.sendFailed, t.errors))
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
          <h1 className="text-3xl font-light leading-snug tracking-tight text-sand">{t.verify.title(identity.kind)}</h1>
          <p className="mt-4 text-sm leading-relaxed text-sand-muted">
            {t.verify.sentTo}
            <br />
            <span className="text-sand">{describeIdentity(identity)}</span>
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
          <Button type="submit" loading={verifying} busyLabel={t.busy} disabled={code.length !== OTP_LENGTH}>
            {t.verify.verify}
          </Button>

          <Button variant="quiet" onClick={handleResend} disabled={isRunning || resending}>
            {isRunning ? t.verify.resendIn(secondsLeft) : t.verify.resend}
          </Button>

          <button
            type="button"
            onClick={() => {
              pendingIdentity.clear()
              navigate('/auth/signup', { replace: true })
            }}
            className="mx-auto block text-xs text-sand-faint underline-offset-4 hover:underline"
          >
            {identity.kind === 'email' ? t.verify.differentEmail : t.verify.differentNumber}
          </button>
        </div>
      </form>
    </Screen>
  )
}
