-- ============================================================================
-- Sprint 4A · 2/6 — places, their translations and where their facts came from.
-- New tables only.
-- ============================================================================

-- A real location. `kind = 'region'` groups destinations (佐渡 → トキの森公園),
-- which is what "4 / 12 places explored" counts against.
create table public.places (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  parent_id uuid references public.places (id) on delete restrict,
  kind text not null default 'destination' check (kind in ('region', 'destination')),
  -- The canonical name in the place's own language. Never translated.
  native_name text not null,
  native_locale text not null default 'ja',
  -- A transliteration (Donden Kōgen), not a translation. Shown when a locale
  -- has no verified name of its own.
  romanized_name text,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  -- A Touch's date is the place's local calendar date (see touch_events.local_date).
  timezone text not null default 'Asia/Tokyo',
  official_url text check (official_url is null or official_url ~ '^https://'),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  -- Visible and openable before anyone has touched it.
  discovery_enabled boolean not null default false,
  -- Set only by LINKA staff. A community suggestion never sets this.
  partner_status text not null default 'none' check (partner_status in ('none', 'partner')),
  -- Storage path in the public `place-media` bucket; null until a licensed image exists.
  hero_image_path text,
  hero_image_credit text,
  -- Which side of its mark the name is written on the local map.
  label_side text check (label_side in ('left', 'right', 'below')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint places_region_has_no_parent check (kind <> 'region' or parent_id is null)
);

create index places_parent_id_idx on public.places (parent_id);
create index places_published_idx on public.places (status) where status = 'published';

create trigger places_set_updated_at before update on public.places
  for each row execute function public.set_updated_at();

-- Localized content. One row per (place, locale); every text field is optional
-- so a locale can carry a verified name without an invented description.
create table public.place_translations (
  place_id uuid not null references public.places (id) on delete cascade,
  locale text not null check (locale ~ '^[a-z]{2,3}(-[A-Z][a-z]{3})?(-[A-Z]{2})?$'),
  -- Display name in this locale (Toki no Mori Park). Null → fall back to native/romanized.
  name text,
  -- The fuller official form, when it differs (Historic Site Sado Gold Mine).
  official_name text,
  locality text,
  short_description text,
  description text,
  -- Time-sensitive facts: { hours, closed, admission, access } — each a short string.
  practical_info jsonb check (practical_info is null or jsonb_typeof(practical_info) = 'object'),
  -- When practical_info was last confirmed against its source. Shown as "as of".
  practical_info_as_of date,
  -- The page this locale's text was based on, and when it was checked.
  source_url text check (source_url is null or source_url ~ '^https://'),
  content_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (place_id, locale),
  constraint place_translations_as_of_needs_info check (practical_info_as_of is null or practical_info is not null)
);

create trigger place_translations_set_updated_at before update on public.place_translations
  for each row execute function public.set_updated_at();

-- Provenance: every source a place's facts rest on, and when it was checked.
create table public.place_sources (
  id uuid primary key default gen_random_uuid(),
  place_id uuid not null references public.places (id) on delete cascade,
  url text not null check (url ~ '^https://'),
  -- What this source supports: coordinates, name, description, practical_info, …
  covers text[] not null default '{}',
  publisher text,
  checked_at timestamptz not null,
  note text,
  created_at timestamptz not null default now(),
  unique (place_id, url)
);

create index place_sources_place_id_idx on public.place_sources (place_id);

-- ─── RLS ────────────────────────────────────────────────────────────────────
-- Published place information is public, signed in or not (an NFC tap must be
-- able to show the place before sign-in). Nothing here is writable by clients;
-- content is managed by staff through the dashboard / service role.

alter table public.places enable row level security;
alter table public.place_translations enable row level security;
alter table public.place_sources enable row level security;

create policy "Published places are public"
  on public.places for select to anon, authenticated
  using (status = 'published');

create policy "Translations of published places are public"
  on public.place_translations for select to anon, authenticated
  using (exists (select 1 from public.places p where p.id = place_id and p.status = 'published'));

create policy "Sources of published places are public"
  on public.place_sources for select to anon, authenticated
  using (exists (select 1 from public.places p where p.id = place_id and p.status = 'published'));

-- Start from nothing whatever the project's default privileges are, then grant exactly.
revoke all on public.places, public.place_translations, public.place_sources from anon, authenticated;
grant select on public.places, public.place_translations, public.place_sources to anon, authenticated;
-- Staff tooling (server-side only; bypasses RLS).
grant select, insert, update, delete on public.places, public.place_translations, public.place_sources to service_role;
