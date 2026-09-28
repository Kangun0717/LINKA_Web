import { Link } from 'react-router-dom'

import { cn } from '@/lib/cn'
import { useMessages } from '@/lib/i18n/useMessages'

export type NavId = 'map' | 'moments' | 'me'

const ITEMS: readonly { id: NavId; to: string }[] = [
  { id: 'map', to: '/home' },
  { id: 'moments', to: '/moments' },
  { id: 'me', to: '/me' },
]

/**
 * Map, Moments, Me — three words resting on the world.
 *
 * No bar, no icons and no centre "+": the physical :))) Touch Point is how
 * anything is added to LINKA.
 */
export default function BottomNav({ activeId = 'map' }: { activeId?: NavId }) {
  const copy = useMessages()

  return (
    <nav
      aria-label="Primary"
      className="absolute inset-x-0 bottom-0 bg-[linear-gradient(to_bottom,rgba(252,251,248,0)_0%,rgba(252,251,248,0.86)_55%)] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-8"
    >
      <ul className="mx-auto flex w-full max-w-xs items-start justify-around">
        {ITEMS.map((item) => {
          const isActive = item.id === activeId

          return (
            <li key={item.id}>
              <Link
                to={item.to}
                aria-current={isActive ? 'page' : undefined}
                className="flex min-h-11 flex-col items-center gap-1.5 px-4 py-2 outline-none focus-visible:ring-1 focus-visible:ring-graphite/30"
              >
                <span
                  className={cn(
                    'text-[0.7rem] tracking-[0.16em]',
                    isActive ? 'text-graphite' : 'text-graphite-faint/80',
                  )}
                >
                  {copy.nav[item.id]}
                </span>
                <span
                  aria-hidden
                  className={cn('size-1 rounded-full', isActive ? 'bg-graphite' : 'bg-transparent')}
                />
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
