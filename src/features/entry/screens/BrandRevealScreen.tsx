import { useNavigate } from 'react-router-dom'

import Button from '@/components/ui/Button'
import Screen from '@/components/ui/Screen'
import TouchPointMark from '@/features/entry/components/TouchPointMark'

/**
 * Brand reveal.
 *
 * Structural only. Sprint 1B turns this into the cinematic transition that
 * plays automatically after the door opens; the copy and layout stay put.
 */
export default function BrandRevealScreen() {
  const navigate = useNavigate()

  return (
    <Screen>
      <div className="flex flex-1 flex-col justify-center text-center">
        <TouchPointMark className="mx-auto text-sand-faint" />

        <h1 className="mt-10 text-5xl font-light tracking-[0.2em] text-sand sm:text-6xl">LINKA</h1>

        <p className="mt-10 text-lg leading-relaxed text-sand">
          Touch the world.
          <br />
          Make it yours.
        </p>

        <p lang="ja" className="mt-6 text-sm leading-relaxed text-sand-muted">
          触れた場所が、あなたの世界になる。
        </p>
      </div>

      <div className="mt-12 shrink-0">
        <Button onClick={() => navigate('/auth')}>Continue</Button>
      </div>
    </Screen>
  )
}
