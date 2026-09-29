import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'

import { GRAIN, SketchCover, Stamp, Tape } from '@/components/notebook/Notebook'
import LoadFailed from '@/components/ui/LoadFailed'
import { memoryRemoved, memorySaved, type JourneyEntry } from '@/data/journey'
import { useAuth } from '@/features/auth/useAuth'
import { MOOD_TINT } from '@/features/journal/mood'
import MemoryPhotos from '@/features/journal/components/MemoryPhotos'
import { faceOf } from '@/features/journal/entry'
import SignInGate from '@/features/journey/SignInGate'
import { useJourney } from '@/features/journey/useJourney'
import { deletePastMemory, saveMemory } from '@/features/memories/api'
import MemoryComposer from '@/features/memories/MemoryComposer'
import PhotoViewer from '@/features/memories/PhotoViewer'
import { PrivatePhoto } from '@/features/memories/PrivatePhoto'
import { usePhotoUrls } from '@/features/memories/usePhotoUrls'
import AppShell from '@/layouts/AppShell'
import { MOOD_EMOJI } from '@/lib/i18n/journeyMessages'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { HTML_LANG } from '@/lib/i18n/locale'
import { useCommunityMessages } from '@/lib/i18n/useCommunityMessages'
import { useMessages } from '@/lib/i18n/useMessages'

/**
 * /moments/:id — one page of the journal, opened. `:id` is a verified
 * visit's id (as before) or a journal entry's own id.
 *
 *   verified  the visit's memory: mood and words edited in place, photos
 *   past      the journal entry: its words and photos; edited on its own
 *             form, and it can be deleted (a visit's memory cannot — the
 *             visit stays, whatever is written about it)
 *
 * Private: a guest sees the sign-in gate, and an id that is not the
 * signed-in person's own is simply not there (RLS never returns anyone
 * else's).
 */
export default function MomentScreen() {
  const { id = '' } = useParams()
  const copy = useMessages()
  const { session } = useAuth()
  const journey = useJourney()
  const entry = journey.moments.find((m) => m.id === id) ?? null

  return (
    <AppShell active="moments">
      <div className="h-full overflow-y-auto overscroll-contain bg-paper-lit">
        <div aria-hidden className="pointer-events-none fixed inset-0" style={{ backgroundImage: GRAIN }} />
        <div className="relative mx-auto max-w-md pb-36 pt-[max(1rem,env(safe-area-inset-top))]">
          <div className="px-3">
            <Link to="/moments" className="-ml-1 flex min-h-11 w-fit items-center gap-2 rounded-lg px-2 text-[0.64rem] uppercase tracking-[0.22em] text-graphite-soft">
              ‹ {copy.moments.all}
            </Link>
          </div>

          {!session && (
            <div className="px-5">
              <SignInGate />
            </div>
          )}
          {session && journey.error !== null && !journey.ready && (
            <div className="px-5">
              <LoadFailed onRetry={journey.reload} />
            </div>
          )}
          {session && !journey.ready && journey.error === null && <div className="mx-5 mt-6 h-72 animate-pulse rounded-sm bg-graphite/[0.04] motion-reduce:animate-none" />}
          {session && journey.ready && !entry && <p className="mt-16 px-5 text-center text-[0.86rem] font-light text-graphite-soft">{copy.moments.notFound}</p>}
          {entry && <MomentPage key={entry.id} entry={entry} />}
        </div>
      </div>
    </AppShell>
  )
}

function MomentPage({ entry }: { entry: JourneyEntry }) {
  const copy = useMessages()
  const cc = useCommunityMessages()
  const { locale } = useLocale()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { state } = useLocation() as { state: { photosFailed?: number } | null }
  const face = faceOf(entry, locale)
  const memory = entry.memory
  const cover = face.photos[0]
  const urls = usePhotoUrls(cover ? [cover] : [])
  const [viewing, setViewing] = useState(false)
  const [deleting, setDeleting] = useState<'idle' | 'confirm' | 'busy' | 'failed'>('idle')

  async function remove() {
    if (!memory || !user) return
    setDeleting('busy')
    try {
      await deletePastMemory(memory)
      memoryRemoved(user.id, memory.id)
      navigate('/moments', { replace: true })
    } catch {
      setDeleting('failed')
    }
  }

  return (
    <article>
      <div className="relative mx-5 mt-3">
        <figure className="bg-white p-[5px] pb-2 shadow-[0_1px_2px_rgba(51,48,43,0.12),0_14px_30px_-16px_rgba(51,48,43,0.45)]" style={{ transform: 'rotate(-0.8deg)' }}>
          {cover ? (
            <button type="button" onClick={() => setViewing(true)} aria-label={copy.memory.photoAlt(face.name)} className="block w-full outline-none">
              <PrivatePhoto photo={cover} urls={urls} size="full" loading="eager" className="block aspect-[4/3] w-full bg-paper-shade object-cover" />
            </button>
          ) : (
            <div className="aspect-[4/2.4] w-full">
              <SketchCover title={face.name} seed={3} />
            </div>
          )}
        </figure>
        {face.verified ? (
          <Stamp top="LINKA TOUCH" bottom={face.stamp ?? ''} size={78} className="absolute -right-2 -top-5" angle={-12} />
        ) : (
          <Tape tone="sun" className="-top-2 left-8" style={{ transform: 'rotate(-5deg)' }} />
        )}
      </div>

      <header className="mt-7 px-5">
        <p className="text-[0.6rem] uppercase tracking-[0.2em] text-graphite-soft">
          {face.verified ? (
            <>
              <span aria-hidden className="touchpoint-mark mr-1.5 normal-case tracking-normal text-graphite">:)))</span>
              {cc.diary.verifiedBadge} · <span className="tabular-nums">{face.date}</span>
            </>
          ) : (
            <span className="normal-case tracking-[0.08em]">
              {cc.diary.pastBadge} · <span className="italic text-graphite">{face.date ?? cc.diary.noDate}</span>
            </span>
          )}
        </p>
        <h1 lang="ja" className="mt-2 text-[1.8rem] font-extralight leading-snug tracking-[0.1em] text-graphite">{face.name}</h1>
        {face.second && <p className="text-[0.58rem] uppercase tracking-[0.24em] text-graphite-soft">{face.second}</p>}
        <p className="mt-3 max-w-sm text-[0.7rem] font-light leading-relaxed text-graphite-soft">{face.verified ? cc.diary.verifiedExplain : cc.diary.pastExplain}</p>
        {face.slug && (
          <Link to={`/place/${face.slug}`} className="mt-3 inline-flex min-h-10 items-center text-[0.72rem] text-graphite underline decoration-graphite/25 underline-offset-4">
            {cc.diary.openPlace} ›
          </Link>
        )}
      </header>

      {!face.verified && (memory?.mood || memory?.note) && (
        <section className="mt-6 px-5">
          {memory?.mood && (
            <p className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.78rem] text-graphite" style={{ backgroundColor: `${MOOD_TINT[memory.mood]}b3` }}>
              <span aria-hidden>{MOOD_EMOJI[memory.mood]}</span>
              {copy.memory.moods[memory.mood]}
            </p>
          )}
          {memory?.note && (
            <p lang={HTML_LANG[locale]} className="mt-4 whitespace-pre-wrap bg-[repeating-linear-gradient(transparent_0_1.75rem,rgba(111,104,96,0.13)_1.75rem_calc(1.75rem+1px))] text-[0.94rem] font-light leading-[1.75rem] text-graphite">
              {memory.note}
            </p>
          )}
        </section>
      )}

      {entry.kind === 'visit' && (
        <section className="mt-7 px-5">
          <MemoryComposer visit={{ visitId: entry.visit.id, placeId: entry.visit.place_id }} placeName={face.name} withPhotos={false} />
        </section>
      )}

      <div className="mt-9 px-5">
        {state?.photosFailed ? <p role="alert" className="mb-3 text-[0.7rem] text-[#a0442c]">{cc.pastForm.photoFailed}</p> : null}
        <MemoryPhotos
          memory={memory}
          placeName={face.name}
          onChange={() => {}}
          ensureMemory={async () => {
            if (memory) return memory
            if (entry.kind !== 'visit') throw new Error('A journal entry always has its memory.')
            const saved = await saveMemory(null, { visitId: entry.visit.id, placeId: entry.visit.place_id }, { note: '', mood: null })
            if (user) memorySaved(user.id, saved.memory)
            return saved.memory
          }}
        />
      </div>

      {entry.kind === 'past' && (
        <div className="mt-10 flex flex-col gap-2 px-5">
          <Link to={`/moments/${entry.id}/edit`} className="flex min-h-12 items-center justify-center rounded-full text-[0.84rem] text-graphite ring-1 ring-graphite/20">
            {cc.diary.edit}
          </Link>
          {deleting === 'confirm' || deleting === 'busy' ? (
            <div className="mt-2 rounded-xl bg-white/75 p-4 ring-1 ring-graphite/10">
              <p className="text-[0.8rem] text-graphite">{cc.diary.deleteConfirm}</p>
              <div className="mt-3 flex gap-2">
                <button type="button" disabled={deleting === 'busy'} onClick={() => void remove()} className="min-h-11 rounded-full bg-[#a0442c] px-4 text-[0.78rem] text-white disabled:opacity-50">
                  {deleting === 'busy' ? cc.diary.deleting : cc.diary.delete}
                </button>
                <button type="button" onClick={() => setDeleting('idle')} className="min-h-11 rounded-full px-4 text-[0.78rem] text-graphite ring-1 ring-graphite/20">
                  {cc.pastForm.cancel}
                </button>
              </div>
            </div>
          ) : (
            <button type="button" onClick={() => setDeleting('confirm')} className="min-h-11 text-[0.74rem] text-[#a0442c]/85 underline decoration-[#a0442c]/25 underline-offset-4">
              {cc.diary.delete}
            </button>
          )}
          {deleting === 'failed' && <p role="alert" className="text-center text-[0.7rem] text-[#a0442c]">{cc.diary.deleteFailed}</p>}
        </div>
      )}

      {viewing && cover && urls[cover.storage_path] && (
        <PhotoViewer src={urls[cover.storage_path]} alt={copy.memory.photoAlt(face.name)} width={cover.width} height={cover.height} onClose={() => setViewing(false)} />
      )}
    </article>
  )
}
