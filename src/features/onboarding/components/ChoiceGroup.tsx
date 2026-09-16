import type { Option } from '@/features/onboarding/data/options'
import { cn } from '@/lib/cn'

type ChoiceGroupProps = {
  label: string
  options: Option[]
  value: string | null
  /** Passing `null` clears the answer — every one of these fields is optional. */
  onChange: (value: string | null) => void
}

/** Optional single-choice field rendered as quiet, tappable pills. */
export default function ChoiceGroup({ label, options, value, onChange }: ChoiceGroupProps) {
  return (
    <fieldset>
      <legend className="text-xs font-medium uppercase tracking-[0.16em] text-sand-faint">
        {label}
        <span className="ml-2 normal-case tracking-normal text-sand-faint/70">optional</span>
      </legend>

      <div className="mt-4 flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = option.value === value

          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => onChange(isSelected ? null : option.value)}
              className={cn(
                'rounded-full border px-4 py-2.5 text-sm transition-colors duration-300 ease-calm outline-none',
                'focus-visible:ring-2 focus-visible:ring-glow focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
                isSelected
                  ? 'border-sand bg-sand text-ink'
                  : 'border-ink-line text-sand-muted hover:border-sand-faint hover:text-sand',
              )}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
