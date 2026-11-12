import { test } from 'node:test';
import assert from 'node:assert/strict';
import { desktopRelease, releaseAsset, releasePrefix } from '../download-model.js';
const release = (tag, name = 'Footy-Windows-Setup.exe', extra = {}) => ({ tag_name: tag, assets: [{ name, browser_download_url: releasePrefix + tag + '/' + name }], ...extra });
test('Windows download finds its release when Android is the latest release', () => {
  const desktop = release('desktop-v1.0.0');
  assert.equal(desktopRelease([release('android-v1.0.1-3', 'Footy.apk'), desktop]), desktop);
});
test('Windows downloads skip drafts, previews and untrusted download URLs', () => {
  assert.equal(desktopRelease([release('desktop-v3', undefined, { draft: true }), release('desktop-v2', undefined, { prerelease: true }), release('desktop-v1', undefined, { assets: [{ name: 'Footy-Windows-Setup.exe', browser_download_url: 'https://evil.com/setup.exe' }] })]), undefined);
  assert.equal(releaseAsset(undefined, 'Footy-Windows-Setup.exe'), undefined);
});
