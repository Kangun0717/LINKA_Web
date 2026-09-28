-- ============================================================================
-- Sprint 4A · 3/6 — Touch Points belong to places; touches are recorded only
-- through record_touch(). Extends the existing (empty) touchpoints and
-- touch_events tables with nullable/defaulted columns only.
-- ============================================================================

-- ─── touchpoints ────────────────────────────────────────────────────────────

alter table public.touchpoints
  add column if not exists place_id uuid references public.places (id) on delete restrict,
  -- What the NFC tag's URL carries: /t/:public_id. Random, not the row id, and
  -- never readable through the Data API (see grants below).
  add column if not exists public_id text not null default public.generate_public_id()
    check (public_id ~ '^[A-Za-z0-9_-]{16,64}$'),
  -- A development/test point. Only admins can touch it, and its touches are
  -- flagged is_test so they never count as real LINKA activity.
  add column if not exists is_test boolean not null default false;

create unique index if not exists touchpoints_public_id_key on public.touchpoints (public_id);
create index if not exists touchpoints_place_id_idx on public.touchpoints (place_id);

drop trigger if exists touchpoints_set_updated_at on public.touchpoints;
create trigger touchpoints_set_updated_at before update on public.touchpoints
  for each row execute function public.set_updated_at();

-- Test points are invisible to everyone but admins (so "0 / 1 Touch Points"
-- never appears for a point that is not real). Replaces the existing policy.
drop policy if exists "Authenticated users can view active touchpoints" on public.touchpoints;
create policy "Active touchpoints are visible"
  on public.touchpoints for select to anon, authenticated
  using (is_active = true and (is_test = false or public.is_admin()));

-- Column grants: everything except `code` and `public_id`. Knowing a public_id
-- is what lets someone check in, so it is resolved only by the functions below.
revoke all on public.touchpoints from anon, authenticated;
grant select (id, place_id, project_id, name, touchpoint_type, description, latitude, longitude,
              cover_image_url, is_active, is_test, access_mode, created_at, updated_at)
  on public.touchpoints to anon, authenticated;

-- ─── touch_events ───────────────────────────────────────────────────────────

alter table public.touch_events
  add column if not exists place_id uuid references public.places (id) on delete restrict,
  -- The calendar date AT THE PLACE when the touch happened (the locked
  -- date rule): fixed at write time from places.timezone, never re-derived
  -- from the viewer's clock.
  add column if not exists local_date date,
  add column if not exists is_test boolean not null default false;

create index if not exists touch_events_user_touched_idx on public.touch_events (user_id, touched_at desc);
create index if not exists touch_events_touchpoint_user_idx on public.touch_events (touchpoint_id, user_id, touched_at desc);
create index if not exists touch_events_place_day_idx on public.touch_events (place_id, local_date) where is_test = false;

-- Own touches only (existing policy "Users can view own touch events" is kept).
revoke all on public.touch_events from anon, authenticated;
grant select on public.touch_events to authenticated;

-- ─── functions ──────────────────────────────────────────────────────────────

-- What an NFC URL points at. Callable signed out, so the tap can show the
-- place before asking anyone to sign in. Returns nothing for unknown, retired
-- or unpublished points, and nothing for a test point unless the caller is an admin.
create or replace function public.resolve_touch_point(p_public_id text)
returns table (
  touchpoint_id uuid,
  touchpoint_name text,
  access_mode text,
  is_test boolean,
  place_id uuid,
  place_slug text
)
language sql
stable
security definer
set search_path = ''
as $$
  select t.id, t.name, t.access_mode, t.is_test, p.id, p.slug
  from public.touchpoints t
  join public.places p on p.id = t.place_id
  where t.public_id = p_public_id
    and t.is_active
    and p.status = 'published'
    and (not t.is_test or public.is_admin())
$$;

-- Records a Touch for the signed-in user.
--
-- A second tap on the same point by the same user within 10 minutes returns
-- the first event instead of creating another (accidental double taps). The
-- advisory lock makes that check safe against two taps arriving at once.
--
-- This does NOT prove physical presence: anyone holding the URL can call it.
-- Signed tags (e.g. NTAG 424 SUN messages) are a later sprint.
create or replace function public.record_touch(p_public_id text)
returns table (
  touch_event_id uuid,
  place_id uuid,
  touched_at timestamptz,
  local_date date,
  is_test boolean,
  duplicate boolean
)
language plpgsql
volatile
security definer
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_user uuid := auth.uid();
  v_point public.touchpoints%rowtype;
  v_place public.places%rowtype;
  v_existing public.touch_events%rowtype;
  v_new public.touch_events%rowtype;
begin
  if v_user is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select * into v_point from public.touchpoints t
  where t.public_id = p_public_id and t.is_active;
  if not found or v_point.place_id is null then
    raise exception 'touch_point_not_found' using errcode = 'P0002';
  end if;

  if v_point.is_test and not public.is_admin() then
    raise exception 'touch_point_not_found' using errcode = 'P0002';
  end if;

  select * into v_place from public.places p
  where p.id = v_point.place_id and p.status = 'published';
  if not found then
    raise exception 'touch_point_not_found' using errcode = 'P0002';
  end if;

  if not exists (select 1 from public.profiles where id = v_user) then
    raise exception 'profile_required' using errcode = 'P0001';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(v_user::text || ':' || v_point.id::text, 0));

  select * into v_existing from public.touch_events e
  where e.user_id = v_user
    and e.touchpoint_id = v_point.id
    and e.touched_at > now() - interval '10 minutes'
  order by e.touched_at desc
  limit 1;

  if found then
    return query select v_existing.id, v_existing.place_id, v_existing.touched_at,
                        v_existing.local_date, v_existing.is_test, true;
    return;
  end if;

  insert into public.touch_events (user_id, touchpoint_id, place_id, touched_at, local_date, source, is_test)
  values (v_user, v_point.id, v_place.id, now(),
          (now() at time zone v_place.timezone)::date, 'nfc', v_point.is_test)
  returning * into v_new;

  return query select v_new.id, v_new.place_id, v_new.touched_at, v_new.local_date, v_new.is_test, false;
end;
$$;

-- Today's real LINKA touches at a place (its own calendar day). Test touches
-- never count. Returns an aggregate only — never who.
create or replace function public.place_touches_today(p_place_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(*)::integer
  from public.touch_events e
  join public.places p on p.id = e.place_id
  where e.place_id = p_place_id
    and p.status = 'published'
    and e.is_test = false
    and e.local_date = (now() at time zone p.timezone)::date
$$;

revoke execute on function public.resolve_touch_point(text) from public;
revoke execute on function public.record_touch(text) from public, anon;
revoke execute on function public.place_touches_today(uuid) from public;
grant execute on function public.resolve_touch_point(text) to anon, authenticated;
grant execute on function public.record_touch(text) to authenticated;
grant execute on function public.place_touches_today(uuid) to anon, authenticated;
-- record_touch is deliberately NOT granted to service_role: it needs a real
-- signed-in user (auth.uid()), and staff must never create touches.
grant execute on function public.resolve_touch_point(text), public.place_touches_today(uuid) to service_role;

-- Staff tooling manages Touch Points; touch_events stay read-only for it.
grant select, insert, update, delete on public.touchpoints to service_role;
grant select on public.touch_events to service_role;
