// Small steps the specs repeat, in the app's own words (English interface).
import { sql } from './db.mjs'

export const COMPOSER = 'How did it feel to be here today?'

/** Open a Touch Point URL and wait until the visit's memory form is ready. */
export async function touch(v, publicId) {
  await v.go(`/t/${publicId}`)
  await v.page.getByText(COMPOSER).waitFor({ timeout: 20000 })
  await v.page.waitForLoadState('networkidle')
  return v.touches.at(-1)
}

export async function saveMemory(page) {
  await page.getByRole('button', { name: 'Save memory' }).click()
  await page.getByText('Saved to your Moments.').waitFor({ timeout: 15000 })
}

export const noteValue = (page) => page.locator('#memory-note').inputValue()

/** Navigate inside the running app (no reload), the way a link does — the JS state survives. */
export async function navigateInApp(page, path) {
  await page.evaluate((to) => {
    window.history.pushState({}, '', to)
    window.dispatchEvent(new PopStateEvent('popstate'))
  }, path)
}

/** touches / visits / memories for one user. */
export const countsFor = (userId) =>
  sql(`select (select count(*) from touch_events where user_id = '${userId}') || '/' ||
              (select count(*) from visits where user_id = '${userId}') || '/' ||
              (select count(*) from memories where user_id = '${userId}')`)

export const placeId = (slug) => sql(`select id from places where slug = '${slug}'`)

/** Wait until an image has really loaded (scrolled into view first: lazy images load only then). */
export async function imageLoads(locator) {
  await locator.scrollIntoViewIfNeeded()
  return locator.evaluate(
    (img) => new Promise((resolve) => {
      const done = () => resolve(img.naturalWidth > 0)
      if (img.complete) done()
      else {
        img.addEventListener('load', done, { once: true })
        img.addEventListener('error', () => resolve(false), { once: true })
      }
    }),
    null,
    { timeout: 15000 },
  )
}
