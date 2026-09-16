import type { ReactNode } from 'react'

import BottomNav from '@/layouts/BottomNav'

/** Authenticated frame: a scrolling surface above the placeholder tab bar. */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-dvh flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
      <BottomNav />
    </div>
  )
}
