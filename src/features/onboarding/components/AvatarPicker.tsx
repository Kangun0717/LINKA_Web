import { AVATAR_PRESETS, findPreset, toAvatarValue } from '@/features/onboarding/data/avatars'
import { cn } from '@/lib/cn'

type AvatarPickerProps = {
  value: string | null
  onChange: (value: string) => void
  /** First letter shown inside the avatar while no nickname exists yet. */
  initial: string
}

/** Choose one of a small set of painted avatars. Upload lands in a later sprint. */
export default function AvatarPicker({ value, onChange, initial }: AvatarPickerProps) {
  const selected = findPreset(value) ?? AVATAR_PRESETS[0]

  return (
    <div>
      <div className="flex justify-center">
        <div
          aria-hidden
          className={cn(
            'flex size-24 items-center justify-center rounded-full text-3xl font-light text-ink/70',
            selected.className,
          )}
        >
          {initial}
        </div>
      </div>

      <div
        role="radiogroup"
        aria-label="Avatar"
        className="mt-6 flex flex-wrap justify-center gap-3"
      >
        {AVATAR_PRESETS.map((preset) => {
          const isSelected = preset.id === selected.id

          return (
            <button
              key={preset.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={preset.label}
              onClick={() => onChange(toAvatarValue(preset.id))}
              className={cn(
                'size-9 rounded-full outline-none transition duration-300 ease-calm',
                'focus-visible:ring-2 focus-visible:ring-glow focus-visible:ring-offset-2 focus-visible:ring-offset-ink',
                preset.className,
                isSelected
                  ? 'ring-2 ring-sand ring-offset-2 ring-offset-ink'
                  : 'opacity-50 hover:opacity-90',
              )}
            />
          )
        })}
      </div>
    </div>
  )
}
