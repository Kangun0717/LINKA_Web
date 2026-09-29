// Everything the local test stack agrees on. Local-only values: nothing here
// reaches a real Supabase project, and the JWT secret signs tokens that only
// the local PostgREST accepts.
import { fileURLToPath } from 'node:url'

export const ROOT = fileURLToPath(new URL('../..', import.meta.url))
export const E2E = fileURLToPath(new URL('..', import.meta.url))
export const CACHE = `${E2E}.cache`
export const ARTIFACTS = `${E2E}.artifacts`

export const PORTS = {
  postgres: Number(process.env.E2E_PG_PORT ?? 54329),
  postgrest: Number(process.env.E2E_PGRST_PORT ?? 54401),
  gateway: Number(process.env.E2E_GATEWAY_PORT ?? 54400),
  app: Number(process.env.E2E_APP_PORT ?? 5199),
}
export const GATEWAY_URL = `http://127.0.0.1:${PORTS.gateway}`
export const APP_URL = `http://127.0.0.1:${PORTS.app}`

export const DB = { template: 'linka_e2e_template', test: 'linka_e2e' }

/** Signs local test tokens only. Not a credential: it exists nowhere but this harness. */
export const JWT_SECRET = 'linka-e2e-local-only-jwt-secret-000000000000'

/** Temporary users created in the local test database (see sql/seed-legacy.sql). */
export const USERS = {
  walker: { email: 'walker@e2e.test', id: '11111111-1111-4111-8111-111111111111' },
  legacy: { email: 'legacy@e2e.test', id: '22222222-2222-4222-8222-222222222222' },
  returning: { email: 'returning@e2e.test', id: '33333333-3333-4333-8333-333333333333' },
}
export const PASSWORD = 'e2e-password-123'

/** Touch Points seeded for the tests. The demo tag carries production's public id, as a test point. */
export const POINTS = {
  demo: 'U14Xpkv9c9bfCaGAARWWUg',
  gate: 'e2eTokiGate000000001',
  plaza: 'e2eTokiPlaza00000002',
  kinzan: 'e2eKinzanGate0000003',
}

/**
 * A photo already in the repository, used as the "user's photo" in upload tests
 * (Wikimedia Commons, Totti, CC BY-SA 4.0 — see src/features/world/preview/worldPreviews.ts).
 */
export const PHOTO = `${ROOT}src/features/world/preview/photos/toki-memory.jpg`

export const POSTGREST_VERSION = 'v16.4'
