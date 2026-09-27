import type { ReactNode } from 'react'

import BottomNav from '@/layouts/BottomNav'

/**
 * Authenticated frame: one full-bleed surface with the navigation resting on
 * it. The world runs underneath the nav rather than stopping above a bar.
 */
export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative h-dvh overflow-hidden">
      {children}
      <BottomNav />
    </div>
  )
}
