/**
 * The pen.
 *
 * One zero-size SVG carrying the filters the whole entrance draws through.
 * `filter: url(#...)` resolves against the document, not the owning SVG, so
 * defining these once here keeps every layer's contours consistent — and means
 * adjusting the hand-drawn wobble is a one-line change rather than a sweep.
 */
export default function InkDefs() {
  return (
    <svg aria-hidden className="pointer-events-none absolute size-0" focusable="false">
      <defs>
        {/*
          Low-frequency noise nudging each path off true by about a pixel. This
          is what separates a drawn line from a rendered one: the deviation has
          to wander along the stroke, never repeat, and never be large enough to
          notice as an effect.
        */}
        <filter id="linka-pen" x="-6%" y="-6%" width="112%" height="112%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.014"
            numOctaves="2"
            seed="11"
            result="linka-pen-noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="linka-pen-noise"
            scale="2.6"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* A second seed, so two layers of the same drawing never wobble alike. */}
        <filter id="linka-pen-alt" x="-6%" y="-6%" width="112%" height="112%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.019"
            numOctaves="2"
            seed="29"
            result="linka-pen-alt-noise"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="linka-pen-alt-noise"
            scale="2.1"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>

        {/* Daylight shadow: soft, warm and short. Never a drop-shadow preset. */}
        <filter id="linka-soft-shadow" x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>
    </svg>
  )
}
