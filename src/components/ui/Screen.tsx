import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

type ScreenProps = {
  children: ReactNode
  /** Vertical placement of the content column. */
  align?: 'center' | 'top'
  className?: string
}

/**
 * Mobile-first full-height canvas.
 *
 * Every screen in LINKA is a single centred column with generous breathing
 * room; on larger viewports the column stays narrow instead of stretching.
 */
export default function Screen({ children, align = 'center', className }: ScreenProps) {
  return (
    <main
      className={cn(
        'flex min-h-full w-full flex-col px-7',
        'pt-[max(2rem,env(safe-area-inset-top))] pb-[max(2rem,env(safe-area-inset-bottom))]',
        className,
      )}
    >
      <div
        className={cn(
          'mx-auto flex w-full max-w-sm flex-1 flex-col',
          align === 'center' ? 'justify-center' : 'justify-start',
        )}
      >
        {children}
      </div>
    </main>
  )
}
