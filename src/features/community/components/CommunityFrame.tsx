import { useEffect, type ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'

import { GRAIN } from '@/components/notebook/Notebook'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'
import AppShell from '@/layouts/AppShell'
import type { NavId } from '@/layouts/BottomNav'

/**
 * The page Community is printed on: warm paper with a faint tooth, one
 * readable column (wider screens get margins, not a wider page), the way
 * back, and the language. The navigation stays — Map / Moments / Me — with
 * none of them lit: Community is reached from the map and from Me.
 */
export default function CommunityFrame({
  children,
  back,
  backLabel,
  nav = null,
  wide = false,
}: {
  children: ReactNode
  back?: string
  backLabel?: string
  nav?: NavId | null
  wide?: boolean
}) {
  // A new page starts at its top (the scroller is this page, not the window).
  const { pathname } = useLocation()
  useEffect(() => {
    document.getElementById('community-scroll')?.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <AppShell active={nav}>
      <div id="community-scroll" className="h-full overflow-y-auto overscroll-contain bg-paper-lit">
        <div aria-hidden className="pointer-events-none fixed inset-0" style={{ backgroundImage: GRAIN }} />
        <div className={`relative mx-auto w-full ${wide ? 'max-w-3xl' : 'max-w-md'} pb-36 pt-[max(0.75rem,env(safe-area-inset-top))]`}>
          <div className="flex min-h-12 items-center justify-between px-3">
            {back ? (
              <Link to={back} className="-ml-1 flex min-h-11 items-center gap-2 rounded-lg px-2 text-[0.64rem] uppercase tracking-[0.22em] text-graphite-soft outline-none focus-visible:ring-1 focus-visible:ring-graphite/30">
                <svg aria-hidden viewBox="0 0 6 10" className="h-2 w-1.5">
                  <path d="M5 1L1 5l4 4" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {backLabel}
              </Link>
            ) : (
              <span />
            )}
            <LanguageSwitcher className="rounded-full bg-paper-lit/80" />
          </div>
          {children}
        </div>
      </div>
    </AppShell>
  )
}

/** A section heading in the notebook's voice: the title, a line of explanation, and an optional link. */
export function SectionHead({ title, lead, action }: { title: string; lead?: string; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 className="text-[1.15rem] font-light leading-snug tracking-[0.1em] text-graphite">{title}</h2>
        {lead && <p className="mt-1 text-[0.72rem] font-light leading-relaxed text-graphite-soft">{lead}</p>}
      </div>
      {action}
    </div>
  )
}

export function SeeAll({ to, label }: { to: string; label: string }) {
  return (
    <Link to={to} className="flex min-h-11 shrink-0 items-center text-[0.7rem] text-graphite-soft underline decoration-graphite/25 underline-offset-4">
      {label}
    </Link>
  )
}
