import {createClient} from './vendor/supabase.js';

export function createAccountClient(config, detectSessionInUrl = true) {
  return createClient(config.supabaseUrl, config.supabasePublishableKey, {
    auth: {
      flowType: 'pkce', detectSessionInUrl, persistSession: true,
      autoRefreshToken: true, storageKey: 'footy-auth',
      ...(window.FOOTY_AUTH_STORAGE ? {storage: window.FOOTY_AUTH_STORAGE} : {})
    }
  });
}
