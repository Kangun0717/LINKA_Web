import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Paper } from '@/components/notebook/Notebook'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'
import AppShell from '@/layouts/AppShell'
import type { NavId } from '@/layouts/BottomNav'
import { useCommunityMessages } from '@/lib/i18n/useCommunityMessages'

/**
 * DEV PREVIEW ONLY — the page around a 4C prototype screen: a clear
 * "prototype · sample data" strip, the way back to the index, the language.
 * With `nav`, the screen sits in the app's own frame (Map / Moments / Me).
 */
export default function PreviewFrame({ children, nav, back = '/preview/4c' }: { children: ReactNode; nav?: NavId; back?: string }) {
  const cc = useCommunityMessages()
  const page = (
    <div className="h-full overflow-y-auto overscroll-contain">
      <Paper className="min-h-dvh pb-32">
        <div className="sticky top-0 z-30 bg-[#3b3731] px-3 pb-1 pt-[max(0.25rem,env(safe-area-inset-top))] text-center text-[0.56rem] tracking-[0.14em] text-white/90">
          {cc.preview.banner}
        </div>
        <div className="flex items-center justify-between px-3 pt-2">
          <Link to={back} className="flex min-h-11 items-center px-2 text-[0.8rem] text-graphite-soft">‹</Link>
          <LanguageSwitcher className="rounded-full bg-paper-lit/80" />
        </div>
        <div className="mx-auto w-full max-w-md">{children}</div>
      </Paper>
    </div>
  )
  return nav ? <AppShell active={nav}>{page}</AppShell> : <div className="h-dvh">{page}</div>
}
