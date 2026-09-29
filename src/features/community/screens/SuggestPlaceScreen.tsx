import { useEffect, useId, useRef, useState, type FormEvent, type MouseEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { Stamp, Tape } from '@/components/notebook/Notebook'
import { communityChanged } from '@/data/community'
import { suggestionsChanged } from '@/data/journey'
import { useAuth } from '@/features/auth/useAuth'
import { addSuggestionPhoto, problemOf, submitSuggestion } from '@/features/community/api'
import { problemText } from '@/features/community/problems'
import CommunityFrame from '@/features/community/components/CommunityFrame'
import SadoSketch from '@/features/community/components/SadoSketch'
import { pointAt } from '@/features/community/components/sketchProjection'
import PhotoTray, { type TrayPhoto } from '@/features/journal/components/PhotoTray'
import SignInGate from '@/features/journey/SignInGate'
import { useProfileContext } from '@/features/onboarding/useProfileContext'
import { cn } from '@/lib/cn'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { useCommunityMessages } from '@/lib/i18n/useCommunityMessages'

type Errors = Partial<Record<'name' | 'area' | 'reason' | 'link', string>>
type Picked = TrayPhoto & { file: File }

/**
 * /community/suggest — tell LINKA about a place, on one light page.
 *
 * A suggestion starts `submitted`: private to its proposer until LINKA opens
 * it (RLS; the insert cannot choose its status). The area and an optional
 * mark on Sado are for LINKA only — the public ever sees LINKA's own public
 * area and approximate point. Photos are re-encoded on this device (no EXIF,
 * no location) and uploaded privately for review after the suggestion is
 * saved, so a failed photo never loses the words.
 *
 * The server limits how often one account can suggest; that refusal is
 * said kindly, never as the database's message.
 */
export default function SuggestPlaceScreen() {
  const cc = useCommunityMessages()
  const t = cc.suggest
  const { locale } = useLocale()
  const { session, user } = useAuth()
  const { profile } = useProfileContext()
  const [name, setName] = useState('')
  const [area, setArea] = useState('')
  const [reason, setReason] = useState('')
  const [link, setLink] = useState('')
  const [point, setPoint] = useState<{ lng: number; lat: number } | null>(null)
  const [attribution, setAttribution] = useState<'nickname' | 'anonymous'>('anonymous')
  const [photos, setPhotos] = useState<Picked[]>([])
  const [errors, setErrors] = useState<Errors>({})
  const [state, setState] = useState<'idle' | 'sending' | 'uploading' | 'done'>('idle')
  const [problem, setProblem] = useState<string | null>(null)
  const [sentId, setSentId] = useState<string | null>(null)
  const [uploaded, setUploaded] = useState(0)
  const [failedPhotos, setFailedPhotos] = useState<Picked[]>([])
  const formRef = useRef<HTMLFormElement>(null)

  // Object URLs for the previews are released when the page closes.
  const previews = useRef(photos)
  useEffect(() => {
    previews.current = photos
  }, [photos])
  useEffect(() => () => previews.current.forEach((p) => URL.revokeObjectURL(p.src)), [])

  async function sendPhotos(id: string, list: Picked[], offset: number) {
    if (!user || list.length === 0) return []
    setState('uploading')
    setUploaded(0)
    const failed: Picked[] = []
    for (const [i, photo] of list.entries()) {
      try {
        await addSuggestionPhoto(id, user.id, photo.file, offset + i)
      } catch {
        failed.push(photo)
      }
      setUploaded(i + 1)
    }
    return failed
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const next: Errors = {}
    if (!name.trim()) next.name = t.required
    if (!area.trim()) next.area = t.required
    if (!reason.trim()) next.reason = t.required
    const url = link.trim()
    if (url && !/^https?:\/\/\S+\.\S+/.test(url)) next.link = t.invalidLink
    setErrors(next)
    if (Object.keys(next).length > 0) {
      formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
      return
    }

    setState('sending')
    setProblem(null)
    try {
      const id = await submitSuggestion({ name, area, reason, referenceUrl: url || null, point, attribution, locale })
      setSentId(id)
      const failed = await sendPhotos(id, photos, 0)
      setFailedPhotos(failed)
      if (user) suggestionsChanged(user.id)
      communityChanged(user?.id)
      setState('done')
      document.getElementById('community-scroll')?.scrollTo({ top: 0 })
    } catch (error) {
      setProblem(problemText(cc, problemOf(error)))
      setState('idle')
    }
  }

  async function retryPhotos() {
    if (!sentId) return
    const failed = await sendPhotos(sentId, failedPhotos, photos.length - failedPhotos.length)
    setFailedPhotos(failed)
    setState('done')
  }

  function mark(event: MouseEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    setPoint(pointAt((event.clientX - box.left) / box.width, (event.clientY - box.top) / box.height))
  }

  if (!session) {
    return (
      <CommunityFrame back="/community" backLabel={cc.hub.back}>
        <div className="px-5">
          <SignInGate title={t.signInTitle} body={t.signInBody} />
        </div>
      </CommunityFrame>
    )
  }

  if (state === 'done' && sentId) {
    return (
      <CommunityFrame back="/community" backLabel={cc.hub.back}>
        <div className="px-5 pt-4" role="status">
          <div className="relative mx-auto max-w-xs rounded-sm bg-white px-6 pb-7 pt-8 shadow-[0_1px_2px_rgba(51,48,43,0.12),0_16px_32px_-18px_rgba(51,48,43,0.45)]" style={{ transform: 'rotate(-1.2deg)' }}>
            <Tape tone="sun" className="-top-2 left-1/2 -translate-x-1/2" />
            <Stamp top="RECEIVED" bottom="LINKA" size={70} className="absolute -right-4 -top-5" angle={-12} />
            <p className="text-[0.56rem] uppercase tracking-[0.24em] text-graphite-soft">{t.title}</p>
            <p lang="ja" className="mt-2 text-[1.3rem] font-light tracking-[0.08em] text-graphite">{name}</p>
            <p className="mt-1 text-[0.68rem] text-graphite-soft">{area}</p>
          </div>
          <h1 className="mt-10 text-[1.25rem] font-light leading-snug tracking-[0.06em] text-graphite">{t.doneTitle}</h1>
          <p className="mt-2 text-[0.8rem] font-light leading-relaxed text-graphite-soft">{t.doneBody}</p>
          <ol className="mt-6 space-y-2.5">
            {t.doneSteps.map((step, i) => (
              <li key={step} className="flex items-center gap-3 text-[0.78rem] text-graphite">
                <span className={cn('flex size-5 shrink-0 items-center justify-center rounded-full text-[0.56rem] tabular-nums', i === 0 ? 'bg-graphite text-paper-lit' : 'ring-1 ring-graphite/25 text-graphite-soft')}>{i + 1}</span>
                {step}
              </li>
            ))}
          </ol>
          {failedPhotos.length > 0 && (
            <div role="alert" className="mt-6 rounded-xl bg-[#a0442c]/[0.06] px-4 py-3 text-[0.74rem] text-[#8a3a26]">
              {t.photoFailed}
              <button type="button" onClick={() => void retryPhotos()} className="ml-2 min-h-9 underline underline-offset-4">
                {t.retryPhotos}
              </button>
            </div>
          )}
          <div className="mt-9 space-y-2.5">
            <Link to={`/community/suggestions/${sentId}`} className="flex min-h-12 items-center justify-center rounded-full bg-graphite text-[0.84rem] text-paper-lit">
              {t.seeMine}
            </Link>
            <Link to="/community" className="flex min-h-12 items-center justify-center rounded-full text-[0.84rem] text-graphite ring-1 ring-graphite/20">
              {t.backToCommunity}
            </Link>
            <button
              type="button"
              onClick={() => {
                setName('')
                setArea('')
                setReason('')
                setLink('')
                setPoint(null)
                setPhotos([])
                setSentId(null)
                setFailedPhotos([])
                setState('idle')
              }}
              className="flex min-h-11 w-full items-center justify-center text-[0.76rem] text-graphite-soft underline decoration-graphite/25 underline-offset-4"
            >
              {t.another}
            </button>
          </div>
        </div>
      </CommunityFrame>
    )
  }

  const busy = state === 'sending' || state === 'uploading'

  return (
    <CommunityFrame back="/community" backLabel={cc.hub.back}>
      <form ref={formRef} onSubmit={(e) => void submit(e)} noValidate className="px-5">
        <h1 className="mt-2 text-[1.7rem] font-extralight tracking-[0.1em] text-graphite">{t.title}</h1>
        <p className="mt-2 text-[0.82rem] font-light leading-relaxed text-graphite-soft">{t.lead}</p>
        <ul className="mt-5 space-y-2">
          {t.points.map((point, i) => (
            <li key={point} className="flex gap-3 text-[0.76rem] leading-snug text-graphite">
              <span aria-hidden className="mt-px flex size-4.5 shrink-0 items-center justify-center rounded-full text-[0.54rem] tabular-nums text-graphite-soft ring-1 ring-graphite/25">{i + 1}</span>
              {point}
            </li>
          ))}
        </ul>
        <p className="mt-5 rounded-xl bg-[#fbf3de] px-4 py-3 text-[0.72rem] leading-relaxed text-graphite ring-1 ring-[#e8d49a]">{t.privacy}</p>

        <Field label={t.nameLabel} error={errors.name}>
          {(props) => <input {...props} value={name} onChange={(e) => setName(e.target.value)} maxLength={200} placeholder={t.namePlaceholder} autoComplete="off" />}
        </Field>
        <Field label={t.areaLabel} error={errors.area}>
          {(props) => <input {...props} value={area} onChange={(e) => setArea(e.target.value)} maxLength={500} placeholder={t.areaPlaceholder} autoComplete="off" />}
        </Field>

        <div className="mt-6">
          <p className="text-[0.66rem] uppercase tracking-[0.16em] text-graphite-soft">
            {t.pinLabel} <span className="normal-case tracking-normal text-graphite-faint">· {cc.suggestFlow.optional}</span>
          </p>
          <p className="mt-1 text-[0.66rem] text-graphite-faint">{t.pinHint}</p>
          <div role="button" tabIndex={-1} aria-label={t.pinLabel} className="mt-2 cursor-crosshair rounded-xl bg-white/60 p-2 ring-1 ring-graphite/10" onClick={mark}>
            <SadoSketch className="mx-auto max-w-[220px]" label={t.pinLabel} pins={point ? [{ id: 'new', kind: 'suggested', ...point }] : []} />
          </div>
          {point && (
            <button type="button" onClick={() => setPoint(null)} className="mt-1 min-h-9 text-[0.68rem] text-graphite-soft underline underline-offset-4">
              {t.pinClear}
            </button>
          )}
        </div>

        <Field label={t.reasonLabel} hint={t.reasonHelp} error={errors.reason}>
          {(props) => (
            <textarea {...props} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={2000} rows={5} placeholder={t.reasonPlaceholder} className={cn(props.className, 'resize-none leading-relaxed')} />
          )}
        </Field>
        <ul className="mt-2 flex flex-wrap gap-2">
          {cc.suggestFlow.prompts.map((prompt) => (
            <li key={prompt}>
              <button
                type="button"
                onClick={() => setReason((text) => (text ? `${text}\n${prompt} ` : `${prompt} `))}
                className="min-h-9 rounded-full bg-white/80 px-3 text-left text-[0.68rem] leading-snug text-graphite-soft ring-1 ring-graphite/12"
              >
                {prompt}
              </button>
            </li>
          ))}
        </ul>

        <Field label={t.linkLabel} hint={cc.suggestFlow.optional} error={errors.link}>
          {(props) => <input {...props} value={link} onChange={(e) => setLink(e.target.value)} inputMode="url" autoCapitalize="none" placeholder="https://" />}
        </Field>

        <div className="mt-7">
          <p className="text-[0.66rem] uppercase tracking-[0.16em] text-graphite-soft">
            {t.photosLabel} <span className="normal-case tracking-normal text-graphite-faint">· {cc.suggestFlow.optional}</span>
          </p>
          <p className="mb-3 mt-1 text-[0.66rem] leading-snug text-graphite-faint">{t.photosHelp}</p>
          <PhotoTray
            photos={photos}
            max={6}
            onChange={(next) => {
              const keep = new Set(next.map((p) => p.key))
              photos.filter((p) => !keep.has(p.key)).forEach((p) => URL.revokeObjectURL(p.src))
              setPhotos(next.map((p) => photos.find((q) => q.key === p.key)!))
            }}
            onAdd={(files) => setPhotos((list) => [...list, ...files.map((file) => ({ key: `${file.name}-${file.size}-${Math.random()}`, src: URL.createObjectURL(file), file }))])}
          />
        </div>

        <fieldset className="mt-8">
          <legend className="text-[0.66rem] uppercase tracking-[0.16em] text-graphite-soft">{t.attributionLabel}</legend>
          {(['anonymous', 'nickname'] as const).map((option) => (
            <label key={option} className="mt-2.5 flex min-h-12 items-center gap-3 rounded-xl bg-white/70 px-4 ring-1 ring-graphite/10">
              <input type="radio" name="attribution" checked={attribution === option} onChange={() => setAttribution(option)} className="accent-graphite" />
              <span className="text-[0.84rem] text-graphite">{option === 'nickname' ? t.nickname(profile?.display_name ?? '') : t.anonymous}</span>
            </label>
          ))}
        </fieldset>

        {problem && (
          <p role="alert" className="mt-6 rounded-xl bg-[#a0442c]/[0.06] px-4 py-3 text-[0.76rem] leading-snug text-[#8a3a26]">
            {problem}
          </p>
        )}

        <button type="submit" disabled={busy} className="mt-8 min-h-13 w-full rounded-full bg-graphite text-[0.9rem] tracking-[0.06em] text-paper-lit disabled:opacity-50">
          {state === 'uploading' ? t.uploading(uploaded, photos.length) : state === 'sending' ? t.submitting : t.submit}
        </button>
        {state === 'uploading' && (
          <div aria-hidden className="mt-3 h-1 overflow-hidden rounded-full bg-graphite/10">
            <div className="h-full bg-graphite/60 transition-[width] duration-500" style={{ width: `${(uploaded / Math.max(1, photos.length)) * 100}%` }} />
          </div>
        )}
      </form>
    </CommunityFrame>
  )
}

// 16px text: iOS Safari zooms into any smaller input on focus.
const inputClass =
  'mt-2 block w-full rounded-xl bg-white/85 px-3.5 py-3 text-[16px] font-light text-graphite outline-none ring-1 ring-graphite/12 placeholder:text-graphite-faint focus:ring-graphite/35 aria-[invalid=true]:ring-[#a0442c]/60'

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: (props: { id: string; className: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode
}) {
  const id = useId()
  return (
    <div className="mt-6">
      <label htmlFor={id} className="text-[0.66rem] uppercase tracking-[0.16em] text-graphite-soft">
        {label}
        {hint && <span className="ml-2 normal-case tracking-normal text-graphite-faint">· {hint}</span>}
      </label>
      {children({ id, className: inputClass, 'aria-invalid': Boolean(error), 'aria-describedby': error ? `${id}-error` : undefined })}
      {error && (
        <p id={`${id}-error`} role="alert" className="mt-1 text-[0.7rem] text-[#a0442c]">
          {error}
        </p>
      )}
    </div>
  )
}
