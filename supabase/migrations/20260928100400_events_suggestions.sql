-- ============================================================================
-- Sprint 4A · 5/6 — place events (for the Live Place Card) and community
-- place suggestions. New tables + one storage bucket.
-- ============================================================================

-- ─── place_events ───────────────────────────────────────────────────────────

create table public.place_events (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz,
  all_day boolean not null default false,
  status text not null default 'draft' check (status in ('draft', 'published', 'cancelled')),
  official_url text check (official_url is null or official_url ~ '^https://'),
  source_url text check (source_url is null or source_url ~ '^https://'),
  checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint place_events_ends_after_start check (ends_at is null or ends_at >= starts_at)
);

create index place_events_place_time_idx on public.place_events (place_id, starts_at);

create trigger place_events_set_updated_at before update on public.place_events
  for each row execute function public.set_updated_at();

-- Same locale strategy as places: one row per locale, fallback decided in the app.
create table public.place_event_translations (
  event_id uuid not null references public.place_events (id) on delete cascade,
  locale text not null check (locale ~ '^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$'),
  title text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (event_id, locale)
);

create trigger place_event_translations_set_updated_at before update on public.place_event_translations
  for each row execute function public.set_updated_at();

alter table public.place_events enable row level security;
alter table public.place_event_translations enable row level security;

-- Cancelled events stay readable so the card can say so rather than silently drop them.
create policy "Published events of published places are public"
  on public.place_events for select to anon, authenticated
  using (
    status in ('published', 'cancelled')
    and exists (select 1 from public.places p where p.id = place_id and p.status = 'published')
  );

create policy "Translations of public events are public"
  on public.place_event_translations for select to anon, authenticated
  using (exists (
    select 1 from public.place_events e
    join public.places p on p.id = e.place_id
    where e.id = event_id and e.status in ('published', 'cancelled') and p.status = 'published'
  ));

revoke all on public.place_events, public.place_event_translations from anon, authenticated;
grant select on public.place_events, public.place_event_translations to anon, authenticated;

-- ─── place_suggestions ──────────────────────────────────────────────────────
-- A proposal from a user. It is never a place: nothing reads it into `places`,
-- and a user can neither see anyone else's nor change the status of their own.

create table public.place_suggestions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 200),
  address text check (address is null or char_length(address) <= 500),
  latitude double precision check (latitude is null or latitude between -90 and 90),
  longitude double precision check (longitude is null or longitude between -180 and 180),
  reason text not null check (char_length(btrim(reason)) between 1 and 2000),
  reference_url text check (reference_url is null or (reference_url ~ '^https?://' and char_length(reference_url) <= 2000)),
  -- `<user_id>/<uuid>.jpg` in the private `suggestion-photos` bucket.
  photo_path text,
  -- The language the user wrote in, for the reviewer.
  locale text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  review_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint place_suggestions_where check (address is not null or (latitude is not null and longitude is not null)),
  constraint place_suggestions_coords_pair check ((latitude is null) = (longitude is null)),
  constraint place_suggestions_photo_is_owners check (photo_path is null or photo_path like user_id::text || '/%')
);

create index place_suggestions_user_idx on public.place_suggestions (user_id, created_at desc);
create index place_suggestions_status_idx on public.place_suggestions (status, created_at);

create trigger place_suggestions_set_updated_at before update on public.place_suggestions
  for each row execute function public.set_updated_at();

alter table public.place_suggestions enable row level security;

create policy "Users submit pending suggestions"
  on public.place_suggestions for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'pending' and reviewed_by is null);

create policy "Users read own suggestions"
  on public.place_suggestions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Admins read all suggestions"
  on public.place_suggestions for select to authenticated
  using (public.is_admin());

-- An admin cannot approve their own suggestion, and can only record
-- themselves as the reviewer.
create policy "Admins moderate others' suggestions"
  on public.place_suggestions for update to authenticated
  using (public.is_admin() and user_id <> (select auth.uid()))
  with check (
    public.is_admin()
    and user_id <> (select auth.uid())
    and (reviewed_by is null or reviewed_by = (select auth.uid()))
  );

revoke all on public.place_suggestions from anon, authenticated;
grant select on public.place_suggestions to authenticated;
-- Column-level: a client cannot even name status / reviewed_* on insert.
grant insert (name, address, latitude, longitude, reason, reference_url, photo_path, locale)
  on public.place_suggestions to authenticated;
grant update (status, reviewed_by, reviewed_at, review_note) on public.place_suggestions to authenticated;
-- Staff tooling (server-side only; bypasses RLS).
grant select, insert, update, delete on public.place_events, public.place_event_translations, public.place_suggestions to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('suggestion-photos', 'suggestion-photos', false, 10485760, array['image/jpeg', 'image/webp'])
on conflict (id) do nothing;

create policy "Suggestion photos: owner uploads"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'suggestion-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Suggestion photos: owner or admin reads"
  on storage.objects for select to authenticated
  using (bucket_id = 'suggestion-photos'
         and ((storage.foldername(name))[1] = (select auth.uid())::text or public.is_admin()));

-- ─── final sweep ────────────────────────────────────────────────────────────
-- Whatever the default privileges, no client role holds TRUNCATE/TRIGGER/
-- REFERENCES on any public table, including the ones created above.
revoke truncate, trigger, references on all tables in schema public from anon, authenticated;
