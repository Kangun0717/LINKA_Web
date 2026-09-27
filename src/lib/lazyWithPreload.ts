import { createElement, lazy, type ComponentType } from 'react'

type Module<P> = { default: ComponentType<P> }

export type PreloadableComponent<P> = ComponentType<P> & { preload: () => Promise<unknown> }

/**
 * `React.lazy`, plus a way to start loading before the component is needed.
 *
 * Once the module has arrived the component renders directly, without ever
 * suspending — so a screen that was fetched ahead of time (My World, while
 * the Door plays) appears on the first frame instead of after a fallback.
 */
export function lazyWithPreload<P extends object>(
  factory: () => Promise<Module<P>>,
): PreloadableComponent<P> {
  let loaded: ComponentType<P> | null = null
  let pending: Promise<unknown> | null = null

  const preload = () =>
    (pending ??= factory().then((module) => {
      loaded = module.default
    }))

  const Lazy = lazy(() => preload().then(() => ({ default: loaded as ComponentType<P> })))

  function Preloadable(props: P) {
    return loaded ? createElement(loaded, props) : createElement(Lazy, props)
  }

  return Object.assign(Preloadable, { preload })
}
