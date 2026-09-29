// Direct URLs, refresh, Back / Forward through the map, and reduced motion.
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'

import { COMPOSER, placeId } from '../lib/app.mjs'
import { launch, visitor } from '../lib/browser.mjs'
import { seedCommunity } from '../lib/community.mjs'
import { POINTS, USERS } from '../lib/config.mjs'
import { seedWalkerJourney } from '../lib/seed.mjs'
import { startStack } from '../lib/stack.mjs'

let stack, browser, ids
before(async () => {
  stack = await startStack()
  browser = await launch()
  seedWalkerJourney()
  ids = seedCommunity(stack)
})
after(async () => {
  await browser?.close()
  await stack?.stop()
})

const stage = (page, prefix) => page.waitForSelector(`[aria-label^="${prefix}"]`, { timeout: 20000 })

test('every route opens directly and survives a refresh', async () => {
  const v = await visitor(browser, { email: USERS.walker.email })
  const routes = [
    ['/home', (p) => stage(p, 'Your world')],
    ['/home?at=jp', (p) => stage(p, '日本,')],
    ['/home?at=jp/sado', (p) => stage(p, '佐渡,')],
    ['/place/onogame', (p) => p.locator('h2', { hasText: '大野亀' }).first().waitFor()],
    [`/t/${POINTS.kinzan}`, (p) => p.getByText(COMPOSER).waitFor()],
    ['/moments', (p) => p.getByText('A quiet morning with the ibis.').waitFor()],
    ['/me', (p) => p.getByText('Walker').first().waitFor()],
    ['/moments/new', (p) => p.getByRole('button', { name: 'Save to my journal' }).waitFor()],
    ['/community', (p) => p.getByRole('heading', { name: 'Places travellers found', level: 1 }).waitFor()],
    ['/community/suggestions?stage=support', (p) => p.getByText('小木のたらい舟').first().waitFor()],
    [`/community/suggestions/${ids.kitazawa}`, (p) => p.getByRole('heading', { name: '北沢浮遊選鉱場跡' }).waitFor()],
    ['/community/suggest', (p) => p.getByRole('button', { name: 'Send to LINKA' }).waitFor()],
  ]
  for (const [path, ready] of routes) {
    await v.go(path)
    await ready(v.page)
    await v.page.reload()
    await ready(v.page)
    assert.equal(new URL(v.page.url()).pathname + new URL(v.page.url()).search, path, `${path} kept its URL`)
  }
  assert.deepEqual(v.errors, [])
  await v.context.close()
})

test('Back and Forward climb the map exactly the way it was entered', async () => {
  const v = await visitor(browser, { email: USERS.walker.email })
  await v.go('/home')
  await stage(v.page, 'Your world')
  await v.page.getByRole('button', { name: /^Enter 日本/ }).first().click()
  await stage(v.page, '日本,')
  await v.page.getByRole('button', { name: /^Enter 佐渡/ }).first().click()
  await stage(v.page, '佐渡,')
  assert.ok(v.page.url().endsWith('/home?at=jp/sado'))
  await v.page.goBack()
  await stage(v.page, '日本,')
  await v.page.goBack()
  await stage(v.page, 'Your world')
  await v.page.goForward()
  await stage(v.page, '日本,')
  assert.ok(v.page.url().endsWith('/home?at=jp'))
  assert.deepEqual(v.errors, [])
  await v.context.close()
})

test('older map links (a place by id) still open its card', async () => {
  const v = await visitor(browser)
  await v.go(`/home?at=jp/sado&place=${placeId('onogame')}`)
  await v.page.locator('h2', { hasText: '大野亀' }).first().waitFor({ timeout: 20000 })
  assert.deepEqual(v.errors, [])
  await v.context.close()
})

test('reduced motion: the Door, a Touch, the arrival (card stays until dismissed) and a flight all complete', async () => {
  const v = await visitor(browser, { email: USERS.walker.email, reducedMotion: 'reduce' })
  await v.go('/')
  await v.page.waitForLoadState('networkidle')
  await v.go(`/t/${POINTS.gate}`)
  await v.page.getByText(COMPOSER).waitFor({ timeout: 20000 })
  await v.page.getByRole('button', { name: 'See it in My World' }).click()
  await v.page.waitForURL(/\/home$/)
  await stage(v.page, 'Your world')
  // Reduced motion: the arriving place is named at once and its card waits
  // for the person — nothing on screen changes by itself.
  const arriving = v.page.getByRole('button', { name: /^トキの森公園, .*touched/ })
  await arriving.waitFor()
  assert.equal(await arriving.getAttribute('aria-pressed'), 'true', 'the arrival card is open')
  await v.page.waitForTimeout(8000) // longer than the whole animated arrival
  assert.equal(await arriving.getAttribute('aria-pressed'), 'true', 'and still open: nothing moved by itself')
  await v.page.mouse.click(12, 200) // the map, away from everything: put the card away
  await v.page.getByRole('button', { name: /^Enter 日本/ }).first().click()
  await stage(v.page, '日本,')
  assert.equal(await v.page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true)
  assert.deepEqual(v.errors, [])
  await v.context.close()
})

test('Back and Forward through Community, Moments and a place keep each page', async () => {
  const v = await visitor(browser, { email: USERS.walker.email })
  await v.go('/community')
  await v.page.getByRole('heading', { name: 'Places travellers found', level: 1 }).waitFor({ timeout: 20000 })
  await v.page.locator(`a[href="/community/suggestions/${ids.kitazawa}"]`).first().click()
  await v.page.getByRole('heading', { name: '北沢浮遊選鉱場跡' }).waitFor()
  await v.page.getByRole('link', { name: /Moments/ }).click()
  await v.page.waitForURL(/\/moments$/)
  await v.page.getByText('A quiet morning with the ibis.').waitFor()
  await v.page.goBack()
  await v.page.getByRole('heading', { name: '北沢浮遊選鉱場跡' }).waitFor()
  await v.page.goBack()
  await v.page.getByRole('heading', { name: 'Places travellers found', level: 1 }).waitFor()
  await v.page.goForward()
  await v.page.getByRole('heading', { name: '北沢浮遊選鉱場跡' }).waitFor()
  assert.ok(v.page.url().endsWith(`/community/suggestions/${ids.kitazawa}`))
  assert.deepEqual(v.errors, [])
  await v.context.close()
})
