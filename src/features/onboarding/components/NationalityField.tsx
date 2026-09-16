import { useId } from 'react'

import { COUNTRIES, flagOf } from '@/features/onboarding/data/nationalities'

type NationalityFieldProps = {
  value: string | null
  onChange: (value: string | null) => void
}

/**
 * Nationality as flag + country name.
 *
 * A native `<select>` is deliberate: on mobile it opens the platform picker,
 * which is faster and more accessible than any custom list we would build.
 */
export default function NationalityField({ value, onChange }: NationalityFieldProps) {
  const id = useId()
  const selected = COUNTRIES.find((country) => country.code === value) ?? null

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-medium uppercase tracking-[0.16em] text-sand-faint"
      >
        Nationality
        <span className="ml-2 normal-case tracking-normal text-sand-faint/70">optional</span>
      </label>

      <div className="mt-4 flex items-center gap-3 border-b border-ink-line pb-3 focus-within:border-glow">
        <span aria-hidden className="text-2xl leading-none">
          {selected ? flagOf(selected.code) : '🌍'}
        </span>

        <select
          id={id}
          value={value ?? ''}
          onChange={(event) => onChange(event.target.value || null)}
          className="w-full appearance-none bg-transparent text-lg text-sand outline-none"
        >
          <option value="" className="bg-ink-raised text-sand">
            Not specified
          </option>
          {COUNTRIES.map((country) => (
            <option key={country.code} value={country.code} className="bg-ink-raised text-sand">
              {`${flagOf(country.code)}  ${country.name}`}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
