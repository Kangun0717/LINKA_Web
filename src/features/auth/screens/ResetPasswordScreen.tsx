import { useState } from 'react'
import { Link } from 'react-router-dom'

import LoadingScreen from '@/components/ui/LoadingScreen'
import Screen from '@/components/ui/Screen'
import { SetPasswordForm } from '@/features/auth/screens/SetPasswordScreen'
import { useAuth } from '@/features/auth/useAuth'
import { useAuthMessages } from '@/lib/i18n/authMessages'

/**
 * /auth/reset — where Supabase's recovery link lands.
 *
 * The link carries a one-time session in the URL; the Supabase client reads it
 * as it loads. So this screen sits outside the guards: a guest guard would
 * send the recovering user away, and a session guard would send them to sign
 * in before the link's session had been read.
 */
export default function ResetPasswordScreen() {
  const { session, loading } = useAuth()
  const t = useAuthMessages()
  // Read before the client clears the URL: an expired or used link says so here.
  const [linkError] = useState(() => new URLSearchParams(window.location.hash.slice(1)).get('error_code'))

  if (loading) {
    return <LoadingScreen label="Opening LINKA" tone="paper" />
  }

  if (!session || linkError) {
    return (
      <Screen>
        <div className="flex flex-1 flex-col justify-center">
          <h1 className="text-3xl font-light leading-snug tracking-tight text-sand">{t.reset.expiredTitle}</h1>
          <p className="mt-4 text-sm leading-relaxed text-sand-muted">
            {t.reset.expiredBody}
          </p>
        </div>
        <Link
          to="/auth/forgot"
          replace
          className="mt-12 flex h-14 w-full items-center justify-center rounded-full bg-sand text-[0.95rem] font-medium tracking-wide text-ink"
        >
          {t.reset.newLink}
        </Link>
      </Screen>
    )
  }

  return <SetPasswordForm mode="reset" />
}
