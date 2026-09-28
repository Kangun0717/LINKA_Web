import { useEffect, useState } from 'react'

/**
 * The type styles that first appear only after the user moves: a level's
 * title (日本, 佐渡) and a card's title. Each must match its real element's
 * size and weight exactly — the browser resolves a fallback font per
 * size + weight, and that is what is being done early here.
 */
const STYLES = [
  'text-[1.45rem] font-light leading-none tracking-[0.16em]',
  'text-[1.08rem] font-light leading-snug tracking-[0.06em]',
] as const

/**
 * Lays out a few Japanese characters, invisibly, once My World is idle.
 *
 * The first time the page sets CJK text at a new size and weight, the
 * browser has to find and instantiate a fallback font for it — measured at
 * ~190 ms of layout on a 4× throttled CPU, landing on the first frame of the
 * World → Japan move as its header appears. Doing it while nothing moves makes
 * that frame ordinary. Nothing is shown, read out or clickable.
 */
export default function FontPrimer() {
  const [primed, setPrimed] = useState(false)

  useEffect(() => {
    const idle = window.requestIdleCallback ?? ((run: () => void) => window.setTimeout(run, 600))
    const cancel = window.cancelIdleCallback ?? window.clearTimeout
    const handle = idle(() => setPrimed(true))
    return () => cancel(handle)
  }, [])

  if (!primed) return null

  return (
    <div aria-hidden className="pointer-events-none invisible absolute left-0 top-0 -z-10 overflow-hidden">
      {STYLES.map((style) => (
        <span key={style} className={style}>
          日本佐渡
        </span>
      ))}
    </div>
  )
}
