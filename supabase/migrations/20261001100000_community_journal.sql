-- ============================================================================
-- Sprint 4C · Community & Journal — PENDING REVIEW. Not in supabase/migrations/,
-- so `db push` cannot apply it. On approval: move into supabase/migrations/.
--
-- Two additions, kept strictly apart from verified presence:
--
--   A. Past Journal entries — memories of places visited before LINKA (or
--      without a Touch). A past entry is a memory with kind = 'past' and NO
--      visit. Nothing here touches `visits` or `touch_events`, so a past
--      entry cannot colour the map, count as a verified place, move region
--      progress or reach place_visitors_today(): those read visits / touches
--      only, and only record_touch() can create either.
--
--   B. Community — suggestions become public (after LINKA opens them), can be
--      supported ("行ってみたい"), carry moderated photos and a public
--      timeline. The public reads ONLY through SECURITY DEFINER functions
--      that return public-safe columns: never user_id, address, coordinates,
--      reviewer notes, internal notes or unmoderated photos.
--
-- No comments, follows, DMs or supporter lists — deliberately.
--
-- Review decisions (2026-09-29): a proposer cannot support their own
-- suggestion; support stays open until publication, then the count is
-- frozen; the proposer's original reason is never overwritten — the public
-- reads a separate, moderated public_reason; submissions, supports and
-- photos are rate-limited per account on the server (B8).
--
-- Nothing is dropped. memories.touch_event_id is kept.
-- Rows affected in production (read 2026-09-29): memories 1 (gains kind =
-- 'visit' by default), place_suggestions 0.
-- ============================================================================

-- ═══ A. PAST JOURNAL ENTRIES ═══════════════════════════════════════════════

alter table public.memories
  -- 'visit': the memory of a verified visit (as today). 'past': a journal
  -- entry about a place and time the user records themselves.
  add column kind text not null default 'visit' check (kind in ('visit', 'past')),
  -- A past entry may be somewhere LINKA has no page for: the user's own words.
  add column place_label text check (place_label is null or char_length(btrim(place_label)) between 1 and 120),
  -- When a past entry happened, as precisely as the user knows it.
  add column remembered_on date,
  add column date_precision text not null default 'day' check (date_precision in ('day', 'month', 'year'));

-- A verified memory keeps its visit and its place; a past entry has no visit.
alter table public.memories alter column visit_id drop not null;
alter table public.memories alter column place_id drop not null;
alter table public.memories
  add constraint memories_kind_visit check ((kind = 'visit') = (visit_id is not null)),
  add constraint memories_visit_has_place check (kind <> 'visit' or place_id is not null),
  add constraint memories_past_has_where check (kind <> 'past' or place_id is not null or place_label is not null),
  -- A verified memory's date is its visit's local date: it has no date of its own.
  add constraint memories_visit_has_no_own_date check (kind <> 'visit' or remembered_on is null);

create index memories_user_remembered_idx on public.memories (user_id, remembered_on desc) where kind = 'past';

-- Insert: the existing policy (own visit, same place) stays for verified
-- memories — the new check constraint ties it to kind = 'visit'. A past
-- entry needs no visit, but may only name a published place.
create policy "Users create past journal entries"
  on public.memories for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and kind = 'past'
    and visit_id is null
    and (place_id is null or exists (select 1 from public.places p where p.id = place_id and p.status = 'published'))
  );

-- Update: a verified memory can never move to another place; a past entry's
-- place may be corrected (to a published place, or to the user's own words).
drop policy "Users update own memories" on public.memories;
create policy "Users update own memories"
  on public.memories for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (cover_photo_id is null or exists (
      select 1 from public.memory_photos ph where ph.id = cover_photo_id and ph.memory_id = memories.id
    ))
    and (
      (kind = 'visit' and place_id = (select v.place_id from public.visits v where v.id = visit_id))
      or (kind = 'past' and (place_id is null or exists (select 1 from public.places p where p.id = place_id and p.status = 'published')))
    )
  );

grant insert (kind, place_label, remembered_on, date_precision) on public.memories to authenticated;
-- kind and visit_id are never updatable: an entry cannot become verified.
grant update (place_id, place_label, remembered_on, date_precision) on public.memories to authenticated;

-- ═══ B. COMMUNITY ══════════════════════════════════════════════════════════

-- ─── B1. place_suggestions: public-safe fields and links ───────────────────

alter table public.place_suggestions
  -- The proposer's choice. 'nickname' shows their display name publicly.
  add column attribution text not null default 'anonymous' check (attribution in ('nickname', 'anonymous')),
  -- Written by LINKA when opening it: the only location shown publicly
  -- (e.g. "佐渡・相川"). The proposer's address and coordinates never are.
  add column public_area text check (public_area is null or char_length(btrim(public_area)) between 1 and 120),
  -- What the public reads instead of `reason`. Copied from `reason` when
  -- LINKA opens the suggestion (unless LINKA sets it in the same update);
  -- LINKA may later redact it (or clear it). `reason` itself — the
  -- proposer's own words — is never changed by anyone but the proposer,
  -- and by them only before it opens (see place_suggestion_guard()).
  add column public_reason text check (public_reason is null or char_length(btrim(public_reason)) between 1 and 2000),
  -- An approximate point LINKA sets for the Community map (never copied from
  -- the proposer's own coordinates without review).
  add column public_latitude double precision check (public_latitude is null or public_latitude between -90 and 90),
  add column public_longitude double precision check (public_longitude is null or public_longitude between -180 and 180),
  -- The LINKA region it belongs to, and the LINKA place it became.
  add column region_id uuid references public.places (id) on delete set null,
  add column place_id uuid references public.places (id) on delete set null,
  add column duplicate_of uuid references public.place_suggestions (id) on delete set null,
  -- Kept in step by triggers, never by clients.
  add column support_count integer not null default 0 check (support_count >= 0),
  add column opened_at timestamptz,
  add column published_at timestamptz,
  add column withdrawn_at timestamptz,
  add constraint place_suggestions_public_point_pair check ((public_latitude is null) = (public_longitude is null));

create index place_suggestions_public_idx on public.place_suggestions (status, opened_at desc)
  where status in ('open', 'under_review', 'contacting_partner', 'approved', 'published');

-- The proposer may still edit a suggestion LINKA has not opened yet.
create policy "Users edit own unopened suggestions"
  on public.place_suggestions for update to authenticated
  using ((select auth.uid()) = user_id and status = 'submitted')
  with check ((select auth.uid()) = user_id and status = 'submitted' and reviewed_by is null);

grant insert (attribution) on public.place_suggestions to authenticated;
grant update (name, address, latitude, longitude, reason, reference_url, attribution) on public.place_suggestions to authenticated;
-- public_reason is deliberately in neither grant: only staff (service role) write it.

-- Two rules that hold for every role, staff tooling included (a trigger,
-- unlike RLS, also binds the service role):
--   · the original reason changes only by its proposer, only before opening;
--   · once published, support_count is frozen.
create or replace function public.place_suggestion_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.reason is distinct from old.reason
     and not (old.status = 'submitted' and old.user_id = auth.uid()) then
    raise exception 'original_reason_immutable' using errcode = '42501',
      hint = 'Moderate public_reason instead; the proposer''s reason is kept as written.';
  end if;
  if old.published_at is not null and new.support_count is distinct from old.support_count then
    raise exception 'support_count_frozen' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke execute on function public.place_suggestion_guard() from public, anon, authenticated;

create trigger place_suggestions_guard
  before update on public.place_suggestions
  for each row execute function public.place_suggestion_guard();

-- ─── B2. supports ("行ってみたい") ──────────────────────────────────────────
-- One per account per suggestion. Who supports is never public; only the count.
-- The count is interest from other people: a proposer cannot support their
-- own suggestion. Support is open from `open` through `approved` (準備中);
-- at publication the count is frozen: no new support, no withdrawal, and
-- later removals (e.g. a deleted account) leave the count as it was.

create table public.place_suggestion_supports (
  suggestion_id uuid not null references public.place_suggestions (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (suggestion_id, user_id)
);

create index place_suggestion_supports_user_idx on public.place_suggestion_supports (user_id, created_at desc);

alter table public.place_suggestion_supports enable row level security;

create policy "Users see their own supports"
  on public.place_suggestion_supports for select to authenticated
  using ((select auth.uid()) = user_id);

-- Whether a suggestion is public and not yet published: support may be
-- given or withdrawn. SECURITY DEFINER: supporters cannot read other
-- people's suggestion rows (RLS), and this answers only yes or no.
create or replace function public.suggestion_support_open(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.place_suggestions s
    where s.id = p_id
      and s.status in ('open', 'under_review', 'contacting_partner', 'approved')
      and s.published_at is null
  )
$$;

-- … and the caller may support it: it is not their own.
create or replace function public.suggestion_accepts_support(p_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.suggestion_support_open(p_id)
     and not exists (select 1 from public.place_suggestions s where s.id = p_id and s.user_id = auth.uid())
$$;
revoke execute on function public.suggestion_support_open(uuid), public.suggestion_accepts_support(uuid) from public, anon;
grant execute on function public.suggestion_support_open(uuid), public.suggestion_accepts_support(uuid) to authenticated, service_role;

create policy "Users support others' public suggestions"
  on public.place_suggestion_supports for insert to authenticated
  with check ((select auth.uid()) = user_id and public.suggestion_accepts_support(suggestion_id));

-- Only while support is open: after publication a support stays as given.
create policy "Users withdraw their own support"
  on public.place_suggestion_supports for delete to authenticated
  using ((select auth.uid()) = user_id and public.suggestion_support_open(suggestion_id));

-- The same rules as the insert policy, raised with a reason the app can
-- show (the policy alone only says "row-level security"). Runs before the
-- policy check and before the rate limit (trigger names sort g < r).
create or replace function public.place_suggestion_support_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.place_suggestions s where s.id = new.suggestion_id and s.user_id = auth.uid()) then
    raise exception 'own_suggestion' using errcode = '42501';
  end if;
  if not public.suggestion_support_open(new.suggestion_id) then
    raise exception 'support_closed' using errcode = '42501';
  end if;
  return new;
end;
$$;
revoke execute on function public.place_suggestion_support_guard() from public, anon, authenticated;

create trigger place_suggestion_supports_guard
  before insert on public.place_suggestion_supports
  for each row execute function public.place_suggestion_support_guard();

revoke all on public.place_suggestion_supports from anon, authenticated, service_role;
grant select, delete on public.place_suggestion_supports to authenticated;
grant insert (suggestion_id) on public.place_suggestion_supports to authenticated;
-- Staff can read and remove (e.g. a removed account's), never create one.
grant select, delete on public.place_suggestion_supports to service_role;

create or replace function public.place_suggestion_support_count()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- `published_at is null`: a published suggestion's count is frozen. A
  -- support racing the publication waits on the row lock, re-reads it as
  -- published and is not counted.
  if tg_op = 'INSERT' then
    update public.place_suggestions set support_count = support_count + 1
    where id = new.suggestion_id and published_at is null;
  else
    update public.place_suggestions set support_count = greatest(support_count - 1, 0)
    where id = old.suggestion_id and published_at is null;
  end if;
  return null;
end;
$$;
revoke execute on function public.place_suggestion_support_count() from public, anon, authenticated;

create trigger place_suggestion_supports_count
  after insert or delete on public.place_suggestion_supports
  for each row execute function public.place_suggestion_support_count();

-- ─── B3. suggestion photos ─────────────────────────────────────────────────
-- Uploaded privately (suggestion-photos). LINKA reviews each; an approved one
-- is copied by staff to the public community-media bucket (public_path).
-- The public only ever sees public_path.

create table public.place_suggestion_photos (
  id uuid primary key default gen_random_uuid(),
  suggestion_id uuid not null references public.place_suggestions (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  -- `<user_id>/<suggestion_id>/<uuid>.jpg` in the private suggestion-photos bucket.
  storage_path text not null unique,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  position smallint not null default 0,
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected')),
  -- Set by staff on approval: the copy in community-media.
  public_path text unique,
  created_at timestamptz not null default now(),
  constraint place_suggestion_photos_path_is_owners check (storage_path like user_id::text || '/%'),
  constraint place_suggestion_photos_public_only_if_approved check (public_path is null or review_status = 'approved')
);

create index place_suggestion_photos_suggestion_idx on public.place_suggestion_photos (suggestion_id, position);

alter table public.place_suggestion_photos enable row level security;

create policy "Users read their own suggestion photos"
  on public.place_suggestion_photos for select to authenticated
  using ((select auth.uid()) = user_id);

-- Added while the suggestion is theirs and not closed; always pending review.
create policy "Users add photos to their own suggestions"
  on public.place_suggestion_photos for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and review_status = 'pending'
    and exists (
      select 1 from public.place_suggestions s
      where s.id = suggestion_id and s.user_id = (select auth.uid())
        and s.status in ('submitted', 'open', 'under_review', 'contacting_partner', 'approved')
    )
  );

create policy "Users remove their own suggestion photos"
  on public.place_suggestion_photos for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.place_suggestion_photos from anon, authenticated, service_role;
grant select, delete on public.place_suggestion_photos to authenticated;
grant insert (suggestion_id, storage_path, width, height, position) on public.place_suggestion_photos to authenticated;
grant select, insert, update, delete on public.place_suggestion_photos to service_role;

-- ─── B4. timeline ──────────────────────────────────────────────────────────
-- A suggestion's journey into LINKA. Status changes are logged by trigger;
-- staff add updates and milestones. `public_note` (per locale) may be shown;
-- `internal_note` never leaves the database except to staff.

create table public.place_suggestion_events (
  id uuid primary key default gen_random_uuid(),
  -- Deferred: the status trigger logs a suggestion's first event before the
  -- suggestion row itself is stored (it is checked at the end of the statement).
  suggestion_id uuid not null references public.place_suggestions (id) on delete cascade deferrable initially deferred,
  kind text not null check (kind in ('status', 'update', 'milestone')),
  -- For kind = 'status': the stage entered.
  status text,
  public_note jsonb not null default '{}' check (jsonb_typeof(public_note) = 'object'),
  internal_note text,
  is_public boolean not null default true,
  occurred_at timestamptz not null default now(),
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint place_suggestion_events_status_kind check ((kind = 'status') = (status is not null))
);

create index place_suggestion_events_suggestion_idx on public.place_suggestion_events (suggestion_id, occurred_at);

alter table public.place_suggestion_events enable row level security;
-- No client policy at all: clients read the timeline only through
-- community_suggestion_timeline(), which leaves internal notes out.
revoke all on public.place_suggestion_events from anon, authenticated, service_role;
grant select, insert, update, delete on public.place_suggestion_events to service_role;

-- Every status change is recorded, and opens / publishes / withdraws the suggestion.
create or replace function public.place_suggestion_status_changed()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    -- Who may read it is decided by community_suggestion_timeline(): the
    -- proposer always, everyone else only once the suggestion is public.
    insert into public.place_suggestion_events (suggestion_id, kind, status, created_by)
    values (new.id, 'status', new.status, auth.uid());
  end if;
  if tg_op = 'UPDATE' and new.status is distinct from old.status then
    if old.status = 'submitted' and new.status in ('open', 'under_review', 'contacting_partner', 'approved', 'published') then
      new.opened_at := coalesce(new.opened_at, now());
      -- The public representation starts as the proposer's words, unless
      -- LINKA wrote a moderated one in this same update.
      new.public_reason := coalesce(new.public_reason, new.reason);
    end if;
    if new.status = 'published' then new.published_at := coalesce(new.published_at, now()); end if;
    if new.status = 'withdrawn' then new.withdrawn_at := coalesce(new.withdrawn_at, now()); end if;
  end if;
  return new;
end;
$$;
revoke execute on function public.place_suggestion_status_changed() from public, anon, authenticated;

create trigger place_suggestions_status_changed
  before insert or update of status on public.place_suggestions
  for each row execute function public.place_suggestion_status_changed();

-- ─── B5. withdrawal ────────────────────────────────────────────────────────

create or replace function public.withdraw_suggestion(p_id uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  update public.place_suggestions
  set status = 'withdrawn'
  where id = p_id and user_id = auth.uid() and status in ('submitted', 'open');
  if not found then
    raise exception 'suggestion_not_withdrawable' using errcode = 'P0001';
  end if;
end;
$$;
revoke execute on function public.withdraw_suggestion(uuid) from public, anon, service_role;
grant execute on function public.withdraw_suggestion(uuid) to authenticated;

-- ─── B6. the public read model ─────────────────────────────────────────────
-- Public = open and later (not submitted, declined, duplicate or withdrawn).
-- Each function returns only public-safe columns — public_reason, never
-- the original reason. The proposer's own unopened suggestion (and their
-- original reason) is readable by them through their own RLS, not here.

create or replace function public.is_public_suggestion_status(p_status text)
returns boolean
language sql
immutable
set search_path = ''
as $$ select p_status in ('open', 'under_review', 'contacting_partner', 'approved', 'published') $$;

create or replace function public.community_suggestions(p_statuses text[] default null, p_limit integer default 24)
returns table (
  id uuid,
  name text,
  public_area text,
  public_latitude double precision,
  public_longitude double precision,
  region_id uuid,
  place_id uuid,
  public_reason text,
  status text,
  support_count integer,
  proposer_name text,
  cover_path text,
  opened_at timestamptz,
  published_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.name, s.public_area, s.public_latitude, s.public_longitude, s.region_id, s.place_id, s.public_reason, s.status, s.support_count,
         case when s.attribution = 'nickname' then p.display_name end,
         (select ph.public_path from public.place_suggestion_photos ph
          where ph.suggestion_id = s.id and ph.public_path is not null order by ph.position limit 1),
         s.opened_at, s.published_at
  from public.place_suggestions s
  left join public.profiles p on p.id = s.user_id
  where public.is_public_suggestion_status(s.status)
    and (p_statuses is null or s.status = any (p_statuses))
  order by coalesce(s.published_at, s.opened_at) desc nulls last
  limit least(greatest(p_limit, 1), 100)
$$;

create or replace function public.community_suggestion(p_id uuid)
returns table (
  id uuid,
  name text,
  public_area text,
  public_latitude double precision,
  public_longitude double precision,
  region_id uuid,
  place_id uuid,
  public_reason text,
  reference_url text,
  status text,
  support_count integer,
  proposer_name text,
  photos text[],
  opened_at timestamptz,
  published_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select s.id, s.name, s.public_area, s.public_latitude, s.public_longitude, s.region_id, s.place_id, s.public_reason, s.reference_url, s.status, s.support_count,
         case when s.attribution = 'nickname' then p.display_name end,
         coalesce(array(select ph.public_path from public.place_suggestion_photos ph
                        where ph.suggestion_id = s.id and ph.public_path is not null order by ph.position), '{}'),
         s.opened_at, s.published_at
  from public.place_suggestions s
  left join public.profiles p on p.id = s.user_id
  where s.id = p_id and public.is_public_suggestion_status(s.status)
$$;

-- Public events of a public suggestion — and, for its proposer, those of
-- their own suggestion at any stage. Internal notes are never returned.
create or replace function public.community_suggestion_timeline(p_id uuid)
returns table (occurred_at timestamptz, kind text, status text, public_note jsonb)
language sql
stable
security definer
set search_path = ''
as $$
  select e.occurred_at, e.kind, e.status, e.public_note
  from public.place_suggestion_events e
  join public.place_suggestions s on s.id = e.suggestion_id
  where e.suggestion_id = p_id
    and e.is_public
    and (public.is_public_suggestion_status(s.status) or s.user_id = auth.uid())
  order by e.occurred_at
$$;

revoke execute on function public.is_public_suggestion_status(text) from public;
revoke execute on function public.community_suggestions(text[], integer), public.community_suggestion(uuid),
  public.community_suggestion_timeline(uuid) from public;
grant execute on function public.is_public_suggestion_status(text) to anon, authenticated, service_role;
grant execute on function public.community_suggestions(text[], integer), public.community_suggestion(uuid),
  public.community_suggestion_timeline(uuid) to anon, authenticated, service_role;

-- ─── B7. storage ───────────────────────────────────────────────────────────

-- Proposers can remove what they uploaded (today they cannot).
create policy "Suggestion photos: owner deletes"
  on storage.objects for delete to authenticated
  using (bucket_id = 'suggestion-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

-- Approved, re-encoded copies for the public. Public read; no client writes
-- (staff tooling uploads with the service role).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('community-media', 'community-media', true, 5242880, array['image/jpeg', 'image/webp'])
on conflict (id) do nothing;

-- ─── B8. per-account rate limits ───────────────────────────────────────────
-- Enforced by BEFORE INSERT triggers, so no client path (PostgREST, RPC,
-- a modified app) can skip them. Each (action, window) row is one limit;
-- an action may have several (a burst and a daily cap). Change a limit
-- without a migration, as staff:
--   update public.community_rate_limits set max_count = 5
--   where action = 'suggestion_submit' and window_length = '1 day';
-- Delete a row to lift that limit; insert one to add a window.
--
-- Every successful attempt is logged, including a support later withdrawn,
-- so support / un-support churn is counted too. A refused attempt rolls
-- back and is not logged. Staff tooling (service role, no auth.uid()) is
-- not limited. The log holds only (user, action, time) and goes with the
-- account; rows older than the longest window may be pruned by staff:
--   delete from public.community_action_log where created_at < now() - interval '30 days';

create table public.community_rate_limits (
  action text not null check (action in ('suggestion_submit', 'suggestion_support', 'suggestion_photo')),
  window_length interval not null check (window_length > interval '0'),
  max_count integer not null check (max_count >= 0),
  primary key (action, window_length)
);

insert into public.community_rate_limits (action, window_length, max_count) values
  ('suggestion_submit',  interval '1 day',   3),
  ('suggestion_submit',  interval '30 days', 10),
  ('suggestion_support', interval '1 hour',  30),
  ('suggestion_support', interval '1 day',   60),
  ('suggestion_photo',   interval '1 day',   20);

create table public.community_action_log (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  action text not null,
  created_at timestamptz not null default now()
);

create index community_action_log_user_idx on public.community_action_log (user_id, action, created_at desc);

-- No client policy on either table: clients never read or write them.
alter table public.community_rate_limits enable row level security;
alter table public.community_action_log enable row level security;
revoke all on public.community_rate_limits, public.community_action_log from anon, authenticated, service_role;
grant select, insert, update, delete on public.community_rate_limits to service_role;
grant select, delete on public.community_action_log to service_role;

-- TG_ARGV[0] = the action. Raises SQLSTATE PT429, which PostgREST returns
-- as HTTP 429; the message is 'rate_limited', the detail names the limit.
create or replace function public.community_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid := auth.uid();
  v_action text := tg_argv[0];
  v_limit record;
begin
  if v_user is null then
    return new;
  end if;
  -- One attempt per account and action at a time: two parallel requests
  -- cannot both pass the count below.
  perform pg_advisory_xact_lock(hashtextextended('community_rate_limit:' || v_user::text || ':' || v_action, 0));
  for v_limit in
    select l.window_length, l.max_count from public.community_rate_limits l where l.action = v_action
  loop
    if (select count(*) from public.community_action_log a
        where a.user_id = v_user and a.action = v_action and a.created_at > now() - v_limit.window_length) >= v_limit.max_count then
      raise exception 'rate_limited' using errcode = 'PT429',
        detail = format('%s: at most %s per %s', v_action, v_limit.max_count, v_limit.window_length);
    end if;
  end loop;
  insert into public.community_action_log (user_id, action) values (v_user, v_action);
  return new;
end;
$$;
revoke execute on function public.community_rate_limit() from public, anon, authenticated;

create trigger place_suggestions_rate_limit
  before insert on public.place_suggestions
  for each row execute function public.community_rate_limit('suggestion_submit');
create trigger place_suggestion_supports_rate_limit
  before insert on public.place_suggestion_supports
  for each row execute function public.community_rate_limit('suggestion_support');
create trigger place_suggestion_photos_rate_limit
  before insert on public.place_suggestion_photos
  for each row execute function public.community_rate_limit('suggestion_photo');

-- ─── final sweep ───────────────────────────────────────────────────────────
revoke truncate, trigger, references on public.place_suggestion_supports, public.place_suggestion_photos,
  public.place_suggestion_events, public.community_rate_limits, public.community_action_log from anon, authenticated;
