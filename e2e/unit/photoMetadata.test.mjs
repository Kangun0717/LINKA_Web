// Unit tests for src/features/journal/photoMetadata.ts (Node runs the .ts
// directly: it has no imports). JPEGs are built byte by byte here, so the
// tests need no fixture files. Run: node --test e2e/unit/
import assert from 'node:assert/strict'
import { test } from 'node:test'

import { parseExif } from '../../src/features/journal/photoMetadata.ts'

/** A minimal JPEG: SOI, APP1(Exif) with IFD0 → ExifIFD (DateTimeOriginal) and GPS IFD, then SOS. */
function jpeg({ little = false, date = '2019:08:12 16:20:05', lat = [37, 48, 38.1], latRef = 'N', lng = [138, 14, 9.7], lngRef = 'E', gps = true, exifDate = true } = {}) {
  const tiff = []
  const u16 = (v) => (little ? [v & 255, v >> 8] : [v >> 8, v & 255])
  const u32 = (v) => (little ? [v & 255, (v >> 8) & 255, (v >> 16) & 255, v >>> 24] : [v >>> 24, (v >> 16) & 255, (v >> 8) & 255, v & 255])
  const entry = (tag, type, count, value) => [...u16(tag), ...u16(type), ...u32(count), ...value]
  // Layout (offsets from TIFF start): header 8 | IFD0 @8 | ExifIFD @40 | GPS IFD @62 | data @120
  const DATA = 120
  const dateBytes = [...Buffer.from(date), 0]
  const rational = (parts) => parts.flatMap((p) => [...u32(Math.round(p * 1000)), ...u32(1000)])
  const data = [...dateBytes] // @120 (20 bytes)
  const latAt = DATA + data.length
  data.push(...rational(lat))
  const lngAt = DATA + data.length
  data.push(...rational(lng))

  tiff.push(...(little ? [0x49, 0x49] : [0x4d, 0x4d]), ...u16(42), ...u32(8))
  // IFD0: 2 entries → ExifIFD pointer, GPS pointer
  tiff.push(...u16(2), ...entry(0x8769, 4, 1, u32(40)), ...entry(0x8825, 4, 1, u32(gps ? 62 : 0)), ...u32(0))
  while (tiff.length < 40) tiff.push(0)
  // ExifIFD: DateTimeOriginal
  tiff.push(...u16(1), ...entry(exifDate ? 0x9003 : 0x9999, 2, dateBytes.length, u32(DATA)), ...u32(0))
  while (tiff.length < 62) tiff.push(0)
  // GPS IFD: refs are 2-byte ASCII stored inline
  const ref = (c) => [c.charCodeAt(0), 0, 0, 0]
  tiff.push(...u16(4), ...entry(1, 2, 2, ref(latRef)), ...entry(2, 5, 3, u32(latAt)), ...entry(3, 2, 2, ref(lngRef)), ...entry(4, 5, 3, u32(lngAt)), ...u32(0))
  while (tiff.length < DATA) tiff.push(0)
  tiff.push(...data)

  const app1 = [...Buffer.from('Exif'), 0, 0, ...tiff]
  const bytes = [0xff, 0xd8, 0xff, 0xe1, (app1.length + 2) >> 8, (app1.length + 2) & 255, ...app1, 0xff, 0xda, 0, 2]
  return new DataView(new Uint8Array(bytes).buffer)
}

test('reads the capture date and GPS position (big-endian)', () => {
  const meta = parseExif(jpeg())
  assert.equal(meta.takenOn, '2019-08-12')
  assert.ok(Math.abs(meta.coords.lat - 37.81058) < 1e-4 && Math.abs(meta.coords.lng - 138.23603) < 1e-4, JSON.stringify(meta))
})

test('reads little-endian (Intel) EXIF the same way', () => {
  assert.deepEqual(parseExif(jpeg({ little: true })), parseExif(jpeg()))
})

test('southern and western references are negative', () => {
  const meta = parseExif(jpeg({ latRef: 'S', lngRef: 'W' }))
  assert.ok(meta.coords.lat < 0 && meta.coords.lng < 0)
})

test('no GPS → no coordinates, the date still read', () => {
  const meta = parseExif(jpeg({ gps: false }))
  assert.equal(meta.coords, null)
  assert.equal(meta.takenOn, '2019-08-12')
})

test('no date → null; a zeroed date → null', () => {
  assert.equal(parseExif(jpeg({ exifDate: false })).takenOn, null)
  assert.equal(parseExif(jpeg({ date: '0000:00:00 00:00:00' })).takenOn, null)
})

test('a 0,0 position is treated as missing', () => {
  assert.equal(parseExif(jpeg({ lat: [0, 0, 0], lng: [0, 0, 0] })).coords, null)
})

test('not a JPEG, a JPEG without EXIF, truncated data: nothing, never an error', () => {
  const empty = { takenOn: null, coords: null }
  assert.deepEqual(parseExif(new DataView(new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer)), empty)
  assert.deepEqual(parseExif(new DataView(new Uint8Array([0xff, 0xd8, 0xff, 0xda, 0, 2]).buffer)), empty)
  const whole = new Uint8Array(jpeg().buffer)
  for (const cut of [3, 10, 30, 80, 150]) {
    assert.doesNotThrow(() => parseExif(new DataView(whole.slice(0, cut).buffer)))
  }
})
