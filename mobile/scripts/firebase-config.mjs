import {readFile} from 'node:fs/promises';
export async function firebaseConfig(){
 const raw=process.env.FOOTY_GOOGLE_SERVICES_JSON || await readFile(new URL('../firebase-android.json',import.meta.url),'utf8');
 const config=JSON.parse(raw);
 if(config.type==='service_account'||config.private_key)throw Error('Server credentials must never be bundled in Android');
 if(config.project_info?.project_id!=='footy-mo7kun-push'||!config.client?.some(c=>c.client_info?.android_client_info?.package_name==='me.mohamedlaaribi.footy'))throw Error('Firebase config is for another Android app');
 return config;
}
export const pushBackendReady=process.env.FOOTY_PUSH_BACKEND_READY!=='false';
