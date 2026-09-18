import { useCallback, useEffect, useRef, useState } from 'react'

import {
  sequenceFor,
  timingsFor,
  type DoorState,
} from '@/features/door/doorTimeline'
import type { TouchSignal } from '@/features/door/touchSignal'
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion'
import { pulse } from '@/lib/haptics'

type UseDoorSequenceOptions = {
  /** Present when the entrance was opened by a Touch, e.g. an NFC touch URL. */
  initialSignal?: TouchSignal
  /** Fired once, when the sequence reaches `complete`. Must be stable. */
  onComplete: () => void
}

type DoorSequence = {
  state: DoorState
  signal: TouchSignal | null
  started: boolean
  reducedMotion: boolean
  /** Begin the entrance. Ignored if it has already begun. */
  start: (signal: TouchSignal) => void
  /** Jump straight to the destination. */
  skip: () => void
}

/**
 * Drives the entrance through its states on a single timer chain.
 *
 * Nothing is animated here: this hook only decides *which* state we are in and
 * for how long. Every transform and fade lives in CSS, keyed off that state.
 */
export function useDoorSequence({
  initialSignal,
  onComplete,
}: UseDoorSequenceOptions): DoorSequence {
  const reducedMotion = usePrefersReducedMotion()

  // Starting state is derived, never pushed through an effect, so an entrance
  // opened by a Touch signal begins mid-sequence on its very first paint.
  const [state, setState] = useState<DoorState>(() =>
    initialSignal ? sequenceFor(reducedMotion)[0] : 'idle',
  )
  const [signal, setSignal] = useState<TouchSignal | null>(initialSignal ?? null)
  const [started, setStarted] = useState(Boolean(initialSignal))
  const startedRef = useRef(Boolean(initialSignal))

  const start = useCallback(
    (next: TouchSignal) => {
      if (startedRef.current) {
        return
      }

      startedRef.current = true
      pulse()
      setSignal(next)
      setState(sequenceFor(reducedMotion)[0])
      setStarted(true)
    },
    [reducedMotion],
  )

  const skip = useCallback(() => {
    startedRef.current = true
    setState('complete')
  }, [])

  useEffect(() => {
    if (!started) {
      return
    }

    const sequence = sequenceFor(reducedMotion)
    const timings = timingsFor(reducedMotion)
    const timers: number[] = []
    let elapsed = 0

    // The first state is already live; schedule each one after it.
    for (let index = 1; index < sequence.length; index += 1) {
      elapsed += timings[sequence[index - 1]] ?? 0
      const next = sequence[index]
      timers.push(window.setTimeout(() => setState(next), elapsed))
    }

    return () => timers.forEach((timer) => window.clearTimeout(timer))
  }, [started, reducedMotion])

  useEffect(() => {
    if (state === 'complete') {
      onComplete()
    }
  }, [state, onComplete])

  return { state, signal, started, reducedMotion, start, skip }
}
