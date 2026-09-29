import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { Postcard, SketchCover, Stamp, Tape } from '@/components/notebook/Notebook'
import { StageTrail, SuggestionTimeline, SupportButton } from '@/features/community/components/CommunityParts'
import { MOCK_SUGGESTIONS } from '@/features/community/preview/mock'
import PreviewFrame from '@/features/community/preview/PreviewFrame'
import { useCommunityMessages } from '@/lib/i18n/useCommunityMessages'

/**
 * DEV PREVIEW — one suggestion's journey into LINKA: its photograph (or a
 * drawn cover), what the proposer said, "I'd like to go", where it is now,
 * and the public timeline. Only public-safe fields exist here.
 */
export default function SuggestionPreview() {
  const cc = useCommunityMessages()
  const { id = 'kitazawa' } = useParams()
  const s = MOCK_SUGGESTIONS.find((m) => m.id === id) ?? MOCK_SUGGESTIONS[0]
  const [supported, setSupported] = useState(s.supportedByMe)
  const [signedIn, setSignedIn] = useState(true)
  const count = s.supportCount + (supported === s.supportedByMe ? 0 : supported ? 1 : -1)
  const published = s.status === 'published'

  return (
    <PreviewFrame back="/preview/4c/community">
      <div className="relative mx-5 mt-3">
        <Postcard src={s.photos[0] ?? null} alt="" tilt={-0.8} ratio="4 / 3">
          <SketchCover title={s.name} note={cc.community.noPhotoYet} seed={2} />
        </Postcard>
        <Tape tone="sun" className="-top-2 left-8" style={{ transform: 'rotate(-5deg)' }} />
        {published && <Stamp top="NOW A LINKA PLACE" bottom="2026.09.26" tone="moss" size={84} className="absolute -bottom-7 -right-2" />}
      </div>

      <header className="mt-7 px-5">
        <h1 lang="ja" className="text-[1.5rem] font-light leading-snug tracking-[0.08em] text-graphite">{s.name}</h1>
        <p className="mt-1 text-[0.7rem] tracking-[0.08em] text-graphite-soft">{s.publicArea}</p>
        <p className="mt-2 text-[0.66rem] tracking-[0.04em] text-graphite-faint">
          {s.proposerName ? cc.community.proposedBy(s.proposerName) : cc.community.proposedAnonymously}
        </p>
      </header>

      <section className="mx-5 mt-6">
        <h2 className="text-[0.58rem] uppercase tracking-[0.24em] text-graphite-soft">{cc.community.whyThisPlace}</h2>
        {/* Written on ruled notebook lines. */}
        <p
          className="mt-2 whitespace-pre-wrap bg-[repeating-linear-gradient(transparent_0_1.7rem,rgba(111,104,96,0.14)_1.7rem_calc(1.7rem+1px))] text-[0.9rem] font-light leading-[1.7rem] text-graphite"
        >
          {s.reason}
        </p>
      </section>

      <section className="mx-5 mt-7">
        <div className="flex flex-wrap items-center gap-3">
          {!published && (
            <SupportButton
              count={count}
              supported={signedIn && supported}
              signedIn={signedIn}
              onToggle={() => (signedIn ? setSupported((v) => !v) : undefined)}
            />
          )}
          {published && (
            <span className="text-[0.74rem] tabular-nums text-graphite-soft"><span className="text-[#a4543a]">♡</span> {cc.community.supportCount(count)}</span>
          )}
        </div>
        <p className="mt-2 text-[0.64rem] leading-snug text-graphite-faint">{signedIn ? cc.community.supportExplain : cc.community.signInToSupport}</p>
        <label className="mt-2 inline-flex items-center gap-2 text-[0.58rem] text-graphite-faint">
          <input type="checkbox" checked={!signedIn} onChange={(e) => setSignedIn(!e.target.checked)} /> preview: as a guest
        </label>
      </section>

      <section className="mx-5 mt-8 rounded-2xl bg-white/60 p-4 ring-1 ring-graphite/[0.07]">
        <StageTrail status={s.status} />
      </section>

      <section className="mx-5 mt-8">
        <h2 className="mb-4 text-[0.58rem] uppercase tracking-[0.24em] text-graphite-soft">{cc.community.journey}</h2>
        <SuggestionTimeline events={s.timeline} />
      </section>

      {published && s.placeSlug && (
        <div className="mx-5 mt-8">
          <p className="text-[0.86rem] tracking-[0.04em] text-graphite">{cc.community.becameLinka}</p>
          <Link to={`/place/${s.placeSlug}`} className="mt-3 flex min-h-12 items-center justify-between rounded-full px-5 text-[0.82rem] text-graphite ring-1 ring-graphite/20">
            {cc.community.openPlace}
            <span aria-hidden>›</span>
          </Link>
        </div>
      )}
    </PreviewFrame>
  )
}
