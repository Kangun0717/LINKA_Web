import { useSignInToAct } from '@/features/auth/useSignInToAct'
import { useMessages } from '@/lib/i18n/useMessages'

/**
 * What a guest sees where a personal journey would be: why an account is
 * worth having, and the two ways in. It never sends them back to the start —
 * the navigation stays, the map and places stay open to them — and signing
 * in brings them back to this page.
 */
export default function SignInGate({ title, body }: { title?: string; body?: string } = {}) {
  const copy = useMessages()
  const signIn = useSignInToAct()

  return (
    <div className="mx-auto mt-10 max-w-sm rounded-2xl bg-white/75 p-5 ring-1 ring-graphite/10">
      <p aria-hidden className="touchpoint-mark text-[0.9rem] text-graphite">:)))</p>
      <h2 className="mt-3 text-[1.1rem] font-light tracking-[0.04em] text-graphite">{title ?? copy.gate.title}</h2>
      {body && <p className="mt-2 text-[0.8rem] leading-snug text-graphite-soft">{body}</p>}
      <ul className="mt-3 space-y-1.5">
        {(body ? [] : copy.gate.benefits).map((benefit) => (
          <li key={benefit} className="flex gap-2 text-[0.8rem] leading-snug text-graphite-soft">
            <span aria-hidden className="text-graphite/50">·</span>
            {benefit}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => signIn('/auth/signup')}
        className="mt-5 flex h-12 w-full items-center justify-center rounded-full bg-graphite text-[0.86rem] tracking-[0.04em] text-paper-lit"
      >
        {copy.gate.create}
      </button>
      <button
        type="button"
        onClick={() => signIn('/auth/signin')}
        className="mt-2 flex h-12 w-full items-center justify-center rounded-full text-[0.86rem] text-graphite ring-1 ring-graphite/20"
      >
        {copy.gate.signIn}
      </button>
    </div>
  )
}
