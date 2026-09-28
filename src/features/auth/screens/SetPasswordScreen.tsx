import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '@/components/ui/Button'
import Screen from '@/components/ui/Screen'
import TextField from '@/components/ui/TextField'
import { setPassword } from '@/features/auth/api'
import { describeAuthError } from '@/features/auth/errors'
import { useAuth } from '@/features/auth/useAuth'
import { useProfileContext } from '@/features/onboarding/useProfileContext'
import { nextStepFor } from '@/routes/nextStep'
import { useAuthMessages } from '@/lib/i18n/authMessages'

export const MIN_PASSWORD_LENGTH = 8

type SetPasswordFormProps = {
  /** `create`: right after the first code. `reset`: from a recovery link. */
  mode: 'create' | 'reset'
}

/**
 * Choose a password for the account the code just proved is yours — the same
 * account, never a second one. Also the last step of password recovery.
 */
export function SetPasswordForm({ mode }: SetPasswordFormProps) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { profile } = useProfileContext()
  const t = useAuthMessages()
  const [password, setValue] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(t.invalid.tooShort(MIN_PASSWORD_LENGTH))
      return
    }
    if (password !== confirm) {
      setError(t.invalid.mismatch)
      return
    }

    setError(null)
    setSaving(true)

    try {
      await setPassword(password)
      // Supabase refreshes the user with password_set; route from that.
      if (user) {
        navigate(nextStepFor({ ...user, user_metadata: { ...user.user_metadata, password_set: true } }, profile), {
          replace: true,
        })
      }
    } catch (cause) {
      setError(describeAuthError(cause, t.errors.saveFailed, t.errors))
      setSaving(false)
    }
  }

  return (
    <Screen>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="text-3xl font-light leading-snug tracking-tight text-sand">
            {mode === 'create' ? t.password.createTitle : t.password.resetTitle}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-sand-muted">
            {mode === 'create' ? t.password.createBody : t.password.resetBody}
          </p>
          {user?.email || user?.phone ? (
            <p className="mt-2 text-sm text-sand">{user.email || user.phone}</p>
          ) : null}

          {/* Lets password managers attach the new password to the right account. */}
          <input
            type="text"
            name="username"
            autoComplete="username"
            value={user?.email || user?.phone || ''}
            readOnly
            hidden
          />

          <div className="mt-12 space-y-8">
            <TextField
              label={t.field.password}
              type="password"
              name="new-password"
              value={password}
              onChange={(event) => {
                setValue(event.target.value)
                setError(null)
              }}
              hint={t.hint.minLength(MIN_PASSWORD_LENGTH)}
              autoComplete="new-password"
              required
            />
            <TextField
              label={t.field.confirm}
              type="password"
              name="confirm-password"
              value={confirm}
              onChange={(event) => {
                setConfirm(event.target.value)
                setError(null)
              }}
              error={error}
              autoComplete="new-password"
              required
            />
          </div>
        </div>

        <div className="mt-12 shrink-0">
          <Button type="submit" loading={saving} busyLabel={t.busy}>
            {mode === 'create' ? t.password.continue : t.password.save}
          </Button>
        </div>
      </form>
    </Screen>
  )
}

/** /auth/password — reached only with a session and no password yet (see RequirePassword). */
export default function SetPasswordScreen() {
  return <SetPasswordForm mode="create" />
}
