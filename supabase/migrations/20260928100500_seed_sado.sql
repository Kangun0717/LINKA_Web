-- ============================================================================
-- Sprint 4A · 6/6 — Sado production content.
--
-- Every fact below was checked on 2026-09-28 against the page named in
-- place_sources. Descriptions are LINKA's own short wording of those facts,
-- not copied text; the card links to the official page for full, current
-- details. Where no official page states something, the field is left empty.
--
-- Coordinates: the map pins placed by the Sado Tourism Association on
-- visitsado.com for each spot. For a village (宿根木), a landform (大野亀) and
-- a highland (ドンデン高原) the point marks the site, not an entrance.
--
-- Idempotent on slug / (place, locale) / (place, url): safe to re-run, and it
-- never overwrites a row that already exists.
-- ============================================================================

insert into public.places
  (slug, parent_id, kind, native_name, native_locale, romanized_name, latitude, longitude,
   timezone, official_url, status, discovery_enabled, label_side)
values
  ('sado', null, 'region', '佐渡', 'ja', 'Sado', 38.0, 138.37,
   'Asia/Tokyo', 'https://www.visitsado.com/', 'published', false, null)
on conflict (slug) do nothing;

insert into public.places
  (slug, parent_id, kind, native_name, native_locale, romanized_name, latitude, longitude,
   timezone, official_url, status, discovery_enabled, label_side)
select v.slug, r.id, 'destination', v.native_name, 'ja', v.romanized_name, v.lat, v.lng,
       'Asia/Tokyo', v.official_url, 'published', true, v.label_side
from public.places r,
  (values
    ('toki-no-mori', 'トキの森公園', 'Toki no Mori Kōen', 38.03711, 138.42129,
     'https://www.city.sado.niigata.jp/site/tokinomori/1161.html', 'right'),
    ('sado-kinzan', '佐渡金山', 'Sado Kinzan', 38.04169, 138.25600,
     'https://www.sado-kinzan.com/', 'below'),
    ('shukunegi', '宿根木', 'Shukunegi', 37.81054, 138.23603,
     'https://www.visitsado.com/spot/detail0121/', 'below'),
    ('onogame', '大野亀', 'Ōnogame', 38.32099, 138.46160,
     'https://www.visitsado.com/spot/detail0133/', 'left'),
    ('donden-kogen', 'ドンデン高原', 'Donden Kōgen', 38.13989, 138.38962,
     'https://www.visitsado.com/spot/detail0137/', 'left')
  ) as v(slug, native_name, romanized_name, lat, lng, official_url, label_side)
where r.slug = 'sado'
on conflict (slug) do nothing;

-- ─── translations ───────────────────────────────────────────────────────────
-- zh-Hans: names only where visitsado.com/ch/ uses one. Its descriptions read
-- as machine translation with errors (道友隧道, 蹈鞘峰), so none are seeded;
-- the app falls back to another language and says so.
--
-- ドンデン高原 has no English name here on purpose: the only official English
-- ("Mount Donden") names ドンデン山, not the highland. Decided 2026-09-28:
-- English shows the romanized name, Donden Kōgen.

insert into public.place_translations
  (place_id, locale, name, official_name, locality, short_description, practical_info,
   practical_info_as_of, source_url, content_checked_at)
select p.id, v.locale, v.name, v.official_name, v.locality, v.short_description,
       v.practical_info::jsonb, v.as_of::date, v.source_url, '2026-09-28T00:00:00+09:00'
from public.places p
join (values
  -- 佐渡 (region)
  ('sado', 'ja', '佐渡', null, '新潟県', null, null, null, 'https://www.visitsado.com/'),
  ('sado', 'en', 'Sado', null, 'Niigata', null, null, null, 'https://www.visitsado.com/en/'),
  ('sado', 'zh-Hans', '佐渡', null, '新潟县', null, null, null, 'https://www.visitsado.com/ch/'),

  -- トキの森公園
  ('toki-no-mori', 'ja', 'トキの森公園', null, '佐渡市 新穂',
   '国中平野の東、新穂にある公園。トキ資料展示館と、飼育されているトキを間近に見られるトキふれあいプラザがあります。',
   '{"hours":"8:30–17:00（最終入館16:30）","closed":"12月〜2月の月曜日、年末年始（3月〜11月は無休）","admission":"保護協力費 大人500円・小中学生200円"}',
   '2026-09-28', 'https://www.city.sado.niigata.jp/site/tokinomori/1161.html'),
  ('toki-no-mori', 'en', 'Toki no Mori Park', null, 'Niibo, Sado',
   'A park in Niibo, on the east side of the Kuninaka Plain, with the Toki Museum and the Toki Interaction Plaza, where crested ibis can be watched up close.',
   '{"hours":"8:30–17:00 (last entry 16:30)","closed":"Mondays from December to February, and New Year holidays (open daily March–November)","admission":"Conservation fee: adults ¥500, elementary and junior high students ¥200"}',
   '2026-09-28', 'https://www.visitsado.com/en/spot/detail0015/'),
  ('toki-no-mori', 'zh-Hans', '朱鹮森林公园', null, null, null, null, null,
   'https://www.visitsado.com/ch/spot/detail0015/'),

  -- 佐渡金山
  ('sado-kinzan', 'ja', '佐渡金山', '史跡 佐渡金山', '佐渡市 下相川',
   '世界遺産「佐渡島の金山」の主要鉱山である相川金銀山を管理・保全する観光施設。佐渡金山コースでは、江戸時代の採掘坑道「宗太夫坑」と、明治32年（1899年）に開削された機械掘り坑道「道遊坑」を巡り、「道遊の割戸」を間近に見られます。',
   '{"hours":"4月〜10月 8:00〜16:00（閉館17:30）、11月〜3月 8:30〜15:30（閉館17:00）","closed":"年中無休（天候・設備点検による臨時休業あり）","admission":"佐渡金山コース 大人（中学生以上）1,500円・小学生750円"}',
   '2026-09-28', 'https://www.sado-kinzan.com/price/'),
  ('sado-kinzan', 'en', 'Sado Gold Mine', 'Historic Site Sado Gold Mine', 'Aikawa, Sado',
   'The tourist facility that manages and preserves the Aikawa Gold and Silver Mine, the main mine of the World Heritage Site "Sado Island Gold Mine". Its Sado Kinzan Course visits the Edo-period Sodayu tunnel and the Doyu tunnel, a machine-dug tunnel opened in 1899, with a close view of the Doyu-no-Warito.',
   '{"hours":"April–October 8:00–16:00 (closes 17:30); November–March 8:30–15:30 (closes 17:00)","closed":"Open every day, with occasional closures for weather or maintenance","admission":"Sado Kinzan Course: adults (junior high and older) ¥1,500, elementary students ¥750"}',
   '2026-09-28', 'https://www.sado-kinzan.com/en/'),
  ('sado-kinzan', 'zh-Hans', '佐渡金山', '史迹 佐渡金山', null, null, null, null,
   'https://www.visitsado.com/ch/spot/detail0098/'),

  -- 宿根木
  ('shukunegi', 'ja', '宿根木', null, '佐渡市 宿根木',
   '中世から港があり、江戸後期から明治初期に北前船の商いで栄えた集落。船板を使った板壁の家々が小さな入り江に密集し、国の重要伝統的建造物群保存地区に選ばれています。',
   null, null, 'https://www.visitsado.com/spot/detail0121/'),
  ('shukunegi', 'en', 'Shukunegi', null, 'Shukunegi, Sado',
   'A harbour village since medieval times that prospered through kitamae-bune merchant shipping in the late Edo and early Meiji periods. Over a hundred plank-walled houses crowd a small inlet, and the village is a nationally designated preservation district for traditional buildings.',
   null, null, 'https://www.visitsado.com/en/spot/detail0121/'),
  ('shukunegi', 'zh-Hans', '宿根木', null, null, null, null, null,
   'https://www.visitsado.com/ch/spot/detail0121/'),

  -- 大野亀
  ('onogame', 'ja', '大野亀', null, '佐渡市 願',
   '外海府海岸に突き出す、標高167mの一枚岩。周辺はトビシマカンゾウの群生地で、見頃は5月下旬から6月上旬です。',
   null, null, 'https://www.visitsado.com/spot/detail0133/'),
  ('onogame', 'en', 'Onogame', null, 'Negai, Sado',
   'A single 167-metre rock rising from the sea on the Sotokaifu coast. The slopes around it are covered in Tobishima day lilies, which bloom from late May to early June.',
   null, null, 'https://www.visitsado.com/en/view/nature/'),
  ('onogame', 'zh-Hans', '大野龟', null, null, null, null, null,
   'https://www.visitsado.com/ch/view/nature/'),

  -- ドンデン高原
  ('donden-kogen', 'ja', 'ドンデン高原', null, '佐渡市',
   '正式名はタダラ峰。標高900m級の三つの山からなる高原一帯で、高山植物や山野草が多く、春から初夏にかけて多くの人がトレッキングに訪れます。',
   '{"access":"冬期はドンデン線（道路）が通行止め"}',
   '2026-09-28', 'https://www.visitsado.com/spot/detail0137/'),
  ('donden-kogen', 'en', null, null, 'Sado',
   'Formally Tadara-mine: a highland of three peaks of about 900 m, rich in alpine plants and wildflowers and popular for trekking from spring to early summer.',
   '{"access":"The Donden road is closed in winter"}',
   '2026-09-28', 'https://www.visitsado.com/en/spot/detail0137/'),
  ('donden-kogen', 'zh-Hans', '钝岭山', null, null, null, null, null,
   'https://www.visitsado.com/ch/spot/detail0137/')
) as v(slug, locale, name, official_name, locality, short_description, practical_info, as_of, source_url)
  on v.slug = p.slug
on conflict (place_id, locale) do nothing;

-- ─── provenance ─────────────────────────────────────────────────────────────

insert into public.place_sources (place_id, url, covers, publisher, checked_at, note)
select p.id, v.url, v.covers::text[], v.publisher, '2026-09-28T00:00:00+09:00', v.note
from public.places p
join (values
  ('toki-no-mori', 'https://www.city.sado.niigata.jp/site/tokinomori/1161.html', '{description,practical_info,address}', '佐渡市', 'Hours, closed days and fee (fee revised 2025-04-01). Preferred over visitsado, whose winter dates are out of date.'),
  ('toki-no-mori', 'https://www.visitsado.com/spot/detail0015/', '{coordinates,description}', '佐渡観光交流機構', null),
  ('toki-no-mori', 'https://www.visitsado.com/en/spot/detail0015/', '{name,description}', '佐渡観光交流機構', 'Official English name: Toki no Mori Park.'),
  ('toki-no-mori', 'https://www.visitsado.com/ch/spot/detail0015/', '{name}', '佐渡観光交流機構', 'zh-Hans name only.'),
  ('sado-kinzan', 'https://www.sado-kinzan.com/', '{description,name}', 'ゴールデン佐渡', null),
  ('sado-kinzan', 'https://www.sado-kinzan.com/price/', '{practical_info,description}', 'ゴールデン佐渡', 'Hours change seasonally; a temporary maintenance closure was posted 2026-08-24. Re-check each season.'),
  ('sado-kinzan', 'https://www.sado-kinzan.com/en/', '{name,description}', 'ゴールデン佐渡', 'Official English name: Historic Site Sado Gold Mine. Source of: manages and preserves the Aikawa Gold and Silver Mine, “the main mine of the World Heritage Site ‘Sado Island Gold Mine’”. Tunnel facts come from /price/.'),
  ('sado-kinzan', 'https://www.visitsado.com/spot/detail0098/', '{coordinates}', '佐渡観光交流機構', null),
  ('sado-kinzan', 'https://www.visitsado.com/ch/spot/detail0098/', '{name}', '佐渡観光交流機構', 'zh-Hans name only.'),
  ('shukunegi', 'https://www.visitsado.com/spot/detail0121/', '{coordinates,description}', '佐渡観光交流機構', 'No hours or fees stated (open village).'),
  ('shukunegi', 'https://www.visitsado.com/en/spot/detail0121/', '{name,description}', '佐渡観光交流機構', null),
  ('shukunegi', 'https://www.visitsado.com/ch/spot/detail0121/', '{name}', '佐渡観光交流機構', 'zh-Hans name only.'),
  ('onogame', 'https://www.visitsado.com/spot/detail0133/', '{coordinates,description}', '佐渡観光交流機構', 'EN/CH detail pages were empty on 2026-09-28; EN/zh text taken from the nature listing pages.'),
  ('onogame', 'https://www.visitsado.com/en/view/nature/', '{name,description}', '佐渡観光交流機構', null),
  ('onogame', 'https://www.visitsado.com/ch/view/nature/', '{name}', '佐渡観光交流機構', 'zh-Hans name only.'),
  ('donden-kogen', 'https://www.visitsado.com/spot/detail0137/', '{coordinates,description}', '佐渡観光交流機構', 'visitsado titles the spot ドンデン山; the highland area is ドンデン高原.'),
  ('donden-kogen', 'https://www.visitsado.com/en/spot/detail0137/', '{description}', '佐渡観光交流機構', 'Uses "Mount Donden" (for ドンデン山) — not adopted; English shows the romanized Donden Kōgen.'),
  ('donden-kogen', 'https://sado-geopark.com/site/2404/', '{name,practical_info}', '佐渡ジオパーク推進協議会', 'Winter road closure. Its map pin looks like a placeholder and was not used.'),
  ('donden-kogen', 'https://www.visitsado.com/ch/spot/detail0137/', '{name}', '佐渡観光交流機構', 'zh-Hans name only (its description mistranslates タダラ峰).')
) as v(slug, url, covers, publisher, note)
  on v.slug = p.slug
on conflict (place_id, url) do nothing;
