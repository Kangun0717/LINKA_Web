# Sprint 4A — schema review (NOT APPLIED)

Status: **written and tested locally only. Nothing has been pushed to the LINKA project.**
Tested on 2026-09-28 against a throwaway PostgreSQL 17 cluster with stub `auth` / `storage` schemas
and Supabase-style "grant ALL by default" privileges (worst case for our revokes): every migration
applies, re-running the seed and fixture is a no-op, and 24 RLS/function checks pass (§7), including service-role cases.

## 1. What exists today (read from the live catalog, 2026-09-28)

| Table | Rows | RLS | Client grants | Policies |
|---|---|---|---|---|
| `profiles` | 1 | on | authenticated: SELECT, INSERT, UPDATE (all columns) | view / insert / update own |
| `touchpoints` | 0 | on | none | "view active" (authenticated) |
| `touch_events` | 0 | on | none | view own; **insert own** |
| `projects`, `products`, `product_variants` | 0 | on | none | view active |

Also: anon/authenticated hold TRUNCATE/TRIGGER/REFERENCES on every public table; no storage buckets;
no auth triggers; one event trigger (`rls_auto_enable`) that turns RLS on for new public tables;
no migration history. Auth: email on (confirmation required), **phone off**, SMS provider "twilio" selected but not enabled.

**Two defects fixed by migration 1:**
1. `update profiles set role = 'admin' where id = auth.uid()` passes today — any user can make themselves admin.
2. The `touch_events` INSERT policy would allow forged check-ins as soon as an INSERT grant exists.

## 2. Files

| File | Purpose |
|---|---|
| `migrations/20260916000000_baseline.sql` | The existing schema, for the record. **Not pushed** — marked applied with `migration repair`. All `IF NOT EXISTS`. |
| `migrations/20260928100000_harden_existing.sql` | Helpers, profiles column grants, `preferred_locale`, drop forged-touch policy, revoke TRUNCATE etc. |
| `migrations/20260928100100_places.sql` | `places`, `place_translations`, `place_sources` |
| `migrations/20260928100200_touch.sql` | Extend `touchpoints` / `touch_events`; `resolve_touch_point`, `record_touch`, `place_touches_today` |
| `migrations/20260928100300_memories.sql` | `memories`, `memory_photos`, buckets `memory-photos` (private), `place-media` (public) |
| `migrations/20260928100400_events_suggestions.sql` | `place_events`, `place_event_translations`, `place_suggestions`, bucket `suggestion-photos` |
| `migrations/20260928100500_seed_sado.sql` | 佐渡 region + 5 destinations, 18 translations, 19 sources |
| `fixtures/sprint4a_test_touchpoint.sql` | **Not a migration.** Test Touch Point at トキの森公園 + your profile → admin |

## 3. Operations, classified

Nothing in this set is **destructive**: no table or column is dropped, no row is deleted or rewritten,
no type is changed. "Potentially destructive" below means a *privilege or policy* is narrowed.

| # | Operation | Class | Existing data affected? |
|---|---|---|---|
| 1.1 | create `set_updated_at`, `generate_public_id`, `is_admin` | non-destructive | no |
| 1.2 | profiles: revoke table INSERT/UPDATE; grant INSERT (id, display_name, avatar_url, age_range, nationality, gender), UPDATE (same + preferred_locale) | **potentially destructive** — clients can no longer write `role`, `created_at`, `updated_at`. The app never writes them. | no |
| 1.3 | profiles: add `preferred_locale` (nullable, checked) | non-destructive | no (null for your row) |
| 1.4 | profiles: `updated_at` trigger | non-destructive | only on future updates |
| 1.5 | drop policy "Users can create own touch events" | **potentially destructive** — removes a capability (inert today: no grant) | no |
| 1.6 | revoke TRUNCATE/TRIGGER/REFERENCES from anon, authenticated (all public tables) | **potentially destructive** — no client uses them; TRUNCATE bypasses RLS | no |
| 2.x | create places / place_translations / place_sources + policies + grants | non-destructive | no |
| 3.1 | touchpoints: add `place_id` (nullable FK), `public_id` (NOT NULL, random default), `is_test` (default false) | non-destructive (0 rows today; any row would get a random id) | no |
| 3.2 | touchpoints: unique index on `public_id`, index on `place_id`, `updated_at` trigger | non-destructive | no |
| 3.3 | touchpoints: replace "Authenticated users can view active touchpoints" with "Active touchpoints are visible" (anon + authenticated, hides test points from non-admins) | **potentially destructive** (policy replaced) | no |
| 3.4 | touchpoints: column SELECT grant **excluding `code`, `public_id`** | non-destructive (there was no grant) | no |
| 3.5 | touch_events: add `place_id`, `local_date`, `is_test`; 3 indexes; SELECT grant (own rows via existing policy) | non-destructive | no (0 rows) |
| 3.6 | create 3 functions (SECURITY DEFINER, `search_path = ''`) | non-destructive | no |
| 4.x | create memories / memory_photos + policies; 2 buckets; 3 storage policies | non-destructive | no |
| 5.x | create place_events / place_event_translations / place_suggestions + policies; 1 bucket; 2 storage policies | non-destructive | no |
| 6.x | seed inserts, `ON CONFLICT DO NOTHING` | non-destructive | no |
| F.1 | fixture: insert test touchpoint | non-destructive (test data, `is_test = true`) | no |
| F.2 | fixture: `update profiles set role = 'admin' where id = '6cbea5d3…' and role = 'user'` | **data change on your row** | yes — your `role` |

## 4. New tables (summary — full definitions in the SQL)

- **places** — `slug` (unique), `parent_id` → places (RESTRICT), `kind` region|destination, `native_name`,
  `romanized_name`, lat/lng (range-checked), `timezone`, `official_url` (https), `status` draft|published|archived,
  `discovery_enabled`, `partner_status` none|partner (staff only), `hero_image_path/credit`, `label_side`, timestamps.
- **place_translations** — PK (place_id, locale); every text optional: `name`, `official_name`, `locality`,
  `short_description`, `description`, `practical_info` (jsonb: hours/closed/admission/access),
  `practical_info_as_of` (date — shown as "as of"), `source_url`, `content_checked_at`, `updated_at` (LINKA's last edit).
  Timeless descriptions carry no "as of"; only `practical_info` does.
- **place_sources** — every URL a place's facts rest on, what it `covers`, `publisher`, `checked_at`, `note`.
- **memories** — one per touch event (`touch_event_id` unique, CASCADE), `note` ≤ 4000, `cover_photo_id` → memory_photos (SET NULL), `visibility` = 'private' only.
- **memory_photos** — `storage_path` must start with the owner's id; width/height; `position`.
- **place_events** (+ **place_event_translations**) — start/end (checked), status draft|published|cancelled, official/source URL, `checked_at`.
- **place_suggestions** — name, address and/or coordinates (one required), reason, reference URL, photo path, locale,
  status pending|approved|rejected, reviewer fields. Nothing reads it into `places`.

**Indexes:** places(parent_id), places(status) partial; place_sources(place_id); touchpoints(public_id) unique,
touchpoints(place_id); touch_events(user_id, touched_at desc), (touchpoint_id, user_id, touched_at desc),
(place_id, local_date) where not test; memories(user_id, place_id), unique(touch_event_id);
memory_photos(memory_id, position), unique(storage_path); place_events(place_id, starts_at);
place_suggestions(user_id, created_at desc), (status, created_at).

## 5. RLS policies after the migrations

Retained unchanged: profiles × 3 (own row), projects/products/product_variants "view active", touch_events "view own".

| Table | Policy | Roles | Rule |
|---|---|---|---|
| places | Published places are public | anon, authenticated | SELECT where `status = 'published'` |
| place_translations | Translations of published places are public | anon, authenticated | SELECT if place published |
| place_sources | Sources of published places are public | anon, authenticated | SELECT if place published |
| touchpoints | Active touchpoints are visible | anon, authenticated | SELECT `is_active and (not is_test or is_admin())` — columns exclude `code`, `public_id` |
| memories | Users read / update / delete own memories | authenticated | `user_id = auth.uid()`; update may only set a cover photo belonging to this memory |
| memories | Users create memories for their own touches | authenticated | own, and the touch event is the caller's at the same place |
| memory_photos | read / update / delete own; add photos to own memories | authenticated | `user_id = auth.uid()`; insert only into the caller's memory; path check constraint |
| place_events | Published events of published places are public | anon, authenticated | published or cancelled, place published |
| place_event_translations | Translations of public events are public | anon, authenticated | as above |
| place_suggestions | Users submit pending suggestions | authenticated | own, `status = 'pending'`; column grant forbids naming status/reviewer fields |
| place_suggestions | Users read own suggestions | authenticated | own |
| place_suggestions | Admins read all / moderate others' suggestions | authenticated | `is_admin()`; an admin cannot moderate their own, and `reviewed_by` must be null or the admin themselves |
| storage.objects | Memory photos: owner reads / uploads / deletes | authenticated | bucket `memory-photos`, first folder = `auth.uid()` |
| storage.objects | Suggestion photos: owner uploads; owner or admin reads | authenticated | bucket `suggestion-photos` |

**service_role** (server-side only) gets explicit grants: full DML on the new content tables, memories, memory_photos,
place_suggestions and touchpoints; SELECT only on touch_events; EXECUTE on generate_public_id, resolve_touch_point and
place_touches_today — never record_touch.

No client can INSERT/UPDATE/DELETE places, translations, sources, events, touchpoints or touch_events.
Touches are written only by `record_touch()`.

**Functions:** `resolve_touch_point(public_id)` (anon, authenticated) — returns the point and its place, nothing for
unknown/retired/unpublished points, nothing for test points unless admin. `record_touch(public_id)` (authenticated) —
requires a profile; 10-minute duplicate window per user + point (advisory-locked); stores `local_date` in the place's
timezone; test points admin-only and flagged `is_test`. `place_touches_today(place_id)` (anon, authenticated) — count
only, excludes test touches, uses the place's calendar day. `is_admin()` answers only about the caller.

**Known limit:** `record_touch` proves possession of the URL, not physical presence. Signed tags (NTAG 424 SUN) are a later sprint.

## 6. Auth configuration that SQL cannot set (dashboard)

1. **URL Configuration → Redirect URLs:** add `http://localhost:5173/auth/reset` and the production origin's `/auth/reset`. Set **Site URL** to the production origin. Without this, recovery links are rejected.
2. **Email templates:** "Confirm signup" and "Magic Link" must contain `{{ .Token }}` (the 6-digit code; OTP works today, so check both are consistent). Leave "Reset Password" on `{{ .ConfirmationURL }}`.
3. **Password policy:** minimum length ≥ 8 (the app enforces 8); consider leaked-password protection.
4. **Phone:** enable the Phone provider, add SMS provider credentials (Twilio etc.), confirm the SMS template carries the code. Until then the app shows phone as unavailable (it reads `/auth/v1/settings`) — no fake SMS.
5. **Before launch:** custom SMTP (the built-in sender is heavily rate-limited) and CAPTCHA on sign-up / code sending.

## 7. Local verification (all passed)

Self-promotion to admin denied · own profile + onboarding upsert allowed · other's profile untouched ·
anon reads 6 published places / 18 translations · anon cannot see the test point, cannot read `public_id`,
cannot resolve or record a touch · ordinary user cannot see/resolve/touch the test point · direct INSERT into
touch_events denied · admin resolves and records; second tap within 10 min returns `duplicate = true`,
`local_date` = place date · test touches count 0 in `place_touches_today` · memory + photo + cover for own touch ·
photo path in another user's folder rejected · storage upload outside own folder rejected · other user sees 0
memories/photos/objects, cannot attach a memory to someone else's touch or to an unknown touch · suggestion
cannot be inserted as `approved` · pending insert allowed · owner cannot approve own · admin approves others,
not own · approval creates no place · anon cannot read suggestions · anon TRUNCATE denied.

## 8. To apply (only after approval)

```sh
supabase migration repair --status applied 20260916000000      # record the baseline, run nothing
supabase db push --dry-run                                      # must list exactly the 6 files dated 20260928…
supabase db push
supabase db query --linked -f supabase/fixtures/sprint4a_test_touchpoint.sql   # separate approval (F.1, F.2)
supabase gen types typescript --linked > src/types/database.types.ts
```
