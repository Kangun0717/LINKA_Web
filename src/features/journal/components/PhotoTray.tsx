import { useRef } from 'react'

import { cn } from '@/lib/cn'
import { useCommunityMessages } from '@/lib/i18n/useCommunityMessages'

export type TrayPhoto = { key: string; src: string }

/**
 * Photos being gathered for a memory or a suggestion, before and after they
 * are saved: choose several from the library, take one with the camera
 * where the device has one, reorder, choose the cover (the first), remove.
 * Every control is a real button with a name, not a gesture only.
 */
export default function PhotoTray({
  photos,
  onAdd,
  onChange,
  max = 10,
}: {
  photos: readonly TrayPhoto[]
  onAdd: (files: File[]) => void
  onChange: (next: TrayPhoto[]) => void
  max?: number
}) {
  const cc = useCommunityMessages()
  const library = useRef<HTMLInputElement>(null)
  const camera = useRef<HTMLInputElement>(null)
  const move = (from: number, to: number) => {
    const next = [...photos]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item)
    onChange(next)
  }
  const pick = (input: HTMLInputElement | null) => {
    const files = Array.from(input?.files ?? []).slice(0, max - photos.length)
    if (input) input.value = ''
    if (files.length) onAdd(files)
  }

  return (
    <div>
      {photos.length > 0 && (
        <ol className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-2 pt-1">
          {photos.map((photo, i) => (
            <li key={photo.key} className="w-28 shrink-0">
              <div className={cn('relative bg-white p-1 shadow-[0_1px_2px_rgba(51,48,43,0.12),0_6px_14px_-8px_rgba(51,48,43,0.4)]', i === 0 && 'ring-2 ring-[#a4543a]/50')}>
                <img src={photo.src} alt="" className="block aspect-square w-full object-cover" />
                {i === 0 && (
                  <span className="absolute left-1.5 top-1.5 rounded-full bg-paper-lit/90 px-1.5 py-0.5 text-[0.52rem] tracking-[0.1em] text-graphite">
                    {cc.journal.cover}
                  </span>
                )}
              </div>
              <div className="mt-1 flex items-center justify-between text-graphite-soft">
                <button type="button" disabled={i === 0} onClick={() => move(i, i - 1)} aria-label={cc.journal.moveEarlier} className="flex size-8 items-center justify-center rounded-full disabled:opacity-25">‹</button>
                {i > 0 ? (
                  <button type="button" onClick={() => move(i, 0)} className="min-h-8 px-1 text-[0.56rem] tracking-[0.06em] underline decoration-graphite/25 underline-offset-2">
                    {cc.journal.makeCover}
                  </button>
                ) : <span />}
                <button type="button" disabled={i === photos.length - 1} onClick={() => move(i, i + 1)} aria-label={cc.journal.moveLater} className="flex size-8 items-center justify-center rounded-full disabled:opacity-25">›</button>
              </div>
              <button type="button" onClick={() => onChange(photos.filter((p) => p.key !== photo.key))} className="block w-full text-center text-[0.58rem] text-[#a0442c]/80">
                {cc.journal.remove}
              </button>
            </li>
          ))}
        </ol>
      )}
      {photos.length < max && (
        <div className="mt-1 grid grid-cols-2 gap-2">
          <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-graphite/30 text-[0.74rem] text-graphite focus-within:border-graphite/60">
            <span aria-hidden>＋</span>
            {cc.journal.addPhotos}
            <input ref={library} type="file" accept="image/*" multiple className="sr-only" onChange={() => pick(library.current)} />
          </label>
          {/* `capture` opens the camera on phones; elsewhere it is simply a file picker. */}
          <label className="flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-graphite/30 text-[0.74rem] text-graphite focus-within:border-graphite/60">
            <span aria-hidden>◎</span>
            {cc.journal.takePhoto}
            <input ref={camera} type="file" accept="image/*" capture="environment" className="sr-only" onChange={() => pick(camera.current)} />
          </label>
        </div>
      )}
    </div>
  )
}
