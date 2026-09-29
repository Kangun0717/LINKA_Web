// Unit tests for the pure parts of 4C: where signing in may return a guest
// to (never outside LINKA), and how stored statuses read as public stages.
// Node runs these .ts files directly (they have no runtime imports).
import assert from 'node:assert/strict'
import { beforeEach, test } from 'node:test'

import { pendingReturn } from '../../src/features/auth/pendingReturn.ts'
import { STAGES, stageOf } from '../../src/lib/i18n/communityMessages.ts'

const store = new Map()
globalThis.window = {
  sessionStorage: {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  },
}
beforeEach(() => store.clear())

test('return after sign-in: LINKA pages only', () => {
  for (const path of ['/community', '/community/suggestions/1e0c1d5e-1111-4111-8111-111111111111', '/community/suggestions?stage=review', '/community/suggest', '/moments/new', '/place/shukunegi', '/me']) {
    pendingReturn.write(path)
    assert.equal(pendingReturn.read(), path, path)
    pendingReturn.clear()
  }
  for (const path of ['//evil.example/x', 'https://evil.example/', '/auth/signin', '/onboarding', 'javascript:alert(1)', '/community/../../x"><script>', '/home']) {
    pendingReturn.write(path)
    assert.equal(pendingReturn.read(), null, `refused: ${path}`)
  }
})

test('return after sign-in: expires, and a tampered value is ignored', () => {
  store.set('linka.return.pending', JSON.stringify({ path: '/community', at: Date.now() - 31 * 60 * 1000 }))
  assert.equal(pendingReturn.read(), null, 'older than 30 minutes')
  store.set('linka.return.pending', JSON.stringify({ path: 'https://evil.example/', at: Date.now() }))
  assert.equal(pendingReturn.read(), null, 'written around the allowlist')
  store.set('linka.return.pending', '{not json')
  assert.equal(pendingReturn.read(), null)
})

test('stages: six, in order; approved reads as Preparing (準備中); submitted stays "suggested"', () => {
  assert.deepEqual(STAGES, ['suggested', 'support', 'review', 'local', 'preparing', 'published'])
  assert.deepEqual(
    ['submitted', 'open', 'under_review', 'contacting_partner', 'approved', 'published'].map(stageOf),
    ['suggested', 'support', 'review', 'local', 'preparing', 'published'],
  )
  for (const closed of ['declined', 'duplicate', 'withdrawn', 'something-new']) assert.equal(stageOf(closed), 'suggested')
})
