/**
 * Photos from the phone, made ready to keep — shared by memories and
 * Community suggestions.
 *
 * Drawing through a canvas keeps only the pixels: EXIF, including GPS
 * location, does not survive, so nothing uploaded carries where or when it
 * was taken. Browsers apply the EXIF orientation when decoding
 * (`image-orientation: from-image`), so what is drawn is already upright.
 */

const MAX_EDGE = 2048
/** Lists, grids and map pins show this; the full photo opens on demand. */
export const THUMB_EDGE = 480

/** Load a picked file into an <img>, the way Safari handles most reliably. */
async function loadImage(file: Blob): Promise<{ image: HTMLImageElement; revoke: () => void }> {
  const url = URL.createObjectURL(file)
  const image = new Image()
  image.decoding = 'async'
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve()
      image.onerror = () => reject(new Error('This photo could not be read.'))
      image.src = url
    })
    return { image, revoke: () => URL.revokeObjectURL(url) }
  } catch (error) {
    URL.revokeObjectURL(url)
    throw error
  }
}

async function encode(image: HTMLImageElement, maxEdge: number, quality: number): Promise<{ blob: Blob; width: number; height: number } | null> {
  const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight))
  const width = Math.max(1, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) return null
  context.drawImage(image, 0, 0, width, height)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
  // Give the canvas memory back at once; iOS keeps a tight budget for canvases.
  canvas.width = 0
  canvas.height = 0
  return blob ? { blob, width, height } : null
}

export type PreparedPhoto = { blob: Blob; width: number; height: number; thumb: Blob | null }

/**
 * Upright, at most 2048 px on its long edge, re-encoded as JPEG — and a
 * 480 px thumbnail. iPhone photos arrive as JPEG (Safari converts HEIC for
 * uploads) or as HEIC, which Safari can decode. If the full-size encode fails
 * under iOS memory limits it tries again smaller rather than giving up; a
 * thumbnail that cannot be made is simply left out.
 */
export async function preparePhoto(file: Blob): Promise<PreparedPhoto> {
  const { image, revoke } = await loadImage(file)
  try {
    for (const edge of [MAX_EDGE, 1600, 1024]) {
      const result = await encode(image, edge, 0.85)
      if (result) {
        const thumb = await encode(image, THUMB_EDGE, 0.8).catch(() => null)
        return { ...result, thumb: thumb?.blob ?? null }
      }
    }
    throw new Error('This photo could not be prepared.')
  } finally {
    revoke()
  }
}

/** Where a photo's thumbnail is kept, next to it (older photos have none). */
export function thumbPathOf(path: string): string {
  return path.replace(/\.jpg$/, '.thumb.jpg')
}

/**
 * A random file name. `crypto.randomUUID` is missing on plain-HTTP pages
 * (such as a phone opening the dev server on the LAN), so it is built from
 * `getRandomValues`, which works everywhere.
 */
export function randomName(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}
