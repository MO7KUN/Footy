-- Reuse existing private profile favorites as the canonical club/league follows.
-- Atomic edits preserve follows saved simultaneously on another device.
create or replace function public.footy_set_entity_follow(p_kind text,p_entity jsonb,p_follow boolean)
returns setof public.footy_profiles language plpgsql security invoker set search_path = '' as $$
begin
 if auth.uid() is null then raise exception 'Sign in required'; end if;
 if p_follow is null then raise exception 'Follow choice required'; end if;
 if p_kind='club' then
   if coalesce(p_entity->>'id','') !~ '^[0-9]{1,20}$'
      or coalesce(p_entity->>'league','') !~ '^[a-z0-9.]{1,40}$'
      or char_length(coalesce(p_entity->>'name','')) not between 1 and 200 then raise exception 'Invalid club'; end if;
   return query update public.footy_profiles p set favorite_teams=
     coalesce((select jsonb_agg(item) from jsonb_array_elements(p.favorite_teams) item where item->>'id'<>p_entity->>'id'),'[]'::jsonb)
     || case when p_follow then jsonb_build_array(jsonb_build_object('id',p_entity->>'id','name',p_entity->>'name','league',p_entity->>'league')) else '[]'::jsonb end
     where p.id=auth.uid() returning p.*;
 elsif p_kind='league' then
   if coalesce(p_entity->>'id','') !~ '^[a-z0-9.]{1,40}$' then raise exception 'Invalid league'; end if;
   return query update public.footy_profiles p set favorite_leagues=
     coalesce((select jsonb_agg(item) from jsonb_array_elements(p.favorite_leagues) item where item<>to_jsonb(p_entity->>'id')),'[]'::jsonb)
     || case when p_follow then jsonb_build_array(p_entity->>'id') else '[]'::jsonb end
     where p.id=auth.uid() returning p.*;
 else raise exception 'Choose a club or league';
 end if;
end; $$;
revoke all on function public.footy_set_entity_follow(text,jsonb,boolean) from public,anon;
grant execute on function public.footy_set_entity_follow(text,jsonb,boolean) to authenticated;
