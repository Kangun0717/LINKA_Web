-- Assertion helpers for SQL tests (local test database only).
create schema if not exists t;
grant usage on schema t to anon, authenticated, service_role;
create table if not exists t.kv (k text primary key, v text);
grant all on t.kv to anon, authenticated, service_role;

create or replace function t.ok(cond boolean, label text) returns void language plpgsql as $$
begin
  if cond is distinct from true then raise notice 'FAIL: %', label; return; end if;
  raise notice 'PASS: %', label;
end $$;

-- Passes only if `sql` fails with SQLSTATE `state`.
create or replace function t.fails(sql text, state text, label text) returns void language plpgsql as $$
begin
  begin
    execute sql;
  exception when others then
    if sqlstate = state then raise notice 'PASS: % (%)', label, sqlstate; return; end if;
    raise notice 'FAIL: % — expected %, got %: %', label, state, sqlstate, sqlerrm;
    return;
  end;
  raise notice 'FAIL: % — statement succeeded', label;
end $$;

-- Passes only if `sql` fails with SQLSTATE `state` and exactly message `msg`.
create or replace function t.fails_with(sql text, state text, msg text, label text) returns void language plpgsql as $$
begin
  begin
    execute sql;
  exception when others then
    if sqlstate = state and sqlerrm = msg then raise notice 'PASS: % (% %)', label, sqlstate, sqlerrm; return; end if;
    raise notice 'FAIL: % — expected % %, got %: %', label, state, msg, sqlstate, sqlerrm;
    return;
  end;
  raise notice 'FAIL: % — statement succeeded', label;
end $$;

-- Act as a user (or as anon with null) for the statements that follow.
create or replace function t.as_user(u uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', coalesce(json_build_object('sub', u)::text, ''), false);
  perform set_config('request.jwt.claim.sub', coalesce(u::text, ''), false);
end $$;

create or replace function t.place(slug text) returns uuid language sql stable security definer as $$
  select id from public.places where places.slug = place.slug
$$;
grant execute on all functions in schema t to anon, authenticated, service_role;
