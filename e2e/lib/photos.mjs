// Test photos. The fixtures in the repository carry no EXIF (their metadata
// was stripped); `withExif` splices a small EXIF block into one — a date and
// a GPS position — so the "suggest from the photo" flow can be tested
// without anyone's real photo.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

import { CACHE, ROOT } from './config.mjs'

export const NO_EXIF = join(ROOT, 'public/places/onogame-800.jpg')

/** A JPEG taken `date` ('YYYY:MM:DD HH:MM:SS') at `lat`/`lng` ([deg, min, sec], N/E), written to a file. */
export function withExif(name, date, lat, lng, base = join(ROOT, 'public/places/shukunegi-800.jpg')) {
  const jpeg = readFileSync(base)
  const app1 = exifSegment(date, lat, lng)
  const bytes = Buffer.concat([jpeg.subarray(0, 2), app1, jpeg.subarray(2)])
  mkdirSync(join(CACHE, 'photos'), { recursive: true })
  const file = join(CACHE, 'photos', name)
  writeFileSync(file, bytes)
  return file
}

function exifSegment(date, lat, lng) {
  const tiff = []
  const u16 = (v) => [v >> 8, v & 255]
  const u32 = (v) => [v >>> 24, (v >> 16) & 255, (v >> 8) & 255, v & 255]
  const entry = (tag, type, count, value) => [...u16(tag), ...u16(type), ...u32(count), ...value]
  const rational = (parts) => parts.flatMap((p) => [...u32(Math.round(p * 1000)), ...u32(1000)])
  const DATA = 120
  const dateBytes = [...Buffer.from(date, 'ascii'), 0]
  const data = [...dateBytes]
  const latAt = DATA + data.length
  data.push(...rational(lat))
  const lngAt = DATA + data.length
  data.push(...rational(lng))
  const ref = (c) => [c.charCodeAt(0), 0, 0, 0]
  tiff.push(0x4d, 0x4d, ...u16(42), ...u32(8))
  tiff.push(...u16(2), ...entry(0x8769, 4, 1, u32(40)), ...entry(0x8825, 4, 1, u32(62)), ...u32(0))
  while (tiff.length < 40) tiff.push(0)
  tiff.push(...u16(1), ...entry(0x9003, 2, dateBytes.length, u32(DATA)), ...u32(0))
  while (tiff.length < 62) tiff.push(0)
  tiff.push(...u16(4), ...entry(1, 2, 2, ref('N')), ...entry(2, 5, 3, u32(latAt)), ...entry(3, 2, 2, ref('E')), ...entry(4, 5, 3, u32(lngAt)), ...u32(0))
  while (tiff.length < DATA) tiff.push(0)
  tiff.push(...data)
  const body = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff]
  return Buffer.from([0xff, 0xe1, (body.length + 2) >> 8, (body.length + 2) & 255, ...body])
}

/**
 * What a stored photo still says about when and where it was taken — nothing,
 * after the app's re-encode. (WebKit's encoder writes a tiny EXIF block of its
 * own — colour space and pixel size — so "no EXIF segment" is not the test;
 * "no date, no position, no original timestamp" is.)
 */
export async function leftoverMetadata(bytes) {
  const { parseExif } = await import('../../src/features/journal/photoMetadata.ts')
  const meta = parseExif(new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength))
  return { takenOn: meta.takenOn, coords: meta.coords, originalTimestamp: bytes.includes(Buffer.from('2019:08:12')) || bytes.includes(Buffer.from('2025:05:10')) }
}
