import { useState } from 'react'

import { NoteHeading } from '@/components/notebook/Notebook'
import { MOCK_PLACES } from '@/features/community/preview/mock'
import PreviewFrame from '@/features/community/preview/PreviewFrame'
import { samplePhotoWithMetadata } from '@/features/community/preview/samplePhoto'
import PhotoTray, { type TrayPhoto } from '@/features/journal/components/PhotoTray'
import { readPhotoMetadata, type PhotoMetadata } from '@/features/journal/photoMetadata'
import { formatDistance, straightLineMeters } from '@/features/places/nearby'
import { cn } from '@/lib/cn'
import { MOOD_EMOJI, MOODS, type Mood } from '@/lib/i18n/journeyMessages'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { formatCalendarDate } from '@/lib/i18n/locale'
import { useMessages } from '@/lib/i18n/useMessages'
import { useCommunityMessages } from '@/lib/i18n/useCommunityMessages'

/** A photo's position is only a hint if a LINKA place is this close. */
const NEAR_METRES = 3000

type Suggestion = { takenOn: string | null; place: { slug: string; name: string; metres: number } | null }

function suggestFrom(meta: PhotoMetadata): Suggestion {
  const coords = meta.coords
  const nearest = coords
    ? MOCK_PLACES.map((p) => ({ slug: p.slug, name: p.name, metres: straightLineMeters(coords, p) })).sort((a, b) => a.metres - b.metres)[0]
    : null
  return { takenOn: meta.takenOn, place: nearest && nearest.metres <= NEAR_METRES ? nearest : null }
}

/**
 * DEV PREVIEW — Add a past memory. Photos first (optional); what they carry
 * is read on this device and offered only as a suggestion the person must
 * accept. Place, date, mood and words are always theirs to set. Saving
 * writes nothing in the prototype — and a real save would create a journal
 * entry, never a Visit.
 */
export default function AddPastPreview() {
  const copy = useMessages()
  const cc = useCommunityMessages()
  const t = cc.addPast
  const { locale } = useLocale()
  const [photos, setPhotos] = useState<TrayPhoto[]>([])
  const [suggestion, setSuggestion] = useState<Suggestion | null>(null)
  const [readNothing, setReadNothing] = useState(false)
  const [where, setWhere] = useState<{ slug: string } | { label: string } | null>(null)
  const [precision, setPrecision] = useState<'day' | 'month' | 'year'>('day')
  const [date, setDate] = useState('')
  const [mood, setMood] = useState<Mood | null>(null)
  const [text, setText] = useState('')
  const [saved, setSaved] = useState(false)

  async function add(files: File[]) {
    setPhotos((list) => [...list, ...files.map((f) => ({ key: `${f.name}-${Math.random()}`, src: URL.createObjectURL(f) }))])
    // The first photo with anything to say is the one that suggests.
    for (const file of files) {
      const found = suggestFrom(await readPhotoMetadata(file))
      if (found.takenOn || found.place) {
        setSuggestion(found)
        setReadNothing(false)
        return
      }
    }
    if (!suggestion) setReadNothing(true)
  }

  function accept() {
    if (!suggestion) return
    if (suggestion.place) setWhere({ slug: suggestion.place.slug })
    if (suggestion.takenOn) {
      setPrecision('day')
      setDate(suggestion.takenOn)
    }
    setSuggestion(null)
  }

  const field = 'block w-full rounded-xl bg-white/80 px-3.5 py-3 text-[16px] font-light text-graphite outline-none ring-1 ring-graphite/12 placeholder:text-graphite-faint focus:ring-graphite/35'
  const label = 'text-[0.62rem] uppercase tracking-[0.22em] text-graphite-soft'

  return (
    <PreviewFrame back="/preview/4c/journal">
      <div className="px-5 pt-2">
        <NoteHeading title={t.title} />
        <p className="mt-2 text-[0.76rem] font-light leading-relaxed text-graphite-soft">{t.intro}</p>

        <section className="mt-7">
          <p className={label}>{t.choosePhotos}</p>
          <div className="mt-3">
            <PhotoTray photos={photos} onChange={setPhotos} onAdd={(files) => void add(files)} />
          </div>
          <button type="button" onClick={() => void samplePhotoWithMetadata().then((f) => add([f]))} className="mt-2 text-[0.6rem] text-graphite-faint underline underline-offset-2">
            preview: try a sample photo with date + location
          </button>

          {suggestion && (
            <div role="status" className="mt-4 rounded-xl bg-[#fbf3de] px-4 py-3.5 ring-1 ring-[#e8d49a]">
              <p className="text-[0.66rem] tracking-[0.06em] text-graphite-soft">{t.basedOnPhoto}</p>
              {suggestion.takenOn && <p className="mt-1.5 text-[0.84rem] text-graphite">{t.suggestedDate(formatCalendarDate(suggestion.takenOn, locale))}</p>}
              {suggestion.place && (
                <p lang="ja" className="mt-0.5 text-[0.84rem] text-graphite">{t.suggestedPlace(suggestion.place.name, formatDistance(suggestion.place.metres, locale))}</p>
              )}
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={accept} className="min-h-10 rounded-full bg-graphite px-4 text-[0.74rem] text-paper-lit">{t.useSuggestion}</button>
                <button type="button" onClick={() => setSuggestion(null)} className="min-h-10 rounded-full px-4 text-[0.74rem] text-graphite ring-1 ring-graphite/20">✕</button>
              </div>
            </div>
          )}
          {readNothing && <p className="mt-3 text-[0.68rem] text-graphite-faint">{t.noMetadata}</p>}
        </section>

        <section className="mt-8">
          <p className={label}>{t.placeLabel}</p>
          <p className="mt-3 text-[0.66rem] text-graphite-soft">{t.placeSearch}</p>
          <ul className="mt-2 flex flex-wrap gap-2">
            {MOCK_PLACES.map((p) => {
              const chosen = where !== null && 'slug' in where && where.slug === p.slug
              return (
                <li key={p.slug}>
                  <button
                    type="button"
                    aria-pressed={chosen}
                    onClick={() => setWhere({ slug: p.slug })}
                    lang="ja"
                    className={cn('min-h-10 rounded-full px-3.5 text-[0.78rem]', chosen ? 'bg-graphite text-paper-lit' : 'bg-white/80 text-graphite ring-1 ring-graphite/12')}
                  >
                    {p.name}
                  </button>
                </li>
              )
            })}
          </ul>
          <label className="mt-4 block text-[0.66rem] text-graphite-soft">
            {t.ownWords}
            <input
              value={where && 'label' in where ? where.label : ''}
              onChange={(e) => setWhere(e.target.value ? { label: e.target.value } : null)}
              placeholder={t.ownWordsPlaceholder}
              className={cn(field, 'mt-2')}
            />
          </label>
        </section>

        <section className="mt-8">
          <p className={label}>{t.dateLabel}</p>
          <div className="mt-3 flex gap-2">
            {(['day', 'month', 'year'] as const).map((p) => (
              <button key={p} type="button" aria-pressed={precision === p} onClick={() => setPrecision(p)} className={cn('min-h-9 flex-1 rounded-full text-[0.72rem]', precision === p ? 'bg-graphite text-paper-lit' : 'text-graphite ring-1 ring-graphite/15')}>
                {t.precision[p]}
              </button>
            ))}
          </div>
          <input
            type={precision === 'day' ? 'date' : precision === 'month' ? 'month' : 'number'}
            value={precision === 'day' ? date : precision === 'month' ? date.slice(0, 7) : date.slice(0, 4)}
            onChange={(e) => setDate(e.target.value)}
            min={precision === 'year' ? 1950 : undefined}
            max={precision === 'year' ? 2026 : undefined}
            className={cn(field, 'mt-3')}
          />
        </section>

        <section className="mt-8">
          <p className={label}>{t.moodLabel}</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {MOODS.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={mood === option}
                onClick={() => setMood(mood === option ? null : option)}
                className={cn('flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl', mood === option ? 'bg-graphite text-paper-lit' : 'bg-white/80 text-graphite ring-1 ring-graphite/10')}
              >
                <span aria-hidden className="text-[1.2rem] leading-none">{MOOD_EMOJI[option]}</span>
                <span className="text-[0.6rem]">{copy.memory.moods[option]}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-8">
          <label className={label}>
            {t.textLabel}
            <textarea value={text} onChange={(e) => setText(e.target.value)} rows={5} placeholder={t.textPlaceholder} className={cn(field, 'mt-3 resize-none normal-case tracking-normal')} />
          </label>
        </section>

        <p className="mt-6 rounded-xl bg-graphite/[0.04] px-4 py-3 text-[0.68rem] leading-relaxed text-graphite-soft">{t.notVerified}</p>
        {saved && <p role="status" className="mt-4 text-center text-[0.74rem] text-[#a4543a]">{cc.preview.notSaved}</p>}
        <button type="button" disabled={where === null} onClick={() => setSaved(true)} className="mt-5 min-h-12 w-full rounded-full bg-graphite text-[0.86rem] tracking-[0.04em] text-paper-lit disabled:opacity-30">
          {t.save}
        </button>
        <p className="mt-5 text-[0.6rem] leading-relaxed text-graphite-faint">{t.privacy}</p>
      </div>
    </PreviewFrame>
  )
}
