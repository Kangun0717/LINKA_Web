import { cn } from '@/lib/cn'

type TouchPointMarkProps = {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const SIZES = {
  sm: 'text-base',
  md: 'text-2xl',
  lg: 'text-4xl',
} as const

/**
 * The `:)))` Touch Point mark — LINKA's physical identity.
 *
 * It is a symbol, not a sentence, so it is exposed to assistive tech under a
 * single stable name instead of being read character by character.
 */
export default function TouchPointMark({ size = 'md', className }: TouchPointMarkProps) {
  return (
    <span
      role="img"
      aria-label="LINKA Touch Point"
      className={cn('touchpoint-mark select-none leading-none', SIZES[size], className)}
    >
      :)))
    </span>
  )
}
