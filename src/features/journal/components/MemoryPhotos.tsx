import { useEffect, useRef, useState } from 'react'

import { memorySaved } from '@/data/journey'
import { useAuth } from '@/features/auth/useAuth'
import { addMemoryPhoto, removeMemoryPhoto, reorderPhotos, setCover, type MemoryPhotoRow, type MemoryRecord } from '@/features/memories/api'
import PhotoViewer from '@/features/memories/PhotoViewer'
import { orderedPhotos } from '@/features/journal/entry'
import { PrivatePhoto } from '@/features/memories/PrivatePhoto'
import { usePhotoUrls } from '@/features/memories/usePhotoUrls'
import { cn } from '@/lib/cn'
import { useCommunityMessages } from '@/lib/i18n/useCommunityMessages'
import { useMessages } from '@/lib/i18n/useMessages'

type Upload = { key: string; file: File; preview: string; state: 'waiting' | 'uploading' | 'failed' }

/**
 * The photographs of one memory — a verified visit's or a journal entry's:
 * a grid of thumbnails (the full photo opens on a tap, with the others a
 * swipe or arrow away), several added at once with their progress shown and
 * a retry on any that fail, and — under "Edit" — the cover, the order and
 * removal. Uploads go one at a time: gentler on a phone's memory and signal.
 */
export default function MemoryPhotos({
  memory,
  ensureMemory,
  placeName,
  onChange,
}: {
  memory: MemoryRecord | null
  /** A photo belongs to a memory: create one first if there is none yet. */
  ensureMemory: () => Promise<MemoryRecord>
  placeName: string
  onChange: (memory: MemoryRecord) => void
}) {
  const copy = useMessages()
  const cc = useCommunityMessages()
  const { user } = useAuth()
  const photos = orderedPhotos(memory)
  const urls = usePhotoUrls(photos)
  const [viewing, setViewing] = useState<number | null>(null)
  const [editing, setEditing] = useState(false)
  const [uploads, setUploads] = useState<Upload[]>([])
  const [problem, setProblem] = useState(false)
  const [batch, setBatch] = useState({ total: 0, done: 0 })
  const fileRef = useRef<HTMLInputElement>(null)
  const latest = useRef(memory)
  useEffect(() => {
    latest.current = memory
  }, [memory])
  const queue = useRef<Promise<void>>(Promise.resolve())

  function keep(next: MemoryRecord) {
    latest.current = next
    onChange(next)
    if (user) memorySaved(user.id, next)
  }

  function upload(item: Upload) {
    // One at a time, in the order chosen.
    queue.current = queue.current.then(async () => {
      if (!user) return
      setUploads((list) => list.map((u) => (u.key === item.key ? { ...u, state: 'uploading' } : u)))
      try {
        const target = latest.current ?? (await ensureMemory())
        latest.current = target
        const photo = await addMemoryPhoto(target, user.id, item.file, Math.max(-1, ...target.memory_photos.map((p) => p.position)) + 1)
        const base = latest.current ?? target
        keep({ ...base, cover_photo_id: base.cover_photo_id ?? photo.id, memory_photos: [...base.memory_photos, photo] })
        setUploads((list) => list.filter((u) => u.key !== item.key))
        setBatch((b) => ({ ...b, done: b.done + 1 }))
        URL.revokeObjectURL(item.preview)
      } catch {
        setUploads((list) => list.map((u) => (u.key === item.key ? { ...u, state: 'failed' } : u)))
      }
    })
  }

  function add(files: FileList | null) {
    const picked = Array.from(files ?? []).map((file) => ({
      key: `${file.name}-${file.size}-${Math.random()}`,
      file,
      preview: URL.createObjectURL(file),
      state: 'waiting' as const,
    }))
    if (fileRef.current) fileRef.current.value = ''
    setUploads((list) => [...list, ...picked])
    setBatch((b) => (uploads.length === 0 ? { total: picked.length, done: 0 } : { ...b, total: b.total + picked.length }))
    picked.forEach(upload)
  }

  async function act(run: () => Promise<void>, next: MemoryRecord) {
    setProblem(false)
    const before = latest.current
    keep(next)
    try {
      await run()
    } catch {
      if (before) keep(before)
      setProblem(true)
    }
  }

  function makeCover(photo: MemoryPhotoRow) {
    if (!memory) return
    void act(() => setCover(memory, photo.id), { ...memory, cover_photo_id: photo.id })
  }

  function move(from: number, to: number) {
    if (!memory) return
    // The grid's order is the order kept: positions follow it, and whatever
    // stands first is the cover.
    const next = [...photos]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    const positioned = next.map((p, position) => ({ ...p, position }))
    const cover = positioned[0].id
    void act(
      async () => {
        // In their new order, with their old positions: only what moved is written.
        await reorderPhotos(next)
        if (cover !== memory.cover_photo_id) await setCover(memory, cover)
      },
      { ...memory, cover_photo_id: cover, memory_photos: positioned },
    )
  }

  function remove(photo: MemoryPhotoRow) {
    if (!memory) return
    const rest = memory.memory_photos.filter((p) => p.id !== photo.id)
    // Removing the cover makes the next photo the cover (the database only clears it).
    const cover = memory.cover_photo_id === photo.id ? (orderedPhotos({ ...memory, cover_photo_id: null, memory_photos: rest })[0]?.id ?? null) : memory.cover_photo_id
    void act(
      async () => {
        await removeMemoryPhoto(photo)
        if (cover && cover !== memory.cover_photo_id) await setCover(memory, cover)
      },
      { ...memory, memory_photos: rest, cover_photo_id: cover },
    )
  }

  const active = uploads.filter((u) => u.state !== 'failed')
  const shown = viewing !== null ? photos[viewing] : null

  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[0.58rem] uppercase tracking-[0.24em] text-graphite-soft">{cc.diary.photosTitle}</h2>
        {photos.length > 1 && (
          <button type="button" onClick={() => setEditing((v) => !v)} aria-pressed={editing} className="min-h-9 text-[0.7rem] text-graphite-soft underline decoration-graphite/25 underline-offset-4">
            {editing ? copy.place.close : cc.diary.edit}
          </button>
        )}
      </div>

      <ol className="mt-3 grid grid-cols-3 gap-2">
        {photos.map((photo, i) => (
          <li key={photo.id} className="relative">
            <button
              type="button"
              onClick={() => setViewing(i)}
              aria-label={copy.memory.photoAlt(placeName)}
              className={cn('block w-full overflow-hidden bg-white p-[3px] shadow-[0_1px_2px_rgba(51,48,43,0.12)] outline-none focus-visible:ring-2 focus-visible:ring-graphite/40', i === 0 && photos.length > 1 && 'ring-1 ring-[#a4543a]/40')}
            >
              <PrivatePhoto photo={photo} urls={urls} className="block aspect-square w-full object-cover" />
            </button>
            {i === 0 && photos.length > 1 && (
              <span className="pointer-events-none absolute left-1.5 top-1.5 rounded-full bg-paper-lit/90 px-1.5 py-0.5 text-[0.5rem] tracking-[0.1em] text-graphite">{cc.journal.cover}</span>
            )}
            {editing && (
              <div className="mt-1 flex items-center justify-between text-graphite-soft">
                <button type="button" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label={cc.journal.moveEarlier} className="flex size-8 items-center justify-center rounded-full disabled:opacity-25">‹</button>
                {i > 0 ? (
                  <button type="button" onClick={() => makeCover(photo)} className="min-h-8 px-0.5 text-[0.54rem] underline decoration-graphite/25 underline-offset-2">
                    {cc.journal.makeCover}
                  </button>
                ) : <span />}
                <button type="button" disabled={i === photos.length - 1} onClick={() => move(i, i + 1)} aria-label={cc.journal.moveLater} className="flex size-8 items-center justify-center rounded-full disabled:opacity-25">›</button>
              </div>
            )}
            {editing && (
              <button type="button" onClick={() => remove(photo)} className="block min-h-8 w-full text-center text-[0.56rem] text-[#a0442c]/85">
                {cc.journal.remove}
              </button>
            )}
          </li>
        ))}
        {uploads.map((item) => (
          <li key={item.key} className="relative overflow-hidden bg-white p-[3px]">
            <img src={item.preview} alt="" className="block aspect-square w-full object-cover opacity-50" />
            {item.state === 'failed' ? (
              <button type="button" onClick={() => upload({ ...item, state: 'waiting' })} className="absolute inset-0 flex items-center justify-center bg-[#a0442c]/70 text-[0.62rem] font-medium text-white">
                ↻ {copy.memory.retryPhoto}
              </button>
            ) : (
              <span className="absolute inset-x-0 bottom-0 bg-black/45 py-0.5 text-center text-[0.5rem] text-white">
                <span className={item.state === 'uploading' ? 'animate-pulse motion-reduce:animate-none' : ''}>{copy.memory.uploading}</span>
              </span>
            )}
          </li>
        ))}
        <li>
          <label className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-1 border border-dashed border-graphite/30 text-center text-[0.6rem] leading-tight text-graphite-soft focus-within:border-graphite/60">
            <span aria-hidden className="text-[1.2rem] leading-none">＋</span>
            {copy.memory.addPhoto}
            <input ref={fileRef} type="file" accept="image/*,.heic,.heif" multiple className="sr-only" onChange={(e) => add(e.target.files)} />
          </label>
        </li>
      </ol>

      {active.length > 0 && (
        <p aria-live="polite" className="mt-2 text-[0.64rem] tabular-nums text-graphite-soft">
          {cc.pastForm.uploading(batch.done, batch.total)}
        </p>
      )}
      {uploads.some((u) => u.state === 'failed') && <p role="alert" className="mt-2 text-[0.66rem] text-[#a0442c]">{copy.memory.uploadFailed}</p>}
      {problem && <p role="alert" className="mt-2 text-[0.66rem] text-[#a0442c]">{copy.memory.failed}</p>}

      {shown && viewing !== null && urls[shown.storage_path] && (
        <PhotoViewer
          src={urls[shown.storage_path]}
          alt={copy.memory.photoAlt(placeName)}
          width={shown.width}
          height={shown.height}
          onClose={() => setViewing(null)}
          nav={{
            index: viewing,
            count: photos.length,
            label: cc.diary.photoOf(viewing + 1, photos.length),
            onPrev: () => setViewing((v) => (v === null ? v : Math.max(0, v - 1))),
            onNext: () => setViewing((v) => (v === null ? v : Math.min(photos.length - 1, v + 1))),
          }}
        />
      )}
    </section>
  )
}
