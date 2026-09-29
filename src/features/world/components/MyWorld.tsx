import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'

import CountryMap, { type AreaWash } from '@/features/world/components/CountryMap'
import DiscoveryCard from '@/features/world/components/DiscoveryCard'
import DiscoveryMark from '@/features/world/components/DiscoveryMark'
import FontPrimer from '@/features/world/components/FontPrimer'
import LocalMap, { type Pocket } from '@/features/world/components/LocalMap'
import MapLabel from '@/features/world/components/MapLabel'
import PlaceCard from '@/features/world/components/PlaceCard'
import PhotoFragment from '@/features/world/components/PhotoFragment'
import PlaceLabel from '@/features/world/components/PlaceLabel'
import TouchMark from '@/features/world/components/TouchMark'
import WorldGlobe, { type Bloom } from '@/features/world/components/WorldGlobe'
import WorldHeader from '@/features/world/components/WorldHeader'
import {
  areaOf,
  COUNTRIES,
  countryOf,
  locate,
  type Country,
  type LocalArea,
  type LocalMapData,
  type WorldPath,
  warmLocalMap,
} from '@/features/world/geo/atlas'
import { boundsPoints, fitPoints, smoothstep, type View } from '@/features/world/geo/camera'
import { kmToPx, variantOf } from '@/features/world/geo/draw'
import { frameWorld, landPaths, project } from '@/features/world/geo/orthographic'
import {
  NO_DISCOVERY,
  type DiscoveryPlace,
  type WorldSnapshot,
} from '@/features/world/model/types'
import { regionSecondName } from '@/features/world/regionName'
import { useArrival } from '@/features/world/useArrival'
import { useCamera } from '@/features/world/useCamera'
import { useFlightLayer } from '@/features/world/useFlightLayer'
import { useWorldSelection } from '@/features/world/useWorldSelection'
import { useElementSize } from '@/hooks/useElementSize'
import { cn } from '@/lib/cn'
import { useLocale } from '@/lib/i18n/LocaleContext'
import { useMessages } from '@/lib/i18n/useMessages'
import { formatCalendarDate } from '@/lib/i18n/locale'
import type { Messages } from '@/lib/i18n/messages'

type MyWorldProps = {
  snapshot: WorldSnapshot
  /**
   * The place a touch has just added, if the user arrived from one. Its mark,
   * ripple and wash play in; everything else is already there.
   */
  arrivalPlaceId?: string | null
  /** Where in the ladder to show: `[]` world, `['jp']` Japan, `['jp', 'sado']` Sado. */
  path?: WorldPath
  onEnter?: (path: WorldPath) => void
  onBack?: () => void
  /**
   * Places that can be discovered before they are visited. Production has no
   * source for these yet and passes none; the dev preview passes samples.
   */
  discovery?: readonly DiscoveryPlace[]
  /** A place whose card is open on arrival (e.g. from another place's card). */
  openPlaceId?: string | null
}

const NO_PATH: WorldPath = []
const noop = () => {}

/**
 * My World — the world, a country in it, and a place in that.
 *
 * The world is the whole screen — larger than the phone, running past its
 * edges — so the user looks into it rather than at a globe placed on a page.
 * Going deeper never cuts to another map: one camera turns the globe, moves
 * in, lets the glass go to frost and the frost go to paper, so it is always
 * the same geography becoming closer.
 *
 * The world is already there; experiences give it colour. Every level shows
 * its whole geography in quiet pencil, and colour only where the user has
 * physically touched. Three states read at a glance, without a legend:
 *
 *   ○      discoverable — there, readable, open to explore, never counted
 *   :)))   touched      — a verified physical visit, and colour around it
 *   :))) + photograph   — remembered: a real moment laid on the drawn map
 *
 * Two gestures, kept apart. A Touch Point (or ○) opens its card. An area —
 * its wash, or its name — is the way into it.
 *
 * It does not know where its places come from: production passes the user's
 * own (today, none) and the dev preview passes its scenarios.
 */
export default function MyWorld({
  snapshot,
  arrivalPlaceId = null,
  path = NO_PATH,
  onEnter = noop,
  onBack = noop,
  discovery = NO_DISCOVERY,
  openPlaceId = null,
}: MyWorldProps) {
  const stageRef = useRef<HTMLDivElement>(null)
  const { width, height } = useElementSize(stageRef)
  const copy = useMessages()
  const { locale } = useLocale()

  const location = useMemo(() => locate(path), [path])
  const levelKey = path.join('/')

  // An arrival belongs to the world scale; opening deeper skips it.
  const [arrivingId] = useState(() => (location.level === 0 ? arrivalPlaceId : null))
  const phase = useArrival(arrivingId)

  const { chosenId, discoveryId, sheetId, setSheetId, chooseTouched, chooseDiscovery, chooseNothing } =
    useWorldSelection(levelKey, openPlaceId)

  // The last local map entered stays drawn while the camera leaves it.
  const [shownArea, setShownArea] = useState<(LocalArea & { map: LocalMapData }) | null>(
    location.level === 2 ? location.area : null,
  )
  if (location.level === 2 && shownArea?.id !== location.area.id) setShownArea(location.area)

  const { places, recentPlaceId } = snapshot
  const isQuiet = places.length === 0

  const belonging = useMemo(
    () =>
      places.map((place) => {
        const country = countryOf(place)
        return { place, country, area: country ? areaOf(country, place) : null }
      }),
    [places],
  )

  // ─── the camera ─────────────────────────────────────────────────────────────

  const worldFrame = useMemo(() => frameWorld(places, width, height), [places, width, height])

  const target = useMemo<View | null>(() => {
    if (width === 0) return null
    if (location.level === 0) return { ...worldFrame, depth: 0 }
    if (location.level === 1) {
      return { ...fitPoints(boundsPoints(location.country.frame), countryBox(width, height)), depth: 1 }
    }
    return { ...fitPoints(location.area.map.coast, localBox(width, height)), depth: 2 }
  }, [location, worldFrame, width, height])

  const { view, moving, flight, startFlying } = useCamera(target, levelKey)
  const layerRef = useRef<HTMLDivElement>(null)
  const ghostRef = useRef<HTMLDivElement>(null)

  useFlightLayer({ flight, startFlying, width, height, stageRef, layerRef, ghostRef })

  // Looking at a country, draw its local maps' detail in idle time, so going
  // down into one never has to stop and generate an island mid-journey.
  useEffect(() => {
    if (location.level !== 1) return
    const idle = window.requestIdleCallback ?? ((run: () => void) => window.setTimeout(run, 400))
    const cancel = window.cancelIdleCallback ?? window.clearTimeout
    const handle = idle(() => {
      for (const area of location.country.areas) if (area.map) warmLocalMap(area.map)
    })
    return () => cancel(handle)
  }, [location])
  const depth = view?.depth ?? location.level

  const globeOpacity = 1 - smoothstep(0.45, 0.9, depth)
  const isGlobeDrawn = view !== null && globeOpacity > 0
  const land = useMemo(
    () => (isGlobeDrawn && view ? landPaths(view, { width, height }) : null),
    [isGlobeDrawn, view, width, height],
  )
  const atmosphere = 1 - smoothstep(0.08, 0.6, depth)
  const countryOpacity = smoothstep(0.35, 0.85, depth) * (1 - smoothstep(1.3, 1.85, depth))
  const paper = smoothstep(1.15, 1.75, depth)
  const ink = smoothstep(1.3, 1.9, depth)
  const isSettled = !moving && view !== null
  const isResolved = location.level === 2 && isSettled

  // ─── what is on screen ──────────────────────────────────────────────────────

  const marks = useMemo(
    () =>
      view === null
        ? []
        : belonging
            .map((entry) => ({ ...entry, at: project(view, entry.place.lng, entry.place.lat) }))
            .filter(({ at }) => at.visible && onScreen(at, width, height)),
    [belonging, view, width, height],
  )

  // The globe's washes are painted on the globe, so they grow as it comes closer.
  const zoom = view ? view.r / worldFrame.r : 1
  const blooms: Bloom[] = marks.map(({ place, at }) => ({
    id: place.id,
    x: at.x,
    y: at.y,
    r: Math.min(150, Math.max(54, worldFrame.r * (places.length === 1 ? 0.3 : 0.24))) * zoom,
    variant: variantOf(place.id),
    open: place.id !== arrivingId || (phase !== 'rest' && phase !== 'mark'),
  }))

  const touchedAreas = useMemo(() => {
    const seen = new Map<string, { country: Country; area: LocalArea }>()
    for (const { country, area } of belonging) {
      if (country && area) seen.set(`${country.id}/${area.id}`, { country, area })
    }
    return [...seen.values()]
  }, [belonging])

  // Areas shown at country scale: every one that has been lived in, and every
  // one with a drawn map, touched or not — those can be discovered.
  const countryAreas = useMemo(() => {
    const touched = new Set(touchedAreas.map(({ area }) => area.id))
    return COUNTRIES.flatMap((country) =>
      country.areas
        .filter((area) => touched.has(area.id) || area.map)
        .map((area) => ({ country, area, touched: touched.has(area.id) })),
    )
  }, [touchedAreas])

  const washes: (AreaWash & { country: Country; area: LocalArea })[] =
    view === null || countryOpacity === 0
      ? []
      : touchedAreas.map(({ country, area }) => {
          const at = project(view, area.reveal.centre.lng, area.reveal.centre.lat)
          return {
            id: area.id,
            country,
            area,
            x: at.x,
            y: at.y,
            r: Math.max(area.reveal.minPx, kmToPx(view, area.reveal.km)),
            variant: variantOf(area.id),
          }
        })

  const areaPlaces = useMemo(
    () =>
      shownArea
        ? belonging.filter(({ area }) => area?.id === shownArea.id).map(({ place }) => place)
        : [],
    [shownArea, belonging],
  )
  const touchedIds = useMemo(() => new Set(areaPlaces.map(({ id }) => id)), [areaPlaces])
  const areaDiscovery = useMemo(() => {
    const country = shownArea ? COUNTRIES.find((c) => c.areas.some((a) => a.id === shownArea.id)) : null
    return country && shownArea
      ? discovery.filter((place) => areaOf(country, place)?.id === shownArea.id)
      : []
  }, [discovery, shownArea])
  const discoverable = useMemo(
    () =>
      view === null || location.level !== 2
        ? []
        : areaDiscovery
            .filter(({ id }) => !touchedIds.has(id))
            .map((place) => ({ place, at: project(view, place.lng, place.lat) }))
            .filter(({ at }) => at.visible && onScreen(at, width, height)),
    [areaDiscovery, touchedIds, view, location.level, width, height],
  )

  const pockets = useMemo<Pocket[]>(
    () =>
      areaPlaces.map((place) => ({
        id: place.id,
        lng: place.lng,
        lat: place.lat,
        variant: variantOf(place.id),
      })),
    [areaPlaces],
  )

  // ─── the card ───────────────────────────────────────────────────────────────

  // An arrival names its place, holds, then lets go; after that, the user chooses.
  const selectedId = chosenId ?? (phase === 'named' ? arrivingId : null)
  const selectedMark = (isSettled && marks.find(({ place }) => place.id === selectedId)) || null

  // The card keeps showing its last place while it fades, rather than emptying.
  const [cardMark, setCardMark] = useState(selectedMark)
  if (selectedMark && selectedMark !== cardMark) setCardMark(selectedMark)

  const openDiscovery = (isResolved && discoverable.find(({ place }) => place.id === discoveryId)?.place) || null
  const [discoveryCard, setDiscoveryCard] = useState(openDiscovery)
  if (openDiscovery && openDiscovery !== discoveryCard) setDiscoveryCard(openDiscovery)

  const visitedSheet = useMemo(() => {
    const place = sheetId ? places.find(({ id }) => id === sheetId) : undefined
    const details = sheetId ? discovery.find(({ id }) => id === sheetId) : undefined
    return place && details ? { place, details } : null
  }, [sheetId, places, discovery])

  // The newest place keeps a quiet name once its card has folded away.
  const arrivalMark = marks.find(({ place }) => place.id === arrivingId) ?? null
  const isLabelShown =
    phase === 'settled' && selectedId !== arrivingId && location.level === 0 && isSettled

  // ─── the ways in ────────────────────────────────────────────────────────────

  const countryLabels = location.level === 0 && view ? countriesOnScreen(marks, view, width, height) : []
  const areCountryLabelsShown =
    isSettled &&
    selectedMark === null &&
    (arrivingId === null || phase === 'settled' || chosenId !== null)

  // Close in, every place carries its name: in ink where lived, in pencil where not.
  const localLabels =
    location.level === 2
      ? [
          ...marks
            .filter(({ area }) => area?.id === shownArea?.id)
            .map(({ place, at }) => ({
              id: place.id,
              name: place.name,
              nameLatin: place.nameLatin ?? null,
              at,
              side: sideFor(areaDiscovery.find((d) => d.id === place.id)?.labelSide, at.x, width),
              touched: true,
            })),
          ...discoverable.map(({ place, at }) => ({
            id: place.id,
            name: place.name,
            nameLatin: place.nameLatin,
            at,
            side: sideFor(place.labelSide, at.x, width),
            touched: false,
          })),
        ]
      : []
  const labelSides = new Map(localLabels.map(({ id, side }) => [id, side]))

  function handleStageClick(event: MouseEvent<HTMLDivElement>) {
    if (selectedMark || openDiscovery) {
      chooseTouched(null)
      return
    }

    const box = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - box.left
    const y = event.clientY - box.top
    const within = (c: { x: number; y: number }, r: number) => Math.hypot(x - c.x, y - c.y) < r

    if (location.level === 0) {
      const bloom = blooms.find((b) => within(b, b.r * 0.8))
      const country = marks.find(({ place }) => place.id === bloom?.id)?.country
      if (country) onEnter([country.id])
    } else if (location.level === 1) {
      const wash = washes.find((w) => w.area.map && within(w, w.r))
      if (wash) onEnter([wash.country.id, wash.area.id])
      else {
        // An untouched area is entered by its name, or a tap close to it.
        const quiet = countryAreas.find(({ area, touched }) => {
          if (touched || !area.map || !view) return false
          return within(project(view, area.reveal.centre.lng, area.reveal.centre.lat), 30)
        })
        if (quiet) onEnter([quiet.country.id, quiet.area.id])
      }
    }

    chooseNothing()
  }

  return (
    <div className="relative h-full overflow-hidden bg-canvas">
      {/* Daylight: a pale sky at the top and the faintest warmth in one corner. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(70%_32%_at_86%_4%,rgba(247,233,189,0.42)_0%,rgba(247,233,189,0)_100%),linear-gradient(to_bottom,rgba(232,241,245,0.9)_0%,rgba(232,241,245,0)_42%)]"
      />

      {/* Everything that is the map — it is what a flight zooms. */}
      <div ref={layerRef} className="absolute inset-0">
        <div
          ref={stageRef}
          data-stage
          role="img"
          aria-label={stageLabel(location, isQuiet, copy)}
          className="absolute inset-0"
          onClick={handleStageClick}
        >
          {view && land && (
            <div className="absolute inset-0" style={{ opacity: globeOpacity }}>
              <WorldGlobe
                moving={moving}
                width={width}
                height={height}
                frame={view}
                land={land}
                blooms={blooms}
                atmosphere={atmosphere}
              />
            </div>
          )}

          {view && countryOpacity > 0 && (
            <CountryMap
              width={width}
              height={height}
              frame={view}
              washes={washes}
              opacity={countryOpacity}
              moving={moving}
            />
          )}

          {view && shownArea && paper > 0 && (
            <LocalMap
              width={width}
              height={height}
              frame={view}
              map={shownArea.map}
              pockets={pockets}
              paper={paper}
              ink={ink}
              resolved={isResolved}
            />
          )}
        </div>

        {marks.map(({ place, at }) => {
          const isArriving = place.id === arrivingId
          const isShown = !isArriving || phase !== 'rest'
          const isSelected = place.id === selectedId && selectedMark !== null

          return (
            <button
              key={place.id}
              type="button"
              aria-pressed={isSelected}
              aria-label={copy.a11y.place(
                place.name,
                place.locality,
                formatCalendarDate(place.firstTouchedOn ?? place.firstTouchedAt, locale),
              )}
              onClick={() => chooseTouched(isSelected ? null : place.id)}
              style={{ left: at.x, top: at.y }}
              className={cn(
                'absolute flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full',
                'transition-[opacity,scale] duration-700 ease-calm outline-none focus-visible:ring-1 focus-visible:ring-graphite/30',
                isShown ? 'scale-100 opacity-100' : 'scale-75 opacity-0',
              )}
            >
              <TouchMark
                recent={place.id === recentPlaceId && (!isArriving || phase === 'settled')}
                selected={isSelected}
                arriving={isArriving && isShown}
                signed={location.level === 2 && depth > 1.9}
              />
            </button>
          )
        })}

        {discoverable.map(({ place, at }) => {
          const isOpen = place.id === discoveryId && openDiscovery !== null
          return (
            <button
              key={place.id}
              type="button"
              aria-pressed={isOpen}
              aria-label={copy.a11y.discoverable(place.name, place.nameLatin)}
              onClick={() => chooseDiscovery(isOpen ? null : place.id)}
              style={{ left: at.x, top: at.y }}
              className={cn(
                'absolute flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full',
                'transition-opacity duration-700 ease-calm outline-none focus-visible:ring-1 focus-visible:ring-graphite/30',
                isResolved ? 'opacity-100 delay-300' : 'pointer-events-none opacity-0',
              )}
            >
              <DiscoveryMark selected={isOpen} />
            </button>
          )
        })}

        {countryLabels.map(({ country, anchor, touched }) => (
          <MapLabel
            key={country.id}
            name={country.name}
            nameLatin={regionSecondName(country, copy)}
            anchor={anchor}
            side="below"
            gap={0}
            shown={areCountryLabelsShown}
            onEnter={() => onEnter([country.id])}
            enterLabel={copy.a11y.enter(country.name, country.nameLatin)}
            delayMs={300}
            tone={touched ? 'lived' : 'quiet'}
          />
        ))}

        {location.level === 1 &&
          view &&
          countryAreas.map(({ country, area, touched }) => {
            const wash = washes.find((w) => w.id === area.id)
            const anchor = wash ?? project(view, area.reveal.centre.lng, area.reveal.centre.lat)
            const gap = wash
              ? area.labelSide === 'below'
                ? wash.r * 0.62
                : wash.r * 0.72
              : 12
            return (
              <MapLabel
                key={area.id}
                name={area.name}
                nameLatin={regionSecondName(area, copy)}
                anchor={anchor}
                side={area.labelSide}
                gap={gap}
                shown={isSettled}
                onEnter={area.map ? () => onEnter([country.id, area.id]) : undefined}
                enterLabel={copy.a11y.enter(area.name, area.nameLatin)}
                delayMs={200}
                tone={touched ? 'lived' : 'quiet'}
              />
            )
          })}

        {localLabels.map((label) => {
          const isOpen =
            (label.touched ? selectedMark?.place.id : openDiscovery?.id) === label.id
          return (
            <MapLabel
              key={label.id}
              name={label.name}
              nameLatin={label.nameLatin}
              anchor={label.at}
              side={label.side}
              // A touched mark wears its ))) to the right; the name stands clear of it.
              gap={label.side === 'below' ? 12 : label.touched && label.side === 'right' ? 30 : 15}
              shown={isResolved && !isOpen}
              delayMs={label.touched ? 1500 : 700}
              tone={label.touched ? 'lived' : 'quiet'}
            />
          )
        })}

        {location.level === 2 &&
          marks
            .filter(({ place, area }) => place.photo && area?.id === shownArea?.id)
            .map(({ place, at }) => (
              <PhotoFragment
                key={place.id}
                photo={place.photo!}
                anchor={at}
                // Rests on the side away from the place's name.
                side={labelSides.get(place.id) === 'left' ? 'right' : 'left'}
                seed={place.id}
                shown={isResolved}
                label={copy.a11y.photo(place.name)}
                onOpen={() => chooseTouched(place.id)}
              />
            ))}

      </div>

      {/* The map as it was, copied at the start of a flight and zoomed away on the GPU. */}
      <div ref={ghostRef} aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden" />

      <WorldHeader location={location} isQuiet={isQuiet} onBack={onBack} />
      <FontPrimer />

      {arrivalMark && (
        <PlaceLabel
          place={arrivalMark.place}
          anchor={arrivalMark.at}
          stageWidth={width}
          shown={isLabelShown}
        />
      )}

      {discoveryCard && (
        <DiscoveryCard
          place={discoveryCard}
          shown={openDiscovery !== null}
          onClose={() => chooseDiscovery(null)}
          others={discovery}
          onOpenOther={(id) => chooseDiscovery(id)}
        />
      )}

      {cardMark && (
        <PlaceCard
          place={cardMark.place}
          anchor={cardMark.at}
          stage={{ width, height }}
          shown={selectedMark !== null && sheetId === null}
          onOpen={
            discovery.some(({ id }) => id === cardMark.place.id) ? () => setSheetId(cardMark.place.id) : undefined
          }
        />
      )}

      {visitedSheet && (
        <DiscoveryCard
          place={visitedSheet.details}
          visitedOn={visitedSheet.place.firstTouchedOn ?? visitedSheet.place.firstTouchedAt.slice(0, 10)}
          shown
          onClose={() => setSheetId(null)}
        />
      )}
    </div>
  )
}

/** Japan whole, clear of the header above and the navigation below. */
function countryBox(width: number, height: number) {
  return { x0: 22, y0: 150, x1: width - 22, y1: height - 118 }
}

/** The island, with room around it. */
function localBox(width: number, height: number) {
  return { x0: 46, y0: 138, x1: width - 46, y1: height - 112 }
}

function onScreen(at: { x: number; y: number }, width: number, height: number): boolean {
  return at.x > -40 && at.x < width + 40 && at.y > -40 && at.y < height + 40
}

/**
 * Each country's name on the globe. A touched country's name is set just below
 * its places, so it reads as the name of the washes around it; a country that
 * can only be discovered yet is named, in pencil, where it lies.
 */
function countriesOnScreen(
  marks: readonly { country: Country | null; at: { x: number; y: number } }[],
  view: View,
  width: number,
  height: number,
): { country: Country; anchor: { x: number; y: number }; touched: boolean }[] {
  const byCountry = new Map<Country, { x: number; y: number }[]>()
  for (const { country, at } of marks) {
    if (country) byCountry.set(country, [...(byCountry.get(country) ?? []), at])
  }

  const touched = [...byCountry].map(([country, points]) => ({
    country,
    touched: true,
    anchor: {
      x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
      y: Math.max(...points.map((p) => p.y)) + 24,
    },
  }))

  const discoverable = COUNTRIES.filter(
    (country) => !byCountry.has(country) && country.areas.some((area) => area.map),
  )
    .map((country) => ({
      country,
      touched: false,
      anchor: project(view, country.labelAt.lng, country.labelAt.lat),
    }))
    .filter(({ anchor }) => anchor.visible && onScreen(anchor, width - 80, height - 80))

  return [...touched, ...discoverable]
}

/** A place's chosen side, or whichever side has room. */
function sideFor(
  preferred: 'left' | 'right' | 'below' | undefined,
  x: number,
  width: number,
): 'left' | 'right' | 'below' {
  if (preferred === 'below') return 'below'
  if (preferred === 'right' && x < width - 120) return 'right'
  if (preferred === 'left' && x > 120) return 'left'
  return x > width * 0.62 ? 'left' : 'right'
}

function stageLabel(location: ReturnType<typeof locate>, isQuiet: boolean, copy: Messages): string {
  if (location.level === 1) {
    return copy.a11y.country(location.country.name, location.country.nameLatin)
  }
  if (location.level === 2) return copy.a11y.localMap(location.area.name, location.area.nameLatin)
  return isQuiet ? copy.a11y.quietWorld : copy.a11y.world
}
