import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'

import LoadingScreen from '@/components/ui/LoadingScreen'
import { useAuth } from '@/features/auth/useAuth'
import DoorScene from '@/features/door/components/DoorScene'
import FirstPersonHand from '@/features/door/components/FirstPersonHand'
import InkDefs from '@/features/door/components/InkDefs'
import LightWash from '@/features/door/components/LightWash'
import LinkaReveal from '@/features/door/components/LinkaReveal'
import { DOOR_COPY } from '@/features/door/doorCopy'
import { doorSession, isReplayRequested } from '@/features/door/doorSession'
import { isAtOrAfter } from '@/features/door/doorTimeline'
import type { TouchSignal } from '@/features/door/touchSignal'
import { useDoorSequence } from '@/features/door/useDoorSequence'
import { useProfileContext } from '@/features/onboarding/useProfileContext'
import { nextStepFor } from '@/routes/nextStep'
import { cn } from '@/lib/cn'

type DoorExperienceProps = {
  /**
   * Present when a physical Touch opened LINKA — a touch URL resolving to an
   * `nfc` signal. The entrance then begins already touched, skipping the wait.
   */
  initialSignal?: TouchSignal
}

/**
 * LINKA's universal entrance.
 *
 * Everyone comes through this door — first visit or five hundredth, signed in
 * or not. What changes is the trigger, never the entrance. The destination is
 * decided entirely by the existing `nextStepFor`, so authentication and
 * onboarding routing stay exactly where they already live.
 */
export default function DoorExperience({ initialSignal }: DoorExperienceProps) {
  const navigate = useNavigate()
  const { session, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfileContext()

  /*
   * Decided once, on the first render. `/` is re-entered by VerifyScreen after
   * a successful OTP, and replaying the whole entrance in the middle of signing
   * in would be wrong — but this is the ONLY case we skip for. It is not a
   * record that the door has been seen.
   */
  const [isResumingAuth] = useState(
    () => !isReplayRequested() && doorSession.isReturningFromAuth(),
  )

  // The flag protects a single redirect and is spent either way.
  useEffect(() => doorSession.clear(), [])

  const handleComplete = useCallback(() => {
    if (session) {
      navigate(nextStepFor(profile), { replace: true })
      return
    }

    doorSession.beginAuthDetour()
    navigate('/auth', { replace: true })
  }, [session, profile, navigate])

  const { state, started, reducedMotion, start, skip } = useDoorSequence({
    initialSignal,
    onComplete: handleComplete,
  })

  if (isResumingAuth) {
    if (authLoading) {
      return <LoadingScreen label={DOOR_COPY.a11y.opening} tone="paper" />
    }

    if (!session) {
      return <Navigate to="/auth" replace />
    }

    if (profileLoading) {
      return <LoadingScreen label={DOOR_COPY.a11y.opening} tone="paper" />
    }

    return <Navigate to={nextStepFor(profile)} replace />
  }

  const isPastRoom = isAtOrAfter(state, 'brand')

  return (
    <main
      data-door-state={state}
      className={cn(
        // One page of paper for the whole entrance, gaining light as it goes.
        'relative h-dvh w-full overflow-hidden transition-colors duration-[1200ms] ease-door',
        isPastRoom ? 'bg-paper-lit' : 'bg-paper',
      )}
    >
      <InkDefs />

      {!reducedMotion ? (
        <>
          <DoorScene state={state} onTouch={() => start({ source: 'direct' })} />
          <FirstPersonHand state={state} />
        </>
      ) : null}

      {/*
        The room clears beneath the wash so the brand has somewhere quiet to
        land — onto lit paper, never onto ink. The drawing is not replaced by
        another screen; it is simply overexposed by its own daylight.

        `pointer-events-none` is load-bearing, not tidiness: this layer is
        full-bleed and sits above the scene for the whole entrance, and an
        element at `opacity: 0` is still hit-tested. Without it, it silently
        swallows every touch aimed at the door.
      */}
      <div
        aria-hidden
        className={cn(
          'pointer-events-none absolute inset-0 bg-paper-lit transition-opacity duration-500',
          isPastRoom ? 'opacity-100' : 'opacity-0',
        )}
      />

      <LightWash state={state} />
      <LinkaReveal state={state} />

      {/*
        Reduced motion still needs a way in: the scene is not rendered, so the
        mark itself becomes the trigger.
      */}
      {reducedMotion && state === 'idle' ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            type="button"
            onClick={() => start({ source: 'direct' })}
            aria-label={DOOR_COPY.a11y.trigger}
            className="rounded-full px-8 py-6 text-2xl text-graphite outline-none focus-visible:ring-2 focus-visible:ring-graphite/50"
          >
            <span className="touchpoint-mark">:)))</span>
          </button>
        </div>
      ) : null}

      <p aria-live="polite" className="sr-only">
        {started ? DOOR_COPY.a11y.opening : ''}
      </p>

      {started && !isPastRoom ? (
        <button
          type="button"
          onClick={skip}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full px-5 py-2 text-xs tracking-wide text-graphite-faint outline-none transition-colors duration-300 hover:text-graphite-soft focus-visible:ring-2 focus-visible:ring-graphite/50"
        >
          {DOOR_COPY.a11y.skip}
        </button>
      ) : null}
    </main>
  )
}
