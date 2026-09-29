# End-to-end tests

The real app, built unmodified, in real browsers — Google Chrome and WebKit
with the iPhone 13 profile (the closest automatable stand-in for mobile
Safari) — against a **local** stack. Nothing here ever talks to a Supabase
project, and no test data is ever written anywhere but a throwaway database.

```sh
npm run test:e2e                           # Chrome, then WebKit
npm run test:e2e -- --browser webkit       # one browser
npm run test:e2e -- --only place           # one spec file
npm run perf -- --label before --browser webkit   # measurements
npm run visual -- capture --label before          # screenshots
npm run visual -- compare --from before --to after
```

## Prerequisites (once)

- **PostgreSQL 17** binaries (`initdb`, `pg_ctl`, `psql`, `pg_config`):
  `brew install postgresql@17`, or set `PG_BIN`.
- **Google Chrome** installed.
- **WebKit for Playwright**: `npx playwright-core install webkit`.
- **PostgREST** is downloaded automatically on first run (pinned release,
  checked against its published SHA-256) into `e2e/.cache/`.

## What runs

| Piece | What it is |
|---|---|
| Database | A PostgreSQL cluster in `e2e/.cache/pg`, built from `supabase/migrations/` in order — the same SQL production ran — on top of `sql/stubs.sql` (API roles, `auth.uid()`, the storage schema, production's default privileges). `sql/seed-legacy.sql` is applied at the point in history where that data existed (before the visits migration), so the migration transforms it exactly as it transformed production. Every spec file starts from a fresh copy. |
| API | The real PostgREST, so row-level security, column grants and constraints are the production ones. |
| Gateway (`lib/gateway.mjs`) | A local stand-in for the parts of Supabase the app calls beyond PostgREST: password sign-in for the temporary test users, `/auth/v1/user`, and a private in-memory photo bucket enforcing "the first folder is your user id". It is test infrastructure only — the app has no test mode, demo login or auth shortcut. |
| App | `vite build` with `VITE_SUPABASE_URL` pointed at the gateway. The run refuses to start if the build mentions the linked production project. |

Test users exist only in the local test database (`lib/config.mjs`). The JWT
secret there is a local value that no real project accepts.

## Specs

- `journey.test.mjs` — Touch Point → record_touch → Visit → Memory (mood,
  note, photo) → Moments → Me; duplicate touch; several Touch Points, one
  visit; another local date, another visit; editing; a stale form; legacy
  memories from before visits; sign-in in the middle of a Touch; refresh,
  Back and Forward.
- `place.test.mjs` — `/place/:slug` as a guest (hero, attribution, safety
  summary and full sheet, nearby straight-line distances, no private
  request) and signed in (their visit, nothing recorded); language switching;
  the Touch page and the map sharing the same place.
- `privacy.test.mjs` — ownership through the real API, guests kept out of
  private screens, storage folders, and switching accounts in one tab
  without a trace of the previous account.
- `resilience.test.mjs` — every route opened directly and refreshed, Back and
  Forward through the map, older map links, reduced motion.

## Never committed

`e2e/.cache/` (database cluster, PostgREST, test builds, logs) and
`e2e/.artifacts/` (screenshots, measurements) are git-ignored.
