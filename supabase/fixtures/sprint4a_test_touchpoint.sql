-- ============================================================================
-- DEVELOPMENT / TEST FIXTURE — not a migration, never run automatically.
--
-- Run once, deliberately, after the Sprint 4A migrations:
--   supabase db query --linked -f supabase/fixtures/sprint4a_test_touchpoint.sql
--
-- 1. One test Touch Point at トキの森公園 ("Main / General").
--    It does NOT claim a physical tag is installed. is_test = true means:
--      - only admins can see, resolve or touch it;
--      - its touches carry is_test = true and never count as LINKA activity.
--    Its public id is fixed so the test URL is stable:
--      /t/U14Xpkv9c9bfCaGAARWWUg
--
-- 2. Makes the project owner's profile an admin, which is what allows the
--    test touch. This is the only way a role changes: the client can no
--    longer write `role` (see 20260928100000_harden_existing.sql).
-- ============================================================================

insert into public.touchpoints
  (place_id, name, code, touchpoint_type, access_mode, is_active, is_test, public_id, latitude, longitude)
select p.id, 'Main / General', 'test-toki-no-mori-main', 'place', 'account_first', true, true,
       'U14Xpkv9c9bfCaGAARWWUg', p.latitude, p.longitude
from public.places p
where p.slug = 'toki-no-mori'
on conflict (code) do nothing;

update public.profiles
set role = 'admin'
where id = '6cbea5d3-b694-4823-978e-e3ba545babbc'
  and role = 'user';
