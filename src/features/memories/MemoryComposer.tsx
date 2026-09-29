import { useEffect, useRef, useState, type FormEvent } from 'react'

import { memorySaved, useMyMemories } from '@/data/journey'
import { useAuth } from '@/features/auth/useAuth'
import {
  addMemoryPhoto,
  removeMemoryPhoto,
  saveMemory,
  signedPhotoUrls,
  type MemoryPhotoRow,
  type MemoryRecord,
  type VisitRef,
} from '@/features/memories/api'
import PhotoViewer from '@/features/memories/PhotoViewer'
import { cn } from '@/lib/cn'
import { MOOD_EMOJI, MOODS, type Mood } from '@/lib/i18n/journeyMessages'
import { useMessages } from '@/lib/i18n/useMessages'

type MemoryComposerProps = {
  /** The visit this memory belongs to — never a single touch. */
  visit: VisitRef
  placeName: string
  /** The Moment page manages photos itself (MemoryPhotos); the Touch flow keeps them here. */
  withPhotos?: boolean
}

type Upload = { key: string; file: File; preview: string; state: 'uploading' | 'failed' }

/**
 * The memory of one visit: how it felt, a line or two, a photograph.
 *
 * It starts from a question rather than an empty box — pick a mood, and a
 * gentle prompt suggests what to write. Nothing is required and nothing is
 * filled in for the user. Photos upload the moment they are chosen (into the
 * user's private folder) and can be opened full screen.
 */
export default function MemoryComposer({ visit, placeName, withPhotos = true }: MemoryComposerProps) {
  const copy = useMessages()
  const { user } = useAuth()
  const [memory, setMemory] = useState<MemoryRecord | null>(null)
  const [mood, setMood] = useState<Mood | null>(null)
  const [note, setNote] = useState('')
  const [promptIndex, setPromptIndex] = useState(0)
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'failed'>('idle')
  const [moodSkipped, setMoodSkipped] = useState(false)
  const [uploads, setUploads] = useState<Upload[]>([])
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [viewing, setViewing] = useState<MemoryPhotoRow | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  /** The user has typed or picked a mood: an arriving memory must not overwrite that. */
  const [edited, setEdited] = useState(false)

  // Every touch at this place today — a repeat tap, another Touch Point, a
  // reload — returns the same visit: resume its memory rather than start one.
  // It comes from the user's memories (shared with Moments and Me), and is
  // adopted once; from then on this form edits that row.
  const { data: memories } = useMyMemories()
  const known = memories?.find((m) => m.visit_id === visit.visitId) ?? null
  if (known && memory === null) {
    setMemory(known)
    if (!edited) {
      setMood(known.mood ?? null)
      setNote(known.note ?? '')
    }
  }

  /** Keep this memory and everyone showing it (Moments, Me) in step. */
  function keep(next: MemoryRecord) {
    setMemory(next)
    if (user) memorySaved(user.id, next)
  }

  const photos = memory?.memory_photos ?? []
  const photoPaths = photos.map((p) => p.storage_path).join('|')
  useEffect(() => {
    if (!photoPaths) return
    let active = true
    signedPhotoUrls(photoPaths.split('|')).then((next) => active && setUrls((prev) => ({ ...prev, ...next })), () => {})
    return () => {
      active = false
    }
  }, [photoPaths])

  async function persist(): Promise<MemoryRecord> {
    const saved = await saveMemory(memory, visit, { note, mood })
    keep(saved.memory)
    setMoodSkipped(saved.moodSkipped)
    if (saved.recovered) {
      // The visit already had a memory this form had not loaded: show what it now holds.
      setNote(saved.memory.note ?? '')
      setMood(saved.memory.mood ?? null)
    }
    return saved.memory
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setState('saving')
    try {
      await persist()
      setState('saved')
    } catch {
      setState('failed')
    }
  }

  async function upload(key: string, file: File) {
    if (!user) return
    setUploads((list) => list.map((u) => (u.key === key ? { ...u, state: 'uploading' } : u)))
    try {
      // A photo belongs to a memory, so the memory is saved first (with the mood and note so far).
      const target = memory ?? (await persist())
      const photo = await addMemoryPhoto(target, user.id, file)
      // From the latest state, not `target`: several photos may be uploading at once.
      setMemory((current) => {
        const base = current ?? target
        const next = { ...base, cover_photo_id: base.cover_photo_id ?? photo.id, memory_photos: [...base.memory_photos, photo] }
        if (user) memorySaved(user.id, next) // idempotent: replaces the row by id
        return next
      })
      setUploads((list) => {
        const done = list.find((u) => u.key === key)
        if (done) URL.revokeObjectURL(done.preview)
        return list.filter((u) => u.key !== key)
      })
    } catch {
      // Never silent: the tile stays, marked failed, with a way to try again.
      setUploads((list) => list.map((u) => (u.key === key ? { ...u, state: 'failed' } : u)))
    }
  }

  function addPhotos(files: FileList | null) {
    const picked = Array.from(files ?? [])
    // Reset at once so choosing the same photo again still fires a change.
    if (fileRef.current) fileRef.current.value = ''
    for (const file of picked) {
      const key = `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`
      setUploads((list) => [...list, { key, file, preview: URL.createObjectURL(file), state: 'uploading' }])
      void upload(key, file)
    }
  }

  async function remove(photo: MemoryPhotoRow) {
    try {
      await removeMemoryPhoto(photo)
      if (memory) {
        const photos = memory.memory_photos.filter((p) => p.id !== photo.id)
        keep({ ...memory, memory_photos: photos, cover_photo_id: memory.cover_photo_id === photo.id ? null : memory.cover_photo_id })
      }
    } catch {
      setState('failed')
    }
  }

  const prompt = copy.memory.prompts[promptIndex % copy.memory.prompts.length]

  return (
    <form onSubmit={submit} className="rounded-2xl bg-white/70 p-4 ring-1 ring-graphite/[0.08]">
      <p className="text-[0.92rem] tracking-[0.03em] text-graphite">{copy.memory.feelingQuestion}</p>

      <div role="radiogroup" aria-label={copy.memory.feelingQuestion} className="mt-3 grid grid-cols-3 gap-2">
        {MOODS.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={mood === option}
            onClick={() => {
              setMood(mood === option ? null : option)
              setEdited(true)
              setState('idle')
            }}
            className={cn(
              'flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl px-1 text-center outline-none transition-colors duration-200',
              'focus-visible:ring-2 focus-visible:ring-graphite/40',
              mood === option ? 'bg-graphite text-paper-lit' : 'bg-paper-lit text-graphite ring-1 ring-graphite/10',
            )}
          >
            <span aria-hidden className="text-[1.25rem] leading-none">{MOOD_EMOJI[option]}</span>
            <span className="text-[0.62rem] leading-tight tracking-[0.02em]">{copy.memory.moods[option]}</span>
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <label htmlFor="memory-note" className="text-[0.8rem] text-graphite-soft">
          {prompt}
        </label>
        <button
          type="button"
          onClick={() => setPromptIndex((i) => i + 1)}
          aria-label="↻"
          className="flex size-9 shrink-0 items-center justify-center rounded-full text-graphite-soft outline-none focus-visible:ring-1 focus-visible:ring-graphite/30"
        >
          ↻
        </button>
      </div>
      <textarea
        id="memory-note"
        value={note}
        onChange={(event) => {
          setNote(event.target.value)
          setEdited(true)
          setState('idle')
        }}
        maxLength={4000}
        rows={3}
        placeholder={copy.memory.placeholder}
        className="mt-1.5 block w-full resize-none rounded-xl bg-paper-lit px-3 py-2.5 text-[16px] font-light leading-relaxed text-graphite outline-none ring-1 ring-graphite/10 placeholder:text-graphite-faint focus:ring-graphite/30"
      />

      {withPhotos && (
      <div className="mt-3 flex flex-wrap gap-2">
        {photos.map((photo) => (
          <div key={photo.id} className="relative">
            <button
              type="button"
              onClick={() => setViewing(photo)}
              aria-label={copy.memory.photoAlt(placeName)}
              className="block size-18 overflow-hidden rounded-lg bg-graphite/10 outline-none focus-visible:ring-2 focus-visible:ring-graphite/40"
            >
              {urls[photo.storage_path] && (
                <img src={urls[photo.storage_path]} alt="" className="size-full object-cover" />
              )}
            </button>
            <button
              type="button"
              onClick={() => void remove(photo)}
              aria-label={copy.memory.removePhoto}
              className="absolute -right-1.5 -top-1.5 flex size-6 items-center justify-center rounded-full bg-graphite text-[0.7rem] text-paper-lit"
            >
              ×
            </button>
          </div>
        ))}
        {uploads.map((item) => (
          <div key={item.key} className="relative size-18 overflow-hidden rounded-lg bg-graphite/10">
            <img src={item.preview} alt="" className={cn('size-full object-cover', 'opacity-50')} />
            {item.state === 'uploading' ? (
              <span className="absolute inset-x-0 bottom-0 animate-pulse bg-black/50 px-1 py-0.5 text-center text-[0.5rem] text-white motion-reduce:animate-none">
                {copy.memory.uploading}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => void upload(item.key, item.file)}
                className="absolute inset-0 flex items-center justify-center bg-[#a0442c]/70 text-[0.62rem] font-medium text-white"
              >
                ↻ {copy.memory.retryPhoto}
              </button>
            )}
          </div>
        ))}
        <label className="flex size-18 cursor-pointer flex-col items-center justify-center gap-0.5 rounded-lg text-center text-[0.58rem] leading-tight text-graphite-soft border border-dashed border-graphite/30 focus-within:border-graphite/60">
          <span aria-hidden className="text-[1.1rem] leading-none">＋</span>
          {copy.memory.addPhoto}
          <input
            ref={fileRef}
            type="file"
            accept="image/*,.heic,.heif"
            multiple
            className="sr-only"
            onChange={(event) => addPhotos(event.target.files)}
          />
        </label>
      </div>
      )}
      {uploads.some((u) => u.state === 'failed') && (
        <p role="alert" className="mt-2 text-[0.66rem] text-[#a0442c]">{copy.memory.uploadFailed}</p>
      )}

      <div className="mt-4 flex items-center justify-between gap-3">
        <p aria-live="polite" className={cn('text-[0.64rem]', state === 'failed' ? 'text-[#a0442c]' : 'text-graphite-faint')}>
          {state === 'saved' ? (moodSkipped ? copy.memory.moodNotSaved : copy.memory.saved) : state === 'failed' ? copy.memory.failed : copy.memory.private}
        </p>
        <button
          type="submit"
          disabled={state === 'saving' || (!note.trim() && !mood)}
          className="min-h-11 shrink-0 rounded-full bg-graphite px-5 text-[0.78rem] tracking-[0.06em] text-paper-lit outline-none disabled:opacity-35 focus-visible:ring-2 focus-visible:ring-graphite/40"
        >
          {state === 'saving' ? copy.memory.saving : copy.memory.save}
        </button>
      </div>

      {viewing && urls[viewing.storage_path] && (
        <PhotoViewer
          src={urls[viewing.storage_path]}
          alt={copy.memory.photoAlt(placeName)}
          width={viewing.width}
          height={viewing.height}
          onClose={() => setViewing(null)}
        />
      )}
    </form>
  )
}
