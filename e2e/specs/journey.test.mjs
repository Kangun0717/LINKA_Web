// Touch Point → (sign-in) → record_touch() → Visit → Memory (mood · note · photo) → Moments → Me
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'

import { COMPOSER, countsFor, imageLoads, noteValue, placeId, saveMemory, touch } from '../lib/app.mjs'
import { launch, visitor } from '../lib/browser.mjs'
import { PASSWORD, PHOTO, POINTS, USERS } from '../lib/config.mjs'
import { sql } from '../lib/db.mjs'
import { touchAs } from '../lib/seed.mjs'
import { startStack } from '../lib/stack.mjs'

let stack, browser, walker, first
before(async () => {
  stack = await startStack()
  browser = await launch()
  walker = await visitor(browser, { email: USERS.walker.email })
})
after(async () => {
  await browser?.close()
  await stack?.stop()
})

test('new visit: record_touch returns a visit, the memory is saved on it', async () => {
  first = await touch(walker, POINTS.gate)
  assert.ok(first?.visit_id && first.duplicate === false, 'record_touch returned a new visit')
  assert.equal(await noteValue(walker.page), '')
  await walker.page.getByRole('radio', { name: /Soothed/ }).click()
  await walker.page.locator('#memory-note').fill('First visit note')
  await saveMemory(walker.page)
  const row = sql(`select visit_id || '|' || coalesce(touch_event_id::text, 'null') || '|' || mood || '|' || note || '|' ||
                   (place_id = (select place_id from visits where id = memories.visit_id)) from memories where user_id = '${USERS.walker.id}'`)
  assert.equal(row, `${first.visit_id}|null|calm|First visit note|true`)
  assert.equal(walker.inserts.at(-1).visit_id, first.visit_id, 'the insert carried the visit from record_touch')
  assert.ok(!('touch_event_id' in walker.inserts.at(-1)), 'no touch_event_id is written')
  assert.equal(sql(`select visit_id from touch_events where id = '${first.touch_event_id}'`), first.visit_id)
})

test('duplicate touch within 10 minutes: same touch, same visit, same memory', async () => {
  const again = await touch(walker, POINTS.gate)
  assert.equal(again.duplicate, true)
  assert.equal(again.visit_id, first.visit_id)
  assert.equal(again.touch_event_id, first.touch_event_id)
  assert.equal(await noteValue(walker.page), 'First visit note')
  assert.equal(countsFor(USERS.walker.id), '1/1/1')
})

test('another Touch Point, same place and day: new touch, same visit, the memory is edited', async () => {
  const plaza = await touch(walker, POINTS.plaza)
  assert.equal(plaza.duplicate, false)
  assert.equal(plaza.visit_id, first.visit_id)
  assert.notEqual(plaza.touch_event_id, first.touch_event_id)
  assert.equal(await noteValue(walker.page), 'First visit note')
  await walker.page.locator('#memory-note').fill('Edited at the plaza')
  const inserts = walker.inserts.length
  await saveMemory(walker.page)
  assert.equal(walker.inserts.length, inserts, 'saved as an update, not an insert')
  assert.equal(countsFor(USERS.walker.id), '2/1/1')
  assert.equal(sql(`select note || '|' || mood from memories where visit_id = '${first.visit_id}'`), 'Edited at the plaza|calm')
})

test('photo: uploaded into the owner\'s folder, attached to the visit\'s memory, made the cover', async () => {
  await walker.page.locator('input[type=file]').setInputFiles(PHOTO)
  await walker.page.getByRole('button', { name: 'Your photo at トキの森公園' }).first().waitFor({ timeout: 20000 })
  const memory = sql(`select id from memories where visit_id = '${first.visit_id}'`)
  const [path, cover, photo] = sql(`select storage_path || '|' || (select cover_photo_id from memories where id = '${memory}') || '|' || id
                                    from memory_photos where memory_id = '${memory}'`).split('|')
  assert.ok(path.startsWith(`${USERS.walker.id}/${memory}/`))
  assert.equal(cover, photo)
  assert.ok(stack.storedPaths().includes(path))
  // …and it can be read back through a signed URL.
  assert.ok(await imageLoads(walker.page.locator('button[aria-label^="Your photo at"] img').first()), 'the uploaded photo displays')
})

test('stale form (the memory never loaded): a photo-only save neither duplicates nor blanks the memory', async () => {
  let hidden = 0
  const list = /\/rest\/v1\/memories\?.*order=created_at/
  await walker.page.route(list, (route) =>
    route.request().method() === 'GET' && hidden++ === 0
      ? route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
      : route.continue())
  await touch(walker, POINTS.gate)
  assert.equal(await noteValue(walker.page), '', 'the form looks empty')
  await walker.page.locator('input[type=file]').setInputFiles(PHOTO)
  await walker.page.waitForFunction(() => document.querySelectorAll('button[aria-label^="Your photo at"]').length >= 2, null, { timeout: 20000 })
  await walker.page.unroute(list)
  assert.equal(sql(`select count(*) from memories where user_id = '${USERS.walker.id}'`), '1')
  assert.equal(sql(`select note || '|' || mood || '|' || (select count(*) from memory_photos where memory_id = memories.id)
                    from memories where visit_id = '${first.visit_id}'`), 'Edited at the plaza|calm|2')
  await walker.page.waitForFunction(() => document.querySelector('#memory-note')?.value === 'Edited at the plaza', null, { timeout: 5000 })
})

test('existing visit without a memory: exactly one memory, however often it is saved', async () => {
  touchAs(USERS.walker, POINTS.kinzan)
  sql(`update touch_events set touched_at = touched_at - interval '11 minutes'
       where user_id = '${USERS.walker.id}' and place_id = '${placeId('sado-kinzan')}'`)
  const visit = sql(`select id from visits where user_id = '${USERS.walker.id}' and place_id = '${placeId('sado-kinzan')}'`)
  const later = await touch(walker, POINTS.kinzan)
  assert.equal(later.visit_id, visit)
  assert.equal(later.duplicate, false)
  await walker.page.locator('#memory-note').fill('Kinzan, first memory')
  await saveMemory(walker.page)
  await walker.page.getByRole('button', { name: 'Save memory' }).click()
  await walker.page.waitForLoadState('networkidle')
  assert.equal(sql(`select count(*) from memories where visit_id = '${visit}'`), '1')
})

test('same place on another local date: a new visit and a new memory', async () => {
  const toki = placeId('toki-no-mori')
  sql(`update touch_events set touched_at = touched_at - interval '1 day', local_date = local_date - 1 where user_id = '${USERS.walker.id}' and place_id = '${toki}';
       update visits set first_touched_at = first_touched_at - interval '1 day', last_touched_at = last_touched_at - interval '1 day', local_date = local_date - 1 where id = '${first.visit_id}'`)
  const next = await touch(walker, POINTS.gate)
  assert.notEqual(next.visit_id, first.visit_id)
  assert.equal(await noteValue(walker.page), '')
  await walker.page.locator('#memory-note').fill('Back the next day')
  await saveMemory(walker.page)
  assert.equal(sql(`select count(*) || '/' || count(distinct visit_id) from memories where user_id = '${USERS.walker.id}' and place_id = '${toki}'`), '2/2')
})

test('Moments: one per visit; Me: places, not touches', async () => {
  await walker.go('/moments')
  await walker.page.getByText('Back the next day').waitFor({ timeout: 15000 })
  const visits = sql(`select count(*) from visits where user_id = '${USERS.walker.id}'`)
  const touches = sql(`select count(*) from touch_events where user_id = '${USERS.walker.id}'`)
  assert.ok(Number(touches) > Number(visits), 'more touches than visits, so the test means something')
  assert.equal(String(await walker.page.locator('ol > li').count()), visits)
  assert.equal(await walker.page.getByText('Edited at the plaza').count(), 1, 'a two-Touch-Point visit shows its memory once')

  await walker.go('/me')
  await walker.page.getByText('Walker').first().waitFor()
  const places = sql(`select count(distinct place_id) from visits where user_id = '${USERS.walker.id}'`)
  await walker.page.waitForFunction((n) => document.querySelector('dl dd')?.textContent === n, places, { timeout: 10000 })
  assert.equal(await walker.page.locator('dl dd').first().textContent(), places)
})

test('/moments/:id opens one visit with its memory; another id is not there', async () => {
  const visit = sql(`select visit_id from memories where note = 'Back the next day'`)
  await walker.go(`/moments/${visit}`)
  await walker.page.locator('li p', { hasText: 'Back the next day' }).first().waitFor({ timeout: 15000 })
  await walker.page.getByText(COMPOSER).waitFor()
  assert.equal(await noteValue(walker.page), 'Back the next day')
  await walker.go('/moments/00000000-0000-4000-8000-000000000000')
  await walker.page.getByText('This moment is not in your journey.').waitFor()
  assert.deepEqual(walker.errors, [])
})

test('a legacy memory (from before visits) loads, shows its photo and edits in place', async () => {
  const legacy = await visitor(browser, { email: USERS.legacy.email })
  const id = sql(`select id from memories where user_id = '${USERS.legacy.id}'`)
  await legacy.go('/moments')
  await legacy.page.getByText('Legacy memory from before visits.').waitFor({ timeout: 15000 })
  assert.ok(await imageLoads(legacy.page.locator('ol > li img').first()), 'the legacy photo displays')
  await legacy.page.getByRole('button', { name: 'Add a memory' }).click()
  await legacy.page.waitForFunction(() => document.querySelector('#memory-note')?.value === 'Legacy memory from before visits.', null, { timeout: 10000 })
  await legacy.page.locator('#memory-note').fill('Legacy memory from before visits. Edited after.')
  await saveMemory(legacy.page)
  assert.equal(
    sql(`select id || '|' || note || '|' || (touch_event_id is not null) || '|' || (select count(*) from memories where user_id = '${USERS.legacy.id}') from memories where user_id = '${USERS.legacy.id}'`),
    `${id}|Legacy memory from before visits. Edited after.|true|1`,
  )
  const today = await touch(legacy, POINTS.plaza)
  assert.equal(today.visit_id, sql(`select visit_id from memories where id = '${id}'`), 'a new tap the same day reopens the legacy memory\'s visit')
  assert.equal(await noteValue(legacy.page), 'Legacy memory from before visits. Edited after.')
  assert.deepEqual(legacy.errors, [])
  await legacy.context.close()
})

test('auth interruption: signed-out Touch → sign in → back to the Touch → the visit\'s memory saves', async () => {
  const guest = await visitor(browser)
  await guest.go(`/t/${POINTS.demo}`)
  await guest.page.getByRole('button', { name: 'Log in' }).click()
  await guest.page.waitForURL(/\/auth\/signin/)
  assert.equal(await guest.page.evaluate(() => JSON.parse(sessionStorage.getItem('linka.touch.pending') ?? '{}').id), POINTS.demo)
  assert.equal(sql(`select count(*) from touch_events where user_id = '${USERS.returning.id}'`), '0', 'nothing recorded while signed out')
  await guest.page.locator('input[type=email]').fill(USERS.returning.email)
  await guest.page.locator('input[type=password]').fill(PASSWORD)
  await guest.page.getByRole('button', { name: 'Sign in' }).click()
  await guest.page.waitForURL(new RegExp(`/t/${POINTS.demo}`), { timeout: 20000 })
  await guest.page.getByText(COMPOSER).waitFor({ timeout: 20000 })
  await guest.page.waitForLoadState('networkidle')
  const recorded = guest.touches.at(-1)
  assert.ok(recorded.visit_id && recorded.is_test === true)
  assert.equal(await guest.page.evaluate(() => sessionStorage.getItem('linka.touch.pending')), null)
  await guest.page.getByRole('radio', { name: /Joyful/ }).click()
  await saveMemory(guest.page)
  assert.equal(sql(`select visit_id || '|' || mood from memories where user_id = '${USERS.returning.id}'`), `${recorded.visit_id}|joyful`)

  // Refresh, See it in My World, Back, Forward, Back: no new touch, visit or memory.
  const all = () => sql(`select (select count(*) from touch_events) || '/' || (select count(*) from visits) || '/' || (select count(*) from memories)`)
  const before = all()
  await guest.page.reload()
  await guest.page.getByText(COMPOSER).waitFor()
  await guest.page.waitForLoadState('networkidle')
  assert.equal(guest.touches.at(-1).visit_id, recorded.visit_id)
  assert.equal(guest.touches.at(-1).duplicate, true)
  assert.equal(await guest.page.getByRole('radio', { name: /Joyful/ }).getAttribute('aria-checked'), 'true')
  await guest.page.getByRole('button', { name: 'See it in My World' }).click()
  await guest.page.waitForURL(/\/home/)
  await guest.page.goBack()
  await guest.page.waitForLoadState('networkidle')
  await guest.page.goForward()
  await guest.page.waitForLoadState('networkidle')
  await guest.page.goBack()
  await guest.page.waitForLoadState('networkidle')
  if (guest.page.url().includes('/t/')) {
    await guest.page.getByText(COMPOSER).waitFor()
    await guest.page.waitForLoadState('networkidle')
  }
  assert.equal(all(), before)
  assert.deepEqual(guest.errors, [])
  await guest.context.close()
})

test('no page errors for the main traveller', () => {
  assert.deepEqual(walker.errors, [])
})
