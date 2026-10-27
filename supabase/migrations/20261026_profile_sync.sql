-- Keep timestamps server-owned and merge match follows atomically across devices.
revoke insert, update on public.footy_profiles from authenticated;
grant insert(id,display_name) on public.footy_profiles to authenticated;
grant update(display_name,username,bio,country,avatar,avatar_color,favorite_teams,favorite_leagues,followed_matches,preferences) on public.footy_profiles to authenticated;
create or replace function public.footy_set_follow(p_match jsonb, p_follow boolean)
returns setof public.footy_profiles language plpgsql security invoker set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Sign in required'; end if;
  if p_match->>'id' is null or p_match->>'league' is null
     or p_match->>'id' !~ '^[0-9]{1,20}$'
     or p_match->>'league' !~ '^[a-z0-9.]{1,40}$'
     or char_length(coalesce(p_match->>'name','')) > 200 then
    raise exception 'Invalid match';
  end if;
  return query update public.footy_profiles p
    set followed_matches = coalesce((select jsonb_agg(item) from jsonb_array_elements(p.followed_matches) as item
      where not (item->>'id'=p_match->>'id' and item->>'league'=p_match->>'league')), '[]'::jsonb)
      || case when p_follow then jsonb_build_array(jsonb_build_object('id',p_match->>'id','league',p_match->>'league','name',p_match->>'name','date',p_match->>'date')) else '[]'::jsonb end
    where p.id=auth.uid() returning p.*;
end; $$;
revoke all on function public.footy_set_follow(jsonb,boolean) from public, anon;
grant execute on function public.footy_set_follow(jsonb,boolean) to authenticated;
