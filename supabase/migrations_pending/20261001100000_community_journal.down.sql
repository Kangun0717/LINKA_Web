-- ============================================================================
-- DOWN for 20261001100000_community_journal.sql — PENDING REVIEW. NOT A
-- MIGRATION. Never place it in supabase/migrations/. Run by hand only, after
-- explicit approval, as one transaction.
--
-- Refuses to run while any past journal entry exists (it would be lost).
-- Community rows created since (supports, suggestion photos, timeline
-- events, the rate-limit settings and log) ARE dropped with their tables;
-- suggestions themselves are kept, minus the new columns — including
-- public_reason, so LINKA's moderated public text is lost (the proposer's
-- original reason is untouched). Objects in community-media are not deleted (the
-- bucket row is only removed when empty — remove the objects first).
-- ============================================================================

do $$
begin
  if exists (select 1 from public.memories where kind = 'past') then
    raise exception 'community_journal down: % past journal entries exist — export them first',
      (select count(*) from public.memories where kind = 'past');
  end if;
end
$$;

-- ─── B. Community ──────────────────────────────────────────────────────────

drop policy if exists "Suggestion photos: owner deletes" on storage.objects;
delete from storage.buckets where id = 'community-media' and not exists (select 1 from storage.objects where bucket_id = 'community-media');

drop function if exists public.community_suggestions(text[], integer);
drop function if exists public.community_suggestion(uuid);
drop function if exists public.community_suggestion_timeline(uuid);
drop function if exists public.is_public_suggestion_status(text);
drop function if exists public.withdraw_suggestion(uuid);

-- B8: the triggers on the remaining table go explicitly; the others go with their tables.
drop trigger if exists place_suggestions_rate_limit on public.place_suggestions;
drop table if exists public.community_action_log;
drop table if exists public.community_rate_limits;

drop trigger if exists place_suggestions_guard on public.place_suggestions;
drop function if exists public.place_suggestion_guard();

drop trigger if exists place_suggestions_status_changed on public.place_suggestions;
drop function if exists public.place_suggestion_status_changed();

drop table if exists public.place_suggestion_events;
drop table if exists public.place_suggestion_photos;
drop table if exists public.place_suggestion_supports; -- takes its count, guard and rate-limit triggers with it
drop function if exists public.place_suggestion_support_count();
drop function if exists public.place_suggestion_support_guard();
drop function if exists public.suggestion_accepts_support(uuid);
drop function if exists public.suggestion_support_open(uuid);
drop function if exists public.community_rate_limit();

drop policy if exists "Users edit own unopened suggestions" on public.place_suggestions;
revoke update (name, address, latitude, longitude, reason, reference_url, attribution) on public.place_suggestions from authenticated;
revoke insert (attribution) on public.place_suggestions from authenticated;
drop index if exists public.place_suggestions_public_idx;
alter table public.place_suggestions
  drop column attribution,
  drop column public_area,
  drop column public_reason,
  drop column public_latitude,
  drop column public_longitude,
  drop column region_id,
  drop column place_id,
  drop column duplicate_of,
  drop column support_count,
  drop column opened_at,
  drop column published_at,
  drop column withdrawn_at;

-- ─── A. Past journal entries ───────────────────────────────────────────────

drop policy if exists "Users create past journal entries" on public.memories;
drop policy if exists "Users update own memories" on public.memories;
create policy "Users update own memories"
  on public.memories for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (cover_photo_id is null or exists (
      select 1 from public.memory_photos ph
      where ph.id = cover_photo_id and ph.memory_id = memories.id
    ))
  );

revoke insert (kind, place_label, remembered_on, date_precision) on public.memories from authenticated;
revoke update (place_id, place_label, remembered_on, date_precision) on public.memories from authenticated;

drop index if exists public.memories_user_remembered_idx;
alter table public.memories
  drop constraint memories_kind_visit,
  drop constraint memories_visit_has_place,
  drop constraint memories_past_has_where,
  drop constraint memories_visit_has_no_own_date;
alter table public.memories
  drop column kind,
  drop column place_label,
  drop column remembered_on,
  drop column date_precision;
alter table public.memories alter column visit_id set not null;
alter table public.memories alter column place_id set not null;
