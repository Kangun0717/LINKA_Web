import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Counts down to zero in whole seconds.
 *
 * Used to hold back the "resend code" action so people do not burn through
 * Supabase's email rate limit on a slow inbox.
 */
export function useCountdown(initialSeconds = 0) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clear = useCallback(() => {
    if (intervalRef.current !== null) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }, [])

  const start = useCallback(
    (seconds: number) => {
      clear()
      setSecondsLeft(seconds)

      intervalRef.current = setInterval(() => {
        setSecondsLeft((current) => {
          if (current <= 1) {
            clear()
            return 0
          }

          return current - 1
        })
      }, 1000)
    },
    [clear],
  )

  useEffect(() => clear, [clear])

  return { secondsLeft, start, isRunning: secondsLeft > 0 }
}
