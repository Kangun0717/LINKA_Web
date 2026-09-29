// Private data stays private: ownership enforced by the database (through the
// real API), guests kept out of private screens, and no cached private data
// carried from one signed-in account to the next.
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'

import { navigateInApp } from '../lib/app.mjs'
import { launch, visitor } from '../lib/browser.mjs'
import { GATEWAY_URL, PASSWORD, USERS } from '../lib/config.mjs'
import { sql } from '../lib/db.mjs'
import { jwt, sessionOf } from '../lib/gateway.mjs'
import { seedWalkerJourney } from '../lib/seed.mjs'
import { startStack } from '../lib/stack.mjs'

let stack, browser
before(async () => {
  stack = await startStack()
  browser = await launch()
  seedWalkerJourney()
})
after(async () => {
  await browser?.close()
  await stack?.stop()
})

const as = (email) => ({ apikey: 'e2e', authorization: `Bearer ${sessionOf(email).access_token}`, 'content-type': 'application/json', prefer: 'return=representation' })
const api = (path, init = {}) =>
  fetch(`${GATEWAY_URL}/rest/v1/${path}`, init).then(async (r) => ({ status: r.status, body: await r.json().catch(() => null) }))

test('another user can neither read nor change someone else\'s visit or memory', async () => {
  const visit = sql(`select id from visits where user_id = '${USERS.walker.id}' limit 1`)
  const memory = sql(`select id from memories where user_id = '${USERS.walker.id}' limit 1`)
  const place = sql(`select place_id from visits where id = '${visit}'`)
  const other = as(USERS.returning.email)

  assert.deepEqual((await api(`visits?user_id=eq.${USERS.walker.id}`, { headers: other })).body, [])
  assert.deepEqual((await api(`memories?id=eq.${memory}`, { headers: other })).body, [])
  const attach = await api('memories', { method: 'POST', headers: other, body: JSON.stringify({ visit_id: visit, place_id: place, note: 'intrusion' }) })
  assert.equal(attach.status, 403)
  assert.equal(attach.body?.code, '42501')
  assert.deepEqual((await api(`memories?id=eq.${memory}`, { method: 'PATCH', headers: other, body: JSON.stringify({ note: 'overwritten' }) })).body, [])
  assert.deepEqual((await api(`memories?id=eq.${memory}`, { method: 'DELETE', headers: other })).body, [])
  assert.equal(sql(`select note from memories where id = '${memory}'`), 'A quiet morning with the ibis.')
})

test('visits are written only by record_touch; legacy touch_event_id is read-only; anon sees nothing private', async () => {
  const place = sql(`select id from places where slug = 'toki-no-mori'`)
  const own = as(USERS.walker.email)
  const direct = await api('visits', { method: 'POST', headers: own, body: JSON.stringify({ user_id: USERS.walker.id, place_id: place, local_date: '2026-01-01', first_touched_at: 'now()', last_touched_at: 'now()' }) })
  assert.ok([401, 403].includes(direct.status), JSON.stringify(direct))
  const legacy = await api('memories', { method: 'POST', headers: own, body: JSON.stringify({ visit_id: sql(`select id from visits where user_id = '${USERS.walker.id}' limit 1`), place_id: place, touch_event_id: sql(`select id from touch_events limit 1`) }) })
  assert.ok([401, 403].includes(legacy.status), JSON.stringify(legacy))
  const anon = { apikey: 'e2e', authorization: `Bearer ${jwt({ role: 'anon' })}` }
  for (const table of ['visits', 'memories', 'touch_events', 'place_suggestions']) {
    const read = await api(table, { headers: anon })
    assert.ok([401, 403].includes(read.status) || (Array.isArray(read.body) && read.body.length === 0), `${table}: ${JSON.stringify(read)}`)
  }
})

test('storage: nobody can sign or upload into another user\'s photos', async () => {
  const other = as(USERS.returning.email)
  const signed = await fetch(`${GATEWAY_URL}/storage/v1/object/sign/memory-photos`, { method: 'POST', headers: other, body: JSON.stringify({ expiresIn: 60, paths: [`${USERS.walker.id}/x/y.jpg`] }) }).then((r) => r.json())
  assert.equal(signed[0].signedURL, null)
  const upload = await fetch(`${GATEWAY_URL}/storage/v1/object/memory-photos/${USERS.walker.id}/x/z.jpg`, { method: 'POST', headers: other, body: 'x' })
  assert.equal(upload.status, 403)
})

test('guests see the sign-in gate on Moments, a Moment and Me — and ask for nothing private', async () => {
  const guest = await visitor(browser)
  const visit = sql(`select id from visits where user_id = '${USERS.walker.id}' limit 1`)
  for (const path of ['/moments', `/moments/${visit}`, '/me']) {
    await guest.go(path)
    await guest.page.getByRole('button', { name: 'Create account' }).waitFor({ timeout: 15000 })
  }
  assert.equal(await guest.page.getByText('A quiet morning with the ibis.').count(), 0)
  assert.deepEqual(guest.requests.filter((r) => /\/rest\/v1\/(visits|memories|touch_events|place_suggestions)/.test(r)), [])
  await guest.context.close()
})

test('switching accounts in the same tab never shows the previous account\'s private data', async () => {
  const v = await visitor(browser, { email: USERS.walker.email })
  await v.go('/moments')
  await v.page.getByText('A quiet morning with the ibis.').waitFor({ timeout: 15000 })

  // Sign out and sign in as someone else without reloading: the app's
  // in-memory caches are what is being tested.
  await navigateInApp(v.page, '/me')
  await v.page.getByRole('button', { name: 'Sign out' }).click()
  await v.page.waitForURL((url) => url.pathname === '/')
  await navigateInApp(v.page, '/auth/signin')
  await v.page.locator('input[type=email]').waitFor({ timeout: 15000 })
  await v.page.locator('input[type=email]').fill(USERS.returning.email)
  await v.page.locator('input[type=password]').fill(PASSWORD)
  const atSignIn = v.requests.length
  await v.page.getByRole('button', { name: 'Sign in' }).click()
  await v.page.waitForURL(/\/home/, { timeout: 20000 })

  await navigateInApp(v.page, '/moments')
  await v.page.getByText('Your moments begin with your first Touch.').waitFor({ timeout: 15000 })
  assert.equal(await v.page.getByText('A quiet morning with the ibis.').count(), 0, 'no trace of the previous account')
  assert.ok(v.requests.slice(atSignIn).some((r) => r.includes('/rest/v1/visits')), 'the new account\'s visits were fetched afresh')

  await navigateInApp(v.page, '/me')
  await v.page.getByText('Returning').first().waitFor()
  assert.equal(await v.page.locator('dl dd').first().textContent(), '0')
  assert.equal(await v.page.locator('img[src*="/storage/v1/"]').count(), 0, 'no previous account photos')
  assert.deepEqual(v.errors, [])
  await v.context.close()
})
