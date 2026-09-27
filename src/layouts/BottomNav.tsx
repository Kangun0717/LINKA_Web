import { cn } from '@/lib/cn'

const ITEMS = [
  { id: 'map', label: 'Map' },
  { id: 'moments', label: 'Moments' },
  { id: 'me', label: 'Me' },
] as const

/**
 * Map, Moments, Me — three words resting on the world.
 *
 * No bar, no icons and no centre "+": the physical :))) Touch Point is how
 * anything is added to LINKA. Map is the only destination that exists, so
 * Moments and Me are shown for orientation but stay inert until they do.
 */
export default function BottomNav({ activeId = 'map' }: { activeId?: string }) {
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
              <span
                aria-current={isActive ? 'page' : undefined}
                className="flex flex-col items-center gap-1.5 px-4 py-2"
              >
                <span
                  className={cn(
                    'text-[0.7rem] tracking-[0.16em]',
                    isActive ? 'text-graphite' : 'text-graphite-faint/70',
                  )}
                >
                  {item.label}
                </span>
                <span
                  aria-hidden
                  className={cn('size-1 rounded-full', isActive ? 'bg-graphite' : 'bg-transparent')}
                />
              </span>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
