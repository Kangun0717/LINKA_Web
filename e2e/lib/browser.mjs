// Real browsers for the tests: Google Chrome (desktop, phone-width) and
// WebKit with Playwright's iPhone 13 profile — the closest automatable
// stand-in for mobile Safari.
import { chromium, devices, webkit } from 'playwright-core'

import { APP_URL } from './config.mjs'
import { sessionOf } from './gateway.mjs'

export const BROWSER = process.env.E2E_BROWSER === 'webkit' ? 'webkit' : 'chrome'

export async function launch(name = BROWSER) {
  return name === 'webkit' ? webkit.launch() : chromium.launch({ channel: 'chrome' })
}

export const deviceFor = (name = BROWSER) =>
  name === 'webkit' ? devices['iPhone 13'] : { viewport: { width: 430, height: 900 }, deviceScaleFactor: 2, hasTouch: false }

/** The storage key supabase-js derives from the gateway URL's host (127.0.0.1 → "127"). */
const AUTH_KEY = 'sb-127-auth-token'

/**
 * A browser context as a visitor: signed in as a test user (a session in
 * storage, exactly as supabase-js keeps one) or a guest. Every page error is
 * collected, and every record_touch result and memory insert is recorded so
 * tests can follow a visit from the server's answer to what the app sent.
 */
export async function visitor(browser, { email = null, locale = 'en', reducedMotion = 'no-preference', name = BROWSER } = {}) {
  const context = await browser.newContext({ ...deviceFor(name), locale: locale === 'ja' ? 'ja-JP' : 'en-US', reducedMotion })
  await context.addInitScript(([key, session, lang]) => {
    if (!window.localStorage.getItem('linka.locale')) window.localStorage.setItem('linka.locale', lang)
    // Only on the very first document: signing out must stay signed out.
    if (session && !window.sessionStorage.getItem('e2e-seeded')) {
      window.localStorage.setItem(key, session)
      window.sessionStorage.setItem('e2e-seeded', '1')
    }
  }, [AUTH_KEY, email ? JSON.stringify(sessionOf(email)) : null, locale])
  const page = await context.newPage()
  const errors = []
  const touches = []
  const inserts = []
  const requests = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('request', (request) => {
    const url = request.url()
    if (url.includes('/rest/v1/') || url.includes('/storage/v1/') || url.includes('/auth/v1/')) {
      requests.push(`${request.method()} ${url.replace(/^https?:\/\/[^/]+/, '')}`)
    }
    if (url.includes('/rest/v1/memories') && request.method() === 'POST') inserts.push(JSON.parse(request.postData() ?? '{}'))
  })
  page.on('response', async (response) => {
    if (response.url().includes('/rest/v1/rpc/record_touch') && response.request().method() === 'POST') {
      try {
        touches.push((await response.json())[0])
      } catch {
        // an error response: no touch
      }
    }
  })
  return { context, page, errors, touches, inserts, requests, go: (path) => page.goto(`${APP_URL}${path}`) }
}
