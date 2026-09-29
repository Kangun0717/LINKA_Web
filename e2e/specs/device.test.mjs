// The new 4C pages at phone and desktop sizes, and with reduced motion:
// nothing wider than the screen, nothing logged as an error. (The WebKit run
// uses Playwright's iPhone 13 profile throughout.)
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'

import { BROWSER, launch, visitor } from '../lib/browser.mjs'
import { seedCommunity } from '../lib/community.mjs'
import { USERS } from '../lib/config.mjs'
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

const pages = () => [
  ['/community', (p) => p.getByRole('heading', { name: 'Places travellers found', level: 1 }).waitFor({ timeout: 20000 })],
  [`/community/suggestions/${ids.kitazawa}`, (p) => p.getByRole('heading', { name: '北沢浮遊選鉱場跡' }).waitFor({ timeout: 20000 })],
  [`/community/suggestions/${ids.shukunegi}`, (p) => p.getByText('Became a LINKA Place ✓').waitFor({ timeout: 20000 })],
  ['/community/suggest', (p) => p.getByRole('button', { name: 'Send to LINKA' }).waitFor({ timeout: 20000 })],
  ['/moments', (p) => p.getByText('A quiet morning with the ibis.').waitFor({ timeout: 20000 })],
  ['/moments/new', (p) => p.getByRole('button', { name: 'Save to my journal' }).waitFor({ timeout: 20000 })],
  ['/me', (p) => p.getByRole('heading', { name: 'My suggestions' }).waitFor({ timeout: 20000 })],
  ['/place/shukunegi', (p) => p.getByText('This place joined LINKA from a traveller’s suggestion.').waitFor({ timeout: 20000 })],
]

async function check(v, label) {
  for (const [path, ready] of pages()) {
    await v.go(path)
    await ready(v.page)
    await v.page.waitForLoadState('networkidle')
    const overflow = await v.page.evaluate(() => {
      const wide = [...document.querySelectorAll('body *')].filter((el) => {
        const box = el.getBoundingClientRect()
        // Horizontal strips scroll inside themselves; only the page may not.
        return box.right > window.innerWidth + 1 && !el.closest('[class*="overflow-x-auto"]') && getComputedStyle(el).position !== 'fixed'
      })
      return { page: document.documentElement.scrollWidth - window.innerWidth, wide: wide.slice(0, 3).map((el) => el.outerHTML.slice(0, 80)) }
    })
    assert.ok(overflow.page <= 1, `${label} ${path}: the page does not scroll sideways (${overflow.page}px)`)
    assert.deepEqual(overflow.wide, [], `${label} ${path}: nothing wider than the screen`)
  }
  assert.deepEqual(v.errors, [], `${label}: no page errors`)
  assert.deepEqual(v.consoleErrors, [], `${label}: no console errors`)
}

test('390 × 844 (iPhone 13 / 14 / 15 width)', async () => {
  const v = await visitor(browser, { email: USERS.walker.email, viewport: { width: 390, height: 844 } })
  await check(v, '390×844')
  await v.context.close()
})

test('desktop (1280 × 800)', { skip: BROWSER === 'webkit' && 'the WebKit run is the iPhone profile' }, async () => {
  const v = await visitor(browser, { email: USERS.walker.email, viewport: { width: 1280, height: 800 } })
  await check(v, 'desktop')
  await v.context.close()
})

test('reduced motion, as a guest', async () => {
  const v = await visitor(browser, { reducedMotion: 'reduce' })
  await v.go('/community')
  await v.page.getByRole('heading', { name: 'Places travellers found', level: 1 }).waitFor({ timeout: 20000 })
  // Let the page's own requests finish: WebKit logs a request cut off by leaving the page as an error.
  await v.page.waitForLoadState('networkidle')
  await v.go(`/community/suggestions/${ids.kitazawa}`)
  await v.page.getByRole('heading', { name: '北沢浮遊選鉱場跡' }).waitFor({ timeout: 20000 })
  assert.equal(await v.page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches), true)
  assert.deepEqual(v.errors, [])
  assert.deepEqual(v.consoleErrors, [])
  await v.context.close()
})
