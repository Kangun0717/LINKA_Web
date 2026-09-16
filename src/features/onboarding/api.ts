import { getSupabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

export type Profile = Database['public']['Tables']['profiles']['Row']

/** The subset of `public.profiles` this sprint writes. */
export type ProfileDraft = {
  displayName: string
  avatarUrl: string | null
  ageRange: string | null
  nationality: string | null
  gender: string | null
}

/**
 * Read the signed-in user's profile row.
 *
 * Returns `null` when no row exists yet — that is the normal state for someone
 * who has just verified their first code.
 */
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return data
}

/**
 * Create or update the signed-in user's profile.
 *
 * `id` is the auth user id, so RLS ("a user may only touch their own row")
 * is what makes this safe — the client never chooses whose profile it writes.
 * Upsert covers both cases because a row may already have been created by a
 * database trigger on sign-up.
 */
export async function saveProfile(userId: string, draft: ProfileDraft): Promise<Profile> {
  const { data, error } = await getSupabase()
    .from('profiles')
    .upsert(
      {
        id: userId,
        display_name: draft.displayName,
        avatar_url: draft.avatarUrl,
        age_range: draft.ageRange,
        nationality: draft.nationality,
        gender: draft.gender,
      },
      { onConflict: 'id' },
    )
    .select()
    .single()

  if (error) {
    throw error
  }

  return data
}

/** Onboarding is complete once the user has chosen a nickname. */
export function isProfileComplete(profile: Profile | null): boolean {
  return Boolean(profile?.display_name?.trim())
}
