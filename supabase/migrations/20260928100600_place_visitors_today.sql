-- ============================================================================
-- Sprint 4A · 7 — PENDING REVIEW. Not in supabase/migrations/, so `db push`
-- cannot apply it. On approval: move it into supabase/migrations/ and push.
--
-- "People here today" means distinct real accounts, not taps. The existing
-- place_touches_today() counts touch events, so one person touching three
-- Touch Points (or returning after the 10-minute duplicate window) counts
-- several times. This adds the visitor count the Live Place Card will use,
-- and withdraws the event count from clients so it cannot be shown by
-- mistake. Nothing is dropped; no row is read or written by the migration.
-- ============================================================================

-- Distinct accounts that touched this place today — "today" being the
-- place's own calendar day (places.timezone), the same day touch_events
-- .local_date records. Test touches never count. Returns a number only.
create or replace function public.place_visitors_today(p_place_id uuid)
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select count(distinct e.user_id)::integer
  from public.touch_events e
  join public.places p on p.id = e.place_id
  where e.place_id = p_place_id
    and p.status = 'published'
    and e.is_test = false
    and e.local_date = (now() at time zone p.timezone)::date
$$;

revoke execute on function public.place_visitors_today(uuid) from public;
grant execute on function public.place_visitors_today(uuid) to anon, authenticated, service_role;

-- Lets the distinct count be answered from the index alone.
create index if not exists touch_events_place_day_user_idx
  on public.touch_events (place_id, local_date, user_id)
  where is_test = false;

-- The event count stays for staff analytics but is no longer callable from
-- the browser, so the UI cannot present taps as people.
revoke execute on function public.place_touches_today(uuid) from anon, authenticated;
