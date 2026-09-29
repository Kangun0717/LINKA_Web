import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import LoadFailed from '@/components/ui/LoadFailed'
import { useAuth } from '@/features/auth/useAuth'
import MomentEntry from '@/features/journey/MomentEntry'
import SignInGate from '@/features/journey/SignInGate'
import { useJourney } from '@/features/journey/useJourney'
import { signedPhotoUrls, type MemoryPhotoRow } from '@/features/memories/api'
import PhotoViewer from '@/features/memories/PhotoViewer'
import AppShell from '@/layouts/AppShell'
import { useMessages } from '@/lib/i18n/useMessages'

/**
 * Moments — the travel journal, newest first.
 *
 * One entry per visit: the date at the place, the place, the mood, the words
 * and the photograph the user kept. Quiet and personal, like a notebook, not a
 * feed: no counts, no one else. Tapping an entry opens its memory to add to it.
 */
export default function MomentsScreen() {
  const copy = useMessages()
  const journey = useJourney()
  const navigate = useNavigate()
  const { session } = useAuth()
  const [openId, setOpenId] = useState<string | null>(null)
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [viewing, setViewing] = useState<{ photo: MemoryPhotoRow; place: string } | null>(null)

  const photoPaths = journey.moments.flatMap((m) => m.memory?.memory_photos.map((p) => p.storage_path) ?? []).join('|')
  useEffect(() => {
    if (!photoPaths) return
    let active = true
    signedPhotoUrls(photoPaths.split('|')).then((next) => active && setUrls(next), () => {})
    return () => {
      active = false
    }
  }, [photoPaths])

  return (
    <AppShell active="moments">
      <div className="h-full overflow-y-auto bg-paper-lit px-5 pb-32 pt-[max(2.25rem,env(safe-area-inset-top))]">
        <h1 className="text-[0.7rem] uppercase tracking-[0.26em] text-graphite-soft">{copy.moments.title}</h1>

        {!session && <SignInGate />}

        {session && journey.error !== null && !journey.ready && <LoadFailed onRetry={journey.reload} />}

        {session && journey.ready && journey.moments.length === 0 && (
          <div className="mt-24 text-center">
            <p className="text-[0.86rem] font-light leading-relaxed text-graphite-soft">{copy.moments.empty}</p>
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="mt-5 min-h-11 text-[0.8rem] text-graphite underline decoration-graphite/30 underline-offset-4"
            >
              {copy.moments.emptyAction}
            </button>
          </div>
        )}

        {session && !journey.ready && journey.error === null && (
          <div className="mt-10 h-40 animate-pulse rounded-2xl bg-graphite/[0.04] motion-reduce:animate-none" />
        )}

        <ol className="mt-6 space-y-8">
          {journey.moments.map((moment) => (
            <MomentEntry
              key={moment.id}
              moment={moment}
              urls={urls}
              open={openId === moment.id}
              onToggle={() => setOpenId(openId === moment.id ? null : moment.id)}
              onView={(photo) => setViewing({ photo, place: moment.place.name })}
              linked
            />
          ))}
        </ol>
      </div>

      {viewing && urls[viewing.photo.storage_path] && (
        <PhotoViewer
          src={urls[viewing.photo.storage_path]}
          alt={copy.memory.photoAlt(viewing.place)}
          width={viewing.photo.width}
          height={viewing.photo.height}
          onClose={() => setViewing(null)}
        />
      )}
    </AppShell>
  )
}
