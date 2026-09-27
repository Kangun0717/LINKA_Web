import { useCallback, useMemo } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'

import { locate, pathOf, type WorldPath } from '@/features/world/geo/atlas'

type Entered = { worldSteps?: number } | null

/**
 * Where in the ladder the user is, kept in the URL as `?at=jp/sado`.
 *
 * Every step down is a history entry, so the browser's Back climbs back up
 * exactly the way the user came. The on-screen Back does the same when it
 * can; when the view was opened directly at depth (a shared or typed URL),
 * there is no step to go back to, so it replaces the URL with the parent.
 */
export function useWorldPath(): {
  path: WorldPath
  enter: (next: WorldPath) => void
  back: () => void
} {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const { state } = useLocation() as { state: Entered }
  const raw = params.get('at')

  const path = useMemo(() => pathOf(locate(raw ? raw.split('/') : [])), [raw])
  const steps = state?.worldSteps ?? 0

  const go = useCallback(
    (next: WorldPath, replace: boolean, worldSteps: number) => {
      const search = new URLSearchParams(params)
      if (next.length > 0) search.set('at', next.join('/'))
      else search.delete('at')
      const query = search.toString().replace(/%2F/g, '/')

      navigate({ search: query ? `?${query}` : '' }, { replace, state: { worldSteps } })
    },
    [navigate, params],
  )

  const enter = useCallback((next: WorldPath) => go(next, false, steps + 1), [go, steps])

  const back = useCallback(() => {
    if (steps > 0) navigate(-1)
    else go(path.slice(0, -1), true, 0)
  }, [go, navigate, path, steps])

  return { path, enter, back }
}
