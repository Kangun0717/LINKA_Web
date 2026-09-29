// The travel journal: past memories (text-only, with photos, with and without
// EXIF), editing and deleting them, the photo experience — and the guarantee
// that a past memory never becomes verified presence.
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'

import { COMPOSER, imageLoads } from '../lib/app.mjs'
import { launch, visitor } from '../lib/browser.mjs'
import { POINTS, USERS } from '../lib/config.mjs'
import { sql } from '../lib/db.mjs'
import { leftoverMetadata, NO_EXIF, withExif } from '../lib/photos.mjs'
import { seedWalkerJourney } from '../lib/seed.mjs'
import { startStack } from '../lib/stack.mjs'

let stack, browser, walker
before(async () => {
  stack = await startStack()
  browser = await launch()
  seedWalkerJourney() // two verified places (トキの森公園, 佐渡金山), one memory
  walker = await visitor(browser, { email: USERS.walker.email })
})
after(async () => {
  await browser?.close()
  await stack?.stop()
})

const verifiedState = () =>
  sql(`select (select count(*) from visits) || '/' || (select count(*) from touch_events) || '/' ||
              (select count(distinct place_id) from visits where user_id = '${USERS.walker.id}') || '/' ||
              coalesce(place_visitors_today((select id from places where slug = 'shukunegi')), 0)`)

/** Degrees → [deg, min, sec] for EXIF. */
const dms = (value) => {
  const deg = Math.floor(value)
  const minutes = (value - deg) * 60
  const min = Math.floor(minutes)
  return [deg, min, (minutes - min) * 60]
}

let before4c
test('text-only past memory: own words, a year, a mood — saved as a journal entry, never a visit', async () => {
  before4c = verifiedState()
  await walker.go('/moments')
  await walker.page.getByRole('link', { name: 'Add a memory' }).click()
  await walker.page.waitForURL(/\/moments\/new$/)
  await walker.page.getByLabel('Somewhere else').fill('京都・哲学の道')
  await walker.page.getByRole('button', { name: 'Year' }).click()
  await walker.page.getByLabel('When').fill('2018')
  await walker.page.getByRole('radio', { name: /Joyful/ }).click()
  await walker.page.getByLabel('What do you remember?').fill('Cherry blossom on the canal.')
  await walker.page.getByRole('button', { name: 'Save to my journal' }).click()
  await walker.page.waitForURL(/\/moments\/[0-9a-f-]{36}$/, { timeout: 20000 })
  await walker.page.getByRole('heading', { name: '京都・哲学の道' }).waitFor()
  await walker.page.getByText('Cherry blossom on the canal.').waitFor()
  assert.equal(
    sql(`select kind || '|' || coalesce(visit_id::text, 'no visit') || '|' || coalesce(place_id::text, 'no place') || '|' || place_label || '|' || remembered_on || '|' || date_precision || '|' || mood
         from memories where note = 'Cherry blossom on the canal.'`),
    'past|no visit|no place|京都・哲学の道|2018-01-01|year|joyful',
  )
  assert.equal(verifiedState(), before4c, 'no visit, no touch, no verified place, no visitor')
})

let pastId
test('photo past memory: EXIF read on the device suggests 宿根木 and a date — the person accepts; photos upload stripped, with thumbnails', async () => {
  const [lat, lng] = sql(`select latitude || '|' || longitude from places where slug = 'shukunegi'`).split('|').map(Number)
  const gps = withExif('shukunegi-2019.jpg', '2019:08:12 16:20:05', dms(lat), dms(lng + 0.004))
  await walker.go('/moments/new')
  await walker.page.locator('input[type=file][multiple]').first().setInputFiles([gps, NO_EXIF])
  await walker.page.getByText('Based on this photo').waitFor({ timeout: 15000 })
  await walker.page.getByText('Taken 12 Aug 2019').waitFor()
  await walker.page.getByText(/Near 宿根木/).waitFor()
  // Nothing is decided until the person says so.
  assert.equal(await walker.page.getByText('Chosen').count(), 0)
  await walker.page.getByRole('button', { name: 'Use this' }).click()
  await walker.page.getByText('Chosen').waitFor()
  assert.equal(await walker.page.getByLabel('When').inputValue(), '2019-08-12')
  await walker.page.getByLabel('What do you remember?').fill('Summer 2019, before LINKA.')
  await walker.page.getByRole('button', { name: 'Save to my journal' }).click()
  await walker.page.waitForURL(/\/moments\/[0-9a-f-]{36}$/, { timeout: 30000 })
  pastId = walker.page.url().split('/').at(-1)

  const row = sql(`select kind || '|' || coalesce(visit_id::text, 'no visit') || '|' || (place_id = (select id from places where slug = 'shukunegi')) || '|' || remembered_on || '|' || date_precision
                   from memories where id = '${pastId}'`)
  assert.equal(row, 'past|no visit|true|2019-08-12|day')
  const photos = sql(`select storage_path || '|' || (id = (select cover_photo_id from memories where id = '${pastId}')) from memory_photos where memory_id = '${pastId}' order by position`).split('\n')
  assert.equal(photos.length, 2, 'both photos')
  const [firstPath, isCover] = photos[0].split('|')
  assert.equal(isCover, 'true', 'the first photo is the cover')
  for (const line of photos) {
    const path = line.split('|')[0]
    assert.ok(path.startsWith(`${USERS.walker.id}/${pastId}/`))
    assert.deepEqual(await leftoverMetadata(stack.storedBytes(path)), { takenOn: null, coords: null, originalTimestamp: false }, 'no date or GPS uploaded')
    assert.ok(stack.storedPaths().includes(path.replace(/\.jpg$/, '.thumb.jpg')), 'a thumbnail next to it')
  }
  assert.ok(firstPath)
  assert.equal(verifiedState(), before4c, 'a photo\'s position verifies nothing')
})

test('no EXIF: says so, and the person chooses place and date themselves', async () => {
  await walker.go('/moments/new')
  await walker.page.locator('input[type=file][multiple]').first().setInputFiles(NO_EXIF)
  await walker.page.getByText('This photo carries no date or location — choose them below.').waitFor({ timeout: 15000 })
  assert.equal(await walker.page.getByText('Based on this photo').count(), 0)
  await walker.page.getByLabel('Search LINKA places').fill('大野')
  await walker.page.getByRole('button', { name: '大野亀' }).click()
  await walker.page.getByRole('button', { name: 'Month' }).click()
  await walker.page.getByLabel('When').fill('2020-05')
  await walker.page.getByRole('button', { name: 'Save to my journal' }).click()
  await walker.page.waitForURL(/\/moments\/[0-9a-f-]{36}$/, { timeout: 30000 })
  assert.equal(sql(`select remembered_on || '|' || date_precision from memories where place_id = (select id from places where slug = 'onogame') and kind = 'past'`), '2020-05-01|month')
})

test('Moments: both kinds, each with its own mark; the photo shows as a thumbnail; the detail opens the full photo', async () => {
  await walker.go('/moments')
  await walker.page.getByText('Summer 2019, before LINKA.').waitFor({ timeout: 20000 })
  await walker.page.getByText('A quiet morning with the ibis.').waitFor()
  assert.ok((await walker.page.getByText('From my journal').count()) >= 3)
  assert.ok((await walker.page.getByText('Touched with LINKA').count()) >= 2)
  const thumb = walker.page.locator(`a[href="/moments/${pastId}"] img`).first()
  assert.ok(await imageLoads(thumb), 'the cover thumbnail loads')
  assert.ok((await thumb.getAttribute('src')).includes('.thumb.jpg'), 'a thumbnail, not the full photo')

  await walker.page.locator(`a[href="/moments/${pastId}"]`).click()
  await walker.page.getByRole('heading', { name: '宿根木' }).waitFor()
  await walker.page.getByText('Your own record of this journey.', { exact: false }).waitFor()
  assert.equal(await walker.page.locator('ol li button[aria-label^="Your photo at"]').count(), 2, 'two photos in the grid')
  await walker.page.locator('ol li button[aria-label^="Your photo at"]').first().click()
  await walker.page.getByRole('dialog').waitFor()
  await walker.page.getByText('Photo 1 of 2').waitFor()
  await walker.page.getByRole('button', { name: '›' }).click()
  await walker.page.getByText('Photo 2 of 2').waitFor()
  await walker.page.keyboard.press('Escape')
  await walker.page.getByRole('dialog').waitFor({ state: 'detached' })
})

test('edit a past memory; make the second photo the cover', async () => {
  await walker.go(`/moments/${pastId}`)
  await walker.page.getByRole('button', { name: 'Edit', exact: true }).click()
  await walker.page.getByRole('button', { name: 'Make cover' }).click()
  await walker.page.waitForLoadState('networkidle')
  const second = sql(`select id from memory_photos where memory_id = '${pastId}' order by position desc limit 1`)
  assert.equal(sql(`select cover_photo_id from memories where id = '${pastId}'`), second)

  await walker.page.getByRole('link', { name: 'Edit', exact: true }).click()
  await walker.page.waitForURL(/\/edit$/)
  await walker.page.getByLabel('What do you remember?').fill('Summer 2019. The lanes were narrow and cool.')
  await walker.page.getByRole('button', { name: 'Save to my journal' }).click()
  await walker.page.waitForURL(new RegExp(`/moments/${pastId}$`))
  await walker.page.getByText('Summer 2019. The lanes were narrow and cool.').waitFor()
  assert.equal(sql(`select kind || '|' || coalesce(visit_id::text, 'no visit') from memories where id = '${pastId}'`), 'past|no visit', 'still a journal entry')
})

test('My World: the memory is a taped pin beside 宿根木, which stays unvisited; the layers show one or the other', async () => {
  await walker.go('/home?at=jp/sado')
  await walker.page.waitForSelector('[aria-label^="佐渡,"]', { timeout: 30000 })
  const pin = walker.page.getByRole('button', { name: /^Journal memory: 宿根木/ })
  await pin.waitFor({ timeout: 20000 })
  await walker.page.getByRole('button', { name: /^宿根木, .*not visited yet/ }).waitFor()
  assert.equal(await walker.page.getByRole('button', { name: /^宿根木, .*touched/ }).count(), 0, 'no :))) mark for a journal entry')

  await walker.page.getByRole('radio', { name: /LINKA/ }).click()
  await walker.page.waitForFunction(() => !document.querySelector('[aria-label^="Journal memory"]'))
  await walker.page.getByRole('radio', { name: 'Memories' }).click()
  await pin.waitFor()
  assert.equal(await walker.page.getByRole('button', { name: /^トキの森公園, .*touched/ }).count(), 0, 'Memories shows the journal only')
  await walker.page.getByRole('radio', { name: 'All' }).click()
  await walker.page.getByRole('button', { name: /^トキの森公園, .*touched/ }).waitFor()
  await pin.click()
  await walker.page.waitForURL(/\/moments\/[0-9a-f-]{36}$/)

  // Verified numbers are what they were: places, regions, progress.
  await walker.go('/me')
  await walker.page.waitForFunction(() => document.querySelector('dl dd')?.textContent === '2', null, { timeout: 15000 })
  await walker.go('/place/shukunegi')
  await walker.page.getByRole('heading', { name: 'Your journal' }).waitFor({ timeout: 15000 })
  assert.equal(await walker.page.getByText(/You touched here/).count(), 0, 'a journal entry is not a visit')
  await walker.page.getByText('1 memory in your journal').waitFor()
  assert.equal(verifiedState(), before4c)
})

test('delete a past memory: the entry, its photos and thumbnails are gone', async () => {
  const paths = sql(`select storage_path from memory_photos where memory_id = '${pastId}'`).split('\n')
  await walker.go(`/moments/${pastId}`)
  await walker.page.getByRole('button', { name: 'Delete this memory' }).click()
  await walker.page.getByText('Delete this memory and its photos? This cannot be undone.').waitFor()
  await walker.page.getByRole('button', { name: 'Delete this memory' }).click()
  await walker.page.waitForURL(/\/moments$/, { timeout: 15000 })
  assert.equal(sql(`select count(*) from memories where id = '${pastId}'`), '0')
  for (const path of paths) {
    assert.ok(!stack.storedPaths().includes(path), 'photo removed')
    assert.ok(!stack.storedPaths().includes(path.replace(/\.jpg$/, '.thumb.jpg')), 'thumbnail removed')
  }
})

test('a verified visit stays verified: its page, its stamp, its memory form', async () => {
  const visit = sql(`select id from visits where user_id = '${USERS.walker.id}' and place_id = (select id from places where slug = 'toki-no-mori')`)
  await walker.go(`/moments/${visit}`)
  await walker.page.getByText(COMPOSER).waitFor({ timeout: 20000 })
  await walker.page.getByText('You were here — recorded by a LINKA Touch Point.', { exact: false }).waitFor()
  assert.equal(await walker.page.getByRole('button', { name: 'Delete this memory' }).count(), 0, 'a visit\'s memory is not deleted from here')
  assert.equal(await walker.page.locator('#memory-note').inputValue(), 'A quiet morning with the ibis.')
  assert.ok(POINTS.gate)
})

test('no page or console errors for the traveller', () => {
  assert.deepEqual(walker.errors, [])
  assert.deepEqual(walker.consoleErrors, [])
})
