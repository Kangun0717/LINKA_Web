-- ============================================================================
-- BASELINE — the schema as it already exists in the LINKA project (read from
-- the live catalog on 2026-09-28). These objects were created in the
-- dashboard, so the project has no migration history.
--
-- DO NOT PUSH THIS FILE AS A MIGRATION. Record it as already applied:
--
--   supabase migration repair --status applied 20260916000000
--
-- It is written with IF NOT EXISTS throughout, so even if it did run it
-- would change nothing. It exists so a fresh local database can be rebuilt
-- from the repository and so later migrations read against a known base.
-- Commerce tables (projects/products/product_variants) are included only
-- because touchpoints references projects.
-- ============================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  avatar_url text,
  age_range text,
  nationality text,
  gender text,
  role text not null default 'user' check (role = any (array['user', 'partner', 'admin'])),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  project_type text not null check (project_type = any (array['campus', 'tourism', 'community', 'other'])),
  description text,
  cover_image_url text,
  is_active boolean not null default true,
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete set null,
  name text not null,
  slug text not null unique,
  category text not null default 'other' check (category = any (array['omamori', 'keychain', 'sticker', 'apparel', 'accessory', 'souvenir', 'other'])),
  description text,
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null,
  sku text not null unique,
  price_jpy integer not null check (price_jpy >= 0),
  has_nfc boolean not null default false,
  is_limited boolean not null default false,
  limited_quantity integer check (limited_quantity is null or limited_quantity > 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint limited_variant_quantity_check check (
    (is_limited = true and limited_quantity is not null) or (is_limited = false and limited_quantity is null)
  )
);

create table if not exists public.touchpoints (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.projects (id) on delete set null,
  name text not null,
  code text not null unique,
  touchpoint_type text not null check (touchpoint_type = any (array['place', 'product', 'event', 'booth', 'other'])),
  description text,
  latitude double precision,
  longitude double precision,
  cover_image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  access_mode text not null default 'public_info' check (access_mode = any (array['public_info', 'account_first']))
);

create table if not exists public.touch_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  touchpoint_id uuid not null references public.touchpoints (id) on delete cascade,
  touched_at timestamptz not null default now(),
  source text not null default 'nfc' check (source = any (array['nfc', 'qr', 'manual'])),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.touchpoints enable row level security;
alter table public.touch_events enable row level security;

-- Policies as they exist today (names verbatim). Guarded so the file is a no-op on the live project.
do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users can view own profile') then
    create policy "Users can view own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users can insert own profile') then
    create policy "Users can insert own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles' and policyname = 'Users can update own profile') then
    create policy "Users can update own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'projects' and policyname = 'Authenticated users can view active projects') then
    create policy "Authenticated users can view active projects" on public.projects for select to authenticated using (is_active = true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'products' and policyname = 'Authenticated users can view active products') then
    create policy "Authenticated users can view active products" on public.products for select to authenticated using (is_active = true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'product_variants' and policyname = 'Authenticated users can view active product variants') then
    create policy "Authenticated users can view active product variants" on public.product_variants for select to authenticated using (is_active = true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'touchpoints' and policyname = 'Authenticated users can view active touchpoints') then
    create policy "Authenticated users can view active touchpoints" on public.touchpoints for select to authenticated using (is_active = true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'touch_events' and policyname = 'Users can view own touch events') then
    create policy "Users can view own touch events" on public.touch_events for select to authenticated using ((select auth.uid()) = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'touch_events' and policyname = 'Users can create own touch events') then
    create policy "Users can create own touch events" on public.touch_events for insert to authenticated with check ((select auth.uid()) = user_id);
  end if;
end
$$;

-- Grants as they exist today: only profiles is reachable through the Data API.
grant select, insert, update on public.profiles to authenticated;
