/**
 * DEV PREVIEW ONLY — a sample "phone photo" with EXIF, so the Add Memory
 * prototype can show metadata suggestions without anyone's real photo: a
 * licensed place hero (metadata stripped) with a small EXIF block spliced
 * in — taken 12 Aug 2019, near 宿根木. Built in the browser; never uploaded.
 */
export async function samplePhotoWithMetadata(): Promise<File> {
  const jpeg = new Uint8Array(await (await fetch('/places/shukunegi-800.jpg')).arrayBuffer())
  const app1 = exifSegment('2019:08:12 16:20:05', [37, 48, 38.1], [138, 14, 9.7])
  const bytes = new Uint8Array(jpeg.length + app1.length)
  bytes.set(jpeg.subarray(0, 2), 0) // SOI
  bytes.set(app1, 2)
  bytes.set(jpeg.subarray(2), 2 + app1.length)
  return new File([bytes], 'IMG_2019_0812.jpg', { type: 'image/jpeg' })
}

function exifSegment(date: string, lat: number[], lng: number[]): Uint8Array {
  const tiff: number[] = []
  const u16 = (v: number) => [v >> 8, v & 255]
  const u32 = (v: number) => [v >>> 24, (v >> 16) & 255, (v >> 8) & 255, v & 255]
  const entry = (tag: number, type: number, count: number, value: number[]) => [...u16(tag), ...u16(type), ...u32(count), ...value]
  const rational = (parts: number[]) => parts.flatMap((p) => [...u32(Math.round(p * 1000)), ...u32(1000)])
  const DATA = 120
  const dateBytes = [...new TextEncoder().encode(date), 0]
  const data = [...dateBytes]
  const latAt = DATA + data.length
  data.push(...rational(lat))
  const lngAt = DATA + data.length
  data.push(...rational(lng))
  const ref = (c: string) => [c.charCodeAt(0), 0, 0, 0]
  tiff.push(0x4d, 0x4d, ...u16(42), ...u32(8))
  tiff.push(...u16(2), ...entry(0x8769, 4, 1, u32(40)), ...entry(0x8825, 4, 1, u32(62)), ...u32(0))
  while (tiff.length < 40) tiff.push(0)
  tiff.push(...u16(1), ...entry(0x9003, 2, dateBytes.length, u32(DATA)), ...u32(0))
  while (tiff.length < 62) tiff.push(0)
  tiff.push(...u16(4), ...entry(1, 2, 2, ref('N')), ...entry(2, 5, 3, u32(latAt)), ...entry(3, 2, 2, ref('E')), ...entry(4, 5, 3, u32(lngAt)), ...u32(0))
  while (tiff.length < DATA) tiff.push(0)
  tiff.push(...data)
  const body = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff]
  return new Uint8Array([0xff, 0xe1, (body.length + 2) >> 8, (body.length + 2) & 255, ...body])
}
