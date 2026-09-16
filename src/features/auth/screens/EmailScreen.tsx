import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '@/components/ui/Button'
import Screen from '@/components/ui/Screen'
import TextField from '@/components/ui/TextField'
import { sendLoginCode } from '@/features/auth/api'
import { describeAuthError } from '@/features/auth/errors'
import { pendingEmail } from '@/features/auth/pendingEmail'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Step one of sign-in: ask for an email address and send a code to it. */
export default function EmailScreen() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const address = email.trim().toLowerCase()

    if (!EMAIL_PATTERN.test(address)) {
      setError('Enter an email address we can reach you at.')
      return
    }

    setError(null)
    setSending(true)

    try {
      await sendLoginCode(address)
      pendingEmail.write(address)
      navigate('/auth/verify')
    } catch (cause) {
      setError(describeAuthError(cause, 'We could not send your code. Please try again.'))
    } finally {
      setSending(false)
    }
  }

  return (
    <Screen>
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="text-3xl font-light leading-snug tracking-tight text-sand">
            Welcome to LINKA
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-sand-muted">
            No passwords. We&rsquo;ll send a six-digit code to your inbox.
          </p>

          <div className="mt-12">
            <TextField
              label="Email"
              type="email"
              name="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value)
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
        </div>

        <div className="mt-12 shrink-0">
          <Button type="submit" loading={sending}>
            Send code
          </Button>
        </div>
      </form>
    </Screen>
  )
}
