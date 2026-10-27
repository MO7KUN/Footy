-- Private profiles: every browser request is constrained to its authenticated owner.
create table if not exists public.footy_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 60),
  username text unique check (username is null or username ~ '^[a-z0-9_]{3,24}$'),
  bio text not null default '' check (char_length(bio) <= 300),
  country text not null default '' check (char_length(country) <= 80),
  avatar text not null default 'ball' check (avatar in ('ball','boot','trophy','stadium','whistle','star')),
  avatar_color text not null default 'green' check (avatar_color in ('green','blue','orange','purple','rose')),
  favorite_teams jsonb not null default '[]' check (jsonb_typeof(favorite_teams) = 'array' and jsonb_array_length(favorite_teams) <= 30),
  favorite_leagues jsonb not null default '[]' check (jsonb_typeof(favorite_leagues) = 'array' and jsonb_array_length(favorite_leagues) <= 15),
  followed_matches jsonb not null default '[]' check (jsonb_typeof(followed_matches) = 'array' and jsonb_array_length(followed_matches) <= 300),
  preferences jsonb not null default '{"timezone":"auto","clock":"24","goals":true,"kickoff":true,"fulltime":true}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.footy_profiles enable row level security;
revoke all on public.footy_profiles from anon, authenticated;
grant select, insert, update on public.footy_profiles to authenticated;
drop policy if exists footy_owner_select on public.footy_profiles;
drop policy if exists footy_owner_insert on public.footy_profiles;
drop policy if exists footy_owner_update on public.footy_profiles;
create policy footy_owner_select on public.footy_profiles for select to authenticated using ((select auth.uid()) = id);
create policy footy_owner_insert on public.footy_profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy footy_owner_update on public.footy_profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create or replace function public.footy_profile_timestamp() returns trigger
language plpgsql set search_path = '' as $$ begin new.updated_at = now(); return new; end; $$;
drop trigger if exists footy_profile_timestamp on public.footy_profiles;
create trigger footy_profile_timestamp before update on public.footy_profiles for each row execute function public.footy_profile_timestamp();

-- Only the authenticated caller can delete their account. Require a recent
-- password login (token refresh alone does not satisfy this check).
create or replace function public.footy_delete_account() returns void
language plpgsql security definer set search_path = '' as $$
declare caller uuid := auth.uid(); recent_password boolean;
begin
  if caller is null then raise exception 'Sign in required'; end if;
  select exists (
    select 1 from jsonb_array_elements(coalesce(auth.jwt()->'amr', '[]'::jsonb)) as method
    where method->>'method' = 'password'
      and (method->>'timestamp')::numeric > extract(epoch from now()) - 300
  ) into recent_password;
  if not recent_password then raise exception 'Sign in again with your password before deleting your account'; end if;
  delete from auth.users where id = caller;
end;
$$;
revoke all on function public.footy_delete_account() from public, anon;
grant execute on function public.footy_delete_account() to authenticated;
