import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {makeManifest} from '../scripts/release-manifest.mjs';
import {firebaseConfig} from '../scripts/firebase-config.mjs';

test('production manifest and Firebase clients use the separate production identity', async () => {
  const config = JSON.parse(await readFile(new URL('../capacitor.config.json', import.meta.url)));
  const release = makeManifest(2, '1.0.0', Buffer.from('fixture'));
  assert.equal(config.appId, 'me.mohamedlaaribi.footy.production');
  assert.equal(release.packageName, config.appId);
  const firebase = await firebaseConfig();
  const packages = firebase.client.map(client => client.client_info.android_client_info.package_name);
  assert.ok(packages.includes(config.appId));
  assert.ok(packages.includes(config.appId + '.preview'));
});
