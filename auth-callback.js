const output=document.querySelector('#authResult');
const params=new URLSearchParams(location.search);
const recovery=params.get('flow')==='recovery';
const code=params.get('code');
// Remove the one-time code from browser history immediately, without logging it.
history.replaceState(null,'',location.pathname);
try{
  const config=window.FOOTY_CONFIG||{};
  if(!config.supabaseUrl||!config.supabasePublishableKey)throw Error('The account service is not connected yet.');
  const {createClient}=await import('https://esm.sh/@supabase/supabase-js@2.102.0?bundle');
  const client=createClient(config.supabaseUrl,config.supabasePublishableKey,{auth:{flowType:'pkce',detectSessionInUrl:false,storageKey:'footy-auth'}});
  if(params.get('error'))throw Error('This link could not be verified. Request a new account or recovery email.');
  if(code){const {error}=await client.auth.exchangeCodeForSession(code);if(error)throw Error('This link has expired, was already used, or was opened in a different browser. Request a new link from this browser.');}
  const {data,error}=await client.auth.getUser();
  if(error||!data.user)throw Error('Your email may be confirmed. Continue to your profile and sign in. If needed, request a new recovery link.');
  location.replace('./'+(recovery?'?auth=recovery':'')+'#/profile');
}catch(error){output.textContent=error.message;}
