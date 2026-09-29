// Community: browsing as a guest, privacy of the public read model, suggesting,
// 行ってみたい (support, self-support refusal, rate limit, freeze at publication),
// photo moderation, the way back after signing in, and the entries from the
// map and from Me.
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'

import { launch, visitor } from '../lib/browser.mjs'
import { GATEWAY_URL, PASSWORD, USERS } from '../lib/config.mjs'
import { ORIGINAL_REASON, PRIVATE_ADDRESS, PUBLIC_REASON, SECRET, seedCommunity, setLimit, supportCount } from '../lib/community.mjs'
import { sql } from '../lib/db.mjs'
import { anonKey, sessionOf } from '../lib/gateway.mjs'
import { leftoverMetadata, withExif } from '../lib/photos.mjs'
import { startStack } from '../lib/stack.mjs'

let stack, browser, ids
before(async () => {
  stack = await startStack()
  browser = await launch()
  ids = seedCommunity(stack)
})
after(async () => {
  await browser?.close()
  await stack?.stop()
})

/** Everything the public read model sent to the page, as text. */
function collectPublic(v) {
  const bodies = []
  v.page.on('response', async (response) => {
    if (/\/rest\/v1\/rpc\/community_/.test(response.url())) bodies.push(await response.text().catch(() => ''))
  })
  return bodies
}

const FORBIDDEN_KEYS = ['user_id', 'address', 'latitude', 'longitude', 'reason', 'review_note', 'internal_note', 'reviewed_by', 'storage_path']

function assertNothingPrivate(texts) {
  const all = texts.join('\n')
  for (const leak of [PRIVATE_ADDRESS, ORIGINAL_REASON, SECRET, 'INTERNAL', '090-', USERS.walker.id, USERS.legacy.id, USERS.returning.id, 'approved.jpg', 'pending.jpg']) {
    assert.ok(!all.includes(leak), `nothing private reached the page: ${leak}`)
  }
}

test('guest: Community lists open and published places — and nothing private', async () => {
  const guest = await visitor(browser)
  const bodies = collectPublic(guest)
  await guest.go('/community')
  await guest.page.getByRole('heading', { name: 'Places travellers found', level: 1 }).waitFor({ timeout: 20000 })
  await guest.page.getByText('北沢浮遊選鉱場跡').first().waitFor()
  await guest.page.getByText('小木のたらい舟').first().waitFor()
  await guest.page.getByText('宿根木の町並み').first().waitFor()
  assert.equal(await guest.page.getByText(SECRET).count(), 0, 'a submitted suggestion is not public')
  await guest.page.getByText(PUBLIC_REASON).first().waitFor()

  for (const body of bodies) {
    for (const row of JSON.parse(body)) for (const key of FORBIDDEN_KEYS) assert.ok(!(key in row), `public row has no ${key}`)
  }
  assertNothingPrivate([...bodies, await guest.page.content()])
  assert.deepEqual(guest.requests.filter((r) => /\/rest\/v1\/(place_suggestions|place_suggestion_supports|place_suggestion_photos|memories|visits)/.test(r)), [], 'a guest asks for nothing private')
  assert.deepEqual(guest.errors, [])
  assert.deepEqual(guest.consoleErrors, [])
  await guest.context.close()
})

test('guest: a suggestion\'s page shows only its public face; photos only as approved public copies', async () => {
  const guest = await visitor(browser)
  const bodies = collectPublic(guest)
  await guest.go(`/community/suggestions/${ids.kitazawa}`)
  await guest.page.getByRole('heading', { name: '北沢浮遊選鉱場跡' }).waitFor({ timeout: 20000 })
  await guest.page.getByText(PUBLIC_REASON).waitFor()
  await guest.page.getByText('Suggested by Walker').waitFor()
  await guest.page.getByText('Checking a safe route for visitors.').waitFor()
  const images = await guest.page.locator('img').evaluateAll((all) => all.map((img) => img.getAttribute('src')))
  assert.ok(images.some((src) => src?.includes('/storage/v1/object/public/community-media/kitazawa/cover.jpg')), 'the approved public copy is shown')
  assert.ok(!images.some((src) => src?.includes('suggestion-photos')), 'never a private upload')
  assert.ok(!guest.requests.some((r) => r.includes('suggestion-photos')), 'no request for the private bucket')
  const detail = bodies.map((b) => JSON.parse(b)).find((rows) => rows[0]?.photos)
  assert.deepEqual(detail[0].photos, ['kitazawa/cover.jpg'], 'the pending photo is not in the public model')
  assertNothingPrivate([...bodies, await guest.page.content()])

  // A submitted suggestion is simply not public.
  await guest.go(`/community/suggestions/${ids.secret}`)
  await guest.page.getByText('This suggestion is not public').waitFor({ timeout: 15000 })
  assertNothingPrivate([await guest.page.content()])
  assert.deepEqual(guest.errors, [])
  await guest.context.close()
})

test('guest action → sign in → back on the same suggestion, then 行ってみたい works', async () => {
  const guest = await visitor(browser)
  await guest.go(`/community/suggestions/${ids.kitazawa}`)
  await guest.page.getByRole('button', { name: /Sign in to say you’d like to go/ }).click()
  await guest.page.waitForURL(/\/auth\/signin/)
  await guest.page.locator('input[type=email]').fill(USERS.returning.email)
  await guest.page.locator('input[type=password]').fill(PASSWORD)
  await guest.page.getByRole('button', { name: 'Sign in' }).click()
  await guest.page.waitForURL(new RegExp(`/community/suggestions/${ids.kitazawa}$`), { timeout: 20000 })
  const button = guest.page.getByRole('button', { name: /I’d like to go/ })
  await button.waitFor({ timeout: 15000 })
  assert.equal(await guest.page.evaluate(() => sessionStorage.getItem('linka.return.pending')), null, 'the return is spent')
  assert.equal(supportCount(ids.kitazawa), 0)
  await button.click()
  await guest.page.getByRole('button', { name: /You’d like to go/ }).waitFor()
  await guest.page.waitForLoadState('networkidle')
  assert.equal(supportCount(ids.kitazawa), 1, 'another traveller\'s support counts')
  assert.equal(sql(`select count(*) from place_suggestion_supports where suggestion_id = '${ids.kitazawa}' and user_id = '${USERS.returning.id}'`), '1')

  // …and taken back.
  await guest.page.getByRole('button', { name: /You’d like to go/ }).click()
  await guest.page.getByRole('button', { name: /I’d like to go/ }).waitFor()
  await guest.page.waitForLoadState('networkidle')
  assert.equal(supportCount(ids.kitazawa), 0, 'unsupport')
  assert.deepEqual(guest.errors, [])
  await guest.context.close()
})

test('a proposer cannot support their own suggestion — in the app or through the API', async () => {
  const walker = await visitor(browser, { email: USERS.walker.email })
  await walker.go(`/community/suggestions/${ids.kitazawa}`)
  await walker.page.getByText('Your suggestion', { exact: false }).first().waitFor({ timeout: 20000 })
  assert.equal(await walker.page.getByRole('button', { name: /I’d like to go/ }).count(), 0, 'no support button on one\'s own')

  const token = sessionOf(USERS.walker.email).access_token
  const response = await fetch(`${GATEWAY_URL}/rest/v1/place_suggestion_supports`, {
    method: 'POST',
    headers: { apikey: anonKey(), authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ suggestion_id: ids.kitazawa }),
  })
  assert.equal(response.status, 403)
  assert.equal((await response.json()).message, 'own_suggestion')
  assert.equal(supportCount(ids.kitazawa), 0)
  assert.deepEqual(walker.errors, [])
  await walker.context.close()
})

test('support rate limit: refused by the server, said kindly, nothing counted', async () => {
  setLimit('suggestion_support', '1 hour', 0)
  const returning = await visitor(browser, { email: USERS.returning.email })
  await returning.go(`/community/suggestions/${ids.kitazawa}`)
  await returning.page.getByRole('button', { name: /I’d like to go/ }).click()
  await returning.page.getByText('That is a lot at once — please try again a little later.').waitFor({ timeout: 15000 })
  assert.equal(await returning.page.getByText('rate_limited').count(), 0, 'never the database\'s words')
  await returning.page.getByRole('button', { name: /I’d like to go/ }).waitFor()
  assert.equal(await returning.page.getByRole('button', { name: /I’d like to go/ }).getAttribute('aria-pressed'), 'false', 'the optimistic support was undone')
  assert.equal(supportCount(ids.kitazawa), 0)
  setLimit('suggestion_support', '1 hour', 30)
  assert.deepEqual(returning.errors, [])
  await returning.context.close()
})

test('published: "Became a LINKA Place ✓", the count frozen as history, and the way to the place', async () => {
  const walker = await visitor(browser, { email: USERS.walker.email })
  await walker.go(`/community/suggestions/${ids.shukunegi}`)
  await walker.page.getByText('Became a LINKA Place ✓').waitFor({ timeout: 20000 })
  await walker.page.getByText('2 said they would like to go').first().waitFor()
  assert.equal(await walker.page.getByRole('button', { name: /like to go/ }).count(), 0, 'no support action once published')

  // Through the API, too: no new support, no withdrawal, the count unchanged.
  const token = sessionOf(USERS.walker.email).access_token
  const headers = { apikey: anonKey(), authorization: `Bearer ${token}`, 'content-type': 'application/json', prefer: 'return=representation' }
  const removed = await fetch(`${GATEWAY_URL}/rest/v1/place_suggestion_supports?suggestion_id=eq.${ids.shukunegi}`, { method: 'DELETE', headers }).then((r) => r.json())
  assert.deepEqual(removed, [], 'a support stays after publication')
  assert.equal(supportCount(ids.shukunegi), 2)

  await walker.page.getByRole('link', { name: /Open the LINKA place/ }).click()
  await walker.page.waitForURL(/\/place\/shukunegi$/)
  await walker.page.getByText('This place joined LINKA from a traveller’s suggestion.').waitFor({ timeout: 15000 })
  assert.deepEqual(walker.errors, [])
  await walker.context.close()
})

test('suggest a place: private until opened, photos private and stripped, rate limit said kindly', async () => {
  const walker = await visitor(browser, { email: USERS.walker.email })
  await walker.go('/community/suggest')
  await walker.page.getByLabel('The place').fill('岩首昇竜棚田')
  await walker.page.getByLabel('Where').fill('佐渡・岩首')
  await walker.page.getByLabel(/^Why should people go/).fill('Rice terraces running down to the sea.')
  const photo = withExif('suggest-gps.jpg', '2025:05:10 09:00:00', [37, 57, 0], [138, 31, 0])
  await walker.page.locator('input[type=file][multiple]').first().setInputFiles(photo)
  await walker.page.getByRole('button', { name: 'Send to LINKA' }).click()
  await walker.page.getByText('Thank you — LINKA has it.').waitFor({ timeout: 30000 })

  const [id, status, owner] = sql(`select id || '|' || status || '|' || user_id from place_suggestions where name = '岩首昇竜棚田'`).split('|')
  assert.equal(status, 'submitted')
  assert.equal(owner, USERS.walker.id)
  const [path, review, publicPath] = sql(`select storage_path || '|' || review_status || '|' || coalesce(public_path, 'none') from place_suggestion_photos where suggestion_id = '${id}'`).split('|')
  assert.ok(path.startsWith(`${USERS.walker.id}/${id}/`), 'uploaded into the proposer\'s own folder')
  assert.equal(review, 'pending')
  assert.equal(publicPath, 'none')
  assert.ok(stack.suggestionPaths().includes(path), 'in the private suggestion-photos bucket')
  assert.deepEqual(await leftoverMetadata(stack.storedBytes(path)), { takenOn: null, coords: null, originalTimestamp: false }, 'the uploaded photo carries no date or GPS')

  // Its proposer sees it, privately; nobody else does.
  await walker.page.getByRole('link', { name: 'See my suggestion' }).click()
  await walker.page.getByText('Only you can see this suggestion').waitFor({ timeout: 15000 })
  const guest = await visitor(browser)
  await guest.go(`/community/suggestions/${id}`)
  await guest.page.getByText('This suggestion is not public').waitFor({ timeout: 15000 })
  assert.equal(await guest.page.getByText('Rice terraces running down to the sea.').count(), 0)
  await guest.context.close()

  // A second one within the limit's window is refused kindly.
  setLimit('suggestion_submit', '1 day', 1)
  await walker.go('/community/suggest')
  await walker.page.getByLabel('The place').fill('Another place')
  await walker.page.getByLabel('Where').fill('Sado')
  await walker.page.getByLabel(/^Why should people go/).fill('Because.')
  await walker.page.getByRole('button', { name: 'Send to LINKA' }).click()
  await walker.page.getByText('That is a lot at once — please try again a little later.').waitFor({ timeout: 15000 })
  assert.equal(sql(`select count(*) from place_suggestions where name = 'Another place'`), '0')
  setLimit('suggestion_submit', '1 day', 3)
  assert.deepEqual(walker.errors, [])
  await walker.context.close()
})

test('Me → Contributions: my suggestions (private ones marked), places I support, what became LINKA', async () => {
  const walker = await visitor(browser, { email: USERS.walker.email })
  await walker.go('/me')
  await walker.page.getByRole('heading', { name: 'My suggestions' }).waitFor({ timeout: 20000 })
  const mine = walker.page.locator('#my-suggestions')
  await mine.getByText('北沢浮遊選鉱場跡', { exact: true }).waitFor()
  await mine.getByText('岩首昇竜棚田', { exact: true }).waitFor()
  await mine.getByText('Private · in review').waitFor()
  await walker.page.locator('#became').getByText('宿根木の町並み', { exact: true }).first().waitFor()
  await walker.page.getByText('“I suggested this.”').waitFor()
  await mine.getByText('北沢浮遊選鉱場跡', { exact: true }).click()
  await walker.page.waitForURL(new RegExp(`/community/suggestions/${ids.kitazawa}$`))
  // Their own words, kept apart from the public version.
  await walker.page.getByText('What you wrote').click()
  await walker.page.getByText(ORIGINAL_REASON).waitFor()
  assert.deepEqual(walker.errors, [])
  await walker.context.close()
})

test('the map leads to Community; /me/suggest leads to the new flow', async () => {
  const walker = await visitor(browser, { email: USERS.walker.email })
  await walker.go('/home')
  await walker.page.getByRole('link', { name: /Community/ }).click()
  await walker.page.waitForURL(/\/community$/)
  await walker.page.getByRole('heading', { name: 'Places travellers found', level: 1 }).waitFor()
  await walker.go('/me/suggest')
  await walker.page.waitForURL(/\/community\/suggest$/)
  await walker.page.getByRole('heading', { name: 'Suggest a place' }).waitFor()
  assert.deepEqual(walker.errors, [])
  await walker.context.close()
})
