-- ============================================================================
-- DOWN for 20260930100000_visits.sql — PENDING REVIEW. NOT A MIGRATION.
-- Kept beside the pending file; never place it in supabase/migrations/.
-- Run only by hand, only after explicit approval, as one transaction:
--
--   psql "$DB_URL" --single-transaction -v ON_ERROR_STOP=1 -f 20260930100000_visits.down.sql
--
-- Returns the schema to its state after 20260929100000_demo_final.sql:
--   · memories point at a touch again (touch_event_id NOT NULL, unique, cascade)
--   · record_touch() returns no visit_id
--   · visits, touch_events.visit_id and memories.visit_id are dropped
--
-- NOT undone: memories that the up-migration merged stay merged (one memory
-- holding every note and photo of that visit). Nothing is lost, but the
-- per-tap split does not come back.
-- A memory created after the up-migration is re-attached to the first touch
-- of its visit.
-- ============================================================================

-- ─── 1. memories → touch again ──────────────────────────────────────────────

update public.memories m
set touch_event_id = (
  select e.id from public.touch_events e
  where e.visit_id = m.visit_id
  order by e.touched_at, e.id
  limit 1
)
where m.touch_event_id is null;

do $$
begin
  if exists (select 1 from public.memories where touch_event_id is null) then
    raise exception 'visits down: % memories have no touch to return to — resolve by hand first',
      (select count(*) from public.memories where touch_event_id is null);
  end if;
end
$$;

alter table public.memories drop constraint memories_touch_event_id_fkey;
alter table public.memories alter column touch_event_id set not null;
alter table public.memories add constraint memories_touch_event_id_key unique (touch_event_id);
alter table public.memories
  add constraint memories_touch_event_id_fkey
  foreign key (touch_event_id) references public.touch_events (id) on delete cascade;

drop policy if exists "Users create memories for their own visits" on public.memories;
create policy "Users create memories for their own touches"
  on public.memories for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (
      select 1 from public.touch_events e
      where e.id = touch_event_id
        and e.user_id = (select auth.uid())
        and e.place_id = memories.place_id
    )
  );

revoke insert (visit_id, place_id, note, cover_photo_id, mood) on public.memories from authenticated;
grant insert (place_id, touch_event_id, note, cover_photo_id, mood) on public.memories to authenticated;

-- Drops memories_visit_id_key and its foreign key with it.
alter table public.memories drop column visit_id;

-- ─── 2. record_touch without visits (the 20260929100000 version) ────────────

drop function public.record_touch(text);

create function public.record_touch(p_public_id text)
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

revoke execute on function public.record_touch(text) from public, anon, service_role;
grant execute on function public.record_touch(text) to authenticated;

-- ─── 3. touch_events, visits ────────────────────────────────────────────────

drop index if exists public.touch_events_visit_idx;
alter table public.touch_events drop column visit_id;
-- As before the up-migration (record_touch always fills them regardless).
alter table public.touch_events
  alter column place_id drop not null,
  alter column local_date drop not null;

-- Policies, trigger and indexes go with the table.
drop table public.visits;
