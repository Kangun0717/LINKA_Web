import { useEffect, useState, type RefObject } from 'react'

export type ElementSize = { width: number; height: number }

/** The rendered size of an element, kept current as the viewport changes. */
export function useElementSize(ref: RefObject<HTMLElement | null>): ElementSize {
  const [size, setSize] = useState<ElementSize>({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return

    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      setSize((previous) =>
        previous.width === width && previous.height === height ? previous : { width, height },
      )
    })

    observer.observe(element)
    return () => observer.disconnect()
  }, [ref])

  return size
}
