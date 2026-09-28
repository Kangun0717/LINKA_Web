import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import LanguageSwitcher from '@/components/ui/LanguageSwitcher'
import { fetchPlaces, type PlaceRecord } from '@/features/places/api'
import PlaceSheet from '@/features/places/components/PlaceSheet'
import { localizePlace } from '@/features/places/localize'
import { usePlaceExtras } from '@/features/places/usePlaceExtras'
import { cn } from '@/lib/cn'
import { useLocale } from '@/lib/i18n/LocaleContext'
import type { Locale } from '@/lib/i18n/locale'

/**
 * DEV PREVIEW ONLY — /preview/emergency?place=toki-no-mori&state=emergency|normal
 *
 * The concept for a demonstration: the same NFC Touch Point is a tourism
 * gateway in normal times and a way into official local safety information
 * when it matters. The place, its content and every safety link are the real
 * production data; ONLY the notice is staged, and it says so in its first
 * line. Registered only in development builds, so it can never ship.
 */
export default function EmergencyDemoScreen() {
  const [params, setParams] = useSearchParams()
  const { locale } = useLocale()
  const demo = DEMO_COPY[locale]
  const [places, setPlaces] = useState<PlaceRecord[] | null>(null)
  const slug = params.get('place') ?? 'toki-no-mori'
  const emergency = params.get('state') !== 'normal'

  useEffect(() => {
    let active = true
    fetchPlaces().then((rows) => active && setPlaces(rows), () => {})
    return () => {
      active = false
    }
  }, [])

  const view = useMemo(() => {
    if (!places) return null
    const all = places.map((p) => localizePlace(p, locale))
    const place = all.find((p) => p.slug === slug)
    return place ? { place, regionId: place.parentId } : null
  }, [places, locale, slug])

  const extras = usePlaceExtras(view?.place.id ?? null, view?.regionId ?? null)

  return (
    <main className="min-h-dvh bg-paper-lit pt-[env(safe-area-inset-top)]">
      <div className="relative mx-auto max-w-md pb-16">
        <div className="sticky top-0 z-20 flex items-center gap-2 bg-[#2f2b27] px-3 py-2 text-[0.62rem] tracking-[0.1em] text-white">
          <span className="rounded bg-white/15 px-1.5 py-0.5 font-medium">DEMO</span>
          <span className="flex-1">{demo.banner}</span>
          {(['normal', 'emergency'] as const).map((state) => (
            <button
              key={state}
              type="button"
              aria-pressed={(state === 'emergency') === emergency}
              onClick={() => setParams({ place: slug, state }, { replace: true })}
              className={cn('min-h-9 rounded-full px-2.5', (state === 'emergency') === emergency ? 'bg-white text-[#2f2b27]' : 'text-white/80')}
            >
              {state}
            </button>
          ))}
        </div>
        <LanguageSwitcher className="absolute right-2 top-12 z-10 rounded-full bg-paper-lit/80" />

        {view ? (
          <PlaceSheet
            place={view.place}
            visitedOn={null}
            extras={extras}
            progress={null}
            heroPriority
            safetyFirst={emergency}
            notice={emergency ? <DemoNotice copy={demo} /> : null}
          />
        ) : (
          <div className="mt-6 h-64 animate-pulse bg-graphite/[0.05]" />
        )}
      </div>
    </main>
  )
}

/** The staged notice's words live here, in the dev-only preview, so they never ship. */
const DEMO_COPY: Record<Locale, { banner: string; title: string; body: string }> = {
  en: { banner: 'DEMONSTRATION — not a real warning', title: 'Important notice', body: 'Please check the official disaster information for this area.' },
  ja: { banner: 'デモ表示 — 実際の警報ではありません', title: '重要なお知らせ', body: 'この地域の防災情報を確認してください。' },
  'zh-Hans': { banner: '演示——并非真实警报', title: '重要通知', body: '请查看本地区的防灾信息。' },
}

function DemoNotice({ copy }: { copy: { banner: string; title: string; body: string } }) {
  return (
    <div role="note" className="mb-4 overflow-hidden rounded-xl ring-1 ring-[#b4553c]/40">
      <p className="bg-[#b4553c] px-3 py-1 text-[0.58rem] font-medium uppercase tracking-[0.18em] text-white">{copy.banner}</p>
      <div className="bg-[#fbf1ec] px-3.5 py-3">
        <p className="text-[0.92rem] tracking-[0.04em] text-[#7a2f1d]">{copy.title}</p>
        <p className="mt-0.5 text-[0.76rem] leading-snug text-[#7a2f1d]/85">{copy.body}</p>
      </div>
    </div>
  )
}
