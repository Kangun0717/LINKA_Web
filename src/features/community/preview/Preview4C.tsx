import { Link, Route, Routes } from 'react-router-dom'

import AddPastPreview from '@/features/community/preview/AddPastPreview'
import CommunityHomePreview from '@/features/community/preview/CommunityHomePreview'
import JournalPreview from '@/features/community/preview/JournalPreview'
import MemoryPreview from '@/features/community/preview/MemoryPreview'
import MePreview from '@/features/community/preview/MePreview'
import PreviewFrame from '@/features/community/preview/PreviewFrame'
import SharePreview from '@/features/community/preview/SharePreview'
import SuggestionPreview from '@/features/community/preview/SuggestionPreview'
import SuggestPreview from '@/features/community/preview/SuggestPreview'

const SCREENS: [string, string][] = [
  ['1 · Community home', '/preview/4c/community'],
  ['2 · Suggestion detail + timeline', '/preview/4c/community/suggestions/kitazawa'],
  ['2b · A suggestion that became LINKA', '/preview/4c/community/suggestions/shukunegi'],
  ['3 · Suggest a place', '/preview/4c/community/suggest'],
  ['4 · Journal / Moments', '/preview/4c/journal'],
  ['5 · Add a past memory', '/preview/4c/journal/add'],
  ['6 · Memory detail + photo viewer', '/preview/4c/journal/toki-2026'],
  ['6b · A past journal entry', '/preview/4c/journal/shukunegi-2019'],
  ['7 · Me — contributions', '/preview/4c/me'],
  ['8 · Keepsake cards (9:16 / 1:1)', '/preview/4c/share'],
]

/**
 * DEV PREVIEW ONLY — Sprint 4C prototypes at /preview/4c/*. Registered only
 * in development builds (see lazyScreens.ts), sample data only, writes
 * nothing anywhere. The index lists every screen for review.
 */
export default function Preview4C() {
  return (
    <Routes>
      <Route index element={<Index />} />
      <Route path="community" element={<CommunityHomePreview />} />
      <Route path="community/suggestions/:id" element={<SuggestionPreview />} />
      <Route path="community/suggest" element={<SuggestPreview />} />
      <Route path="journal" element={<JournalPreview />} />
      <Route path="journal/add" element={<AddPastPreview />} />
      <Route path="journal/:id" element={<MemoryPreview />} />
      <Route path="me" element={<MePreview />} />
      <Route path="share" element={<SharePreview />} />
    </Routes>
  )
}

function Index() {
  return (
    <PreviewFrame back="/">
      <div className="px-5 pt-4">
        <h1 className="text-[1.3rem] font-light tracking-[0.06em] text-graphite">Sprint 4C · Community &amp; Journal</h1>
        <p className="mt-1 text-[0.72rem] text-graphite-soft">Prototype screens for review — sample Sado data, nothing is saved.</p>
        <ul className="mt-6 space-y-2">
          {SCREENS.map(([label, to]) => (
            <li key={to}>
              <Link to={to} className="flex min-h-12 items-center justify-between rounded-xl bg-white/70 px-4 text-[0.84rem] text-graphite ring-1 ring-graphite/10">
                {label}
                <span aria-hidden className="text-graphite-soft">›</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </PreviewFrame>
  )
}
