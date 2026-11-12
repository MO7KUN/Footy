const { test } = require('node:test');
const assert = require('node:assert/strict');
const { HOME, isFooty, isExternal } = require('../policy.cjs');
test('Footy pages and account callback stay inside the desktop window', () => {
  for (const url of [HOME, HOME + '#/following', HOME + 'auth.html?code=abc', HOME + 'download.html']) assert.equal(isFooty(url), true);
});
test('other sites, sibling GitHub Pages projects and unsafe schemes cannot navigate the app', () => {
  for (const url of ['https://example.com/', 'https://mohamedlaaribi.me/Footy-evil/', 'https://mohamedlaaribi.me/other/', 'http://mohamedlaaribi.me/Footy/', 'https://mo7kun.github.io.evil.com/Footy/', 'https://user:pass@mohamedlaaribi.me/Footy/', 'file:///C:/Windows/', 'javascript:alert(1)', 'https://mohamedlaaribi.me/Footy/../other/', 'invalid']) assert.equal(isFooty(url), false, url);
});
test('only HTTPS links without credentials can launch the browser', () => {
  assert.equal(isExternal('https://github.com/MO7KUN/Footy/releases'), true);
  for (const url of ['file:///C:/test', 'javascript:alert(1)', 'ms-settings:display', 'http://example.com/', 'https://user:password@example.com/', 'invalid']) assert.equal(isExternal(url), false, url);
});
