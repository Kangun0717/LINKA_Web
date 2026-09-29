import { GRAIN, Postcard, SketchCover, Stamp, Tape } from '@/components/notebook/Notebook'
import SadoSketch, { type SketchPin } from '@/features/community/components/SadoSketch'
import { cn } from '@/lib/cn'
import { useCommunityMessages } from '@/lib/i18n/useCommunityMessages'

/**
 * A LINKA keepsake to save and share — a travel souvenir, not an advert: the
 * person's own photographs and places in front, LINKA only as a small
 * stamp and wordmark. Drawn at a fixed design size (360 wide) so a later
 * exporter can render exactly this to an image at 1080×1920 or 1080×1080.
 * No social-platform API: saving the image is enough.
 */
export type ShareCardData =
  | { kind: 'year'; region: string; year: number; pins: SketchPin[]; places: string[]; photos: string[] }
  | { kind: 'counts'; region: string; year: number; touched: number; memories: number; photos: string[] }
  | { kind: 'postcard'; place: string; placeSecond: string; date: string; text: string; photo: string | null }
  | { kind: 'milestone'; place: string; area: string; date: string; supportCount: number; photo: string | null }

export type ShareFormat = 'story' | 'square'

export default function ShareCard({ data, format }: { data: ShareCardData; format: ShareFormat }) {
  const cc = useCommunityMessages()
  const story = format === 'story'
  return (
    <div
      className={cn('relative w-[360px] overflow-hidden bg-[#f8f3ea] text-graphite shadow-[0_18px_40px_-20px_rgba(51,48,43,0.45)]', story ? 'h-[640px]' : 'h-[360px]')}
      style={{ backgroundImage: GRAIN }}
    >
      <div className={cn('flex h-full flex-col', story ? 'p-7' : 'p-5')}>
        {data.kind === 'year' && (
          <>
            <p className="text-[0.62rem] uppercase tracking-[0.3em] text-graphite-soft">{data.year}</p>
            <h2 className={cn('font-light tracking-[0.1em]', story ? 'mt-2 text-[1.9rem]' : 'mt-1 text-[1.35rem]')}>{cc.share.myRegion(data.region, data.year)}</h2>
            <div className={cn('relative mx-auto', story ? 'mt-5 w-[52%]' : 'mt-1 w-[34%]')}>
              <SadoSketch pins={data.pins} label={data.region} />
            </div>
            {story && (
              <div className="relative mt-6 flex justify-center gap-3">
                {data.photos.slice(0, 3).map((src, i) => (
                  <Postcard key={src} src={src} alt="" tilt={[-5, 2, 6][i]} ratio="1" className="w-[30%]" />
                ))}
              </div>
            )}
            <p lang="ja" className={cn('text-[0.7rem] leading-relaxed tracking-[0.08em] text-graphite-soft', story ? 'mt-5' : 'mt-auto')}>{data.places.join('・')}</p>
          </>
        )}

        {data.kind === 'counts' && (
          <>
            <p className="text-[0.62rem] uppercase tracking-[0.3em] text-graphite-soft">{cc.share.myRegion(data.region, data.year)}</p>
            <div className={cn('flex flex-1 flex-col justify-center', story ? 'gap-7' : 'gap-3')}>
              <p className="font-light tracking-[0.04em]">
                <span className={cn('block tabular-nums', story ? 'text-[5.2rem] leading-none' : 'text-[3.4rem] leading-none')}>{data.touched}</span>
                <span className="text-[0.95rem] tracking-[0.12em]">{cc.share.touchedLabel}</span>
              </p>
              <p className="font-light tracking-[0.04em]">
                <span className={cn('block tabular-nums', story ? 'text-[5.2rem] leading-none' : 'text-[3.4rem] leading-none')}>{data.memories}</span>
                <span className="text-[0.95rem] tracking-[0.12em]">{cc.share.memoriesLabel}</span>
              </p>
            </div>
            {story && (
              <div className="grid grid-cols-4 gap-2">
                {data.photos.slice(0, 4).map((src) => (
                  <img key={src} src={src} alt="" className="aspect-square w-full object-cover" />
                ))}
              </div>
            )}
          </>
        )}

        {data.kind === 'postcard' && (
          <>
            <div className="relative">
              {data.photo ? (
                <Postcard src={data.photo} alt="" tilt={-1.5} ratio={story ? '4 / 5' : '16 / 9'} />
              ) : (
                <Postcard src={null} alt="" tilt={-1.5} ratio={story ? '4 / 5' : '16 / 9'}><SketchCover title={data.place} /></Postcard>
              )}
              <Tape tone="sun" className="-top-2 left-8" style={{ transform: 'rotate(-6deg)' }} />
            </div>
            <p className={cn('text-[0.6rem] uppercase tracking-[0.24em] text-graphite-soft', story ? 'mt-6' : 'mt-3')}>{data.date}</p>
            <h2 lang="ja" className={cn('font-light tracking-[0.1em]', story ? 'mt-1 text-[1.6rem]' : 'text-[1.1rem]')}>{data.place}</h2>
            <p className="text-[0.55rem] uppercase tracking-[0.24em] text-graphite-soft">{data.placeSecond}</p>
            {story && <p className="mt-4 text-[0.9rem] font-light leading-relaxed">“{data.text}”</p>}
          </>
        )}

        {data.kind === 'milestone' && (
          <>
            <p className="text-[0.62rem] uppercase tracking-[0.3em] text-graphite-soft">{data.date}</p>
            <h2 lang="ja" className={cn('font-light leading-snug tracking-[0.08em]', story ? 'mt-3 text-[1.55rem]' : 'mt-1 text-[1.1rem]')}>{cc.share.becameLinka}</h2>
            <div className={cn('relative', story ? 'mt-7' : 'mt-3 w-2/3')}>
              <Postcard src={data.photo} alt="" tilt={1.5} ratio="4 / 3">
                <SketchCover title={data.place} note={data.area} seed={3} />
              </Postcard>
              <Stamp top="NOW A LINKA PLACE" bottom={data.date} tone="moss" size={story ? 92 : 70} className="absolute -bottom-6 -right-3" />
            </div>
            <p lang="ja" className={cn('font-light tracking-[0.08em]', story ? 'mt-10 text-[1.3rem]' : 'mt-3 text-[0.95rem]')}>{data.place}</p>
            <p className="text-[0.7rem] tracking-[0.06em] text-graphite-soft">{data.area} · ♡ {data.supportCount}</p>
          </>
        )}

        <p className={cn('flex items-center justify-between text-[0.6rem] tracking-[0.28em] text-graphite-soft', story ? 'mt-auto pt-6' : 'mt-auto pt-3')}>
          <span>LINKA</span>
          <span className="touchpoint-mark tracking-normal text-graphite">:)))</span>
        </p>
      </div>
    </div>
  )
}
