#!/usr/bin/env node
// Screenshots of the key screens, and a pixel comparison between two runs.
//
//   node e2e/visual.mjs capture --label before --app-dir <dist> [--browser webkit]
//   node e2e/visual.mjs capture --label after
//   node e2e/visual.mjs compare --from before --to after [--browser webkit]
//
// Captured with reduced motion, after the screen has settled, on the same
// seeded data, so two captures of an unchanged app are pixel-identical.
// Output lives in e2e/.artifacts/visual (never committed).
import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs'
import { parseArgs } from 'node:util'

import { launch, visitor } from './lib/browser.mjs'
import { ARTIFACTS, POINTS, USERS } from './lib/config.mjs'
import { stopPostgres } from './lib/db.mjs'
import { prepare } from './lib/prepare.mjs'
import { seedWalkerJourney } from './lib/seed.mjs'
import { startStack } from './lib/stack.mjs'

const { positionals, values } = parseArgs({
  allowPositionals: true,
  options: {
    label: { type: 'string' }, from: { type: 'string' }, to: { type: 'string' },
    'app-dir': { type: 'string' }, browser: { type: 'string', default: 'webkit' },
  },
})
const dirOf = (label) => `${ARTIFACTS}/visual/${label}-${values.browser}`

/** name → [who, path, how to know it has settled, optional action]. */
const SCREENS = {
  'world': [USERS.walker, '/home', (p) => p.waitForSelector('[aria-label="Your world"]')],
  'japan': [USERS.walker, '/home?at=jp', (p) => p.waitForSelector('[aria-label^="日本,"]')],
  'sado': [USERS.walker, '/home?at=jp/sado', (p) => p.waitForSelector('[aria-label^="佐渡,"]')],
  'sado-place-card': [USERS.walker, '/home?at=jp/sado', (p) => p.waitForSelector('[aria-label^="佐渡,"]'),
    async (p) => {
      await p.getByRole('button', { name: /^宿根木, .*not visited yet/ }).click()
      await p.locator('h2', { hasText: '宿根木' }).first().waitFor({ state: 'visible' })
    }],
  'touch-guest': [null, `/t/${POINTS.gate}`, (p) => p.locator('h2', { hasText: 'トキの森公園' }).first().waitFor()],
  'touch-checked-in': [USERS.walker, `/t/${POINTS.gate}`, (p) => p.getByText('How did it feel to be here today?').waitFor()],
  'moments': [USERS.walker, '/moments', (p) => p.getByText('A quiet morning with the ibis.').waitFor()],
  'me': [USERS.walker, '/me', (p) => p.getByText('Walker').first().waitFor()],
  'moments-guest': [null, '/moments', (p) => p.getByRole('button', { name: 'Create account' }).waitFor()],
}

async function capture() {
  const { server } = await prepare({ appDir: values['app-dir'] })
  const stack = await startStack()
  seedWalkerJourney()
  const browser = await launch(values.browser)
  const dir = dirOf(values.label)
  mkdirSync(dir, { recursive: true })
  for (const [name, [user, path, settled, action]] of Object.entries(SCREENS)) {
    const v = await visitor(browser, { email: user?.email ?? null, reducedMotion: 'reduce', name: values.browser })
    await v.go(path)
    await settled(v.page)
    if (action) await action(v.page)
    await v.page.waitForLoadState('networkidle')
    // Let images decode and the map finish drawing; no motion under reduced motion.
    await v.page.evaluate(() => Promise.all([...document.images].map((img) => (img.complete ? null : img.decode().catch(() => null)))))
    await v.page.waitForTimeout(1500)
    await v.page.screenshot({ path: `${dir}/${name}.png`, fullPage: !name.startsWith('world') && !['japan', 'sado', 'sado-place-card'].includes(name) })
    if (v.errors.length) console.log(`  ${name}: page errors ${v.errors.join(' | ')}`)
    console.log(`  captured ${name}`)
    await v.context.close()
  }
  await browser.close()
  await stack.stop()
  await server.close()
  stopPostgres()
  console.log(`→ ${dir}`)
}

/** Compare two captures pixel by pixel in a browser canvas; writes a diff image per changed screen. */
async function compare() {
  const [from, to] = [dirOf(values.from), dirOf(values.to)]
  const browser = await launch('chrome')
  const page = await browser.newPage()
  const out = `${ARTIFACTS}/visual/diff-${values.from}-${values.to}-${values.browser}`
  mkdirSync(out, { recursive: true })
  const report = {}
  for (const file of readdirSync(from).filter((f) => f.endsWith('.png'))) {
    if (!existsSync(`${to}/${file}`)) {
      report[file] = 'missing in the new capture'
      continue
    }
    const [a, b] = [readFileSync(`${from}/${file}`), readFileSync(`${to}/${file}`)]
    if (a.equals(b)) {
      report[file] = 'identical'
      console.log(file.padEnd(24), report[file])
      continue
    }
    const result = await page.evaluate(async ([a64, b64]) => {
      const load = (src) => new Promise((resolve) => { const i = new Image(); i.onload = () => resolve(i); i.src = `data:image/png;base64,${src}` })
      const [ia, ib] = await Promise.all([load(a64), load(b64)])
      const w = Math.max(ia.width, ib.width), h = Math.max(ia.height, ib.height)
      const px = (img) => { const c = new OffscreenCanvas(w, h); const x = c.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, w, h).data }
      const [pa, pb] = [px(ia), px(ib)]
      const diff = new OffscreenCanvas(w, h), dx = diff.getContext('2d'), out = dx.createImageData(w, h)
      let changed = 0
      for (let i = 0; i < pa.length; i += 4) {
        const d = Math.max(Math.abs(pa[i] - pb[i]), Math.abs(pa[i + 1] - pb[i + 1]), Math.abs(pa[i + 2] - pb[i + 2]), Math.abs(pa[i + 3] - pb[i + 3]))
        if (d > 16) { changed++; out.data.set([255, 0, 80, 255], i) } else { const g = (pb[i] + pb[i + 1] + pb[i + 2]) / 3; out.data.set([g, g, g, 60], i) }
      }
      dx.putImageData(out, 0, 0)
      const blob = await diff.convertToBlob({ type: 'image/png' })
      const png = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result).split(',')[1])
        reader.readAsDataURL(blob)
      })
      return { size: `${ia.width}×${ia.height} → ${ib.width}×${ib.height}`, changed, ratio: changed / (w * h), png }
    }, [a.toString('base64'), b.toString('base64')])
    if (result.changed > 0) writeFileSync(`${out}/${file}`, Buffer.from(result.png, 'base64'))
    report[file] = result.changed === 0 ? 'identical' : `${result.changed} px differ (${(result.ratio * 100).toFixed(3)}%), ${result.size}`
    console.log(file.padEnd(24), report[file])
  }
  await browser.close()
  writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2))
  console.log(`→ ${out}`)
}

if (positionals[0] === 'capture') await capture()
else if (positionals[0] === 'compare') await compare()
else console.log('usage: visual.mjs capture --label <name> [--app-dir <dist>] | compare --from <a> --to <b>')
