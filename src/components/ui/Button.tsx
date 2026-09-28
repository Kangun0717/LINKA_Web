import type { ButtonHTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/cn'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode
  variant?: 'primary' | 'quiet'
  loading?: boolean
  /** What a busy button says. */
  busyLabel?: string
}

const VARIANTS = {
  primary: 'bg-sand text-ink hover:bg-white disabled:bg-sand/40 disabled:text-ink/50',
  quiet: 'text-sand-muted hover:text-sand disabled:text-sand-faint',
} as const

/** The only call-to-action shape in the product. One per screen. */
export default function Button({
  children,
  variant = 'primary',
  loading = false,
  busyLabel = 'Just a moment…',
  className,
  disabled,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex h-14 w-full items-center justify-center rounded-full text-[0.95rem] font-medium tracking-wide',
        'transition-colors duration-300 ease-calm outline-none',
        'focus-visible:ring-2 focus-visible:ring-glow focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
        'disabled:cursor-not-allowed',
        VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {loading ? <span className="opacity-70">{busyLabel}</span> : children}
    </button>
  )
}
