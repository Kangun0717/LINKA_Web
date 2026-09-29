import { onPrivateReset } from '@/data/store'
import { preparePhoto, randomName, thumbPathOf } from '@/features/memories/photos'
import type { Mood } from '@/lib/i18n/journeyMessages'
import { getSupabase } from '@/lib/supabase'
import type { Tables, TablesUpdate } from '@/types/database.types'

/**
 * A person's own memories: the note, the mood and the photographs of a visit.
 *
 * Everything here is private. RLS lets a user read and write only their own
 * rows and their own `memory-photos/<user id>/…` objects; photos are shown
 * through short-lived signed URLs, never public ones.
 */

export type MemoryPhotoRow = Pick<Tables<'memory_photos'>, 'id' | 'storage_path' | 'width' | 'height' | 'position'>

/**
 * A memory is one of two kinds, never confused:
 *
 *   visit — the memory of a verified Visit (one per visit; the database
 *           enforces it). Its date is the visit's local date.
 *   past  — a journal entry: a place and a time the person records
 *           themselves, with no visit. It can never colour the map, count as
 *           a verified place or reach analytics — the database gives it no
 *           visit and no way to gain one (`kind` is not updatable).
 *
 * `touch_event_id` is only set on memories created before visits existed; it
 * stays readable, but nothing new is keyed by it.
 */
export type MemoryRecord = Pick<
  Tables<'memories'>,
  | 'id'
  | 'note'
  | 'place_id'
  | 'visit_id'
  | 'touch_event_id'
  | 'cover_photo_id'
  | 'created_at'
  | 'updated_at'
  | 'kind'
  | 'place_label'
  | 'remembered_on'
  | 'date_precision'
> & {
  /** Present once the mood migration is applied. */
  mood?: Mood | null
  memory_photos: MemoryPhotoRow[]
}

/**
 * `memories` and `memory_photos` are joined by two foreign keys (a photo's
 * memory_id, and a memory's cover_photo_id), so the embed must name which one
 * it means. Left bare, PostgREST refuses the whole request (PGRST201) — which
 * silently broke saving memories, uploading photos and Moments.
 */
const MEMORY_COLUMNS = '*, memory_photos!memory_photos_memory_id_fkey(id, storage_path, width, height, position)'

export async function fetchMyMemories(): Promise<MemoryRecord[]> {
  const { data, error } = await (await getSupabase())
    .from('memories')
    .select(MEMORY_COLUMNS)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as unknown as MemoryRecord[]
}

/** The memory of a visit, if one has been kept. At most one exists. */
export async function fetchMemoryForVisit(visitId: string): Promise<MemoryRecord | null> {
  const { data, error } = await (await getSupabase())
    .from('memories')
    .select(MEMORY_COLUMNS)
    .eq('visit_id', visitId)
    .maybeSingle()
  if (error) throw error
  return data as unknown as MemoryRecord | null
}

/** The insert lost to a memory that already exists for this visit (`memories_visit_id_key`). */
function isVisitAlreadyRemembered(error: { code?: string; message?: string } | null): boolean {
  return Boolean(error && error.code === '23505' && error.message?.includes('memories_visit_id_key'))
}

/** The server does not have the mood column yet (its migration is pending). */
function isMissingMoodColumn(error: { code?: string; message?: string } | null): boolean {
  return Boolean(error && (error.code === 'PGRST204' || error.code === '42703') && error.message?.includes('mood'))
}

/**
 * `recovered`: the caller did not know this visit already had a memory, so
 * the one that existed was updated instead — and it may hold words or a mood
 * the caller has not shown yet.
 */
export type SavedMemory = { memory: MemoryRecord; moodSkipped: boolean; recovered: boolean }

/** The visit a memory belongs to: `record_touch()`'s `visit_id` and `place_id`. */
export type VisitRef = { visitId: string; placeId: string }

/**
 * Create or update the memory of one visit. Empty fields stay empty: nothing
 * is filled in on the user's behalf.
 *
 * A visit has at most one memory. If the caller did not know one already
 * existed — a second tab, a save racing the initial load, a photo and a save
 * at once — the insert is refused by the database and the existing memory is
 * updated instead, so a visit never gains a second memory. That update only
 * adds what the caller supplied: an empty note or no mood keeps what is there.
 *
 * If the server cannot store a mood yet, the note and photos are still saved
 * and the caller is told (`moodSkipped`) so it can say so — never silently.
 */
export async function saveMemory(
  existing: MemoryRecord | null,
  visit: VisitRef,
  input: { note: string; mood: Mood | null },
): Promise<SavedMemory> {
  const supabase = await getSupabase()
  let target = existing
  let fields = input
  const write = (withMood: boolean) => {
    const values: { note: string | null; mood?: Mood | null } = { note: fields.note.trim() || null }
    if (withMood && (fields.mood || target?.mood)) values.mood = fields.mood
    // `mood` joins the generated types once its migration is applied.
    const row = values as TablesUpdate<'memories'>
    const query = target
      ? supabase.from('memories').update(row).eq('id', target.id)
      : supabase.from('memories').insert({ ...row, visit_id: visit.visitId, place_id: visit.placeId })
    return query.select(MEMORY_COLUMNS).single()
  }

  let { data, error } = await write(true)
  let recovered = false
  if (!target && isVisitAlreadyRemembered(error)) {
    target = await fetchMemoryForVisit(visit.visitId)
    if (target) {
      recovered = true
      fields = { note: input.note.trim() ? input.note : (target.note ?? ''), mood: input.mood ?? target.mood ?? null }
      ;({ data, error } = await write(true))
    }
  }
  let moodSkipped = false
  if (isMissingMoodColumn(error) && fields.mood) {
    ;({ data, error } = await write(false))
    moodSkipped = true
  }
  if (error) throw error
  return { memory: data as unknown as MemoryRecord, moodSkipped, recovered }
}

const BUCKET = 'memory-photos'

/**
 * Upload one photo into the user's own folder and attach it to the memory:
 * the photo (EXIF stripped on this device) and, next to it, a thumbnail for
 * lists and the map. Becomes the cover if the memory has none.
 */
export async function addMemoryPhoto(
  memory: MemoryRecord,
  userId: string,
  file: File,
  position = memory.memory_photos.length,
): Promise<MemoryPhotoRow> {
  const supabase = await getSupabase()
  const { blob, width, height, thumb } = await preparePhoto(file)
  const path = `${userId}/${memory.id}/${randomName()}.jpg`

  const upload = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false })
  if (upload.error) throw upload.error
  // The thumbnail is a convenience: without it, lists show the photo itself.
  if (thumb) await supabase.storage.from(BUCKET).upload(thumbPathOf(path), thumb, { contentType: 'image/jpeg', upsert: false }).catch(() => {})

  const { data, error } = await supabase
    .from('memory_photos')
    .insert({ memory_id: memory.id, storage_path: path, width, height, position })
    .select('id, storage_path, width, height, position')
    .single()
  if (error) {
    await supabase.storage.from(BUCKET).remove([path, thumbPathOf(path)])
    throw error
  }

  if (!memory.cover_photo_id) {
    await supabase.from('memories').update({ cover_photo_id: data.id }).eq('id', memory.id)
  }
  return data
}

export async function removeMemoryPhoto(photo: MemoryPhotoRow): Promise<void> {
  const supabase = await getSupabase()
  const { error } = await supabase.from('memory_photos').delete().eq('id', photo.id)
  if (error) throw error
  await supabase.storage.from(BUCKET).remove([photo.storage_path, thumbPathOf(photo.storage_path)])
}

/** The photo shown first, in lists and on the map. */
export async function setCover(memory: MemoryRecord, photoId: string): Promise<void> {
  const { error } = await (await getSupabase()).from('memories').update({ cover_photo_id: photoId }).eq('id', memory.id)
  if (error) throw error
}

/** The order photos are shown in (`position` is the only photo field a user may change, with alt). */
export async function reorderPhotos(photos: readonly MemoryPhotoRow[]): Promise<void> {
  const supabase = await getSupabase()
  const moved = photos.map((photo, position) => ({ photo, position })).filter(({ photo, position }) => photo.position !== position)
  const results = await Promise.all(moved.map(({ photo, position }) => supabase.from('memory_photos').update({ position }).eq('id', photo.id)))
  const failed = results.find((r) => r.error)
  if (failed?.error) throw failed.error
}

export type PastMemoryInput = {
  /** A published LINKA place, or null with the person's own words in `placeLabel`. */
  placeId: string | null
  placeLabel: string | null
  /** YYYY-MM-DD; a month or year is stored as its first day, with its precision. */
  rememberedOn: string | null
  precision: 'day' | 'month' | 'year'
  note: string
  mood: Mood | null
}

/**
 * Create or update a past journal entry. It is written with `kind = 'past'`
 * and no visit — the one shape the database accepts for it — so it can
 * never become verified presence.
 */
export async function savePastMemory(existing: MemoryRecord | null, input: PastMemoryInput): Promise<MemoryRecord> {
  const supabase = await getSupabase()
  const fields = {
    place_id: input.placeId,
    place_label: input.placeId ? null : input.placeLabel?.trim() || null,
    remembered_on: input.rememberedOn,
    date_precision: input.precision,
    note: input.note.trim() || null,
    mood: input.mood,
  }
  const query = existing
    ? supabase.from('memories').update(fields).eq('id', existing.id)
    : supabase.from('memories').insert({ ...fields, kind: 'past' })
  const { data, error } = await query.select(MEMORY_COLUMNS).single()
  if (error) throw error
  return data as unknown as MemoryRecord
}

/**
 * Delete a past journal entry and its photos. (A verified visit's memory is
 * not deleted from the app: the visit stays, and its words can be cleared.)
 */
export async function deletePastMemory(memory: MemoryRecord): Promise<void> {
  if (memory.kind !== 'past') throw new Error('Only a journal entry can be deleted.')
  const supabase = await getSupabase()
  const paths = memory.memory_photos.flatMap((p) => [p.storage_path, thumbPathOf(p.storage_path)])
  const { error } = await supabase.from('memories').delete().eq('id', memory.id)
  if (error) throw error
  if (paths.length > 0) await supabase.storage.from(BUCKET).remove(paths).catch(() => {})
}

const signed = new Map<string, { url: string; expires: number }>()
const SIGNED_SECONDS = 60 * 60
// Signed URLs are private data too: dropped with the rest when the account changes.
onPrivateReset(() => signed.clear())

/** Short-lived URLs for private photos, reused until shortly before they expire. */
export async function signedPhotoUrls(paths: string[]): Promise<Record<string, string>> {
  const now = Date.now()
  const missing = paths.filter((path) => (signed.get(path)?.expires ?? 0) < now + 60_000)
  if (missing.length > 0) {
    const { data, error } = await (await getSupabase()).storage.from(BUCKET).createSignedUrls(missing, SIGNED_SECONDS)
    if (error) throw error
    for (const item of data) {
      if (item.path && item.signedUrl) signed.set(item.path, { url: item.signedUrl, expires: now + SIGNED_SECONDS * 1000 })
    }
  }
  return Object.fromEntries(paths.flatMap((path) => (signed.has(path) ? [[path, signed.get(path)!.url]] : [])))
}
