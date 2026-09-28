import { useNavigate } from 'react-router-dom'

import Button from '@/components/ui/Button'
import Screen from '@/components/ui/Screen'
import { useAuthMessages } from '@/lib/i18n/authMessages'

/**
 * The fork after the Door: someone new, or someone coming back.
 *
 * Kept as two plain choices so creating an account and signing in are never
 * the same screen with a hidden difference.
 */
export default function AuthEntryScreen() {
  const navigate = useNavigate()
  const t = useAuthMessages()

  return (
    <Screen>
      <div className="flex flex-1 flex-col justify-center">
        <h1 className="text-3xl font-light leading-snug tracking-tight text-sand">{t.entry.title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-sand-muted">
          {t.entry.body}
        </p>
      </div>

      <div className="mt-12 shrink-0 space-y-4">
        <Button onClick={() => navigate('/auth/signup')}>{t.entry.create}</Button>
        <Button variant="quiet" onClick={() => navigate('/auth/signin')}>
          {t.entry.haveAccount}
        </Button>
      </div>
    </Screen>
  )
}
