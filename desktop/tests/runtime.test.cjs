const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { HOME } = require('../policy.cjs');
async function launch() {
  const state = { external: [], files: [], dialogs: 0 };
  const session = {
    setPermissionCheckHandler(fn) { state.check = fn; },
    setPermissionRequestHandler(fn) { state.request = fn; }
  };
  const contents = new EventEmitter();
  Object.assign(contents, { session, getURL: () => HOME, isDestroyed: () => false,
    setWindowOpenHandler: fn => { state.popup = fn; },
    loadURL: async url => { state.url = url; },
    loadFile: async file => { state.files.push(file); }
  });
  const app = new EventEmitter();
  Object.assign(app, { enableSandbox: () => { state.sandbox = true; }, setAppUserModelId() {},
    requestSingleInstanceLock: () => true, whenReady: async () => {}, quit() {}, getVersion: () => '1.0.0' });
  const electron = { app, BrowserWindow: class extends EventEmitter {
    constructor(options) { super(); state.options = options; this.webContents = contents; }
    show() {}
  }, Menu: { buildFromTemplate: v => v, setApplicationMenu() {} },
    shell: { openExternal: async url => { state.external.push(url); } },
    dialog: { showMessageBox: async () => { state.dialogs++; return { response: 0 }; } }
  };
  const base = path.join(__dirname, '..');
  vm.runInNewContext(fs.readFileSync(path.join(base, 'main.cjs'), 'utf8'), {
    require: id => id === 'electron' ? electron : id === './policy.cjs' ? require('../policy.cjs') : require(id),
    __dirname: base, process: { argv: [] }, console, URL
  });
  await Promise.resolve();
  return { state, contents };
}
test('desktop renderer uses sandbox, isolation and a persistent profile without Node access', async () => {
  const { state } = await launch();
  assert.equal(state.sandbox, true);
  assert.equal(state.url, HOME);
  const prefs = state.options.webPreferences;
  assert.equal(prefs.sandbox, true);
  assert.equal(prefs.contextIsolation, true);
  assert.equal(prefs.nodeIntegration, false);
  assert.equal(prefs.webviewTag, false);
  assert.equal(prefs.webSecurity, true);
  assert.equal(prefs.partition, 'persist:footy');
});
test('external navigation opens browser and unsafe popups never launch a protocol handler', async () => {
  const { state, contents } = await launch();
  let blocked = false;
  contents.emit('will-navigate', { preventDefault: () => { blocked = true; } }, 'https://example.com/');
  assert.equal(blocked, true);
  assert.deepEqual(state.external, ['https://example.com/']);
  assert.equal(state.popup({ url: 'file:///C:/Windows/' }).action, 'deny');
  assert.equal(state.external.length, 1);
  let attached = false;
  contents.emit('will-attach-webview', { preventDefault: () => { attached = true; } });
  assert.equal(attached, true);
});
test('permissions deny camera and notifications require native consent from the Footy main frame', async () => {
  const { state, contents } = await launch();
  const origin = new URL(HOME).origin;
  assert.equal(state.check(contents, 'notifications', origin), false);
  let answer;
  await state.request(contents, 'camera', result => { answer = result; }, { isMainFrame: true, requestingUrl: HOME });
  assert.equal(answer, false);
  await state.request(contents, 'notifications', result => { answer = result; }, { isMainFrame: false, requestingUrl: HOME });
  assert.equal(answer, false);
  assert.equal(state.dialogs, 0);
  await state.request(contents, 'notifications', result => { answer = result; }, { isMainFrame: true, requestingUrl: HOME });
  assert.equal(answer, true);
  assert.equal(state.dialogs, 1);
  assert.equal(state.check(contents, 'notifications', origin), true);
  assert.equal(state.check(contents, 'camera', origin), false);
});
test('network failures show recovery page but aborted navigations and subresources do not', async () => {
  const { state, contents } = await launch();
  contents.emit('did-fail-load', {}, -3, 'aborted', HOME, true);
  contents.emit('did-fail-load', {}, -105, 'offline', HOME, false);
  assert.equal(state.files.length, 0);
  contents.emit('did-fail-load', {}, -105, 'offline', HOME, true);
  assert.equal(path.basename(state.files[0]), 'offline.html');
});
