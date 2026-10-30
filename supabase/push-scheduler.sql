-- Credentials are provisioned separately into Vault, never into this file.
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

create function public.footy_push_configuration(p_secret text)
returns jsonb language plpgsql security definer set search_path='' as $$
declare expected text; account jsonb;
begin
 select decrypted_secret into expected from vault.decrypted_secrets where name='footy_push_cron_secret';
 if expected is null or length(expected)<32 or p_secret is distinct from expected then return null; end if;
 select decrypted_secret::jsonb into account from vault.decrypted_secrets where name='footy_fcm_service_account';
 return account;
end $$;
revoke all on function public.footy_push_configuration(text) from public,anon,authenticated;
grant execute on function public.footy_push_configuration(text) to service_role;

select cron.schedule('footy-football-push','* * * * *', $job$
 select net.http_post(
  url:='https://dwvuqfeymgnxmrcdmxaw.supabase.co/functions/v1/football-push',
  headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer ' ||
   (select decrypted_secret from vault.decrypted_secrets where name='footy_push_cron_secret')),
  body:='{}'::jsonb, timeout_milliseconds:=60000
 );
$job$);
