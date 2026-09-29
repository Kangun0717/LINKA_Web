import type { ReactNode, RefObject } from 'react'

import { useMessages } from '@/lib/i18n/useMessages'

/**
 * A bottom sheet over the page, on warm paper — a native modal <dialog>, so
 * focus moves into it and stays there, Escape closes it and the page behind is
 * inert. Tapping outside the sheet closes it too. Open it with
 * `ref.current.showModal()`.
 *
 * `heading` stays pinned at the top while the rest scrolls, beside the ✕.
 */
export default function Sheet({
  ref,
  label,
  heading,
  children,
}: {
  ref: RefObject<HTMLDialogElement | null>
  label: string
  heading: ReactNode
  children: ReactNode
}) {
  const copy = useMessages()
  return (
    <dialog
      ref={ref}
      aria-label={label}
      onClick={(event) => {
        if (event.target === event.currentTarget) event.currentTarget.close()
      }}
      className="fixed inset-x-0 top-auto bottom-0 mx-auto my-0 max-h-[85dvh] w-full max-w-md overflow-y-auto overscroll-contain rounded-t-2xl bg-paper-lit p-0 text-graphite shadow-[0_-12px_36px_-14px_rgba(40,36,32,0.35)] backdrop:bg-[rgba(30,27,24,0.35)]"
    >
      <div className="px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4">
        <div className="sticky top-0 z-10 -mx-5 -mt-4 flex items-center justify-between gap-3 bg-paper-lit/95 px-5 pb-2 pt-4 backdrop-blur-sm">
          <div className="flex-1">{heading}</div>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label={copy.place.close}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-graphite-soft outline-none ring-1 ring-graphite/10 focus-visible:ring-graphite/40"
          >
            <svg aria-hidden viewBox="0 0 10 10" className="size-2.5">
              <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </dialog>
  )
}
