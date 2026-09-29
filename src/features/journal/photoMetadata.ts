/**
 * What a photo says about when and where it was taken — read on the device,
 * only to SUGGEST a date and a nearby place for a past journal entry. The
 * person always confirms or corrects; nothing is decided from metadata.
 *
 * Privacy: this reads the photo file locally. Nothing read here is uploaded:
 * photos are re-encoded through a canvas before upload (memories/api.ts),
 * which keeps only pixels — EXIF, including GPS, never leaves the device.
 * Only the date and place the person chooses are saved.
 *
 * JPEG EXIF only (DateTimeOriginal, GPS latitude / longitude). iPhone photos
 * reach the browser as JPEG in most pickers; HEIC or a photo whose metadata
 * the browser or the person removed simply yields nothing, and the flow
 * continues without a suggestion.
 */

export type PhotoMetadata = {
  /** `YYYY-MM-DD` as the camera recorded it (its own local date). */
  takenOn: string | null
  coords: { lat: number; lng: number } | null
}

const NOTHING: PhotoMetadata = { takenOn: null, coords: null }
/** EXIF lives in the first segments; no need to read the whole image. */
const HEAD_BYTES = 256 * 1024

export async function readPhotoMetadata(file: Blob): Promise<PhotoMetadata> {
  try {
    return parseExif(new DataView(await file.slice(0, HEAD_BYTES).arrayBuffer()))
  } catch {
    return NOTHING // the file could not be read at all
  }
}

/** Parse EXIF out of the start of a JPEG. Never throws: damaged or truncated data yields nothing. Exported for tests. */
export function parseExif(view: DataView): PhotoMetadata {
  try {
    return parseJpeg(view)
  } catch {
    return NOTHING
  }
}

function parseJpeg(view: DataView): PhotoMetadata {
  if (view.byteLength < 4 || view.getUint16(0) !== 0xffd8) return NOTHING
  let offset = 2
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset)
    const length = view.getUint16(offset + 2)
    if ((marker & 0xff00) !== 0xff00 || length < 2) return NOTHING
    // APP1 carrying "Exif\0\0"
    if (marker === 0xffe1 && view.getUint32(offset + 4) === 0x45786966 && view.getUint16(offset + 8) === 0) {
      return parseTiff(view, offset + 10)
    }
    if (marker === 0xffda) return NOTHING // image data begins: no EXIF before it
    offset += 2 + length
  }
  return NOTHING
}

function parseTiff(view: DataView, tiff: number): PhotoMetadata {
  const little = view.getUint16(tiff) === 0x4949
  const u16 = (at: number) => view.getUint16(at, little)
  const u32 = (at: number) => view.getUint32(at, little)
  if (u16(tiff + 2) !== 42) return NOTHING

  /** The tags of one IFD: tag → offset of its 12-byte entry. */
  const ifd = (start: number) => {
    const entries = new Map<number, number>()
    if (start <= 0 || tiff + start + 2 > view.byteLength) return entries
    const count = u16(tiff + start)
    for (let i = 0; i < count; i++) {
      const entry = tiff + start + 2 + i * 12
      if (entry + 12 > view.byteLength) break
      entries.set(u16(entry), entry)
    }
    return entries
  }
  const valueOffset = (entry: number, bytes: number) => (bytes <= 4 ? entry + 8 : tiff + u32(entry + 8))
  const ascii = (entry: number) => {
    const count = u32(entry + 4)
    const at = valueOffset(entry, count)
    let text = ''
    for (let i = 0; i < count && at + i < view.byteLength; i++) {
      const code = view.getUint8(at + i)
      if (code === 0) break
      text += String.fromCharCode(code)
    }
    return text
  }
  const rationals = (entry: number) => {
    const count = u32(entry + 4)
    const at = valueOffset(entry, count * 8)
    const values: number[] = []
    for (let i = 0; i < count && at + i * 8 + 8 <= view.byteLength; i++) {
      const den = u32(at + i * 8 + 4)
      values.push(den === 0 ? 0 : u32(at + i * 8) / den)
    }
    return values
  }

  const root = ifd(u32(tiff + 4))
  let takenOn: string | null = null
  const exifPointer = root.get(0x8769)
  if (exifPointer !== undefined) {
    const exif = ifd(u32(exifPointer + 8))
    const original = exif.get(0x9003) ?? root.get(0x0132)
    const match = original !== undefined ? /^(\d{4}):(\d{2}):(\d{2})/.exec(ascii(original)) : null
    if (match && match[1] !== '0000') takenOn = `${match[1]}-${match[2]}-${match[3]}`
  }

  let coords: PhotoMetadata['coords'] = null
  const gpsPointer = root.get(0x8825)
  if (gpsPointer !== undefined) {
    const gps = ifd(u32(gpsPointer + 8))
    const [latRef, lat, lngRef, lng] = [gps.get(1), gps.get(2), gps.get(3), gps.get(4)]
    if (latRef !== undefined && lat !== undefined && lngRef !== undefined && lng !== undefined) {
      const degrees = ([d = 0, m = 0, s = 0]: number[]) => d + m / 60 + s / 3600
      const la = degrees(rationals(lat)) * (ascii(latRef) === 'S' ? -1 : 1)
      const lo = degrees(rationals(lng)) * (ascii(lngRef) === 'W' ? -1 : 1)
      if (Number.isFinite(la) && Number.isFinite(lo) && Math.abs(la) <= 90 && Math.abs(lo) <= 180 && !(la === 0 && lo === 0)) {
        coords = { lat: la, lng: lo }
      }
    }
  }
  return { takenOn, coords }
}
