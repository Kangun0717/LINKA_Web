// /place/:slug — the public Place page — and the Place presentation it shares
// with /t/:publicId and the map's place card: hero, attribution, safety,
// nearby distance, languages. Guests read everything public and nothing private.
import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'

import { COMPOSER, imageLoads, touch } from '../lib/app.mjs'
import { launch, visitor } from '../lib/browser.mjs'
import { POINTS, USERS } from '../lib/config.mjs'
import { sql } from '../lib/db.mjs'
import { startStack } from '../lib/stack.mjs'

let stack, browser
before(async () => {
  stack = await startStack()
  browser = await launch()
})
after(async () => {
  await browser?.close()
  await stack?.stop()
})

const PRIVATE = /\/rest\/v1\/(visits|memories|touch_events|place_suggestions|rpc\/record_touch)|\/storage\/v1\//

/** Straight-line distances computed here, independently of the app. */
function expectedNearby(origin) {
  const rows = sql(`select slug || ',' || latitude || ',' || longitude || ',' || native_name from places where kind = 'destination'`)
    .split('\n').map((line) => { const [slug, lat, lng, name] = line.split(','); return { slug, lat: +lat, lng: +lng, name } })
  const from = rows.find((r) => r.slug === origin)
  const rad = Math.PI / 180
  const meters = (b) => 2 * 6371008.8 * Math.asin(Math.sqrt(Math.sin(((b.lat - from.lat) * rad) / 2) ** 2 +
    Math.cos(from.lat * rad) * Math.cos(b.lat * rad) * Math.sin(((b.lng - from.lng) * rad) / 2) ** 2))
  const format = (m) => {
    const r = Math.max(10, Math.round(m / 10) * 10)
    if (r < 1000) return `${r} m`
    const km = m / 1000
    return km < 10 ? `${new Intl.NumberFormat('en', { maximumFractionDigits: 1 }).format(Math.round(km * 10) / 10)} km` : `${Math.round(km)} km`
  }
  return rows.filter((r) => r.slug !== origin).map((r) => ({ name: r.name, m: meters(r) })).sort((a, b) => a.m - b.m).map((r) => `${r.name}|${format(r.m)}`)
}

const readNearby = (page) => page.evaluate(() => {
  const h = [...document.querySelectorAll('h3')].find((x) => /More LINKA places nearby|近くのLINKAの場所|附近的 LINKA 地点/.test(x.textContent) && x.offsetParent !== null)
  const section = h?.closest('section')
  return section && {
    items: [...section.querySelectorAll('li button')].map((b) => `${b.querySelector('span[lang="ja"]').textContent}|${b.lastElementChild.textContent}`),
    note: section.querySelector('p')?.textContent,
  }
})

const safetyCard = (page) => page.evaluate(() => {
  const s = document.querySelector('section[aria-label="Safety"], section[aria-label="安全・防災"], section[aria-label="安全与防灾"]')
  const outside = [...s.querySelectorAll('a, button')].filter((el) => !el.closest('dialog'))
  return {
    https: outside.filter((a) => a.href?.startsWith('http')).length,
    tel: outside.filter((a) => a.href?.startsWith('tel:')).map((a) => `${a.getAttribute('href')}|${a.textContent}`),
    action: outside.filter((b) => b.tagName === 'BUTTON').map((b) => b.textContent),
    text: s.innerText,
    open: s.querySelector('dialog').open,
  }
})

test('guest: the whole public place, and no private request', async () => {
  const guest = await visitor(browser)
  await guest.go('/place/toki-no-mori')
  await guest.page.locator('h2', { hasText: 'トキの森公園' }).first().waitFor({ timeout: 20000 })
  await guest.page.waitForLoadState('networkidle')
  const page = guest.page

  // Hero: loaded, reserved at its shape, described in the reader's language, credited and licensed.
  assert.ok(await imageLoads(page.locator('figure img').first()), 'hero loads')
  const hero = await page.locator('figure img').first().evaluate((img) => ({
    alt: img.alt, w: img.naturalWidth, ratio: img.getBoundingClientRect().width / img.getBoundingClientRect().height, srcset: img.srcset,
  }))
  assert.ok(hero.w > 0 && hero.alt.startsWith('A crested ibis'), `hero: ${JSON.stringify(hero)}`)
  assert.ok(Math.abs(hero.ratio - 1.6) < 0.02, 'hero reserved at 16:10')
  assert.ok(hero.srcset.includes('1600w'))
  const credit = await page.locator('figcaption a').evaluateAll((links) => links.map((a) => `${a.textContent}→${a.href}`))
  assert.ok(credit.some((c) => c.startsWith('CC BY-SA 4.0→https://creativecommons.org/licenses/by-sa/4.0')), `licence link: ${credit}`)
  assert.ok(credit.some((c) => c.includes('commons.wikimedia.org')), `source link: ${credit}`)

  // Introduction, official information, sources, official site.
  await page.getByText('A park in Niibo').waitFor()
  await page.getByText('8:30–17:00 (last entry 16:30)').waitFor()
  assert.equal(await page.getByRole('link', { name: /Official website/ }).count(), 1)
  assert.equal(await page.locator('summary', { hasText: 'Sources' }).count(), 1)
  assert.equal(await page.getByText('Not visited yet').count(), 1, 'a guest has visited nothing')

  // Safety: summary, then the full official list.
  const card = await safetyCard(page)
  assert.equal(card.https, 1)
  assert.deepEqual(card.tel, ['tel:110|110警察 / Police', 'tel:119|119消防・救急 / Fire / Ambulance'])
  assert.ok(!card.text.includes('#7119') && card.text.includes('does not show live warning status'))
  assert.ok(card.text.includes('Source: 日本政府観光局 (JNTO)'))
  await page.getByRole('button', { name: 'View all' }).click()
  const expected = sql(`select count(*) from safety_resources where place_id is null or place_id in (select id from places where slug in ('toki-no-mori', 'sado'))`)
  const sheet = await page.evaluate(() => { const d = document.querySelector('dialog[open]'); return d && { rows: d.querySelectorAll('li').length, text: d.innerText.toLowerCase() } })
  assert.equal(String(sheet.rows), expected)
  for (const text of ['#7119', '050-3816-2787', 'hazard maps', 'evacuation sites', 'as of']) assert.ok(sheet.text.includes(text), `sheet has ${text}`)
  await page.keyboard.press('Escape')
  assert.equal((await safetyCard(page)).open, false)

  // Nearby: straight-line distance, nearest first, said to be straight-line.
  const nearby = await readNearby(page)
  assert.deepEqual(nearby.items, expectedNearby('toki-no-mori'))
  assert.equal(nearby.note, 'Straight-line distance from this place')

  assert.deepEqual(guest.requests.filter((r) => PRIVATE.test(r)), [], 'a guest never asks for private data')
  assert.deepEqual(guest.errors, [])

  // A nearby place opens its own page, from the top.
  await page.locator('li button', { hasText: 'ドンデン高原' }).click()
  await page.waitForURL(/\/place\/donden-kogen$/)
  await page.locator('h2', { hasText: 'ドンデン高原' }).first().waitFor()
  assert.equal(await page.evaluate(() => window.scrollY), 0)
  await guest.context.close()
})

test('language switching: interface and content follow; official names stay; fallbacks are said', async () => {
  const guest = await visitor(browser)
  await guest.go('/place/sado-kinzan')
  await guest.page.locator('h2', { hasText: '佐渡金山' }).first().waitFor({ timeout: 20000 })
  await guest.page.getByText('Sado Gold Mine', { exact: true }).first().waitFor()

  await guest.page.getByRole('button', { name: /^Language:/ }).click()
  await guest.page.getByRole('button', { name: '日本語' }).click()
  await guest.page.getByText('世界遺産「佐渡島の金山」').first().waitFor()
  assert.deepEqual((await safetyCard(guest.page)).tel, ['tel:110|110警察 / Police', 'tel:119|119消防・救急 / Fire / Ambulance'], 'emergency labels stay Japanese + English')
  assert.deepEqual((await safetyCard(guest.page)).action, ['すべて見る'])
  assert.equal((await readNearby(guest.page)).note, 'この場所からの直線距離')

  await guest.page.getByRole('button', { name: /^言語:/ }).click()
  await guest.page.getByRole('button', { name: '简体中文' }).click()
  await guest.page.locator('h2', { hasText: '佐渡金山' }).first().waitFor()
  // No Chinese description exists: the fallback is shown and said, never invented.
  await guest.page.getByText('暂无简体中文介绍，以下以英语显示。').waitFor()
  assert.equal(await guest.page.evaluate(() => document.documentElement.lang), 'zh-Hans')
  assert.equal(await guest.page.evaluate(() => localStorage.getItem('linka.locale')), 'zh-Hans')
  assert.deepEqual(guest.errors, [])
  await guest.context.close()
})

test('signed in: the same page adds only their own visit — and reading never records one', async () => {
  const walker = await visitor(browser, { email: USERS.walker.email })
  const before = sql(`select count(*) from touch_events`)
  await walker.go('/place/toki-no-mori')
  await walker.page.locator('h2', { hasText: 'トキの森公園' }).first().waitFor({ timeout: 20000 })
  await walker.page.waitForLoadState('networkidle')
  assert.equal(await walker.page.getByText('Not visited yet').count(), 1)
  assert.equal(await walker.page.getByText(COMPOSER).count(), 0, 'no memory form on the public page')
  assert.equal(sql(`select count(*) from touch_events`), before, 'no touch was recorded')

  await touch(walker, POINTS.gate)
  await walker.go('/place/toki-no-mori')
  await walker.page.getByText(/^Visited · /).waitFor({ timeout: 15000 })
  await walker.page.getByText(/Exploring Sado/).waitFor()
  await walker.page.getByText('1 / 5 places').waitFor()
  assert.equal(await walker.page.getByText(COMPOSER).count(), 0)
  assert.deepEqual(walker.errors, [])
  await walker.context.close()
})

test('the Touch page shows the same place; its nearby places open their public pages', async () => {
  const guest = await visitor(browser)
  await guest.go(`/t/${POINTS.gate}`)
  await guest.page.locator('h2', { hasText: 'トキの森公園' }).first().waitFor({ timeout: 20000 })
  await guest.page.getByRole('button', { name: 'See the information' }).click()
  const nearby = await readNearby(guest.page)
  assert.deepEqual(nearby.items, expectedNearby('toki-no-mori'))
  await guest.page.locator('li button', { hasText: '佐渡金山' }).click()
  await guest.page.waitForURL(/\/place\/sado-kinzan$/)
  assert.deepEqual(guest.requests.filter((r) => PRIVATE.test(r)), [], 'exploring as a guest records nothing')
  await guest.context.close()
})

test('the map opens a place by its slug, and its card shows the same distances', async () => {
  const guest = await visitor(browser)
  await guest.go('/place/shukunegi')
  await guest.page.getByRole('button', { name: 'Explore LINKA places on the map' }).click()
  await guest.page.waitForURL(/\/home\?at=jp\/sado&place=shukunegi$/)
  await guest.page.waitForFunction(() => [...document.querySelectorAll('h3')].some((x) => x.textContent === 'More LINKA places nearby' && x.offsetParent !== null), null, { timeout: 20000 })
  assert.deepEqual((await readNearby(guest.page)).items, expectedNearby('shukunegi'))
  assert.deepEqual(guest.errors, [])
  await guest.context.close()
})

test('an unknown place says so', async () => {
  const guest = await visitor(browser)
  await guest.go('/place/not-a-real-place')
  await guest.page.getByText('This place is not on LINKA').waitFor({ timeout: 20000 })
  await guest.go('/place/sado')
  await guest.page.getByText('This place is not on LINKA').waitFor({ timeout: 20000 })
  await guest.context.close()
})
