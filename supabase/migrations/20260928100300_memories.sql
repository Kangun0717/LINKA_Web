-- ============================================================================
-- Sprint 4A · 4/6 — Memories: a private reflection and photographs for a visit.
-- New tables + two storage buckets.
-- ============================================================================

-- One Memory per visit (touch event). It can only be created for a touch the
-- user actually made, so a place never gains a Memory without a Touch.
create table public.memories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  place_id uuid not null references public.places (id) on delete restrict,
  touch_event_id uuid not null unique references public.touch_events (id) on delete cascade,
  note text check (note is null or char_length(note) <= 4000),
  -- The photograph shown as the map's Memory Fragment. FK added below.
  cover_photo_id uuid,
  -- Private is the only value for now; the column exists so sharing can be
  -- added deliberately later rather than by changing a default.
  visibility text not null default 'private' check (visibility in ('private')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index memories_user_place_idx on public.memories (user_id, place_id);

create trigger memories_set_updated_at before update on public.memories
  for each row execute function public.set_updated_at();

-- Photographs live in Storage; a row only points at one.
create table public.memory_photos (
  id uuid primary key default gen_random_uuid(),
  memory_id uuid not null references public.memories (id) on delete cascade,
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  -- `<user_id>/<memory_id>/<uuid>.jpg` inside the private `memory-photos` bucket.
  storage_path text not null unique,
  width integer not null check (width > 0),
  height integer not null check (height > 0),
  alt text check (alt is null or char_length(alt) <= 300),
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  constraint memory_photos_path_is_owners check (storage_path like user_id::text || '/%')
);

create index memory_photos_memory_idx on public.memory_photos (memory_id, position);

alter table public.memories
  add constraint memories_cover_photo_fkey
  foreign key (cover_photo_id) references public.memory_photos (id) on delete set null;

-- ─── RLS: a Memory is its owner's alone ─────────────────────────────────────

alter table public.memories enable row level security;
alter table public.memory_photos enable row level security;

create policy "Users read own memories"
  on public.memories for select to authenticated
  using ((select auth.uid()) = user_id);

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

create policy "Users delete own memories"
  on public.memories for delete to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users read own memory photos"
  on public.memory_photos for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users add photos to own memories"
  on public.memory_photos for insert to authenticated
  with check (
    (select auth.uid()) = user_id
    and exists (select 1 from public.memories m where m.id = memory_id and m.user_id = (select auth.uid()))
  );

create policy "Users update own memory photos"
  on public.memory_photos for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users delete own memory photos"
  on public.memory_photos for delete to authenticated
  using ((select auth.uid()) = user_id);

revoke all on public.memories, public.memory_photos from anon, authenticated;
grant select, delete on public.memories to authenticated;
grant insert (place_id, touch_event_id, note, cover_photo_id) on public.memories to authenticated;
grant update (note, cover_photo_id) on public.memories to authenticated;
grant select, delete on public.memory_photos to authenticated;
grant insert (memory_id, storage_path, width, height, alt, position) on public.memory_photos to authenticated;
grant update (alt, position) on public.memory_photos to authenticated;
-- Staff tooling (server-side only; bypasses RLS).
grant select, insert, update, delete on public.memories, public.memory_photos to service_role;

-- ─── Storage ────────────────────────────────────────────────────────────────
-- memory-photos: private. Objects live under `<user_id>/…`; only that user can
-- read or write them, and the app shows them through short-lived signed URLs.
-- The client resizes to ≤ 2048 px JPEG/WebP before upload.
--
-- place-media: public read, staff-managed (hero images). No client writes.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('memory-photos', 'memory-photos', false, 10485760, array['image/jpeg', 'image/webp']),
  ('place-media', 'place-media', true, 5242880, array['image/jpeg', 'image/webp', 'image/avif'])
on conflict (id) do nothing;

create policy "Memory photos: owner reads"
  on storage.objects for select to authenticated
  using (bucket_id = 'memory-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Memory photos: owner uploads"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'memory-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "Memory photos: owner deletes"
  on storage.objects for delete to authenticated
  using (bucket_id = 'memory-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
