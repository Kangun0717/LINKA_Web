import { useId, type InputHTMLAttributes } from 'react'

import { cn } from '@/lib/cn'

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & {
  label: string
  hint?: string
  error?: string | null
}

/** Underlined, label-above input. Quiet by default, warm when focused. */
export default function TextField({
  label,
  hint,
  error,
  className,
  ...rest
}: TextFieldProps) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className="block text-xs font-medium uppercase tracking-[0.16em] text-sand-faint"
      >
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn(
          'mt-3 w-full bg-transparent pb-3 text-lg text-sand placeholder:text-sand-faint/60',
          'border-b outline-none transition-colors duration-300 ease-calm',
          error ? 'border-red-400/70' : 'border-ink-line focus:border-glow',
          className,
        )}
        {...rest}
      />
      {hint && !error ? (
        <p id={`${id}-hint`} className="mt-3 text-sm text-sand-faint">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  )
}
