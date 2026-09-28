-- ============================================================================
-- Sprint 4A · 1/6 — close two holes in the existing schema, add shared helpers.
-- Touches no rows.
-- ============================================================================

-- ─── helpers ────────────────────────────────────────────────────────────────

-- Keeps updated_at honest on every table that has one.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- A URL-safe, non-sequential public identifier (22 chars, 122 random bits).
-- Uses only core gen_random_uuid(), so it does not depend on pgcrypto's schema.
create or replace function public.generate_public_id()
returns text
language sql
volatile
set search_path = ''
as $$
  select translate(rtrim(encode(uuid_send(gen_random_uuid()), 'base64'), '='), '+/', '-_')
$$;

-- Moderation / test-touch gate. SECURITY DEFINER so it can read the caller's
-- role without the caller needing any extra grant; it only ever answers about
-- the caller.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  )
$$;

revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.generate_public_id() from public, anon, authenticated;
revoke execute on function public.is_admin() from public;
-- anon needs it too: RLS policies that call it are evaluated for signed-out
-- reads, and it simply answers false there.
grant execute on function public.is_admin() to anon, authenticated;
-- The service role (staff tooling, never the browser) inserts touchpoints, whose
-- public_id default calls generate_public_id(); without this the insert fails.
grant execute on function public.generate_public_id() to service_role;

-- ─── profiles: a user must not be able to change their own role ─────────────
-- Today `authenticated` holds table-wide INSERT/UPDATE, so
--   update profiles set role = 'admin' where id = auth.uid()
-- passes RLS. Replace with column grants that leave out role/id/timestamps.

revoke insert, update on public.profiles from authenticated;
grant insert (id, display_name, avatar_url, age_range, nationality, gender) on public.profiles to authenticated;
-- `id` is included only because the onboarding upsert (INSERT … ON CONFLICT DO
-- UPDATE) names it in its SET list; RLS pins it to auth.uid(), so it cannot move.
grant update (id, display_name, avatar_url, age_range, nationality, gender) on public.profiles to authenticated;

alter table public.profiles
  add column if not exists preferred_locale text
  check (preferred_locale is null or preferred_locale = any (array['ja', 'en', 'zh-Hans']));
grant update (preferred_locale) on public.profiles to authenticated;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ─── touch_events: touches are written only by record_touch() ───────────────
-- The INSERT policy would let a client insert a check-in for any Touch Point
-- (it is inert today only because no INSERT grant exists). Removed so that a
-- future grant cannot silently re-open it.

drop policy if exists "Users can create own touch events" on public.touch_events;

-- ─── TRUNCATE is never a client operation ───────────────────────────────────
-- anon/authenticated currently hold TRUNCATE (and TRIGGER/REFERENCES) on every
-- public table. PostgREST cannot issue TRUNCATE, but it bypasses RLS, so it
-- should not be held at all.

revoke truncate, trigger, references on all tables in schema public from anon, authenticated;
