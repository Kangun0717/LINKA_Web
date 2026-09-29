-- Tests for 20261001100000_community_journal.sql on the local test database.
-- walker 1111…, legacy 2222… (has a pre-visits memory), returning 3333…

-- ═══ A. Past journal entries never become verified presence ════════════════

select t.ok((select kind from memories where user_id = '22222222-2222-4222-8222-222222222222') = 'visit', 'A existing memory becomes kind = visit');
insert into t.kv select 'visits_before', count(*)::text from visits;
insert into t.kv select 'touches_before', count(*)::text from touch_events;
insert into t.kv select 'visitors_before', place_visitors_today(t.place('toki-no-mori'))::text;

set role authenticated;
select t.as_user('11111111-1111-4111-8111-111111111111');
insert into memories (kind, place_id, note, mood, remembered_on, date_precision)
  values ('past', t.place('shukunegi'), 'Summer 2019, before LINKA.', 'moved', '2019-08-12', 'day');
insert into memories (kind, place_label, note, remembered_on, date_precision)
  values ('past', '京都・哲学の道', 'A walk in spring.', '2018-04-01', 'month');
select t.ok((select count(*) from memories where kind = 'past') = 2, 'A past entries saved (LINKA place, and own words)');
select t.fails($$insert into memories (kind, note) values ('past', 'nowhere')$$, '23514', 'A a past entry needs a place or a label');
select 1 from record_touch('e2eKinzanGate0000003');
select t.ok((select count(*) from visits) = 1, 'A (walker now has one verified visit)');
select t.fails($$insert into memories (kind, visit_id, place_id) select 'past', id, place_id from visits limit 1$$, '23514', 'A a past entry cannot claim a visit');
select t.fails(format($$insert into memories (kind, place_id) values ('visit', %L)$$, t.place('onogame')), '42501', 'A a verified memory cannot exist without a visit');
select t.fails($$update memories set kind = 'visit' where kind = 'past'$$, '42501', 'A kind is not updatable: a past entry never becomes verified');
update memories set place_id = t.place('onogame'), place_label = null where note = 'Summer 2019, before LINKA.';
select t.ok((select place_id from memories where note = 'Summer 2019, before LINKA.') = t.place('onogame'), 'A a past entry''s place can be corrected');
update memories set remembered_on = '2019-08-10' where note = 'Summer 2019, before LINKA.';
select t.ok((select remembered_on from memories where note = 'Summer 2019, before LINKA.') = '2019-08-10', 'A and its date');
reset role;

-- A verified memory keeps its place and has no date of its own.
select t.as_user('22222222-2222-4222-8222-222222222222');
set role authenticated;
select t.ok((select count(*) from memories) = 1, 'A another user sees none of walker''s entries');
select t.fails(format($$update memories set place_id = %L$$, t.place('onogame')), '42501', 'A a verified memory cannot move to another place');
select t.fails($$update memories set remembered_on = '2020-01-01'$$, '23514', 'A a verified memory has no date of its own');
reset role;

-- Exactly one more of each: the one Touch recorded above. Past entries add none.
select t.ok(count(*) = (select v::int + 1 from t.kv where k = 'visits_before'), 'A past entries created no visit') from visits;
select t.ok(count(*) = (select v::int + 1 from t.kv where k = 'touches_before'), 'A past entries created no touch') from touch_events;
select t.ok(place_visitors_today(t.place('toki-no-mori'))::text = (select v from t.kv where k = 'visitors_before'), 'A visitor count unchanged');

-- Verified path still works end to end.
select t.as_user('11111111-1111-4111-8111-111111111111');
set role authenticated;
insert into t.kv select 'walker_visit', visit_id::text from record_touch('e2eTokiGate000000001');
insert into memories (visit_id, place_id, note) select (v)::uuid, t.place('toki-no-mori'), 'Verified today' from t.kv where k = 'walker_visit';
select t.ok((select kind from memories where note = 'Verified today') = 'visit', 'A a Touch still makes a verified memory');
reset role;

-- ═══ B. Community ══════════════════════════════════════════════════════════

-- B1. submit (private until opened)
select t.as_user('11111111-1111-4111-8111-111111111111');
set role authenticated;
insert into place_suggestions (name, address, latitude, longitude, reason, attribution, locale)
  values ('北沢浮遊選鉱場跡', '佐渡市相川北沢町 3-1 (private detail)', 38.0282, 138.2382, 'Ruins like a castle in the green, lit up at night.', 'nickname', 'en');
insert into place_suggestions (name, address, reason, locale)
  values ('小木の たらい舟', '佐渡市小木町', 'Rowing a wooden tub boat around the harbour.', 'ja');
reset role;
insert into t.kv select 'kitazawa', id::text from place_suggestions where name = '北沢浮遊選鉱場跡';
insert into t.kv select 'tarai', id::text from place_suggestions where name = '小木の たらい舟';
select t.ok((select status from place_suggestions where id = (select v::uuid from t.kv where k = 'kitazawa')) = 'submitted', 'B1 submitted');
select t.ok((select count(*) from place_suggestion_events where suggestion_id = (select v::uuid from t.kv where k = 'kitazawa') and status = 'submitted') = 1, 'B1 submission logged');

select t.as_user(null);
set role anon;
select t.ok((select count(*) from community_suggestions()) = 0, 'B1 anon: nothing public before LINKA opens it');
select t.ok((select count(*) from community_suggestion((select v::uuid from t.kv where k = 'kitazawa'))) = 0, 'B1 anon: detail of a submitted suggestion is empty');
select t.ok((select count(*) from community_suggestion_timeline((select v::uuid from t.kv where k = 'kitazawa'))) = 0, 'B1 anon: no timeline either');
select t.fails($$select * from place_suggestions$$, '42501', 'B1 anon cannot read the table');
reset role;

select t.as_user('11111111-1111-4111-8111-111111111111');
set role authenticated;
select t.ok((select count(*) from community_suggestion_timeline((select v::uuid from t.kv where k = 'kitazawa'))) = 1, 'B1 the proposer sees their own timeline');
update place_suggestions set reason = 'Ruins like a castle in the green.' where id = (select v::uuid from t.kv where k = 'kitazawa');
select t.ok((select reason from place_suggestions where id = (select v::uuid from t.kv where k = 'kitazawa')) = 'Ruins like a castle in the green.', 'B1 the proposer can edit before it opens');
select t.fails(format($$update place_suggestions set status = 'open' where id = %L$$, (select v from t.kv where k = 'kitazawa')), '42501', 'B1 the proposer cannot open it');
select t.fails($$insert into place_suggestions (name, address, reason, public_reason) values ('x', 'y', 'z', 'my own public text')$$, '42501', 'C the proposer cannot write public_reason on submit');
select t.fails(format($$update place_suggestions set public_reason = 'mine' where id = %L$$, (select v from t.kv where k = 'kitazawa')), '42501', 'C … nor later');
reset role;

-- B2. LINKA opens it (staff tooling = service role)
set role service_role;
-- tarai: LINKA writes its own public text in the opening update; kitazawa: none.
update place_suggestions set status = 'open', public_area = '佐渡・相川', region_id = t.place('sado'), public_latitude = 38.03, public_longitude = 138.24,
    public_reason = case when name = '小木の たらい舟' then 'Tub boats in Ogi harbour.' end
  where id in (select v::uuid from t.kv where k in ('kitazawa', 'tarai'));
insert into place_suggestion_events (suggestion_id, kind, public_note, internal_note)
  select v::uuid, 'update', '{"en":"Checking opening hours with the city","ja":"市に公開時間を確認しています"}', 'Owner Mr X, phone 090-xxxx (INTERNAL)'
  from t.kv where k = 'kitazawa';
reset role;
select t.ok((select opened_at is not null from place_suggestions where id = (select v::uuid from t.kv where k = 'kitazawa')), 'B2 opened_at set');
select t.ok((select public_reason = reason and reason = 'Ruins like a castle in the green.' from place_suggestions where id = (select v::uuid from t.kv where k = 'kitazawa')), 'C public_reason starts as the proposer''s words');
select t.ok((select public_reason = 'Tub boats in Ogi harbour.' and reason = 'Rowing a wooden tub boat around the harbour.' from place_suggestions where id = (select v::uuid from t.kv where k = 'tarai')), 'C a public text LINKA sets when opening is kept; the original too');

select t.as_user(null);
set role anon;
select t.ok((select count(*) from community_suggestions()) = 2, 'B2 anon: both open suggestions are public');
select t.ok((select proposer_name from community_suggestions() where name = '北沢浮遊選鉱場跡') = 'Walker', 'B2 nickname shown when the proposer chose it');
select t.ok((select proposer_name from community_suggestions() where name = '小木の たらい舟') is null, 'B2 anonymous by default');
select t.ok((select public_area from community_suggestion((select v::uuid from t.kv where k = 'kitazawa'))) = '佐渡・相川', 'B2 public area shown');
select t.ok((select public_latitude = 38.03 and public_longitude = 138.24 from community_suggestion((select v::uuid from t.kv where k = 'kitazawa'))), 'B2 the approximate map point LINKA set is public — not the proposer''s 38.0282, 138.2382');
select t.ok(not exists (
  select 1 from pg_proc p, unnest(p.proargnames) a
  where p.proname in ('community_suggestions', 'community_suggestion', 'community_suggestion_timeline')
    and a in ('user_id', 'address', 'latitude', 'longitude', 'review_note', 'internal_note', 'reviewed_by', 'storage_path', 'reason')
), 'B2 no public function returns user_id, address, coordinates, reviewer or internal notes — or the original reason');
select t.ok((select public_reason from community_suggestion((select v::uuid from t.kv where k = 'tarai'))) = 'Tub boats in Ogi harbour.', 'C the public reads public_reason');
select t.ok((select count(*) from community_suggestion_timeline((select v::uuid from t.kv where k = 'kitazawa'))) = 3, 'B2 public timeline: submitted, opened, update');
select t.ok((select string_agg(public_note::text, '') from community_suggestion_timeline((select v::uuid from t.kv where k = 'kitazawa'))) not like '%INTERNAL%', 'B2 internal note never in the timeline');
reset role;

select t.as_user('11111111-1111-4111-8111-111111111111');
set role authenticated;
update place_suggestions set reason = 'changed after opening' where id = (select v::uuid from t.kv where k = 'kitazawa');
select t.ok((select reason from place_suggestions where id = (select v::uuid from t.kv where k = 'kitazawa')) <> 'changed after opening', 'B2 the proposer can no longer edit once open');
reset role;

-- C. LINKA redacts the public text; the original is never overwritten.
select t.as_user(null);
set role service_role;
update place_suggestions set public_reason = 'Ruins like a castle in the green. [detail removed by LINKA]' where id = (select v::uuid from t.kv where k = 'kitazawa');
select t.fails_with(format($$update place_suggestions set reason = 'rewritten by staff' where id = %L$$, (select v from t.kv where k = 'kitazawa')), '42501', 'original_reason_immutable', 'C staff cannot overwrite the original reason');
select t.fails_with(format($$update place_suggestions set reason = null where id = %L$$, (select v from t.kv where k = 'kitazawa')), '42501', 'original_reason_immutable', 'C … nor clear it');
reset role;
select t.as_user(null);
set role anon;
select t.ok((select public_reason from community_suggestion((select v::uuid from t.kv where k = 'kitazawa'))) = 'Ruins like a castle in the green. [detail removed by LINKA]', 'C the public sees the redacted text');
reset role;
select t.as_user('11111111-1111-4111-8111-111111111111');
set role authenticated;
select t.ok((select reason = 'Ruins like a castle in the green.' and public_reason like '%removed by LINKA%' from place_suggestions where id = (select v::uuid from t.kv where k = 'kitazawa')), 'C the proposer still reads their original, and the public version');
reset role;

-- B3. 行ってみたい support
-- A. The proposer (walker) cannot support their own suggestion.
select t.as_user('11111111-1111-4111-8111-111111111111');
set role authenticated;
select t.ok(not suggestion_accepts_support((select v::uuid from t.kv where k = 'kitazawa')), 'A the policy predicate refuses the proposer');
select t.fails_with(format($$insert into place_suggestion_supports (suggestion_id) values (%L)$$, (select v from t.kv where k = 'kitazawa')), '42501', 'own_suggestion', 'A a proposer cannot support their own suggestion');
reset role;
select t.ok((select support_count from place_suggestions where id = (select v::uuid from t.kv where k = 'kitazawa')) = 0, 'A … and the count is untouched');
select t.as_user('33333333-3333-4333-8333-333333333333');
set role authenticated;
select t.ok(suggestion_accepts_support((select v::uuid from t.kv where k = 'kitazawa')), 'A another account may');
reset role;
select t.as_user('33333333-3333-4333-8333-333333333333');
set role authenticated;
insert into place_suggestion_supports (suggestion_id) select v::uuid from t.kv where k = 'kitazawa';
select t.fails(format($$insert into place_suggestion_supports (suggestion_id) values (%L)$$, (select v from t.kv where k = 'kitazawa')), '23505', 'B3 one support per account');
reset role;
select t.as_user('22222222-2222-4222-8222-222222222222');
set role authenticated;
insert into place_suggestion_supports (suggestion_id) select v::uuid from t.kv where k = 'kitazawa';
select t.ok((select count(*) from place_suggestion_supports) = 1, 'B3 a user sees only their own supports');
reset role;
select t.ok((select support_count from place_suggestions where id = (select v::uuid from t.kv where k = 'kitazawa')) = 2, 'B3 count = 2');
select t.as_user('22222222-2222-4222-8222-222222222222');
set role authenticated;
delete from place_suggestion_supports;
reset role;
select t.ok((select support_count from place_suggestions where id = (select v::uuid from t.kv where k = 'kitazawa')) = 1, 'B3 support can be removed (count = 1)');
select t.as_user(null);
set role anon;
select t.ok((select support_count from community_suggestion((select v::uuid from t.kv where k = 'kitazawa'))) = 1, 'B3 the public sees the count');
select t.fails($$select * from place_suggestion_supports$$, '42501', 'B3 the public never sees who');
select t.fails(format($$insert into place_suggestion_supports (suggestion_id, user_id) values (%L, '33333333-3333-4333-8333-333333333333')$$, (select v from t.kv where k = 'tarai')), '42501', 'B3 a guest cannot support');
reset role;
-- Not public → not supportable.
select t.as_user('33333333-3333-4333-8333-333333333333');
set role authenticated;
insert into place_suggestions (name, address, reason) values ('Private idea', 'somewhere', 'because');
select t.fails(format($$update place_suggestions set support_count = 999 where id = %L$$, (select v from t.kv where k = 'kitazawa')), '42501', 'B3 nobody can set the count');
reset role;
insert into t.kv select 'private', id::text from place_suggestions where name = 'Private idea';
select t.as_user('22222222-2222-4222-8222-222222222222');
set role authenticated;
select t.fails_with(format($$insert into place_suggestion_supports (suggestion_id) values (%L)$$, (select v from t.kv where k = 'private')), '42501', 'support_closed', 'B3 a submitted suggestion cannot be supported');
reset role;
set role service_role;
select t.fails(format($$insert into place_suggestion_supports (suggestion_id, user_id) values (%L, '11111111-1111-4111-8111-111111111111')$$, (select v from t.kv where k = 'tarai')), '42501', 'B3 staff cannot create supports');
reset role;

-- B4. photos: private until approved and copied
select t.as_user('11111111-1111-4111-8111-111111111111');
set role authenticated;
insert into place_suggestion_photos (suggestion_id, storage_path, width, height)
  select v::uuid, '11111111-1111-4111-8111-111111111111/' || v || '/a.jpg', 1600, 1200 from t.kv where k = 'kitazawa';
select t.fails(format($$insert into place_suggestion_photos (suggestion_id, storage_path, width, height, review_status) values (%L, '11111111-1111-4111-8111-111111111111/x/b.jpg', 10, 10, 'approved')$$, (select v from t.kv where k = 'kitazawa')), '42501', 'B4 a photo cannot approve itself');
select t.fails(format($$insert into place_suggestion_photos (suggestion_id, storage_path, width, height) values (%L, '33333333-3333-4333-8333-333333333333/x/c.jpg', 10, 10)$$, (select v from t.kv where k = 'kitazawa')), '23514', 'B4 path must be the owner''s folder');
reset role;
select t.as_user('33333333-3333-4333-8333-333333333333');
set role authenticated;
select t.fails(format($$insert into place_suggestion_photos (suggestion_id, storage_path, width, height) values (%L, '33333333-3333-4333-8333-333333333333/x/c.jpg', 10, 10)$$, (select v from t.kv where k = 'kitazawa')), '42501', 'B4 nobody adds photos to someone else''s suggestion');
select t.ok((select count(*) from place_suggestion_photos) = 0, 'B4 other users cannot read photo rows');
reset role;
select t.as_user(null);
set role anon;
select t.ok((select photos from community_suggestion((select v::uuid from t.kv where k = 'kitazawa'))) = '{}', 'B4 no public photo before review');
reset role;
set role service_role;
update place_suggestion_photos set review_status = 'approved', public_path = 'kitazawa/a.jpg';
reset role;
select t.as_user(null);
set role anon;
select t.ok((select photos from community_suggestion((select v::uuid from t.kv where k = 'kitazawa'))) = '{kitazawa/a.jpg}', 'B4 the approved public copy appears');
select t.ok((select cover_path from community_suggestions() where name = '北沢浮遊選鉱場跡') = 'kitazawa/a.jpg', 'B4 and becomes the cover');
reset role;

-- B5. the journey to a LINKA place
set role service_role;
update place_suggestions set status = 'contacting_partner' where id = (select v::uuid from t.kv where k = 'kitazawa');
update place_suggestions set status = 'approved' where id = (select v::uuid from t.kv where k = 'kitazawa');
reset role;
-- D. Support stays open through approved (準備中) …
select t.as_user('22222222-2222-4222-8222-222222222222');
set role authenticated;
insert into place_suggestion_supports (suggestion_id) select v::uuid from t.kv where k = 'kitazawa';
reset role;
select t.ok((select support_count from place_suggestions where id = (select v::uuid from t.kv where k = 'kitazawa')) = 2, 'D support is still open at approved / 準備中 (count = 2)');
set role service_role;
update place_suggestions set status = 'published', place_id = t.place('sado-kinzan') where id = (select v::uuid from t.kv where k = 'kitazawa');
reset role;
select t.ok((select published_at is not null and place_id = t.place('sado-kinzan') from place_suggestions where id = (select v::uuid from t.kv where k = 'kitazawa')), 'B5 published, linked to its LINKA place');
select t.as_user(null);
set role anon;
select t.ok((select string_agg(coalesce(status, kind), '>' order by occurred_at) from community_suggestion_timeline((select v::uuid from t.kv where k = 'kitazawa'))) = 'submitted>open>update>contacting_partner>approved>published', 'B5 the full public journey');
reset role;
-- D. … and freezes at publication.
select t.as_user('22222222-2222-4222-8222-222222222222');
set role authenticated;
select t.fails_with(format($$insert into place_suggestion_supports (suggestion_id) values (%L)$$, (select v from t.kv where k = 'kitazawa')), '42501', 'support_closed', 'D a published suggestion takes no new support');
reset role;
select t.as_user('33333333-3333-4333-8333-333333333333');
set role authenticated;
delete from place_suggestion_supports where suggestion_id = (select v::uuid from t.kv where k = 'kitazawa');
select t.ok((select count(*) from place_suggestion_supports where suggestion_id = (select v::uuid from t.kv where k = 'kitazawa')) = 1, 'D a support cannot be withdrawn after publication (the row stays)');
reset role;
select t.ok((select support_count from place_suggestions where id = (select v::uuid from t.kv where k = 'kitazawa')) = 2, 'D … and the count stays 2');
set role service_role;
delete from place_suggestion_supports where suggestion_id = (select v::uuid from t.kv where k = 'kitazawa') and user_id = '33333333-3333-4333-8333-333333333333';
reset role;
select t.ok((select support_count from place_suggestions where id = (select v::uuid from t.kv where k = 'kitazawa')) = 2, 'D a support removed later (e.g. deleted account) leaves the frozen count');
set role service_role;
select t.fails_with(format($$update place_suggestions set support_count = 5 where id = %L$$, (select v from t.kv where k = 'kitazawa')), '42501', 'support_count_frozen', 'D not even staff can change a frozen count');
reset role;
select t.as_user(null);
set role anon;
select t.ok((select status = 'published' and support_count = 2 from community_suggestion((select v::uuid from t.kv where k = 'kitazawa'))), 'D the public sees published with the frozen count');
reset role;

-- B6. withdrawal
select t.as_user('33333333-3333-4333-8333-333333333333');
set role authenticated;
select t.fails(format($$select withdraw_suggestion(%L)$$, (select v from t.kv where k = 'tarai')), 'P0001', 'B6 only the proposer can withdraw');
reset role;
select t.as_user('11111111-1111-4111-8111-111111111111');
set role authenticated;
select withdraw_suggestion((select v::uuid from t.kv where k = 'tarai'));
select t.fails(format($$select withdraw_suggestion(%L)$$, (select v from t.kv where k = 'kitazawa')), 'P0001', 'B6 a published suggestion cannot be withdrawn');
reset role;
select t.ok((select status || '/' || (withdrawn_at is not null) from place_suggestions where id = (select v::uuid from t.kv where k = 'tarai')) = 'withdrawn/true', 'B6 withdrawn');
select t.as_user(null);
set role anon;
select t.ok((select count(*) from community_suggestions()) = 1, 'B6 a withdrawn suggestion is no longer public');
select t.fails($$select withdraw_suggestion(gen_random_uuid())$$, '42501', 'B6 anon cannot call withdraw');
reset role;

-- B7. roles
select t.ok(not has_table_privilege('anon', 'place_suggestion_events', 'SELECT') and not has_table_privilege('authenticated', 'place_suggestion_events', 'SELECT'), 'B7 clients cannot read the events table');
select t.ok(not has_table_privilege('authenticated', 'place_suggestion_supports', 'UPDATE'), 'B7 supports are never updated');
select t.ok(not has_function_privilege('authenticated', 'place_suggestion_support_count()', 'EXECUTE'), 'B7 trigger functions are not callable');
select t.ok(has_function_privilege('anon', 'community_suggestions(text[], integer)', 'EXECUTE'), 'B7 anon reads the public model');
select t.ok((select public from storage.buckets where id = 'community-media'), 'B7 community-media is public-read');
select t.ok(not exists (select 1 from pg_policies where schemaname = 'storage' and policyname ilike '%community%'), 'B7 no client may write community-media');
select t.ok(not has_table_privilege('authenticated', 'community_rate_limits', 'SELECT') and not has_table_privilege('authenticated', 'community_rate_limits', 'UPDATE')
  and not has_table_privilege('authenticated', 'community_action_log', 'SELECT') and not has_table_privilege('authenticated', 'community_action_log', 'INSERT')
  and not has_table_privilege('anon', 'community_action_log', 'SELECT'), 'B7 clients can neither read nor change the rate limits or the log');
select t.ok(not has_function_privilege('authenticated', 'community_rate_limit()', 'EXECUTE') and not has_function_privilege('authenticated', 'place_suggestion_guard()', 'EXECUTE')
  and not has_function_privilege('authenticated', 'place_suggestion_support_guard()', 'EXECUTE'), 'B7 guard and rate-limit functions are not callable');

-- ═══ B8. Rate limits (server-side) ═════════════════════════════════════════
select t.ok((select string_agg(action || ' ' || max_count || '/' || window_length, ', ' order by action, window_length) from community_rate_limits)
  = 'suggestion_photo 20/1 day, suggestion_submit 3/1 day, suggestion_submit 10/30 days, suggestion_support 30/01:00:00, suggestion_support 60/1 day', 'B8 default limits');

-- Submissions: walker submitted 2 today (B1); a 3rd passes, a 4th is refused.
select t.as_user('11111111-1111-4111-8111-111111111111');
set role authenticated;
insert into place_suggestions (name, address, reason) values ('Third idea', 'Sado', 'because');
select t.fails_with($$insert into place_suggestions (name, address, reason) values ('Fourth idea', 'Sado', 'because')$$, 'PT429', 'rate_limited', 'B8 a 4th submission in one day is refused');
reset role;
select t.ok((select count(*) from place_suggestions where name = 'Fourth idea') = 0
  and (select count(*) from community_action_log where user_id = '11111111-1111-4111-8111-111111111111' and action = 'suggestion_submit') = 3, 'B8 a refused attempt leaves no row and no log entry');
-- Changed by staff, without a migration, effective at once.
set role service_role;
update community_rate_limits set max_count = 4 where action = 'suggestion_submit' and window_length = '1 day';
reset role;
set role authenticated;
insert into place_suggestions (name, address, reason) values ('Fourth idea', 'Sado', 'because');
reset role;
select t.ok((select count(*) from place_suggestions where name = 'Fourth idea') = 1, 'B8 raising a limit takes effect at once');
set role service_role;
update community_rate_limits set max_count = 3 where action = 'suggestion_submit' and window_length = '1 day';
reset role;

-- Photos: walker added 1 (B4). With the daily cap at 1, the next is refused.
insert into t.kv select 'third', id::text from place_suggestions where name = 'Third idea';
set role service_role;
update community_rate_limits set max_count = 1 where action = 'suggestion_photo';
reset role;
set role authenticated;
select t.fails_with(format($$insert into place_suggestion_photos (suggestion_id, storage_path, width, height) values (%L, '11111111-1111-4111-8111-111111111111/%s/d.jpg', 10, 10)$$, (select v from t.kv where k = 'third'), (select v from t.kv where k = 'third')), 'PT429', 'rate_limited', 'B8 photo uploads are limited');
reset role;
set role service_role;
update community_rate_limits set max_count = 20 where action = 'suggestion_photo';
reset role;

-- Supports: returning (2222) supported twice (B3, withdrawn; B5). With the
-- hourly cap at 2, a third is refused: a withdrawn support still counts.
set role service_role;
update place_suggestions set status = 'open' where id = (select v::uuid from t.kv where k = 'private');
update community_rate_limits set max_count = 2 where action = 'suggestion_support' and window_length = '1 hour';
reset role;
select t.ok((select count(*) from place_suggestion_supports where user_id = '22222222-2222-4222-8222-222222222222') = 1
  and (select count(*) from community_action_log where user_id = '22222222-2222-4222-8222-222222222222' and action = 'suggestion_support') = 2, 'B8 support churn is logged (1 support held, 2 given)');
select t.as_user('22222222-2222-4222-8222-222222222222');
set role authenticated;
select t.fails_with(format($$insert into place_suggestion_supports (suggestion_id) values (%L)$$, (select v from t.kv where k = 'private')), 'PT429', 'rate_limited', 'B8 supports are limited');
reset role;
set role service_role;
update community_rate_limits set max_count = 30 where action = 'suggestion_support' and window_length = '1 hour';
reset role;
set role authenticated;
insert into place_suggestion_supports (suggestion_id) select v::uuid from t.kv where k = 'private';
reset role;
select t.ok((select support_count from place_suggestions where id = (select v::uuid from t.kv where k = 'private')) = 1, 'B8 and allowed again under the default');

-- Staff tooling (service role, no user) is not limited.
select t.as_user(null);
set role service_role;
insert into place_suggestions (user_id, name, address, reason) values ('11111111-1111-4111-8111-111111111111', 'Entered by staff', 'Sado', 'from a phone call');
reset role;
select t.ok((select count(*) from place_suggestions where name = 'Entered by staff') = 1, 'B8 staff tooling is not rate-limited');
