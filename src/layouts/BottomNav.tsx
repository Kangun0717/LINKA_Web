import TouchPointMark from '@/components/brand/TouchPointMark'

const ITEMS = [
  { id: 'map', label: 'Map' },
  { id: 'moments', label: 'Moments' },
  { id: 'me', label: 'Me' },
] as const

/**
 * Placeholder navigation.
 *
 * Nothing here routes yet — Map becomes the home surface in Sprint 2, so the
 * items are rendered disabled rather than linking somewhere that does not
 * exist.
 */
export default function BottomNav({ activeId = 'map' }: { activeId?: string }) {
  return (
    <nav
      aria-label="Primary"
      className="border-t border-ink-line bg-ink/90 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto flex w-full max-w-sm items-center justify-around px-6 py-3">
        {ITEMS.map((item) => {
          const isActive = item.id === activeId

          return (
            <li key={item.id}>
              <button
                type="button"
                disabled
                aria-current={isActive ? 'page' : undefined}
                className="flex cursor-not-allowed flex-col items-center gap-1.5 px-4 py-1 disabled:opacity-100"
              >
                <TouchPointMark
                  size="sm"
                  className={isActive ? 'text-sand' : 'text-sand-faint/60'}
                />
                <span
                  className={`text-[0.7rem] tracking-wide ${
                    isActive ? 'text-sand' : 'text-sand-faint'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
