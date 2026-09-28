-- ============================================================================
-- Sprint 4A · Final demo — hero photographs. PENDING REVIEW.
--
-- The images ship with the app (public/places/<slug>-800.jpg, -1600.jpg;
-- metadata stripped). This records, per place, where each came from and
-- under which licence, so attribution travels with the data.
--
-- hero_image_path: a path starting with "/" is an app asset base
-- ("/places/toki-no-mori" → -800.jpg / -1600.jpg); anything else remains a
-- path in the public place-media bucket, as designed.
-- Every licence below was verified through the Wikimedia Commons API on
-- 2026-09-28. Four are CC BY-SA: the resized copies stay under that licence.
-- ============================================================================

alter table public.places
  add column if not exists hero_image_source_url text check (hero_image_source_url is null or hero_image_source_url ~ '^https://'),
  add column if not exists hero_image_license text,
  add column if not exists hero_image_license_url text check (hero_image_license_url is null or hero_image_license_url ~ '^https://');

-- Alt text describes the photograph (LINKA's words), per language.
alter table public.place_translations add column if not exists hero_image_alt text;

grant select (hero_image_source_url, hero_image_license, hero_image_license_url) on public.places to anon, authenticated;
grant select (hero_image_alt) on public.place_translations to anon, authenticated;

update public.places p
set hero_image_path = v.path,
    hero_image_credit = v.credit,
    hero_image_source_url = v.source,
    hero_image_license = v.license,
    hero_image_license_url = v.license_url
from (values
  ('toki-no-mori', '/places/toki-no-mori', 'Photo: Totti, CC BY-SA 4.0 (Wikimedia Commons)',
   'https://commons.wikimedia.org/wiki/File:Nipponia_nippon_Sado_Toki_Hogo_Center_2.jpg', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0'),
  ('sado-kinzan', '/places/sado-kinzan', 'Photo: Asturio Cantabrio, CC BY-SA 4.0 (Wikimedia Commons)',
   'https://commons.wikimedia.org/wiki/File:Dohyu_no_Warito_ac_(3).jpg', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0'),
  ('shukunegi', '/places/shukunegi', 'Photo: JH0WJF, Public domain (Wikimedia Commons)',
   'https://commons.wikimedia.org/wiki/File:Sado_Shukunegi.jpg', 'Public domain', null),
  ('onogame', '/places/onogame', 'Photo: Brown-shippings, CC BY-SA 3.0 (Wikimedia Commons)',
   'https://commons.wikimedia.org/wiki/File:Oonogame_bike_A-type70km-point,_Long_Distance_triathlon_course_in_Sado_island,_Japan.jpg', 'CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0'),
  ('donden-kogen', '/places/donden-kogen', 'Photo: Koda6029, CC BY-SA 4.0 (Wikimedia Commons)',
   'https://commons.wikimedia.org/wiki/File:%E5%B0%BB%E7%AB%8B%E5%B1%B1%E3%81%8B%E3%82%89%E3%81%AE%E3%83%89%E3%83%B3%E3%83%87%E3%83%B3%E9%AB%98%E5%8E%9F.jpg', 'CC BY-SA 4.0', 'https://creativecommons.org/licenses/by-sa/4.0')
) as v(slug, path, credit, source, license, license_url)
where p.slug = v.slug;

update public.place_translations t
set hero_image_alt = v.alt
from public.places p,
  (values
    ('toki-no-mori', 'en', 'A crested ibis wading in a shallow stream beside green grass at the Sado Japanese Crested Ibis Conservation Center.'),
    ('toki-no-mori', 'ja', '佐渡トキ保護センターの浅い流れを歩くトキ。'),
    ('toki-no-mori', 'zh-Hans', '佐渡朱鹮保护中心里，一只朱鹮在浅浅的水流中行走。'),
    ('sado-kinzan', 'en', 'The split summit of Dōyū no Warito rising above green forest under a clear sky.'),
    ('sado-kinzan', 'ja', '青空の下、緑の森の上にそびえる二つに割れた「道遊の割戸」。'),
    ('sado-kinzan', 'zh-Hans', '晴空下，裂成两半的「道游之割户」耸立在绿色森林之上。'),
    ('shukunegi', 'en', 'Weathered two-storey wooden houses with stone-weighted roofs along a paved lane and a narrow stone channel in Shukunegi.'),
    ('shukunegi', 'ja', '石置き屋根の板壁の家々と、石畳の小道と水路が続く宿根木の町並み。'),
    ('shukunegi', 'zh-Hans', '宿根木村落里，石压屋顶的木板墙民居沿着石板小路和狭窄水渠排列。'),
    ('onogame', 'en', 'The dome-shaped rock of Onogame at the end of a rocky coastline across calm blue sea.'),
    ('onogame', 'ja', '穏やかな青い海の向こう、岩の海岸の先にそびえる大野亀。'),
    ('onogame', 'zh-Hans', '平静的蓝色海面对岸，岩石海岸尽头的圆顶巨岩大野龟。'),
    ('donden-kogen', 'en', 'Rolling green grassland and forested ridges of the Donden Highlands seen from Mount Shiritate.'),
    ('donden-kogen', 'ja', '尻立山から望む、ドンデン高原の緑の草原と山並み。'),
    ('donden-kogen', 'zh-Hans', '从尻立山眺望的钝岭山一带绿色草原与山脊。')
  ) as v(slug, locale, alt)
where p.slug = v.slug and t.place_id = p.id and t.locale = v.locale;
