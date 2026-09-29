import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { useMessages } from '@/lib/i18n/useMessages'

type PhotoViewerProps = {
  src: string
  alt: string
  width: number
  height: number
  onClose: () => void
  /** Several photos: the one shown, how many, and the way to the others. */
  nav?: { index: number; count: number; label: string; onPrev: () => void; onNext: () => void }
}

/**
 * A memory photo, full screen.
 *
 * The photo at its own aspect ratio on a dark ground. It closes with the ✕,
 * a tap outside the photo, Escape, the browser Back button, or a downward
 * swipe — the ways a phone expects. The page underneath does not scroll or
 * navigate while it is open.
 */
export default function PhotoViewer({ src, alt, width, height, onClose, nav }: PhotoViewerProps) {
  const copy = useMessages()
  const closeRef = useRef<HTMLButtonElement>(null)
  const [drag, setDrag] = useState(0)
  const startY = useRef<number | null>(null)
  // The latest onClose, without re-running the effect (which owns a history entry).
  const onCloseRef = useRef(onClose)
  const navRef = useRef(nav)
  useEffect(() => {
    onCloseRef.current = onClose
    navRef.current = nav
  })

  useEffect(() => {
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()

    // Back closes the photo instead of leaving the page.
    window.history.pushState({ ...window.history.state, linkaPhoto: true }, '')
    const onPop = () => onCloseRef.current()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') window.history.back()
      if (event.key === 'ArrowLeft') navRef.current?.onPrev()
      if (event.key === 'ArrowRight') navRef.current?.onNext()
    }
    window.addEventListener('popstate', onPop)
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = previous
      window.removeEventListener('popstate', onPop)
      window.removeEventListener('keydown', onKey)
    }
  }, [])

  const close = () => window.history.back()

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={alt}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(18,16,14,0.94)] animate-[linka-fade-in_240ms_ease-out_both] motion-reduce:animate-none"
      style={{ opacity: 1 - Math.min(0.6, Math.abs(drag) / 400) }}
      onClick={(event) => event.target === event.currentTarget && close()}
      onTouchStart={(event) => (startY.current = event.touches[0].clientY)}
      onTouchMove={(event) => startY.current !== null && setDrag(Math.max(0, event.touches[0].clientY - startY.current))}
      onTouchEnd={() => {
        if (drag > 110) close()
        else setDrag(0)
        startY.current = null
      }}
    >
      <img
        key={src}
        src={src}
        alt={alt}
        width={width}
        height={height}
        draggable={false}
        className="max-h-[88dvh] max-w-[96vw] object-contain select-none"
        style={{ transform: `translateY(${drag}px)`, transition: drag === 0 ? 'transform 200ms ease-out' : 'none' }}
      />
      {nav && nav.count > 1 && (
        <>
          <p className="absolute inset-x-0 bottom-[max(1rem,env(safe-area-inset-bottom))] text-center text-[0.7rem] tabular-nums tracking-[0.1em] text-white/75">{nav.label}</p>
          {nav.index > 0 && (
            <button type="button" onClick={nav.onPrev} aria-label="‹" className="absolute left-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-[1.1rem] text-white">
              ‹
            </button>
          )}
          {nav.index < nav.count - 1 && (
            <button type="button" onClick={nav.onNext} aria-label="›" className="absolute right-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-[1.1rem] text-white">
              ›
            </button>
          )}
        </>
      )}
      <button
        ref={closeRef}
        type="button"
        onClick={close}
        aria-label={copy.memory.closePhoto}
        className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] flex size-11 items-center justify-center rounded-full bg-white/10 text-white outline-none focus-visible:ring-2 focus-visible:ring-white/60"
      >
        <svg aria-hidden viewBox="0 0 10 10" className="size-3">
          <path d="M1.5 1.5l7 7M8.5 1.5l-7 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
        </svg>
      </button>
    </div>,
    document.body,
  )
}
