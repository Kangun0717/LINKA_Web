import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { GRAIN } from '@/components/notebook/Notebook'
import { memorySaved, useMyMemories } from '@/data/journey'
import { usePlaces } from '@/data/places'
import { useAuth } from '@/features/auth/useAuth'
import PhotoTray, { type TrayPhoto } from '@/features/journal/components/PhotoTray'
import { readPhotoMetadata } from '@/features/journal/photoMetadata'
import SignInGate from '@/features/journey/SignInGate'
import { addMemoryPhoto, savePastMemory, type MemoryRecord } from '@/features/memories/api'
import { formatDistance, straightLineMeters } from '@/features/places/nearby'
import AppShell from '@/layouts/AppShell'
import { cn } from '@/lib/cn'
import { MOOD_EMOJI, MOODS, type Mood } from '@/lib/i18n/journeyMessages'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { formatCalendarDate } from '@/lib/i18n/locale'
import { useCommunityMessages } from '@/lib/i18n/useCommunityMessages'
import { useMessages } from '@/lib/i18n/useMessages'

/** A photo's position is only a hint if a LINKA place is this close. */
const NEAR_METRES = 3000

type Picked = TrayPhoto & { file: File }
/** What a photo said: its date, and its position — matched to a LINKA place when shown, not when read. */
type Hint = { takenOn: string | null; coords: { lat: number; lng: number } | null }
type Precision = 'day' | 'month' | 'year'

/**
 * /moments/new and /moments/:id/edit — a journal entry: a place and a time
 * the person records themselves, a trip from years ago or one without a
 * Touch Point.
 *
 *   photos (optional) → what they carry is read ON THIS DEVICE and offered
 *   as a suggestion only → place → date → mood → words → save
 *
 * The date and position inside a photo never decide anything and never
 * verify anything: the person accepts or ignores the suggestion, and only
 * the place and date they choose are saved. The photos themselves are
 * re-encoded before upload, so their EXIF (and GPS) never leaves the device.
 *
 * Saved as `kind = 'past'` with no visit — it cannot colour the map, count
 * as a verified place or change progress.
 */
export default function PastMemoryScreen() {
  const { id } = useParams()
  const cc = useCommunityMessages()
  const { session } = useAuth()
  const memories = useMyMemories()
  const existing = id ? (memories.data?.find((m) => m.id === id && m.kind === 'past') ?? null) : null

  return (
    <AppShell active="moments">
      <div className="h-full overflow-y-auto overscroll-contain bg-paper-lit">
        <div aria-hidden className="pointer-events-none fixed inset-0" style={{ backgroundImage: GRAIN }} />
        <div className="relative mx-auto max-w-md px-5 pb-36 pt-[max(1rem,env(safe-area-inset-top))]">
          <Link to={id ? `/moments/${id}` : '/moments'} className="-ml-2 flex min-h-11 w-fit items-center gap-2 rounded-lg px-2 text-[0.64rem] uppercase tracking-[0.22em] text-graphite-soft">
            ‹ {cc.diary.back}
          </Link>
          {!session ? (
            <SignInGate />
          ) : id && memories.data === undefined ? (
            <div className="mt-6 h-72 animate-pulse rounded-sm bg-graphite/[0.04] motion-reduce:animate-none" />
          ) : id && !existing ? (
            <p className="mt-16 text-center text-[0.86rem] font-light text-graphite-soft">{cc.diary.notFound}</p>
          ) : (
            <PastMemoryForm key={existing?.id ?? 'new'} existing={existing} />
          )}
        </div>
      </div>
    </AppShell>
  )
}

function PastMemoryForm({ existing }: { existing: MemoryRecord | null }) {
  const copy = useMessages()
  const cc = useCommunityMessages()
  const t = cc.addPast
  const f = cc.pastForm
  const { locale } = useLocale()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { index } = usePlaces()
  // From a place's page: "Add a memory of this place" arrives with it chosen.
  const [params] = useSearchParams()
  const fromPage = params.get('place')

  const [photos, setPhotos] = useState<Picked[]>([])
  const [hint, setHint] = useState<Hint | null>(null)
  const [readNothing, setReadNothing] = useState(false)
  const [placeId, setPlaceId] = useState<string | null>(existing?.place_id ?? null)
  const [prefilled, setPrefilled] = useState(false)
  if (!existing && !prefilled && fromPage && index) {
    setPrefilled(true)
    const place = index.bySlug.get(fromPage)
    if (place?.kind === 'destination') setPlaceId(place.id)
  }
  const [label, setLabel] = useState(existing?.place_label ?? '')
  const [query, setQuery] = useState('')
  const [precision, setPrecision] = useState<Precision>((existing?.date_precision as Precision | undefined) ?? 'day')
  const [date, setDate] = useState(existing?.remembered_on ?? '')
  const [mood, setMood] = useState<Mood | null>(existing?.mood ?? null)
  const [note, setNote] = useState(existing?.note ?? '')
  const [state, setState] = useState<'idle' | 'saving' | 'uploading' | 'failed'>('idle')
  const [uploaded, setUploaded] = useState(0)
  const [whereError, setWhereError] = useState(false)
  const previews = useRef<Picked[]>([])
  useEffect(() => {
    previews.current = photos
  }, [photos])
  useEffect(() => () => previews.current.forEach((p) => URL.revokeObjectURL(p.src)), [])

  // Destinations only (not regions), as the place picker offers them.
  const places = useMemo(() => (index?.all ?? []).filter((p) => p.kind === 'destination'), [index])
  const chosen = placeId ? (index?.byId.get(placeId) ?? null) : null
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q ? places.filter((p) => `${p.name} ${p.nameLatin} ${p.locality ?? ''}`.toLowerCase().includes(q)) : places
    return list.slice(0, 12)
  }, [places, query])

  async function addPhotos(files: File[]) {
    const picked = files.map((file) => ({ key: `${file.name}-${file.size}-${Math.random()}`, src: URL.createObjectURL(file), file }))
    setPhotos((list) => [...list, ...picked])
    // The first photo that says anything is the one that suggests — read here, on the device.
    for (const { file } of picked) {
      const meta = await readPhotoMetadata(file)
      if (meta.takenOn || meta.coords) {
        setHint({ takenOn: meta.takenOn, coords: meta.coords })
        setReadNothing(false)
        return
      }
    }
    if (!hint) setReadNothing(true)
  }

  // The nearest LINKA place to where the photo was taken, if one is close —
  // worked out from the places as they are now (they may arrive after the photo).
  const hintPlace = useMemo(() => {
    const coords = hint?.coords
    if (!coords) return null
    return places.map((place) => ({ place, metres: straightLineMeters(coords, place) })).sort((a, b) => a.metres - b.metres).find((c) => c.metres <= NEAR_METRES) ?? null
  }, [hint, places])

  function acceptHint() {
    if (!hint) return
    if (hintPlace) {
      setPlaceId(hintPlace.place.id)
      setLabel('')
    }
    if (hint.takenOn) {
      setPrecision('day')
      setDate(hint.takenOn)
    }
    setHint(null)
  }

  function storedDate(): string | null {
    if (!date) return null
    if (precision === 'year') return /^\d{4}/.test(date) ? `${date.slice(0, 4)}-01-01` : null
    if (precision === 'month') return /^\d{4}-\d{2}/.test(date) ? `${date.slice(0, 7)}-01` : null
    return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null
  }

  async function save(event: FormEvent) {
    event.preventDefault()
    if (!placeId && !label.trim()) {
      setWhereError(true)
      document.getElementById('past-where')?.scrollIntoView({ block: 'center' })
      return
    }
    setWhereError(false)
    setState('saving')
    try {
      let memory = await savePastMemory(existing, { placeId, placeLabel: label, rememberedOn: storedDate(), precision, note, mood })
      if (user) memorySaved(user.id, memory)
      let failed = 0
      if (photos.length > 0 && user) {
        setState('uploading')
        setUploaded(0)
        for (const [i, photo] of photos.entries()) {
          try {
            const row = await addMemoryPhoto(memory, user.id, photo.file, memory.memory_photos.length)
            memory = { ...memory, cover_photo_id: memory.cover_photo_id ?? row.id, memory_photos: [...memory.memory_photos, row] }
            memorySaved(user.id, memory)
          } catch {
            failed += 1
          }
          setUploaded(i + 1)
        }
      }
      // A photo that could not be added can be added again on the page itself, which says so.
      navigate(`/moments/${memory.id}`, { replace: true, state: failed > 0 ? { photosFailed: failed } : null })
    } catch {
      setState('failed')
    }
  }

  const field = 'block w-full rounded-xl bg-white/85 px-3.5 py-3 text-[16px] font-light text-graphite outline-none ring-1 ring-graphite/12 placeholder:text-graphite-faint focus:ring-graphite/35'
  const heading = 'text-[0.62rem] uppercase tracking-[0.22em] text-graphite-soft'
  const busy = state === 'saving' || state === 'uploading'

  return (
    <form onSubmit={(e) => void save(e)} noValidate>
      <h1 className="mt-2 text-[1.6rem] font-extralight tracking-[0.1em] text-graphite">{existing ? f.editTitle : t.title}</h1>
      <p className="mt-2 text-[0.78rem] font-light leading-relaxed text-graphite-soft">{t.intro}</p>

      {!existing && (
        <section className="mt-8">
          <p className={heading}>{t.choosePhotos}</p>
          <div className="mt-3">
            <PhotoTray
              photos={photos}
              onAdd={(files) => void addPhotos(files)}
              onChange={(next) => {
                const keep = new Set(next.map((p) => p.key))
                photos.filter((p) => !keep.has(p.key)).forEach((p) => URL.revokeObjectURL(p.src))
                setPhotos(next.map((p) => photos.find((q) => q.key === p.key)!))
              }}
            />
          </div>
          {hint && (hint.takenOn || hintPlace) && (
            <div role="status" className="mt-4 rounded-xl bg-[#fbf3de] px-4 py-3.5 ring-1 ring-[#e8d49a]">
              <p className="text-[0.64rem] tracking-[0.06em] text-graphite-soft">{t.basedOnPhoto}</p>
              {hint.takenOn && <p className="mt-1.5 text-[0.84rem] text-graphite">{t.suggestedDate(formatCalendarDate(hint.takenOn, locale))}</p>}
              {hintPlace && (
                <p lang="ja" className="mt-0.5 text-[0.84rem] text-graphite">
                  {t.suggestedPlace(hintPlace.place.name, formatDistance(hintPlace.metres, locale))}
                </p>
              )}
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={acceptHint} className="min-h-10 rounded-full bg-graphite px-4 text-[0.74rem] text-paper-lit">{t.useSuggestion}</button>
                <button type="button" onClick={() => setHint(null)} aria-label={f.cancel} className="min-h-10 rounded-full px-4 text-[0.74rem] text-graphite ring-1 ring-graphite/20">✕</button>
              </div>
            </div>
          )}
          {readNothing && !hint && <p className="mt-3 text-[0.68rem] text-graphite-faint">{t.noMetadata}</p>}
        </section>
      )}

      <section id="past-where" className="mt-9">
        <p className={heading}>{t.placeLabel}</p>
        {chosen ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-white/85 px-4 py-3 ring-1 ring-graphite/12">
            <div className="min-w-0">
              <p className="text-[0.58rem] uppercase tracking-[0.2em] text-graphite-soft">{f.chosen}</p>
              <p lang="ja" className="truncate text-[0.92rem] tracking-[0.06em] text-graphite">{chosen.name}</p>
              <p className="text-[0.56rem] uppercase tracking-[0.2em] text-graphite-soft">{chosen.nameLatin}</p>
            </div>
            <button type="button" onClick={() => setPlaceId(null)} className="min-h-10 shrink-0 rounded-full px-3.5 text-[0.72rem] text-graphite ring-1 ring-graphite/20">
              {f.change}
            </button>
          </div>
        ) : (
          <>
            <label className="mt-3 block text-[0.66rem] text-graphite-soft">
              {f.searchPlaces}
              <input value={query} onChange={(e) => setQuery(e.target.value)} type="search" className={cn(field, 'mt-2')} />
            </label>
            <ul className="mt-3 flex flex-wrap gap-2">
              {matches.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => {
                      setPlaceId(p.id)
                      setLabel('')
                      setWhereError(false)
                    }}
                    lang="ja"
                    className="min-h-10 rounded-full bg-white/85 px-3.5 text-[0.78rem] text-graphite ring-1 ring-graphite/12"
                  >
                    {p.name}
                  </button>
                </li>
              ))}
            </ul>
            {query.trim() && matches.length === 0 && <p className="mt-2 text-[0.66rem] text-graphite-faint">{f.noMatch}</p>}
            <label className="mt-5 block text-[0.66rem] text-graphite-soft">
              {t.ownWords}
              <input
                value={label}
                onChange={(e) => {
                  setLabel(e.target.value)
                  setWhereError(false)
                }}
                maxLength={120}
                placeholder={t.ownWordsPlaceholder}
                aria-invalid={whereError}
                className={cn(field, 'mt-2', whereError && 'ring-[#a0442c]/60')}
              />
            </label>
          </>
        )}
        {whereError && <p role="alert" className="mt-2 text-[0.7rem] text-[#a0442c]">{f.needWhere}</p>}
      </section>

      <section className="mt-9">
        <p className={heading}>{t.dateLabel}</p>
        <div className="mt-3 flex gap-2">
          {(['day', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={precision === p}
              onClick={() => setPrecision(p)}
              className={cn('min-h-10 flex-1 rounded-full text-[0.74rem]', precision === p ? 'bg-graphite text-paper-lit' : 'text-graphite ring-1 ring-graphite/15')}
            >
              {t.precision[p]}
            </button>
          ))}
        </div>
        <input
          aria-label={t.dateLabel}
          type={precision === 'day' ? 'date' : precision === 'month' ? 'month' : 'number'}
          inputMode={precision === 'year' ? 'numeric' : undefined}
          value={precision === 'day' ? date : precision === 'month' ? date.slice(0, 7) : date.slice(0, 4)}
          onChange={(e) => setDate(e.target.value)}
          min={precision === 'year' ? 1900 : undefined}
          max={precision === 'year' ? new Date().getFullYear() : precision === 'day' ? new Date().toISOString().slice(0, 10) : undefined}
          placeholder={precision === 'year' ? 'YYYY' : precision === 'month' ? 'YYYY-MM' : f.datePlaceholder}
          className={cn(field, 'mt-3')}
        />
        {date && (
          <button type="button" onClick={() => setDate('')} className="mt-1 min-h-9 text-[0.66rem] text-graphite-soft underline underline-offset-4">
            {f.clearDate}
          </button>
        )}
      </section>

      <section className="mt-9">
        <p className={heading}>{t.moodLabel}</p>
        <div role="radiogroup" aria-label={t.moodLabel} className="mt-3 grid grid-cols-3 gap-2">
          {MOODS.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={mood === option}
              onClick={() => setMood(mood === option ? null : option)}
              className={cn('flex min-h-14 flex-col items-center justify-center gap-0.5 rounded-xl', mood === option ? 'bg-graphite text-paper-lit' : 'bg-white/85 text-graphite ring-1 ring-graphite/10')}
            >
              <span aria-hidden className="text-[1.2rem] leading-none">{MOOD_EMOJI[option]}</span>
              <span className="text-[0.6rem]">{copy.memory.moods[option]}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-9">
        <label htmlFor="past-note" className={heading}>{t.textLabel}</label>
        <textarea
          id="past-note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={4000}
          rows={6}
          placeholder={t.textPlaceholder}
          className={cn(field, 'mt-3 resize-none bg-[repeating-linear-gradient(transparent_0_1.75rem,rgba(111,104,96,0.1)_1.75rem_calc(1.75rem+1px))] leading-[1.75rem]')}
        />
      </section>

      <p className="mt-7 rounded-xl bg-graphite/[0.04] px-4 py-3 text-[0.7rem] leading-relaxed text-graphite-soft">{t.notVerified}</p>
      {state === 'failed' && <p role="alert" className="mt-4 text-center text-[0.74rem] text-[#a0442c]">{f.failed}</p>}
      <button type="submit" disabled={busy} className="mt-5 min-h-13 w-full rounded-full bg-graphite text-[0.88rem] tracking-[0.04em] text-paper-lit disabled:opacity-50">
        {state === 'uploading' ? f.uploading(uploaded, photos.length) : state === 'saving' ? f.saving : t.save}
      </button>
      {state === 'uploading' && (
        <div aria-hidden className="mt-3 h-1 overflow-hidden rounded-full bg-graphite/10">
          <div className="h-full bg-graphite/60 transition-[width] duration-500" style={{ width: `${(uploaded / Math.max(1, photos.length)) * 100}%` }} />
        </div>
      )}
      <p className="mt-5 text-[0.62rem] leading-relaxed text-graphite-faint">{t.privacy}</p>
    </form>
  )
}
