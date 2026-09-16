import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'

import Button from '@/components/ui/Button'
import Screen from '@/components/ui/Screen'
import TextField from '@/components/ui/TextField'
import { useAuth } from '@/features/auth/useAuth'
import { saveProfile, type Profile } from '@/features/onboarding/api'
import AvatarPicker from '@/features/onboarding/components/AvatarPicker'
import ChoiceGroup from '@/features/onboarding/components/ChoiceGroup'
import NationalityField from '@/features/onboarding/components/NationalityField'
import { AVATAR_PRESETS, toAvatarValue } from '@/features/onboarding/data/avatars'
import { AGE_RANGES, GENDERS } from '@/features/onboarding/data/options'

type OnboardingScreenProps = {
  /** Existing row, when the user got partway through before. */
  profile: Profile | null
  onSaved: (profile: Profile) => void
}

const DEFAULT_AVATAR = toAvatarValue(AVATAR_PRESETS[0].id)

/**
 * First-run profile creation.
 *
 * Only the nickname is required; every demographic field can be left alone and
 * is stored as `null` rather than an empty string.
 */
export default function OnboardingScreen({ profile, onSaved }: OnboardingScreenProps) {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [nickname, setNickname] = useState(profile?.display_name ?? '')
  const [avatar, setAvatar] = useState(profile?.avatar_url ?? DEFAULT_AVATAR)
  const [ageRange, setAgeRange] = useState(profile?.age_range ?? null)
  const [nationality, setNationality] = useState(profile?.nationality ?? null)
  const [gender, setGender] = useState(profile?.gender ?? null)

  const [nicknameError, setNicknameError] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const trimmed = nickname.trim()

    if (!trimmed) {
      setNicknameError('Choose a nickname so we know what to call you.')
      return
    }

    if (!user) {
      setSaveError('Your session has expired. Please sign in again.')
      return
    }

    setNicknameError(null)
    setSaveError(null)
    setSaving(true)

    try {
      const saved = await saveProfile(user.id, {
        displayName: trimmed,
        avatarUrl: avatar,
        ageRange,
        nationality,
        gender,
      })
      // Seed shared state before navigating, so the home guard sees the new
      // nickname instead of bouncing back to onboarding.
      onSaved(saved)
      navigate('/home', { replace: true })
    } catch {
      setSaveError('We could not save your profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen align="top">
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col py-6">
        <h1 className="text-3xl font-light leading-snug tracking-tight text-sand">
          Create your profile
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-sand-muted">
          Just a nickname is enough. The rest is yours to share, or not.
        </p>

        <div className="mt-12 space-y-12">
          <AvatarPicker
            value={avatar}
            onChange={setAvatar}
            initial={(nickname.trim()[0] ?? ':').toUpperCase()}
          />

          <TextField
            label="Nickname"
            value={nickname}
            onChange={(event) => {
              setNickname(event.target.value)
              setNicknameError(null)
            }}
            error={nicknameError}
            placeholder="What should we call you?"
            maxLength={40}
            autoComplete="nickname"
            required
          />

          <ChoiceGroup
            label="Age range"
            options={AGE_RANGES}
            value={ageRange}
            onChange={setAgeRange}
          />

          <NationalityField value={nationality} onChange={setNationality} />

          <ChoiceGroup label="Gender" options={GENDERS} value={gender} onChange={setGender} />
        </div>

        <div className="mt-14 shrink-0">
          {saveError ? (
            <p role="alert" className="mb-4 text-center text-sm text-red-300">
              {saveError}
            </p>
          ) : null}

          <Button type="submit" loading={saving}>
            Start my Journey
          </Button>
        </div>
      </form>
    </Screen>
  )
}
