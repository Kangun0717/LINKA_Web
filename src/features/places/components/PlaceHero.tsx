import type { Hero } from '@/features/places/localize'

/**
 * A place's licensed photograph, with its attribution on the image.
 *
 * Reserved at its 16:10 shape before it loads (width/height + aspect ratio),
 * so nothing below it moves. `srcSet` offers the 800 and 1600 px versions;
 * `priority` loads it at once for a page's first image, lazily in a card.
 * Alt text is written per language (place_translations.hero_image_alt) and
 * follows the same fallback as every other field.
 *
 * Attribution: the credit links to the photograph's source page, and the
 * licence named in it links to the licence itself. Nothing is shown for a
 * place without a credited image — no photograph is ever invented.
 */
export default function PlaceHero({ hero, priority, tabIndex }: { hero: Hero; priority: boolean; tabIndex: number }) {
  return (
    <figure className="relative overflow-hidden bg-[#e9e4da]">
      <img
        src={hero.src}
        srcSet={hero.srcSet}
        sizes="(max-width: 480px) 100vw, 480px"
        alt={hero.alt}
        width={800}
        height={500}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        className="block aspect-[16/10] w-full object-cover saturate-[0.92]"
      />
      <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-black/35 to-transparent" />
      <figcaption className="absolute bottom-1.5 right-2 text-[0.54rem] tracking-[0.03em] text-white/90 [text-shadow:0_0_4px_rgba(0,0,0,0.6)]">
        <Credit hero={hero} tabIndex={tabIndex} />
      </figcaption>
    </figure>
  )
}

function Credit({ hero, tabIndex }: { hero: Hero; tabIndex: number }) {
  const link = 'underline-offset-2 hover:underline'
  const at = hero.license && hero.licenseUrl ? hero.credit.indexOf(hero.license) : -1
  if (at < 0) {
    return hero.sourceUrl ? (
      <a href={hero.sourceUrl} target="_blank" rel="noopener noreferrer" tabIndex={tabIndex} className={link}>
        {hero.credit}
      </a>
    ) : (
      <>{hero.credit}</>
    )
  }
  // "Photo: Totti, CC BY-SA 4.0 (Wikimedia Commons)": the licence links to the
  // licence; the rest to the photograph's page.
  const before = hero.credit.slice(0, at)
  const after = hero.credit.slice(at + hero.license!.length)
  const source = (text: string) =>
    text && hero.sourceUrl ? (
      <a href={hero.sourceUrl} target="_blank" rel="noopener noreferrer" tabIndex={tabIndex} className={link}>
        {text}
      </a>
    ) : (
      text
    )
  return (
    <>
      {source(before)}
      <a href={hero.licenseUrl!} target="_blank" rel="noopener noreferrer license" tabIndex={tabIndex} className={link}>
        {hero.license}
      </a>
      {source(after)}
    </>
  )
}
