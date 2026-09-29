import { useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { suggestionsChanged } from '@/data/journey'
import { useAuth } from '@/features/auth/useAuth'
import SignInGate from '@/features/journey/SignInGate'
import { submitSuggestion } from '@/features/suggest/api'
import AppShell from '@/layouts/AppShell'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { useMessages } from '@/lib/i18n/useMessages'

type Errors = Partial<Record<'name' | 'area' | 'reason' | 'link', string>>

/**
 * Suggest a Place — the beginning of LINKA growing with its travellers.
 *
 * A suggestion is a proposal to the LINKA team, not a place: it is stored as
 * `submitted`, only its author can see it, and it never appears on anyone's
 * map. Photos are left out of this first version on purpose.
 */
export default function SuggestScreen() {
  const copy = useMessages()
  const { locale } = useLocale()
  const navigate = useNavigate()
  const { session, user } = useAuth()
  const [name, setName] = useState('')
  const [area, setArea] = useState('')
  const [reason, setReason] = useState('')
  const [link, setLink] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [state, setState] = useState<'idle' | 'sending' | 'sent' | 'failed'>('idle')

  async function submit(event: FormEvent) {
    event.preventDefault()
    const next: Errors = {}
    if (!name.trim()) next.name = copy.suggest.required
    if (!area.trim()) next.area = copy.suggest.required
    if (!reason.trim()) next.reason = copy.suggest.required
    const url = link.trim()
    if (url && !/^https?:\/\/\S+\.\S+/.test(url)) next.link = copy.suggest.invalidLink
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setState('sending')
    try {
      await submitSuggestion({ name, address: area, reason, referenceUrl: url || null, locale })
      if (user) suggestionsChanged(user.id)
      setState('sent')
    } catch {
      setState('failed')
    }
  }

  return (
    <AppShell active="me">
      <div className="h-full overflow-y-auto bg-paper-lit px-5 pb-40 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <button type="button" onClick={() => navigate('/me')} className="-ml-2 min-h-11 px-2 text-[0.66rem] uppercase tracking-[0.2em] text-graphite-soft">
          ‹ {copy.me.title}
        </button>

        {!session ? (
          <SignInGate />
        ) : state === 'sent' ? (
          <div className="mt-20 text-center">
            <p className="text-[1.1rem] font-light tracking-[0.04em] text-graphite">{copy.suggest.thanks}</p>
            <p className="mt-2 text-[0.78rem] text-graphite-soft">{copy.suggest.thanksBody}</p>
            <button
              type="button"
              onClick={() => navigate('/me', { replace: true })}
              className="mt-8 min-h-12 w-full rounded-full bg-graphite text-[0.86rem] text-paper-lit"
            >
              {copy.suggest.done}
            </button>
          </div>
        ) : (
          <form onSubmit={submit} noValidate>
            <h1 className="mt-2 text-[1.35rem] font-light tracking-[0.04em] text-graphite">{copy.suggest.title}</h1>
            <p className="mt-2 text-[0.78rem] font-light leading-relaxed text-graphite-soft">{copy.suggest.intro}</p>

            <Field label={copy.suggest.name} error={errors.name}>
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={200} placeholder={copy.suggest.namePlaceholder} className={inputClass} />
            </Field>
            <Field label={copy.suggest.area} error={errors.area}>
              <input value={area} onChange={(e) => setArea(e.target.value)} maxLength={500} placeholder={copy.suggest.areaPlaceholder} className={inputClass} />
            </Field>
            <Field label={copy.suggest.reason} error={errors.reason}>
              <textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={2000} rows={4} placeholder={copy.suggest.reasonPlaceholder} className={`${inputClass} resize-none`} />
            </Field>
            <Field label={`${copy.suggest.link}`} hint={copy.suggest.optional} error={errors.link}>
              <input value={link} onChange={(e) => setLink(e.target.value)} inputMode="url" autoCapitalize="none" placeholder={copy.suggest.linkPlaceholder} className={inputClass} />
            </Field>

            {state === 'failed' && <p role="alert" className="mt-4 text-[0.74rem] text-[#a0442c]">{copy.suggest.failed}</p>}

            <button
              type="submit"
              disabled={state === 'sending'}
              className="mt-7 min-h-13 w-full rounded-full bg-graphite text-[0.88rem] tracking-[0.04em] text-paper-lit disabled:opacity-50"
            >
              {state === 'sending' ? copy.suggest.submitting : copy.suggest.submit}
            </button>
          </form>
        )}
      </div>
    </AppShell>
  )
}

// 16px text: iOS Safari zooms into any smaller input on focus.
const inputClass =
  'mt-1.5 block w-full rounded-xl bg-white/80 px-3.5 py-3 text-[16px] font-light text-graphite outline-none ring-1 ring-graphite/12 placeholder:text-graphite-faint focus:ring-graphite/35'

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: ReactNode }) {
  return (
    <label className="mt-5 block">
      <span className="text-[0.66rem] uppercase tracking-[0.16em] text-graphite-soft">
        {label}
        {hint && <span className="ml-2 normal-case tracking-normal text-graphite-faint">{hint}</span>}
      </span>
      {children}
      {error && <span role="alert" className="mt-1 block text-[0.7rem] text-[#a0442c]">{error}</span>}
    </label>
  )
}
