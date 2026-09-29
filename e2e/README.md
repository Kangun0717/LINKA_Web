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
npm run test:unit                          # pure logic (photo metadata, return paths, stages)
npm run test:db                            # every SQL test, on the real migration history
npm run test:db -- --test <name>           # one (e2e/sql/tests/<name>.sql)
npm run test:db -- --pending <file>.sql --test <name>
                                           # a migration not yet in supabase/migrations
E2E_PENDING=<file>.sql npm run test:e2e    # the app against a pending migration
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
| Gateway (`lib/gateway.mjs`) | A local stand-in for the parts of Supabase the app calls beyond PostgREST: password sign-in for the temporary test users, `/auth/v1/user`, and in-memory storage — `memory-photos` and `suggestion-photos` private, enforcing "the first folder is your user id" and (like Supabase) signing only objects that exist; `community-media` public-read with no client writes. It is test infrastructure only — the app has no test mode, demo login or auth shortcut. |
| App | `vite build` with `VITE_SUPABASE_URL` pointed at the gateway. The run refuses to start if the build mentions the linked production project. |

Test users exist only in the local test database (`lib/config.mjs`). The JWT
secret there is a local value that no real project accepts.

## Specs

- `journey.test.mjs` — Touch Point → record_touch → Visit → Memory (mood,
  note, photo) → Moments → a Moment → Me; duplicate touch; several Touch Points, one
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
- `resilience.test.mjs` — every route opened directly and refreshed (Community
  and the journal included), Back and Forward through the map and through
  Community → a suggestion → Moments, older map links, reduced motion.
- `community.test.mjs` — Community as a guest (lists and detail carry nothing
  private: no user id, address, coordinates, original reason, internal note,
  private photo path or supporter), sign-in from an action and back, submit
  (private until opened; photos private and EXIF-free), 行ってみたい by
  another user and taken back, self-support refused in the app and the API,
  the server's rate limit said kindly, the frozen count after publication,
  Me → Contributions, and the entries from the map and /me/suggest.
- `journal.test.mjs` — past memories: text-only, with photos (EXIF suggests a
  place and date only when accepted), without EXIF, several photos with
  thumbnails, the viewer, editing, the cover, deleting; the map's taped
  memory pins and layers; and that none of it changes verified visits,
  touches, places, progress or visitor counts.
- `device.test.mjs` — the 4C pages at 390 × 844 and desktop width with no
  sideways scroll and no console errors, and with reduced motion.

Community data in the specs is written by `lib/community.mjs` straight into
the local test database, the way staff tooling would.

## Never committed

`e2e/.cache/` (database cluster, PostgREST, test builds, logs) and
`e2e/.artifacts/` (screenshots, measurements) are git-ignored.
