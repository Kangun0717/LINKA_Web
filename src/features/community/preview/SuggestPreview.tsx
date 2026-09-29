import { useState, type MouseEvent } from 'react'

import { NoteHeading } from '@/components/notebook/Notebook'
import SadoSketch from '@/features/community/components/SadoSketch'
import { pointAt } from '@/features/community/components/sketchProjection'
import { MOCK_ME } from '@/features/community/preview/mock'
import PreviewFrame from '@/features/community/preview/PreviewFrame'
import PhotoTray, { type TrayPhoto } from '@/features/journal/components/PhotoTray'
import { cn } from '@/lib/cn'
import { useCommunityMessages } from '@/lib/i18n/useCommunityMessages'

const STEPS = 5

/**
 * DEV PREVIEW — Suggest a Place in five small steps. The "why" step offers
 * prompts, because people often do not know what to write. Nothing is sent.
 */
export default function SuggestPreview() {
  const cc = useCommunityMessages()
  const t = cc.suggestFlow
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [area, setArea] = useState('')
  const [link, setLink] = useState('')
  const [point, setPoint] = useState<{ lng: number; lat: number } | null>(null)
  const [why, setWhy] = useState('')
  const [photos, setPhotos] = useState<TrayPhoto[]>([])
  const [attribution, setAttribution] = useState<'nickname' | 'anonymous'>('anonymous')
  const [sent, setSent] = useState(false)

  const canNext = step === 1 ? name.trim().length > 0 : step === 2 ? area.trim().length > 0 || point !== null : step === 3 ? why.trim().length > 0 : true
  const field = 'mt-2 block w-full rounded-xl bg-white/80 px-3.5 py-3 text-[16px] font-light text-graphite outline-none ring-1 ring-graphite/12 placeholder:text-graphite-faint focus:ring-graphite/35'

  function place(event: MouseEvent<HTMLDivElement>) {
    const box = event.currentTarget.getBoundingClientRect()
    setPoint(pointAt((event.clientX - box.left) / box.width, (event.clientY - box.top) / box.height))
  }

  return (
    <PreviewFrame back="/preview/4c/community">
      <div className="px-5 pt-2">
        <NoteHeading title={t.title} second={t.step(step, STEPS)} />
        <div aria-hidden className="mt-3 flex gap-1.5">
          {Array.from({ length: STEPS }, (_, i) => (
            <span key={i} className={cn('h-[3px] flex-1 rounded-full', i < step ? 'bg-graphite/70' : 'bg-graphite/10')} />
          ))}
        </div>

        {step === 1 && (
          <label className="mt-8 block">
            <span className="text-[1.05rem] font-light tracking-[0.04em] text-graphite">{t.nameLabel}</span>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder={t.namePlaceholder} className={field} />
          </label>
        )}

        {step === 2 && (
          <div className="mt-8">
            <p className="text-[1.05rem] font-light tracking-[0.04em] text-graphite">{t.whereLabel}</p>
            <label className="mt-4 block text-[0.7rem] tracking-[0.06em] text-graphite-soft">
              {t.whereArea}
              <input value={area} onChange={(e) => setArea(e.target.value)} placeholder={t.whereAreaPlaceholder} className={field} />
            </label>
            <p className="mt-5 text-[0.7rem] tracking-[0.06em] text-graphite-soft">{t.whereMap} <span className="text-graphite-faint">({t.optional})</span></p>
            <div className="relative mt-2 cursor-crosshair rounded-xl bg-white/60 p-2 ring-1 ring-graphite/10" onClick={place}>
              <SadoSketch label={t.whereMap} pins={point ? [{ id: 'new', kind: 'suggested', ...point }] : []} />
            </div>
            <label className="mt-5 block text-[0.7rem] tracking-[0.06em] text-graphite-soft">
              {t.whereLink} <span className="text-graphite-faint">({t.optional})</span>
              <input value={link} onChange={(e) => setLink(e.target.value)} inputMode="url" placeholder="https://" className={field} />
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="mt-8">
            <p className="text-[1.05rem] font-light tracking-[0.04em] text-graphite">{t.whyLabel}</p>
            <p className="mt-2 text-[0.72rem] font-light text-graphite-soft">{t.whyHelp}</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {t.prompts.map((prompt) => (
                <li key={prompt}>
                  <button
                    type="button"
                    onClick={() => setWhy((text) => (text ? `${text}\n\n${prompt}\n` : `${prompt}\n`))}
                    className="rounded-full bg-white/80 px-3 py-2 text-left text-[0.72rem] leading-snug text-graphite ring-1 ring-graphite/12"
                  >
                    {prompt}
                  </button>
                </li>
              ))}
            </ul>
            <textarea value={why} onChange={(e) => setWhy(e.target.value)} rows={6} placeholder={t.whyPlaceholder} className={cn(field, 'mt-4 resize-none leading-relaxed')} />
          </div>
        )}

        {step === 4 && (
          <div className="mt-8">
            <p className="text-[1.05rem] font-light tracking-[0.04em] text-graphite">{t.photosLabel} <span className="text-[0.7rem] text-graphite-faint">({t.optional})</span></p>
            <p className="mb-4 mt-2 text-[0.72rem] font-light leading-relaxed text-graphite-soft">{t.photosHelp}</p>
            <PhotoTray
              photos={photos}
              onChange={setPhotos}
              onAdd={(files) => setPhotos((list) => [...list, ...files.map((f) => ({ key: `${f.name}-${Math.random()}`, src: URL.createObjectURL(f) }))])}
            />
          </div>
        )}

        {step === 5 && (
          <fieldset className="mt-8">
            <legend className="text-[1.05rem] font-light tracking-[0.04em] text-graphite">{t.attributionLabel}</legend>
            {(['nickname', 'anonymous'] as const).map((option) => (
              <label key={option} className="mt-3 flex min-h-12 items-center gap-3 rounded-xl bg-white/70 px-4 ring-1 ring-graphite/10">
                <input type="radio" name="attribution" checked={attribution === option} onChange={() => setAttribution(option)} />
                <span className="text-[0.84rem] text-graphite">
                  {option === 'nickname' ? t.attributionNickname(MOCK_ME.nickname) : t.attributionAnonymous}
                </span>
              </label>
            ))}
            <p className="mt-5 rounded-xl bg-graphite/[0.04] px-4 py-3 text-[0.7rem] leading-relaxed text-graphite-soft">{t.privateUntilOpened}</p>
          </fieldset>
        )}

        {sent && <p role="status" className="mt-6 text-center text-[0.74rem] text-[#a4543a]">{cc.preview.notSaved}</p>}

        <div className="mt-10 flex gap-3">
          {step > 1 && (
            <button type="button" onClick={() => setStep(step - 1)} className="min-h-12 flex-1 rounded-full text-[0.84rem] text-graphite ring-1 ring-graphite/20">
              {t.back}
            </button>
          )}
          <button
            type="button"
            disabled={!canNext}
            onClick={() => (step < STEPS ? setStep(step + 1) : setSent(true))}
            className="min-h-12 flex-[2] rounded-full bg-graphite text-[0.84rem] tracking-[0.04em] text-paper-lit disabled:opacity-30"
          >
            {step < STEPS ? t.next : t.send}
          </button>
        </div>
      </div>
    </PreviewFrame>
  )
}
