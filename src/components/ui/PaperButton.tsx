import type { ReactNode } from 'react'

import { cn } from '@/lib/cn'

/**
 * The full-width button of LINKA's paper pages: solid graphite for the one
 * thing to do next, a quiet outline for the alternative. (`Button` is its
 * counterpart on the dark account screens.)
 */
export default function PaperButton({ children, onClick, quiet = false }: { children: ReactNode; onClick: () => void; quiet?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex h-13 w-full items-center justify-center rounded-full text-[0.9rem] tracking-[0.04em] outline-none transition-colors duration-300 ease-calm focus-visible:ring-2 focus-visible:ring-graphite/40',
        quiet ? 'text-graphite ring-1 ring-graphite/20 hover:bg-graphite/[0.04]' : 'bg-graphite text-paper-lit hover:bg-graphite/90',
      )}
    >
      {children}
    </button>
  )
}
