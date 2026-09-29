#!/usr/bin/env node
// Measure the app on the local stack, the same way before and after a change.
//
//   node e2e/perf.mjs --label before --app-dir <dist>   (a build made with this harness)
//   node e2e/perf.mjs --label after                     (builds the working tree)
//
// Per scenario, the median of --runs cold visits (a fresh browser context,
// empty cache): time to the scenario's meaningful content, JS bytes and
// Supabase requests the page made, long tasks (Chrome), and for flights the
// frame timeline. Written to e2e/.artifacts/perf-<label>-<browser>.json.
import { mkdirSync, writeFileSync } from 'node:fs'
import { parseArgs } from 'node:util'

import { launch, visitor } from './lib/browser.mjs'
import { ARTIFACTS, POINTS, USERS } from './lib/config.mjs'
import { stopPostgres } from './lib/db.mjs'
import { prepare } from './lib/prepare.mjs'
import { seedCommunity } from './lib/community.mjs'
import { seedWalkerJourney } from './lib/seed.mjs'
import { startStack } from './lib/stack.mjs'

const { values } = parseArgs({
  options: { label: { type: 'string', default: 'run' }, 'app-dir': { type: 'string' }, browser: { type: 'string', default: 'chrome' }, runs: { type: 'string', default: '5' }, cpu: { type: 'string', default: '4' } },
})
const RUNS = Number(values.runs)

/** Probes installed before any app code runs. */
const PROBES = () => {
  window.__perf = { longTasks: [], frames: [] }
  try {
    new PerformanceObserver((list) => list.getEntries().forEach((e) => window.__perf.longTasks.push(e.duration))).observe({ type: 'longtask', buffered: true })
  } catch {
    // WebKit has no Long Tasks API
  }
}

const { server } = await prepare({ appDir: values['app-dir'] })
const stack = await startStack()
// A signed-in traveller with a real journey: two places touched, one memory —
// and Community's public suggestions (the new 4C pages; a build without them
// sends those URLs to the Door, which `routeExists` records).
seedWalkerJourney()
const community = seedCommunity(stack)

const browser = await launch(values.browser)
const results = {}

async function measure(name, { email = USERS.walker.email, path, ready, then } = {}) {
  const samples = []
  for (let i = 0; i < RUNS; i++) {
    const v = await visitor(browser, { email, name: values.browser })
    await v.context.addInitScript(PROBES)
    // Chrome only: slow the CPU down to roughly a phone's (WebKit has no equivalent).
    if (values.browser === 'chrome' && Number(values.cpu) > 1) {
      const cdp = await v.context.newCDPSession(v.page)
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(values.cpu) })
    }
    let jsBytes = 0
    v.page.on('response', async (response) => {
      if (response.url().endsWith('.js')) jsBytes += (await response.body().catch(() => Buffer.alloc(0))).length
    })
    const start = Date.now()
    await v.go(path)
    await ready(v.page)
    const sample = { ms: Date.now() - start }
    if (then) Object.assign(sample, await then(v.page))
    await v.page.waitForTimeout(300)
    const probe = await v.page.evaluate(() => ({ longTasks: window.__perf.longTasks }))
    sample.jsKB = Math.round(jsBytes / 1024)
    sample.supabaseRequests = v.requests.filter((r) => r.includes('/rest/v1/') || r.includes('/storage/v1/')).length
    sample.longTaskMax = Math.round(Math.max(0, ...probe.longTasks))
    sample.longTaskTotal = Math.round(probe.longTasks.reduce((a, b) => a + b, 0))
    sample.errors = v.errors.length
    samples.push(sample)
    await v.context.close()
  }
  const median = (key) => {
    const sorted = samples.map((s) => s[key]).filter((x) => typeof x === 'number').sort((a, b) => a - b)
    return sorted.length ? sorted[Math.floor(sorted.length / 2)] : null
  }
  results[name] = Object.fromEntries(Object.keys(samples[0]).map((key) => [key, median(key)]))
  console.log(name.padEnd(22), JSON.stringify(results[name]))
}

/** Frame timeline from a click until the next level has settled (at most `ms`). */
async function flight(page, click, arrived, ms = 3500) {
  await page.evaluate(() => {
    window.__frames = []
    let last = performance.now()
    const tick = (now) => {
      window.__frames.push(now - last)
      last = now
      if (window.__frames.length < 2000) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  const start = Date.now()
  await click()
  await arrived()
  const toArrive = Date.now() - start
  await page.waitForTimeout(Math.max(0, ms - toArrive))
  return page.evaluate((arrive) => {
    const frames = window.__frames.slice(1)
    const sorted = [...frames].sort((a, b) => a - b)
    return {
      arriveMs: arrive,
      frames: frames.length,
      frameP95: Math.round(sorted[Math.floor(sorted.length * 0.95)] ?? 0),
      frameMax: Math.round(sorted.at(-1) ?? 0),
      framesOver50: frames.filter((f) => f > 50).length,
    }
  }, toArrive)
}

/** The map's stage names its level: "Your world", "日本, …", "佐渡, …, a hand-drawn map". */
const stage = (page, prefix) => page.waitForSelector(`[aria-label^="${prefix}"]`, { timeout: 30000 })

await measure('door', {
  email: null, path: '/',
  ready: (p) => p.waitForFunction(() => performance.getEntriesByName('first-contentful-paint').length > 0, null, { timeout: 30000 }),
  then: (p) => p.evaluate(() => ({ fcp: Math.round(performance.getEntriesByName('first-contentful-paint')[0]?.startTime ?? 0) })),
})
await measure('home', { path: '/home', ready: (p) => stage(p, 'Your world') })
await measure('world→japan', {
  path: '/home', ready: (p) => stage(p, 'Your world'),
  then: (p) => flight(p, () => p.getByRole('button', { name: /^Enter 日本/ }).first().click(), () => stage(p, '日本,')),
})
await measure('japan→sado', {
  path: '/home?at=jp', ready: (p) => stage(p, '日本,'),
  then: (p) => flight(p, () => p.getByRole('button', { name: /^Enter 佐渡/ }).first().click(), () => stage(p, '佐渡,')),
})
await measure('place open (map)', {
  path: '/home?at=jp/sado', ready: (p) => stage(p, '佐渡,'),
  then: async (p) => {
    const start = Date.now()
    await p.getByRole('button', { name: /^宿根木, .*not visited yet/ }).click()
    await p.locator('h2', { hasText: '宿根木' }).first().waitFor({ state: 'visible' })
    return { openMs: Date.now() - start }
  },
})
await measure('/t → place (guest)', { email: null, path: `/t/${POINTS.gate}`, ready: (p) => p.locator('h2', { hasText: 'トキの森公園' }).first().waitFor() })
await measure('/t → checked in', { path: `/t/${POINTS.gate}`, ready: (p) => p.getByText('How did it feel to be here today?').waitFor({ timeout: 30000 }) })
await measure('/place (guest)', {
  email: null, path: '/place/toki-no-mori',
  ready: (p) => p.locator('h2', { hasText: 'トキの森公園' }).first().waitFor({ timeout: 8000 }).catch(() => {}),
  // Before /place/:slug existed the URL fell through to the Door.
  then: (p) => ({ routeExists: new URL(p.url()).pathname.startsWith('/place/') ? 1 : 0 }),
})
await measure('moments', { path: '/moments', ready: (p) => p.getByText('A quiet morning with the ibis.').waitFor({ timeout: 30000 }) })
await measure('me', { path: '/me', ready: (p) => p.getByText('Walker').first().waitFor({ timeout: 30000 }) })
const exists = (prefix) => (p) => ({ routeExists: new URL(p.url()).pathname.startsWith(prefix) ? 1 : 0 })
await measure('/community (guest)', {
  email: null, path: '/community',
  ready: (p) => p.getByText('北沢浮遊選鉱場跡').first().waitFor({ timeout: 8000 }).catch(() => {}),
  then: exists('/community'),
})
await measure('suggestion (guest)', {
  email: null, path: `/community/suggestions/${community.kitazawa}`,
  ready: (p) => p.locator('h1', { hasText: '北沢浮遊選鉱場跡' }).waitFor({ timeout: 8000 }).catch(() => {}),
  then: exists('/community'),
})
await measure('/moments/new', {
  path: '/moments/new',
  ready: (p) => p.getByText('Save to my journal').waitFor({ timeout: 8000 }).catch(() => {}),
  then: exists('/moments/new'),
})

await browser.close()
await stack.stop()
await server.close()
stopPostgres()
mkdirSync(ARTIFACTS, { recursive: true })
const file = `${ARTIFACTS}/perf-${values.label}-${values.browser}.json`
writeFileSync(file, JSON.stringify({ label: values.label, browser: values.browser, runs: RUNS, cpuThrottle: values.browser === 'chrome' ? Number(values.cpu) : 1, at: new Date().toISOString(), results }, null, 2))
console.log(`\n→ ${file}`)
