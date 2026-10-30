-- Review and apply after Firebase is connected. Depends on the existing security hardening migration.
create table public.footy_push_devices (
 user_id uuid not null references public.footy_profiles(id) on delete cascade,
 token text primary key check(length(token) between 20 and 4096),
 session_id uuid not null references auth.sessions(id) on delete cascade,
 updated_at timestamptz not null default now()
);
alter table public.footy_push_devices enable row level security;
revoke all on public.footy_push_devices from anon,public;
grant select,insert,update,delete on public.footy_push_devices to authenticated,service_role;
create policy push_owner on public.footy_push_devices to authenticated
 using(user_id=(select auth.uid()) and (select footy_private.mfa_satisfied()))
 with check(user_id=(select auth.uid()) and session_id=((select auth.jwt())->>'session_id')::uuid and (select footy_private.mfa_satisfied()));
create function public.footy_upsert_push_device(p_token text) returns void language plpgsql security invoker set search_path='' as $$
begin
 if auth.uid() is null or not footy_private.mfa_satisfied() then raise exception 'Verified sign-in required';end if;
 insert into public.footy_push_devices(user_id,token,session_id) values(auth.uid(),p_token,(auth.jwt()->>'session_id')::uuid)
 on conflict(token) do update set session_id=excluded.session_id,updated_at=now() where footy_push_devices.user_id=auth.uid();
 if not found then raise exception 'Device registration belongs to another session';end if;
end $$;
create function public.footy_remove_push_device(p_token text) returns void language sql security invoker set search_path='' as $$
 delete from public.footy_push_devices where user_id=auth.uid() and token=p_token;
$$;
revoke all on function public.footy_upsert_push_device(text),public.footy_remove_push_device(text) from public,anon;
grant execute on function public.footy_upsert_push_device(text),public.footy_remove_push_device(text) to authenticated;

create table public.footy_push_snapshots(id text primary key,score text not null,state text not null,updated_at timestamptz not null default now());
create table public.footy_push_jobs(id text primary key,token text not null references public.footy_push_devices(token) on delete cascade,title text not null,body text not null,route text not null,event jsonb not null,kind jsonb not null,attempts int not null default 0,sent_at timestamptz,created_at timestamptz not null default now());
create index push_pending on public.footy_push_jobs(created_at) where sent_at is null and attempts<5;
alter table public.footy_push_snapshots enable row level security;
alter table public.footy_push_jobs enable row level security;
revoke all on public.footy_push_snapshots,public.footy_push_jobs from public,anon,authenticated;
grant all on public.footy_push_snapshots,public.footy_push_jobs to service_role;

-- Only the trusted sender may join devices to profiles and active sessions.
create function public.footy_push_targets() returns table(token text,favorite_teams jsonb,favorite_leagues jsonb,preferences jsonb)
language sql security definer set search_path='' as $$
 select d.token,p.favorite_teams,p.favorite_leagues,p.preferences from public.footy_push_devices d
 join public.footy_profiles p on p.id=d.user_id join auth.sessions s on s.id=d.session_id and s.user_id=d.user_id
 where (not exists(select 1 from auth.mfa_factors f where f.user_id=d.user_id and f.status='verified') or s.aal='aal2') and (s.not_after is null or s.not_after>now()) and d.updated_at>now()-interval '60 days';
$$;
revoke all on function public.footy_push_targets() from public,anon,authenticated;
grant execute on function public.footy_push_targets() to service_role;
create table public.footy_push_lease(id boolean primary key default true check(id),expires_at timestamptz not null default now());
insert into public.footy_push_lease(id) values(true);
alter table public.footy_push_lease enable row level security;
revoke all on public.footy_push_lease from public,anon,authenticated;
grant all on public.footy_push_lease to service_role;
create function public.footy_begin_push_run() returns boolean language plpgsql security invoker set search_path='' as $$
begin update public.footy_push_lease set expires_at=now()+interval '10 minutes' where id and expires_at<=now();return found;end $$;
create function public.footy_end_push_run() returns void language sql security invoker set search_path='' as $$ update public.footy_push_lease set expires_at=now() where id; $$;
revoke all on function public.footy_begin_push_run(),public.footy_end_push_run() from public,anon,authenticated;
grant execute on function public.footy_begin_push_run(),public.footy_end_push_run() to service_role;
