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
import { nextStepFor } from '@/routes/nextStep'
import { useAuthMessages } from '@/lib/i18n/authMessages'

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
  const t = useAuthMessages()

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
      setNicknameError(t.onboarding.nicknameRequired)
      return
    }

    if (!user) {
      setSaveError(t.onboarding.sessionExpired)
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
      // Home — or the Touch Point they tapped before creating the account.
      navigate(nextStepFor(user, saved), { replace: true })
    } catch {
      setSaveError(t.onboarding.saveFailed)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen align="top">
      <form onSubmit={handleSubmit} className="flex flex-1 flex-col py-6">
        <h1 className="text-3xl font-light leading-snug tracking-tight text-sand">
          {t.onboarding.title}
        </h1>
        <p className="mt-4 text-sm leading-relaxed text-sand-muted">
          {t.onboarding.body}
        </p>

        <div className="mt-12 space-y-12">
          <AvatarPicker
            value={avatar}
            onChange={setAvatar}
            initial={(nickname.trim()[0] ?? ':').toUpperCase()}
          />

          <TextField
            label={t.onboarding.nickname}
            value={nickname}
            onChange={(event) => {
              setNickname(event.target.value)
              setNicknameError(null)
            }}
            error={nicknameError}
            placeholder={t.onboarding.nicknamePlaceholder}
            maxLength={40}
            autoComplete="nickname"
            required
          />

          <ChoiceGroup
            label={t.onboarding.ageRange}
            options={AGE_RANGES.map((o) => (o.value === 'under_18' ? { ...o, label: t.onboarding.under18 } : o))}
            value={ageRange}
            onChange={setAgeRange}
          />

          <NationalityField value={nationality} onChange={setNationality} />

          <ChoiceGroup
            label={t.onboarding.gender}
            options={GENDERS.map((o) => ({ ...o, label: t.onboarding.genders[o.value as keyof typeof t.onboarding.genders] ?? o.label }))}
            value={gender}
            onChange={setGender}
          />
        </div>

        <div className="mt-14 shrink-0">
          {saveError ? (
            <p role="alert" className="mb-4 text-center text-sm text-red-300">
              {saveError}
            </p>
          ) : null}

          <Button type="submit" loading={saving} busyLabel={t.busy}>
            {t.onboarding.submit}
          </Button>
        </div>
      </form>
    </Screen>
  )
}
