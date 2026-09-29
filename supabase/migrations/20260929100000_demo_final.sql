-- ============================================================================
-- Sprint 4A · Final demo — PENDING REVIEW. Not in supabase/migrations/, so
-- `db push` cannot apply it. On approval: move into supabase/migrations/.
--
--   1. A test Touch Point can be opened for demos: anyone may SEE it (to read
--      the place), any signed-in account may TOUCH it — and every such touch
--      is still is_test = true, so it never reaches a visitor count.
--   2. memories.mood — one of six fixed moods.
--   3. place_suggestions statuses for the review pipeline (Decision 1,
--      2026-09-28), voting-ready. Existing rows are carried over.
--   4. safety_resources — official disaster / safety links, public read.
--
-- Hero image credits are a separate file (…100100_place_heroes.sql): content,
-- not security, so they can be reviewed and applied on their own.
-- ============================================================================

-- ─── 1. demo access for test Touch Points ───────────────────────────────────

-- 'admin' (default): as before — only admins can resolve or touch it.
-- 'demo': anyone can resolve it (place information only; resolving never
--         records anything), any signed-in account can touch it.
-- Only meaningful when is_test = true; a real point ignores it.
alter table public.touchpoints
  add column if not exists test_access text not null default 'admin'
    check (test_access in ('admin', 'demo'));

grant select (test_access) on public.touchpoints to anon, authenticated;

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
    and (not t.is_test or t.test_access = 'demo' or public.is_admin())
$$;

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

  -- A test point: admins always; any signed-in account when it is a demo point.
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

  -- is_test is copied from the point, never from the caller: a demo touch is
  -- stored as a test touch and is excluded from place_visitors_today().
  insert into public.touch_events (user_id, touchpoint_id, place_id, touched_at, local_date, source, is_test)
  values (v_user, v_point.id, v_place.id, now(),
          (now() at time zone v_place.timezone)::date, 'nfc', v_point.is_test)
  returning * into v_new;

  return query select v_new.id, v_new.place_id, v_new.touched_at, v_new.local_date, v_new.is_test, false;
end;
$$;

-- CREATE OR REPLACE keeps existing grants; restated so the file stands alone.
revoke execute on function public.resolve_touch_point(text) from public;
revoke execute on function public.record_touch(text) from public, anon;
grant execute on function public.resolve_touch_point(text) to anon, authenticated, service_role;
grant execute on function public.record_touch(text) to authenticated;

-- The one physical demo tag.
update public.touchpoints
set test_access = 'demo'
where public_id = 'U14Xpkv9c9bfCaGAARWWUg' and is_test = true;

-- ─── 2. memories.mood ───────────────────────────────────────────────────────

alter table public.memories
  add column if not exists mood text
    check (mood is null or mood in ('joyful', 'calm', 'surprised', 'moved', 'learned', 'special'));

grant insert (mood), update (mood) on public.memories to authenticated;

-- ─── 3. place_suggestions: the review pipeline ──────────────────────────────
-- Decision 1 (2026-09-28):
--   submitted → open → under_review → contacting_partner → approved → published
--   terminal: declined | duplicate | withdrawn
-- `submitted` is private until moderated. Only `open` and later states may
-- ever be shown in Community — no public read policy exists yet; that comes
-- with the Community sprint. Supporters (a later place_suggestion_supports
-- table, primary key (suggestion_id, user_id)) are never exposed.
--
-- Rows written by the demo's Suggest screen carry the old values, so they
-- are carried over rather than assumed absent:
--   pending → submitted · approved → approved · rejected → declined

alter table public.place_suggestions drop constraint if exists place_suggestions_status_check;

update public.place_suggestions set status = 'submitted' where status = 'pending';
update public.place_suggestions set status = 'declined' where status = 'rejected';

alter table public.place_suggestions alter column status set default 'submitted';
alter table public.place_suggestions
  add constraint place_suggestions_status_check
  check (status in ('submitted', 'open', 'under_review', 'contacting_partner', 'approved', 'published',
                    'declined', 'duplicate', 'withdrawn'));

drop policy if exists "Users submit pending suggestions" on public.place_suggestions;
drop policy if exists "Users submit suggestions" on public.place_suggestions;
create policy "Users submit suggestions"
  on public.place_suggestions for insert to authenticated
  with check ((select auth.uid()) = user_id and status = 'submitted' and reviewed_by is null);

-- ─── 4. safety_resources ────────────────────────────────────────────────────
-- Links to OFFICIAL safety and disaster information only. LINKA never states
-- a hazard, a route or a current status itself: every row points at the
-- authority that does. place_id null = applies everywhere (national).

create table if not exists public.safety_resources (
  id uuid primary key default gen_random_uuid(),
  place_id uuid references public.places (id) on delete cascade,
  kind text not null check (kind in (
    'disaster_info', 'alerts', 'hazard_map', 'evacuation', 'weather_warnings', 'multilingual', 'emergency_contact'
  )),
  -- The page or service name exactly as its publisher titles it.
  title text not null,
  -- Languages the linked resource itself is available in.
  languages text[] not null default '{ja}',
  url text not null check (url ~ '^https://'),
  phone text,
  publisher text not null,
  -- LINKA's short explanation of what the link is for, per locale.
  summary jsonb not null default '{}' check (jsonb_typeof(summary) = 'object'),
  sort smallint not null default 0,
  checked_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique nulls not distinct (place_id, url, phone)
);

create index if not exists safety_resources_place_idx on public.safety_resources (place_id, sort);

drop trigger if exists safety_resources_set_updated_at on public.safety_resources;
create trigger safety_resources_set_updated_at before update on public.safety_resources
  for each row execute function public.set_updated_at();

alter table public.safety_resources enable row level security;

drop policy if exists "Safety resources of published places are public" on public.safety_resources;
create policy "Safety resources of published places are public"
  on public.safety_resources for select to anon, authenticated
  using (place_id is null or exists (select 1 from public.places p where p.id = place_id and p.status = 'published'));

revoke all on public.safety_resources from anon, authenticated;
grant select on public.safety_resources to anon, authenticated;
grant select, insert, update, delete on public.safety_resources to service_role;
revoke truncate, trigger, references on public.safety_resources from anon, authenticated;

-- Verified 2026-09-28: every URL returned HTTP 200; titles copied from the page.
insert into public.safety_resources (place_id, kind, title, languages, url, phone, publisher, summary, sort, checked_at)
select (select id from public.places where slug = v.slug), v.kind, v.title, v.langs::text[], v.url, v.phone, v.publisher,
       v.summary::jsonb, v.sort, '2026-09-28T00:00:00+09:00'
from (values
  -- 佐渡市 (region: applies to every place on Sado)
  ('sado', 'alerts', 'さど防災ネット', '{ja}', 'https://bousai-net.city.sado.niigata.jp/', null, '佐渡市',
   '{"ja":"避難情報・開設中の避難所・警報を佐渡市が発信する公式サイト","en":"Sado City''s official site for evacuation orders, open shelters and warnings (Japanese)","zh-Hans":"佐渡市官方发布避难信息、开放中的避难所和警报的网站（日语）"}', 10),
  ('sado', 'disaster_info', '佐渡市防災情報', '{ja}', 'https://www.city.sado.niigata.jp/site/bousai/', null, '佐渡市 防災課',
   '{"ja":"佐渡市の防災情報トップページ","en":"Sado City disaster-prevention information (Japanese)","zh-Hans":"佐渡市防灾信息主页（日语）"}', 20),
  ('sado', 'hazard_map', '佐渡市ハザードマップ', '{ja}', 'https://www.city.sado.niigata.jp/site/bousai/17752.html', null, '佐渡市 防災課',
   '{"ja":"土砂災害・洪水・津波の想定区域と避難場所の地図","en":"Maps of landslide, flood and tsunami zones and evacuation sites (Japanese)","zh-Hans":"泥石流、洪水、海啸预想区域及避难场所地图（日语）"}', 30),
  ('sado', 'evacuation', '指定緊急避難場所一覧', '{ja}', 'https://www.city.sado.niigata.jp/soshiki/2003/3392.html', null, '佐渡市 防災課',
   '{"ja":"地区別の指定緊急避難場所（開設されない場所もあります）","en":"Designated emergency evacuation sites by district — not all may open (Japanese)","zh-Hans":"按地区列出的指定紧急避难场所，并非全部都会开放（日语）"}', 40),
  ('sado', 'multilingual', '訪日外国人観光客の皆さまへ　災害時の情報入手に役立つサイト・アプリについて災害から身を守るために日ごろからの備えを', '{ja}', 'https://www.city.sado.niigata.jp/site/bousai/63926.html', null, '佐渡市 防災課',
   '{"ja":"訪日外国人向けに、災害時に役立つサイト・アプリを佐渡市が紹介","en":"Sado City''s guide to disaster apps and sites for international visitors (page in Japanese)","zh-Hans":"佐渡市为外国游客介绍灾害时可用的网站和应用（页面为日语）"}', 50),
  ('sado', 'weather_warnings', '気象庁｜警報・注意報', '{ja}', 'https://www.jma.go.jp/bosai/warning/#area_type=class20s&area_code=1522400', null, '気象庁',
   '{"ja":"佐渡市に出ている気象警報・注意報","en":"Current weather warnings and advisories for Sado City (Japanese)","zh-Hans":"佐渡市当前的气象警报和注意报（日语）"}', 60),
  ('sado', 'disaster_info', '新潟県防災ポータル - トップページ', '{ja}', 'https://www.bousai.pref.niigata.lg.jp/contents/index.html', null, '新潟県',
   '{"ja":"新潟県の防災ポータル","en":"Niigata Prefecture disaster-prevention portal (Japanese)","zh-Hans":"新潟县防灾门户网站（日语）"}', 70),
  ('sado', 'emergency_contact', '夜間の救急医療電話相談（＃7119）を実施しています。', '{ja}', 'https://www.pref.niigata.lg.jp/sec/chiikiiryo/1356882439151.html', '#7119', '新潟県 地域医療政策課',
   '{"ja":"急な病気・けがの相談（おおむね15歳以上）。月〜土 18時〜翌8時、日祝は24時間","en":"Medical advice line for sudden illness or injury, about age 15+. Mon–Sat 18:00–08:00, Sun/holidays 24 h (Japanese)","zh-Hans":"突发疾病或受伤的咨询热线（约15岁以上）。周一至周六18:00–次日8:00，周日及节假日24小时（日语）"}', 80),
  -- 相川 / 小木 district evacuation pages
  ('sado-kinzan', 'evacuation', '相川地区の指定緊急避難場所一覧', '{ja}', 'https://www.city.sado.niigata.jp/site/bousai/3388.html', null, '佐渡市',
   '{"ja":"相川地区の指定緊急避難場所（地震・津波・土砂災害・洪水別）","en":"Aikawa district evacuation sites, by earthquake, tsunami, landslide and flood (Japanese)","zh-Hans":"相川地区指定紧急避难场所，按地震、海啸、泥石流、洪水分类（日语）"}', 5),
  ('shukunegi', 'evacuation', '小木地区の指定緊急避難場所一覧', '{ja}', 'https://www.city.sado.niigata.jp/site/bousai/3396.html', null, '佐渡市',
   '{"ja":"小木地区の指定緊急避難場所（地震・津波・土砂災害・洪水別）","en":"Ogi district evacuation sites, by earthquake, tsunami, landslide and flood (Japanese)","zh-Hans":"小木地区指定紧急避难场所，按地震、海啸、泥石流、洪水分类（日语）"}', 5),
  -- National (place_id null): everywhere in Japan
  (null, 'emergency_contact', 'For safe travels in Japan - Guide for when you are feeling ill | Japan : the Official Guide', '{en}', 'https://www.jnto.go.jp/emergency/eng/mi_guide.html', '110', '日本政府観光局 (JNTO)',
   '{"ja":"警察","en":"Police","zh-Hans":"警察"}', 1),
  (null, 'emergency_contact', 'For safe travels in Japan - Guide for when you are feeling ill | Japan : the Official Guide', '{en}', 'https://www.jnto.go.jp/emergency/eng/mi_guide.html', '119', '日本政府観光局 (JNTO)',
   '{"ja":"消防・救急","en":"Fire and ambulance","zh-Hans":"消防、急救"}', 2),
  (null, 'emergency_contact', 'For safe travels in Japan - Guide for when you are feeling ill | Japan : the Official Guide', '{en}', 'https://www.jnto.go.jp/emergency/eng/mi_guide.html', '050-3816-2787', '日本政府観光局 (JNTO)',
   '{"ja":"Japan Visitor Hotline（24時間・多言語）","en":"Japan Visitor Hotline (24 hours, multilingual)","zh-Hans":"Japan Visitor Hotline（24小时，多语言）"}', 3),
  (null, 'multilingual', 'Safety tips for travelers', '{en,zh-Hans,zh-Hant,ko}', 'https://www.jnto.go.jp/safety-tips/eng/app.html', null, '観光庁 / 日本政府観光局 (JNTO)',
   '{"ja":"観光庁の訪日外国人向け災害情報アプリ「Safety tips」","en":"Safety tips — the Japan Tourism Agency''s disaster alert app for visitors","zh-Hans":"观光厅面向外国游客的防灾信息应用「Safety tips」"}', 90),
  (null, 'multilingual', 'Other Languages', '{en,zh-Hans,ko}', 'https://www.jma.go.jp/jma/kokusai/multi.html', null, '気象庁',
   '{"ja":"気象庁の多言語による防災気象情報","en":"Japan Meteorological Agency weather and disaster information in other languages","zh-Hans":"日本气象厅多语言防灾气象信息"}', 91),
  (null, 'hazard_map', 'ハザードマップポータルサイト', '{ja}', 'https://disaportal.gsi.go.jp/', null, '国土交通省 国土地理院',
   '{"ja":"国のハザードマップポータル（重ねるハザードマップ）","en":"National hazard map portal (Japanese)","zh-Hans":"国家灾害风险地图门户（日语）"}', 92)
) as v(slug, kind, title, langs, url, phone, publisher, summary, sort)
on conflict (place_id, url, phone) do nothing;
