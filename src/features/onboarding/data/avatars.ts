/**
 * Preset avatars.
 *
 * Photo upload is out of scope for this sprint, so `profiles.avatar_url` holds
 * a `preset:<id>` token instead of a URL. Anything that is not a preset token
 * is treated as a real image URL, which is how uploads will slot in later.
 */
export type AvatarPreset = {
  id: string
  label: string
  /** Tailwind gradient classes used to paint the preset. */
  className: string
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  { id: 'dawn', label: 'Dawn', className: 'bg-gradient-to-br from-[#e2b271] to-[#8c5a3c]' },
  { id: 'moss', label: 'Moss', className: 'bg-gradient-to-br from-[#9db38b] to-[#3f5340]' },
  { id: 'tide', label: 'Tide', className: 'bg-gradient-to-br from-[#8fb3c7] to-[#35506b]' },
  { id: 'clay', label: 'Clay', className: 'bg-gradient-to-br from-[#d3a08f] to-[#7a4a41]' },
  { id: 'dusk', label: 'Dusk', className: 'bg-gradient-to-br from-[#a99ac4] to-[#4a3f63]' },
  { id: 'paper', label: 'Paper', className: 'bg-gradient-to-br from-[#f2ece2] to-[#a49b8e]' },
]

export const PRESET_PREFIX = 'preset:'

export function toAvatarValue(presetId: string): string {
  return `${PRESET_PREFIX}${presetId}`
}

export function findPreset(avatarUrl: string | null | undefined): AvatarPreset | null {
  if (!avatarUrl?.startsWith(PRESET_PREFIX)) {
    return null
  }

  const id = avatarUrl.slice(PRESET_PREFIX.length)
  return AVATAR_PRESETS.find((preset) => preset.id === id) ?? null
}
