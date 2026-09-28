import { useId } from 'react'

import { COUNTRIES, flagOf } from '@/features/onboarding/data/nationalities'
import { useAuthMessages } from '@/lib/i18n/authMessages'

type NationalityFieldProps = {
  value: string | null
  onChange: (value: string | null) => void
}

/**
 * Nationality as flag + country name.
 *
 * The flag is drawn exactly once, beside the select. The options carry the
 * name only: a closed native select shows its selected option's text, so a
 * flag inside the option text appeared a second time next to this one.
 *
 * A native `<select>` is deliberate: on mobile it opens the platform picker,
 * which is faster and more accessible than any custom list we would build.
 */
export default function NationalityField({ value, onChange }: NationalityFieldProps) {
  const id = useId()
  const t = useAuthMessages()
  const selected = COUNTRIES.find((country) => country.code === value) ?? null

  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-medium uppercase tracking-[0.16em] text-sand-faint"
      >
        {t.onboarding.nationality}
        <span className="ml-2 normal-case tracking-normal text-sand-faint/70">{t.onboarding.optional}</span>
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
            {t.onboarding.notSpecified}
          </option>
          {COUNTRIES.map((country) => (
            <option key={country.code} value={country.code} className="bg-ink-raised text-sand">
              {country.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
