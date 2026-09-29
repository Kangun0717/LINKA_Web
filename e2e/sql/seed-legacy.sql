-- Test data as it existed before visits (applied by lib/db.mjs just before
-- 20260929100000). Temporary users exist only in the local test database.
--
--   walker     — no history; the main journey tests
--   legacy     — touched the plaza and kept a memory with a photo, the way
--                production's one memory was kept (keyed by touch)
--   returning  — signs in during a Touch (the auth-interruption test)

insert into auth.users values
  ('11111111-1111-4111-8111-111111111111', 'walker@e2e.test'),
  ('22222222-2222-4222-8222-222222222222', 'legacy@e2e.test'),
  ('33333333-3333-4333-8333-333333333333', 'returning@e2e.test');
insert into public.profiles (id, display_name) values
  ('11111111-1111-4111-8111-111111111111', 'Walker'),
  ('22222222-2222-4222-8222-222222222222', 'Legacy'),
  ('33333333-3333-4333-8333-333333333333', 'Returning');

-- The demo tag carries production's public id, as a test point (demo access
-- is granted to it by 20260929100000, exactly as in production).
insert into public.touchpoints (name, code, touchpoint_type, place_id, public_id, is_test)
select v.name, v.code, 'place', p.id, v.public_id, v.is_test
from (values
  ('toki-demo',   'e2e-c0', 'U14Xpkv9c9bfCaGAARWWUg', 'toki-no-mori', true),
  ('toki-gate',   'e2e-c1', 'e2eTokiGate000000001',   'toki-no-mori', false),
  ('toki-plaza',  'e2e-c2', 'e2eTokiPlaza00000002',   'toki-no-mori', false),
  ('kinzan-gate', 'e2e-c3', 'e2eKinzanGate0000003',   'sado-kinzan',  false)
) v(name, code, public_id, slug, is_test)
join public.places p on p.slug = v.slug;

set role authenticated;
select set_config('request.jwt.claim.sub', '22222222-2222-4222-8222-222222222222', false);
select 1 from public.record_touch('e2eTokiPlaza00000002');
insert into public.memories (place_id, touch_event_id, note)
  select place_id, id, 'Legacy memory from before visits.' from public.touch_events;
insert into public.memory_photos (memory_id, storage_path, width, height, position)
  select id, '22222222-2222-4222-8222-222222222222/' || id || '/legacy.jpg', 640, 480, 0 from public.memories;
update public.memories set cover_photo_id = (select id from public.memory_photos);
reset role;
select set_config('request.jwt.claim.sub', '', false);

-- Past the 10-minute duplicate window, still the same local day.
update public.touch_events set touched_at = touched_at - interval '20 minutes';
