-- ============================================================================
-- Sprint 4B-1 · Visits — PENDING REVIEW. Not in supabase/migrations/, so
-- `db push` cannot apply it. On approval: move into supabase/migrations/.
--
-- Decision 2 (2026-09-28): one user + one place + one local date = one visit.
-- A visit gathers every touch that user made at that place that day, from any
-- of its Touch Points. The memory (note, mood, photos) belongs to the visit,
-- not to a single tap.
--
-- REQUIRES 20260929100000_demo_final.sql first (memories.mood). Checked below.
--
-- What it does, in order:
--   1. visits table (read-only to clients; written only by record_touch)
--   2. one visit per existing (user, place, local_date) group of touch_events
--   3. touch_events.visit_id (NOT NULL); place_id / local_date made NOT NULL
--   4. memories.visit_id (NOT NULL, unique). If one visit already has several
--      memories (one per tap), they are merged into the earliest — see §4.
--   5. memories RLS / grants re-pointed from touch_event_id to visit_id;
--      touch_event_id kept as a nullable legacy column (drop in 4B-2)
--   6. record_touch() creates or extends the day's visit and returns visit_id
--
-- place_visitors_today() is unchanged: it already counts distinct accounts
-- per place per local day from touch_events, which is exactly a count of
-- real visits.
-- ============================================================================

do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'memories' and column_name = 'mood'
  ) then
    raise exception 'visits: apply 20260929100000_demo_final.sql first (memories.mood is missing)';
  end if;

  -- record_touch has always written both; a row without them cannot be placed in a visit.
  if exists (select 1 from public.touch_events where place_id is null or local_date is null) then
    raise exception 'visits: % touch_events have no place_id or local_date — resolve them before applying',
      (select count(*) from public.touch_events where place_id is null or local_date is null);
  end if;
end
$$;

-- ─── 1. visits ──────────────────────────────────────────────────────────────

create table public.visits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete restrict,
  -- The calendar date AT THE PLACE (the locked date rule), copied from the
  -- touches — never derived from the viewer's clock.
  local_date date not null,
  first_touched_at timestamptz not null,
  last_touched_at timestamptz not null,
  -- True only while every touch in the visit is a test touch: one real touch
  -- makes it a real visit.
  is_test boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint visits_one_per_day unique (user_id, place_id, local_date),
  constraint visits_touch_order check (last_touched_at >= first_touched_at)
);

create index visits_user_date_idx on public.visits (user_id, local_date desc);
create index visits_place_date_idx on public.visits (place_id, local_date) where is_test = false;

create trigger visits_set_updated_at before update on public.visits
  for each row execute function public.set_updated_at();

alter table public.visits enable row level security;

create policy "Users read own visits"
  on public.visits for select to authenticated
  using ((select auth.uid()) = user_id);

-- No client writes: a visit exists only because record_touch() recorded a touch.
revoke all on public.visits from anon, authenticated, service_role;
grant select on public.visits to authenticated;
-- Staff tooling reads; it never creates visits (as with touch_events).
grant select on public.visits to service_role;

-- ─── 2. backfill visits from existing touches ───────────────────────────────

insert into public.visits (user_id, place_id, local_date, first_touched_at, last_touched_at, is_test)
select e.user_id, e.place_id, e.local_date, min(e.touched_at), max(e.touched_at), bool_and(e.is_test)
from public.touch_events e
group by e.user_id, e.place_id, e.local_date;

-- ─── 3. touch_events → visit ────────────────────────────────────────────────

alter table public.touch_events
  add column visit_id uuid references public.visits (id) on delete cascade;

update public.touch_events e
set visit_id = v.id
from public.visits v
where v.user_id = e.user_id and v.place_id = e.place_id and v.local_date = e.local_date;

alter table public.touch_events
  alter column visit_id set not null,
  alter column place_id set not null,
  alter column local_date set not null;

create index touch_events_visit_idx on public.touch_events (visit_id, touched_at);

-- ─── 4. memories → visit (merging per-tap memories of the same visit) ───────
--
-- Before this, each tap could carry its own memory. Where one visit now has
-- several, they become one, and nothing the user wrote or uploaded is lost:
--   survivor  = the earliest-created memory of the visit
--   photos    = all of them, moved to the survivor, earlier memory first,
--               then by their own order (storage objects are not moved; the
--               path check only requires the owner's folder, which is unchanged)
--   note      = every non-empty note, verbatim, oldest first, separated by a
--               blank line (the migration stops rather than truncate > 4000)
--   mood      = the survivor's, else the earliest one set
--   cover     = the survivor's, else the earliest one set
-- The merged-away rows are then deleted. This step cannot be undone by a
-- rollback (see the review notes).

alter table public.memories
  add column visit_id uuid references public.visits (id) on delete cascade;

update public.memories m
set visit_id = e.visit_id
from public.touch_events e
where e.id = m.touch_event_id;

create temporary table visit_memory_merge as
select m.id,
       m.visit_id,
       first_value(m.id) over (partition by m.visit_id order by m.created_at, m.id) as survivor_id,
       row_number() over (partition by m.visit_id order by m.created_at, m.id) as rank,
       count(*) over (partition by m.visit_id) as siblings
from public.memories m;

do $$
declare
  v_visits integer;
  v_merged integer;
  v_too_long uuid;
begin
  select count(distinct visit_id), count(*) filter (where rank > 1)
  into v_visits, v_merged
  from visit_memory_merge where siblings > 1;

  select mm.survivor_id into v_too_long
  from visit_memory_merge mm
  join public.memories m on m.id = mm.id
  where mm.siblings > 1 and m.note is not null and btrim(m.note) <> ''
  group by mm.survivor_id
  having sum(char_length(m.note)) + 2 * (count(*) - 1) > 4000
  limit 1;

  if v_too_long is not null then
    raise exception 'visits: merged note for memory % would exceed 4000 characters — resolve by hand first', v_too_long;
  end if;

  raise notice 'visits: % visit(s) had several memories; % memory row(s) will be merged into their visit''s earliest', v_visits, v_merged;
end
$$;

-- Photos: renumber within the survivor.
with ordered as (
  select ph.id,
         mm.survivor_id,
         row_number() over (partition by mm.survivor_id order by mm.rank, ph.position, ph.created_at, ph.id) - 1 as pos
  from public.memory_photos ph
  join visit_memory_merge mm on mm.id = ph.memory_id
  where mm.siblings > 1
)
update public.memory_photos ph
set memory_id = o.survivor_id, position = o.pos
from ordered o
where o.id = ph.id;

-- Note, mood and cover onto the survivor.
with merged as (
  select mm.survivor_id,
         string_agg(m.note, E'\n\n' order by mm.rank) filter (where m.note is not null and btrim(m.note) <> '') as note,
         (array_agg(m.mood order by mm.rank) filter (where m.mood is not null))[1] as mood,
         (array_agg(m.cover_photo_id order by mm.rank) filter (where m.cover_photo_id is not null))[1] as cover_photo_id
  from visit_memory_merge mm
  join public.memories m on m.id = mm.id
  where mm.siblings > 1
  group by mm.survivor_id
)
update public.memories m
set note = merged.note, mood = merged.mood, cover_photo_id = merged.cover_photo_id
from merged
where m.id = merged.survivor_id;

-- The merged-away memories (their photos have already moved).
delete from public.memories m
using visit_memory_merge mm
where mm.id = m.id and mm.rank > 1;

drop table visit_memory_merge;

alter table public.memories alter column visit_id set not null;
alter table public.memories add constraint memories_visit_id_key unique (visit_id);

-- touch_event_id: legacy. No longer unique, no longer required, and deleting
-- a touch no longer deletes the visit's memory. Dropped in 4B-2 once the app
-- has run on visit_id alone.
alter table public.memories drop constraint memories_touch_event_id_key;
alter table public.memories drop constraint memories_touch_event_id_fkey;
alter table public.memories alter column touch_event_id drop not null;
alter table public.memories
  add constraint memories_touch_event_id_fkey
  foreign key (touch_event_id) references public.touch_events (id) on delete set null;

-- ─── 5. memories RLS / grants ───────────────────────────────────────────────

drop policy if exists "Users create memories for their own touches" on public.memories;
create policy "Users create memories for their own visits"
  on public.memories for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.visits v
      where v.id = visit_id
        and v.user_id = (select auth.uid())
        and v.place_id = memories.place_id
    )
  );

-- Column privileges are revoked by column (a table-level REVOKE leaves them).
revoke insert (place_id, touch_event_id, note, cover_photo_id, mood) on public.memories from authenticated;
grant insert (visit_id, place_id, note, cover_photo_id, mood) on public.memories to authenticated;
-- UPDATE stays (note, cover_photo_id, mood): a memory can never move to another visit.

-- ─── 6. record_touch: create or extend the day's visit ──────────────────────
-- The return type gains visit_id, which CREATE OR REPLACE cannot do, so the
-- function is dropped and recreated in this transaction; grants are restated.
-- Behaviour is otherwise identical to 20260929100000 (demo access, 10-minute
-- duplicate window per point, is_test copied from the point).

drop function public.record_touch(text);

create function public.record_touch(p_public_id text)
returns table (
  touch_event_id uuid,
  visit_id uuid,
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
  v_now timestamptz := now();
  v_local date;
  v_point public.touchpoints%rowtype;
  v_place public.places%rowtype;
  v_existing public.touch_events%rowtype;
  v_visit uuid;
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

  if v_point.is_test and not (v_point.test_access = 'demo' or public.is_admin()) then
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
    and e.touched_at > v_now - interval '10 minutes'
  order by e.touched_at desc
  limit 1;

  if found then
    return query select v_existing.id, v_existing.visit_id, v_existing.place_id, v_existing.touched_at,
                        v_existing.local_date, v_existing.is_test, true;
    return;
  end if;

  v_local := (v_now at time zone v_place.timezone)::date;

  -- One visit per user, place and local day. Two Touch Points tapped at once
  -- take different advisory locks; the unique constraint settles that race.
  insert into public.visits as v (user_id, place_id, local_date, first_touched_at, last_touched_at, is_test)
  values (v_user, v_place.id, v_local, v_now, v_now, v_point.is_test)
  on conflict (user_id, place_id, local_date) do update
    set last_touched_at = greatest(v.last_touched_at, excluded.last_touched_at),
        is_test = v.is_test and excluded.is_test
  returning v.id into v_visit;

  insert into public.touch_events (user_id, touchpoint_id, place_id, visit_id, touched_at, local_date, source, is_test)
  values (v_user, v_point.id, v_place.id, v_visit, v_now, v_local, 'nfc', v_point.is_test)
  returning * into v_new;

  return query select v_new.id, v_new.visit_id, v_new.place_id, v_new.touched_at, v_new.local_date, v_new.is_test, false;
end;
$$;

revoke execute on function public.record_touch(text) from public, anon, service_role;
grant execute on function public.record_touch(text) to authenticated;
-- Still never service_role: a touch needs a real signed-in user.
