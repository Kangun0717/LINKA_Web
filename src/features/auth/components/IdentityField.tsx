import TextField from '@/components/ui/TextField'
import type { IdentityMethod } from '@/features/auth/identity'
import { cn } from '@/lib/cn'
import { useAuthMessages } from '@/lib/i18n/authMessages'

type MethodSwitchProps = {
  method: IdentityMethod
  onChange: (method: IdentityMethod) => void
}

/** Email · Phone — two quiet words, not a tab bar. */
export function MethodSwitch({ method, onChange }: MethodSwitchProps) {
  const t = useAuthMessages()
  return (
    <div role="radiogroup" aria-label={t.method.label} className="flex gap-1">
      {(['email', 'phone'] as const).map((option) => (
        <button
          key={option}
          type="button"
          role="radio"
          aria-checked={method === option}
          onClick={() => onChange(option)}
          className={cn(
            'rounded-full px-3.5 py-1.5 text-xs tracking-[0.14em] uppercase outline-none transition-colors duration-300 ease-calm',
            'focus-visible:ring-1 focus-visible:ring-glow',
            method === option ? 'bg-sand/10 text-sand' : 'text-sand-faint hover:text-sand-muted',
          )}
        >
          {option === 'email' ? t.method.email : t.method.phone}
        </button>
      ))}
    </div>
  )
}

type IdentityFieldProps = {
  method: IdentityMethod
  value: string
  onChange: (value: string) => void
  error: string | null
  /** From `usePhoneAvailable`; phone input is disabled unless `true`. */
  phoneAvailable: boolean | null
}

export function IdentityField({ method, value, onChange, error, phoneAvailable }: IdentityFieldProps) {
  const t = useAuthMessages()
  if (method === 'email') {
    return (
      <TextField
        label={t.field.email}
        type="email"
        name="email"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        error={error}
        placeholder="you@example.com"
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
        required
      />
    )
  }

  return (
    <TextField
      label={t.field.phone}
      type="tel"
      name="phone"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      error={error}
      hint={
        phoneAvailable === false
          ? t.hint.phoneOff
          : t.hint.phoneCode
      }
      placeholder="+81 90 1234 5678"
      autoComplete="tel"
      inputMode="tel"
      disabled={phoneAvailable !== true}
      required
    />
  )
}
