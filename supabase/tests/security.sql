-- Run in the SQL editor as postgres after all migrations. All fixtures and
-- writes, including deletion of a synthetic test account, are rolled back.
begin;
create temporary table footy_security_fixtures as
select gen_random_uuid() as owner_id, gen_random_uuid() as other_id, gen_random_uuid() as session_id;
grant select on footy_security_fixtures to authenticated;
insert into auth.users(id) select owner_id from footy_security_fixtures union all select other_id from footy_security_fixtures;
insert into public.footy_profiles(id,display_name) select owner_id,'Security fixture' from footy_security_fixtures union all select other_id,'Other fixture' from footy_security_fixtures;
insert into auth.sessions(id,user_id,created_at,updated_at,aal)
select session_id,owner_id,now(),now(),'aal2' from footy_security_fixtures;
insert into auth.mfa_factors(id,user_id,factor_type,status,created_at,updated_at)
select gen_random_uuid(),owner_id,'totp','verified',now(),now() from footy_security_fixtures;
select set_config('request.jwt.claims',jsonb_build_object('sub',owner_id,'role','authenticated','aal','aal1','session_id',session_id,
  'amr',jsonb_build_array(jsonb_build_object('method','password','timestamp',floor(extract(epoch from now())))))::text,true) from footy_security_fixtures;
set local role authenticated;
do $$
declare affected integer;
begin
  if footy_private.mfa_satisfied() then raise exception 'FAIL: MFA bypass'; end if;
  if exists(select 1 from public.footy_profiles) then raise exception 'FAIL: aal1 read'; end if;
  update public.footy_profiles set bio='blocked'; get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FAIL: aal1 update'; end if;
  begin
    insert into public.footy_profiles(id,display_name) values(auth.uid(),'blocked');
    raise exception 'FAIL: aal1 insert';
  exception when insufficient_privilege then null; end;
  if exists(select 1 from public.footy_set_entity_follow('league','{"id":"eng.1"}',true)) then raise exception 'FAIL: aal1 follow'; end if;
  begin
    perform public.footy_delete_account(); raise exception 'FAIL: aal1 deletion';
  exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims',(auth.jwt()||'{"aal":"aal2"}'::jsonb)::text,true);
do $$
declare affected integer;
begin
  if not footy_private.mfa_satisfied() then raise exception 'FAIL: aal2 denied'; end if;
  if (select count(*) from public.footy_profiles) <> 1 then raise exception 'FAIL: owner isolation'; end if;
  update public.footy_profiles set bio='allowed' where id=auth.uid(); get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'FAIL: aal2 update denied'; end if;
  update public.footy_profiles set bio='blocked' where id<>(auth.uid()); get diagnostics affected = row_count;
  if affected <> 0 then raise exception 'FAIL: cross-account update'; end if;
  if not exists(select 1 from public.footy_set_entity_follow('club','{"id":"1","league":"eng.1","name":"Fixture club"}',true)) then raise exception 'FAIL: valid club'; end if;
  begin
    update public.footy_profiles set favorite_teams='[{"id":"1","name":{"nested":"bad"}}]' where id=auth.uid();
    raise exception 'FAIL: nested team accepted';
  exception when check_violation then null; end;
  begin
    update public.footy_profiles set preferences='{"goals":"yes"}' where id=auth.uid();
    raise exception 'FAIL: invalid preference accepted';
  exception when check_violation then null; end;
  begin
    update public.footy_profiles set favorite_teams=jsonb_build_array(jsonb_build_object('id','1','name',repeat('x',40000))) where id=auth.uid();
    raise exception 'FAIL: oversized profile accepted';
  exception when check_violation then null; end;
  perform set_config('request.jwt.claims',(auth.jwt()||jsonb_build_object('amr',jsonb_build_array(jsonb_build_object('method','password','timestamp',floor(extract(epoch from now()))-301))))::text,true);
  begin
    perform public.footy_delete_account(); raise exception 'FAIL: stale password deletion';
  exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claims',(auth.jwt()||jsonb_build_object('amr',jsonb_build_array(jsonb_build_object('method','password','timestamp',floor(extract(epoch from now())))),'session_id',gen_random_uuid()))::text,true);
  begin
    perform public.footy_delete_account(); raise exception 'FAIL: revoked session deletion';
  exception when insufficient_privilege then null; end;
  perform set_config('request.jwt.claims',(auth.jwt()||jsonb_build_object('session_id',(select session_id from footy_security_fixtures)))::text,true);
  perform public.footy_delete_account();
end $$;
reset role;
do $$ begin
 if exists(select 1 from auth.users where id=(select owner_id from footy_security_fixtures)) then raise exception 'FAIL: verified deletion did not complete'; end if;
 if not exists(select 1 from auth.users where id=(select other_id from footy_security_fixtures)) then raise exception 'FAIL: deletion affected other account'; end if;
end $$;
-- An account that has not enrolled MFA must continue to work with aal1.
select set_config('request.jwt.claims',jsonb_build_object('sub',other_id,'role','authenticated','aal','aal1')::text,true) from footy_security_fixtures;
set local role authenticated;
do $$ begin
 if not footy_private.mfa_satisfied() or (select count(*) from public.footy_profiles) <> 1 then raise exception 'FAIL: non-MFA account blocked'; end if;
end $$;
reset role;
rollback;
select 'PASS: MFA enforcement, owner isolation, data validation, recent password, session revocation, verified deletion, non-MFA compatibility (all fixture writes rolled back)' as security_regressions;
