import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/** The colours of LINKA's two surfaces — keep in step with index.css tokens. */
const PAPER = '#fcf9f3'
const INK = '#0a0a0a'

/**
 * Keeps what is BEHIND the page in step with the screen on it.
 *
 * On iPhone Safari (viewport-fit=cover) the document background shows under
 * the status bar, around the collapsing toolbar and in any overscroll, and
 * `theme-color` tints the browser chrome. Both were ink everywhere, so every
 * paper screen looked as if it stopped short of the edges. The account
 * screens are the only dark ones; everything else is paper.
 */
export default function SurfaceSync() {
  const { pathname } = useLocation()
  const dark = pathname.startsWith('/auth') || pathname.startsWith('/onboarding') || pathname.startsWith('/legacy')

  useEffect(() => {
    const colour = dark ? INK : PAPER
    document.documentElement.style.backgroundColor = colour
    document.body.style.backgroundColor = colour
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colour)
  }, [dark])

  return null
}
