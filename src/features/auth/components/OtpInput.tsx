import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react'

import { cn } from '@/lib/cn'

export const OTP_LENGTH = 6

type OtpInputProps = {
  value: string
  onChange: (value: string) => void
  /** Fired once the final digit completes the code. */
  onComplete?: (value: string) => void
  disabled?: boolean
  invalid?: boolean
  describedBy?: string
}

/**
 * Six single-digit boxes that behave like one field.
 *
 * Paste, arrow keys and backspace all work across the whole code, and the
 * group is labelled as a single control so screen readers announce it once.
 */
export default function OtpInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  invalid = false,
  describedBy,
}: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  useEffect(() => {
    inputsRef.current[0]?.focus()
  }, [])

  const digits = Array.from({ length: OTP_LENGTH }, (_, index) => value[index] ?? '')

  function commit(next: string, focusIndex: number) {
    const trimmed = next.slice(0, OTP_LENGTH)
    onChange(trimmed)
    inputsRef.current[Math.min(focusIndex, OTP_LENGTH - 1)]?.focus()

    if (trimmed.length === OTP_LENGTH) {
      onComplete?.(trimmed)
    }
  }

  function handleInput(index: number, raw: string) {
    const typed = raw.replace(/\D/g, '')

    if (!typed) {
      return
    }

    const chars = value.padEnd(OTP_LENGTH, ' ').split('')
    typed.split('').forEach((char, offset) => {
      if (index + offset < OTP_LENGTH) {
        chars[index + offset] = char
      }
    })

    commit(chars.join('').trimEnd(), index + typed.length)
  }

  function handleKeyDown(index: number, event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace') {
      event.preventDefault()
      const chars = value.split('')

      if (chars[index]) {
        chars[index] = ''
        commit(chars.join('').trimEnd(), index)
        return
      }

      chars[index - 1] = ''
      commit(chars.join('').trimEnd(), Math.max(index - 1, 0))
      return
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      inputsRef.current[Math.max(index - 1, 0)]?.focus()
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      inputsRef.current[Math.min(index + 1, OTP_LENGTH - 1)]?.focus()
    }
  }

  function handlePaste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '')

    if (pasted) {
      event.preventDefault()
      commit(pasted.slice(0, OTP_LENGTH), pasted.length)
    }
  }

  return (
    <div
      role="group"
      aria-label={`Verification code, ${OTP_LENGTH} digits`}
      aria-describedby={describedBy}
      className="flex justify-between gap-2"
    >
      {digits.map((digit, index) => (
        <input
          // Positions are fixed, so the index is a stable identity here.
          // oxlint-disable-next-line no-array-index-key
          key={index}
          ref={(element) => {
            inputsRef.current[index] = element
          }}
          value={digit}
          onChange={(event) => handleInput(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={handlePaste}
          onFocus={(event) => event.target.select()}
          disabled={disabled}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={OTP_LENGTH}
          aria-label={`Digit ${index + 1}`}
          aria-invalid={invalid || undefined}
          className={cn(
            'h-16 w-full min-w-0 rounded-xl border bg-ink-raised text-center text-2xl font-light text-sand',
            'outline-none transition-colors duration-300 ease-calm',
            'focus:border-glow disabled:opacity-50',
            invalid ? 'border-red-400/70' : 'border-ink-line',
          )}
        />
      ))}
    </div>
  )
}
