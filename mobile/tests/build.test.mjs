import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const read=name=>readFile(new URL('../www/'+name,import.meta.url),'utf8');
test('Android uses the existing production account service with only its public key',async()=>{const config=await read('config.js');assert.match(config,/dwvuqfeymgnxmrcdmxaw\.supabase\.co/);assert.match(config,/sb_publishable_/);assert.doesNotMatch(config,/service_role|sb_secret_/)});
test('mobile entry bundles account SDK and preserves synced follow actions',async()=>{const app=await read('native.js');assert.doesNotMatch(app,/https:\/\/esm.sh/);assert.match(app,/footy_set_entity_follow/);assert.match(app,/footy-auth/);assert.match(app,/mobile-tabs/)});
test('Android assets use native alerts and do not request browser notification permission',async()=>{const app=await read('app.js');assert.match(app,/window\.FOOTY_NATIVE\.enableAlerts\(\)/);assert.match(app,/window\.FOOTY_NATIVE\.notify/)});
test('bundled pages start through the mobile entry and preserve usable viewport',async()=>{const html=await read('index.html');assert.match(html,/src="native.js"/);assert.match(html,/viewport-fit=cover/);assert.doesNotMatch(html,/src="app.js/)});
