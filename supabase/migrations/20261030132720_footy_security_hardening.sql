-- Additive hardening for existing installations. Apply after the base migrations.
-- Keep MFA enrollment optional; enforce it server-side once a factor is verified.
create schema if not exists footy_private;
revoke all on schema footy_private from public, anon;
grant usage on schema footy_private to authenticated;

create or replace function footy_private.mfa_satisfied() returns boolean
language sql stable security definer set search_path = '' as $$
  select auth.uid() is not null and (
    coalesce(auth.jwt()->>'aal', 'aal1') = 'aal2'
    or not exists (
      select 1 from auth.mfa_factors
      where user_id = auth.uid() and status = 'verified'
    )
  );
$$;
revoke all on function footy_private.mfa_satisfied() from public, anon;
grant execute on function footy_private.mfa_satisfied() to authenticated;

drop policy if exists footy_require_mfa on public.footy_profiles;
create policy footy_require_mfa on public.footy_profiles as restrictive
for all to authenticated
using ((select footy_private.mfa_satisfied()))
with check ((select footy_private.mfa_satisfied()));

create or replace function public.footy_delete_account() returns void
language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid(); recent_password boolean;
begin
  if caller is null then raise exception 'Sign in required' using errcode = '42501'; end if;
  if not footy_private.mfa_satisfied() then
    raise exception 'Complete two-factor authentication before deleting your account' using errcode = '42501';
  end if;
  if not exists (select 1 from auth.sessions s where s.user_id = caller
    and s.id::text = auth.jwt()->>'session_id'
    and (s.not_after is null or s.not_after > now())) then
    raise exception 'Sign in again before deleting your account' using errcode = '42501';
  end if;
  select exists (
    select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr', '[]'::jsonb)) as method
    where method->>'method' = 'password'
      and (method->>'timestamp')::numeric between extract(epoch from now()) - 300 and extract(epoch from now())
  ) into recent_password;
  if not recent_password then raise exception 'Sign in again with your password before deleting your account' using errcode = '42501'; end if;
  delete from auth.users where id = caller;
end;
$$;
revoke all on function public.footy_delete_account() from public, anon;
grant execute on function public.footy_delete_account() to authenticated;

-- Validate direct REST writes as well as the follow RPCs. Bound serialized size
-- before inspecting elements, and reject nested/unknown fields.
create or replace function footy_private.valid_profile_json(teams jsonb, leagues jsonb, matches jsonb, prefs jsonb)
returns boolean language plpgsql immutable set search_path = '' as $$
declare item jsonb;
begin
  if teams is null or leagues is null or matches is null or prefs is null then return false; end if;
  if octet_length(teams::text) > 32768 or octet_length(leagues::text) > 2048
    or octet_length(matches::text) > 131072 or octet_length(prefs::text) > 1024 then return false; end if;
  if jsonb_typeof(teams) <> 'array' or jsonb_typeof(leagues) <> 'array'
    or jsonb_typeof(matches) <> 'array' or jsonb_typeof(prefs) <> 'object' then return false; end if;
  if jsonb_array_length(teams) > 30 or jsonb_array_length(leagues) > 15 or jsonb_array_length(matches) > 300 then return false; end if;
  for item in select value from jsonb_array_elements(teams) loop
    if jsonb_typeof(item) <> 'object' then return false; end if;
    if item - array['id','name','league'] <> '{}'::jsonb
      or jsonb_typeof(item->'id') is distinct from 'string'
      or coalesce(item->>'id','') !~ '^[0-9]{1,20}$'
      or jsonb_typeof(item->'name') is distinct from 'string'
      or char_length(coalesce(item->>'name','')) not between 1 and 200 then return false; end if;
    if item ? 'league' and (jsonb_typeof(item->'league') <> 'string' or item->>'league' !~ '^[a-z0-9.]{1,40}$') then return false; end if;
  end loop;
  for item in select value from jsonb_array_elements(leagues) loop
    if jsonb_typeof(item) <> 'string' or item #>> '{}' !~ '^[a-z0-9.]{1,40}$' then return false; end if;
  end loop;
  for item in select value from jsonb_array_elements(matches) loop
    if jsonb_typeof(item) <> 'object' then return false; end if;
    if item - array['id','name','league','date'] <> '{}'::jsonb
      or jsonb_typeof(item->'id') is distinct from 'string'
      or coalesce(item->>'id','') !~ '^[0-9]{1,20}$'
      or jsonb_typeof(item->'league') is distinct from 'string'
      or coalesce(item->>'league','') !~ '^[a-z0-9.]{1,40}$' then return false; end if;
    if item ? 'name' and (jsonb_typeof(item->'name') not in ('string','null') or char_length(item->>'name') > 200) then return false; end if;
    if item ? 'date' and (jsonb_typeof(item->'date') not in ('string','null') or char_length(item->>'date') > 64) then return false; end if;
  end loop;
  if prefs - array['timezone','clock','goals','kickoff','fulltime'] <> '{}'::jsonb then return false; end if;
  if prefs ? 'timezone' and (jsonb_typeof(prefs->'timezone') <> 'string'
    or char_length(prefs->>'timezone') not between 1 and 80
    or prefs->>'timezone' !~ '^[A-Za-z0-9_+/-]+$') then return false; end if;
  if prefs ? 'clock' and (jsonb_typeof(prefs->'clock') <> 'string' or prefs->>'clock' not in ('12','24')) then return false; end if;
  foreach item in array array[prefs->'goals',prefs->'kickoff',prefs->'fulltime'] loop
    if item is not null and jsonb_typeof(item) <> 'boolean' then return false; end if;
  end loop;
  return true;
end;
$$;
revoke all on function footy_private.valid_profile_json(jsonb,jsonb,jsonb,jsonb) from public, anon;
grant execute on function footy_private.valid_profile_json(jsonb,jsonb,jsonb,jsonb) to authenticated;

alter table public.footy_profiles add constraint footy_profile_json_schema
check (footy_private.valid_profile_json(favorite_teams, favorite_leagues, followed_matches, preferences)) not valid;
-- Validation intentionally fails without rewriting existing user data if a legacy
-- row needs repair. Inspect it privately instead of silently dropping favorites.
alter table public.footy_profiles validate constraint footy_profile_json_schema;
