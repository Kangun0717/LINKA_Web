import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

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
 * /moments/:id — one Moment (one verified visit) on its own page, with its
 * memory open to edit. Private: a guest sees the sign-in gate, and an id that
 * is not one of the signed-in user's own visits is simply not there (RLS
 * never returns anyone else's).
 */
export default function MomentScreen() {
  const { id = '' } = useParams()
  const copy = useMessages()
  const navigate = useNavigate()
  const { session } = useAuth()
  const journey = useJourney()
  const moment = journey.moments.find((m) => m.id === id) ?? null
  const [urls, setUrls] = useState<Record<string, string>>({})
  const [viewing, setViewing] = useState<MemoryPhotoRow | null>(null)

  const photoPaths = moment?.memory?.memory_photos.map((p) => p.storage_path).join('|') ?? ''
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
      <div className="h-full overflow-y-auto bg-paper-lit px-5 pb-32 pt-[max(1.5rem,env(safe-area-inset-top))]">
        <button type="button" onClick={() => navigate('/moments')} className="-ml-2 min-h-11 px-2 text-[0.66rem] uppercase tracking-[0.2em] text-graphite-soft">
          ‹ {copy.moments.all}
        </button>

        {!session && <SignInGate />}

        {session && journey.error !== null && !journey.ready && <LoadFailed onRetry={journey.reload} />}

        {session && !journey.ready && journey.error === null && (
          <div className="mt-6 h-40 animate-pulse rounded-2xl bg-graphite/[0.04] motion-reduce:animate-none" />
        )}

        {session && journey.ready && !moment && (
          <p className="mt-16 text-center text-[0.86rem] font-light text-graphite-soft">{copy.moments.notFound}</p>
        )}

        {moment && (
          <ol className="mt-4">
            <MomentEntry moment={moment} urls={urls} open onToggle={() => navigate('/moments')} onView={setViewing} />
          </ol>
        )}
      </div>

      {viewing && moment && urls[viewing.storage_path] && (
        <PhotoViewer
          src={urls[viewing.storage_path]}
          alt={copy.memory.photoAlt(moment.place.name)}
          width={viewing.width}
          height={viewing.height}
          onClose={() => setViewing(null)}
        />
      )}
    </AppShell>
  )
}
