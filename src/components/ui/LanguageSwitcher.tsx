import { useEffect, useId, useRef, useState } from 'react'

import { cn } from '@/lib/cn'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { useMessages } from '@/lib/i18n/useMessages'
import { LOCALE_NAMES, LOCALES, type Locale } from '@/lib/i18n/locale'

/** What the closed control shows: short, and in the language itself. */
const SHORT: Record<Locale, string> = { ja: '日本語', en: 'EN', 'zh-Hans': '中文' }

/**
 * The language, as a single quiet word in the corner.
 *
 * It is set in the same small graphite as the header's own labels so it never
 * competes with the map. Opening it shows the three languages, each named in
 * itself. Choosing one re-renders in place; nothing reloads.
 */
export default function LanguageSwitcher({ className = 'relative' }: { className?: string }) {
  const { locale, setLocale } = useLocale()
  const copy = useMessages()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const close = (event: PointerEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === 'Escape' : !rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('pointerdown', close)
    document.addEventListener('keydown', close)
    return () => {
      document.removeEventListener('pointerdown', close)
      document.removeEventListener('keydown', close)
    }
  }, [open])

  return (
    // Positioning comes only from `className`: a default `relative` alongside a
    // caller's `absolute` let the default win and pinned it to the wrong side.
    <div ref={rootRef} className={cn('pointer-events-auto', className)}>
      <button
        type="button"
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`${copy.language.label}: ${LOCALE_NAMES[locale]}`}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 min-w-11 items-center justify-end rounded-lg px-2 text-[0.64rem] tracking-[0.18em] text-graphite-soft outline-none focus-visible:ring-1 focus-visible:ring-graphite/30"
      >
        {SHORT[locale]}
      </button>

      <ul
        id={menuId}
        aria-label={copy.language.label}
        className={cn(
          'absolute right-0 top-10 min-w-32 rounded-xl py-1.5',
          'bg-[rgba(252,249,242,0.94)] backdrop-blur-[10px]',
          'shadow-[0_0_0_0.5px_rgba(51,48,43,0.08),0_8px_24px_-10px_rgba(80,112,128,0.28)]',
          'transition-[opacity,translate] duration-300 ease-calm',
          open ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0',
        )}
      >
        {LOCALES.map((option) => (
          <li key={option}>
            <button
              type="button"
              lang={option}
              tabIndex={open ? 0 : -1}
              aria-current={option === locale ? 'true' : undefined}
              onClick={() => {
                setLocale(option)
                setOpen(false)
              }}
              className={cn(
                'flex w-full items-center gap-2.5 px-3.5 py-2 text-left text-[0.78rem] tracking-[0.04em] outline-none focus-visible:bg-graphite/[0.05]',
                option === locale ? 'text-graphite' : 'text-graphite-soft',
              )}
            >
              <span
                aria-hidden
                className={cn('size-1 rounded-full', option === locale ? 'bg-graphite' : 'bg-transparent')}
              />
              {LOCALE_NAMES[option]}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
