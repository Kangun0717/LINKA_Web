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

export type MemoryRecord = Pick<
  Tables<'memories'>,
  'id' | 'note' | 'place_id' | 'touch_event_id' | 'cover_photo_id' | 'created_at' | 'updated_at'
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

export async function fetchMemoryForTouch(touchEventId: string): Promise<MemoryRecord | null> {
  const { data, error } = await (await getSupabase())
    .from('memories')
    .select(MEMORY_COLUMNS)
    .eq('touch_event_id', touchEventId)
    .maybeSingle()
  if (error) throw error
  return data as unknown as MemoryRecord | null
}

/** The server does not have the mood column yet (its migration is pending). */
function isMissingMoodColumn(error: { code?: string; message?: string } | null): boolean {
  return Boolean(error && (error.code === 'PGRST204' || error.code === '42703') && error.message?.includes('mood'))
}

export type SavedMemory = { memory: MemoryRecord; moodSkipped: boolean }

/**
 * Create or update the memory of one visit. Empty fields stay empty: nothing
 * is filled in on the user's behalf.
 *
 * If the server cannot store a mood yet, the note and photos are still saved
 * and the caller is told (`moodSkipped`) so it can say so — never silently.
 */
export async function saveMemory(
  existing: MemoryRecord | null,
  visit: { touchEventId: string; placeId: string },
  fields: { note: string; mood: Mood | null },
): Promise<SavedMemory> {
  const supabase = await getSupabase()
  const write = (withMood: boolean) => {
    const values: { note: string | null; mood?: Mood | null } = { note: fields.note.trim() || null }
    if (withMood && (fields.mood || existing?.mood)) values.mood = fields.mood
    // `mood` joins the generated types once its migration is applied.
    const row = values as TablesUpdate<'memories'>
    const query = existing
      ? supabase.from('memories').update(row).eq('id', existing.id)
      : supabase.from('memories').insert({ ...row, place_id: visit.placeId, touch_event_id: visit.touchEventId })
    return query.select(MEMORY_COLUMNS).single()
  }

  let { data, error } = await write(true)
  let moodSkipped = false
  if (isMissingMoodColumn(error) && fields.mood) {
    ;({ data, error } = await write(false))
    moodSkipped = true
  }
  if (error) throw error
  return { memory: data as unknown as MemoryRecord, moodSkipped }
}

const BUCKET = 'memory-photos'
const MAX_EDGE = 2048

/** Load a picked file into an <img>, the way Safari handles most reliably. */
async function loadImage(file: File): Promise<{ image: HTMLImageElement; revoke: () => void }> {
  const url = URL.createObjectURL(file)
  const image = new Image()
  image.decoding = 'async'
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('This photo could not be read.'))
      image.src = url
    })
    return { image, revoke: () => URL.revokeObjectURL(url) }
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}

async function encode(image: HTMLImageElement, maxEdge: number): Promise<{ blob: Blob; width: number; height: number } | null> {
  const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return null
  context.drawImage(image, 0, 0, width, height)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85))
  // Give the canvas memory back at once; iOS keeps a tight budget for canvases.
  canvas.width = 0
  canvas.height = 0
  return blob ? { blob, width, height } : null
}

/**
 * A photo from the phone, made ready to keep: upright (browsers apply the
 * EXIF orientation when drawing), at most 2048 px on its long edge,
 * re-encoded as JPEG. Drawing through a canvas keeps only the pixels — EXIF,
 * including GPS location, does not survive.
 *
 * iPhone photos arrive as JPEG (Safari converts HEIC for uploads) or as HEIC,
 * which Safari can also decode. If the full-size encode fails under iOS
 * memory limits, it tries again smaller rather than giving up.
 */
async function preparePhoto(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  const { image, revoke } = await loadImage(file)
  try {
    for (const edge of [MAX_EDGE, 1600, 1024]) {
      const result = await encode(image, edge)
      if (result) return result
    }
    throw new Error('This photo could not be prepared.')
  } finally {
    revoke()
  }
}

/**
 * A random file name. `crypto.randomUUID` is missing on plain-HTTP pages
 * (such as a phone opening the dev server on the LAN), so it is built from
 * `getRandomValues`, which works everywhere.
 */
function randomName(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}

/** Upload one photo into the user's own folder and attach it to the memory. */
export async function addMemoryPhoto(
  memory: MemoryRecord,
  userId: string,
  file: File,
): Promise<MemoryPhotoRow> {
  const supabase = await getSupabase()
  const { blob, width, height } = await preparePhoto(file)
  const path = `${userId}/${memory.id}/${randomName()}.jpg`

  const upload = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg', upsert: false })
  if (upload.error) throw upload.error

  const { data, error } = await supabase
    .from('memory_photos')
    .insert({ memory_id: memory.id, storage_path: path, width, height, position: memory.memory_photos.length })
    .select('id, storage_path, width, height, position')
    .single()
  if (error) {
    await supabase.storage.from(BUCKET).remove([path])
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
  await supabase.storage.from(BUCKET).remove([photo.storage_path])
}

const signed = new Map<string, { url: string; expires: number }>()
const SIGNED_SECONDS = 60 * 60

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
