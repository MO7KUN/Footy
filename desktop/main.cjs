const { app, BrowserWindow, Menu, shell, dialog } = require('electron');
const path = require('node:path');
const { HOME, isFooty, isExternal } = require('./policy.cjs');
let mainWindow;
app.enableSandbox();
app.setAppUserModelId('com.footy.desktop');
if (!app.requestSingleInstanceLock()) app.quit();
else {
  app.on('second-instance', () => {
    if (!mainWindow) return;
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  });
  app.whenReady().then(createWindow);
}
app.on('window-all-closed', () => app.quit());

function openExternal(url) {
  if (isExternal(url)) shell.openExternal(url).catch(() => {});
}
function createWindow() {
  mainWindow = new BrowserWindow({
    title: 'Footy', width: 1320, height: 900, minWidth: 760, minHeight: 600,
    backgroundColor: '#f5f6f2', icon: path.join(__dirname, 'icon.ico'), show: false,
    webPreferences: {
      nodeIntegration: false, contextIsolation: true, sandbox: true,
      webSecurity: true, allowRunningInsecureContent: false, webviewTag: false,
      partition: 'persist:footy'
    }
  });
  const contents = mainWindow.webContents;
  const session = contents.session;
  let notificationsAllowed = false;
  session.setPermissionCheckHandler((webContents, permission, origin) =>
    notificationsAllowed && webContents === contents && permission === 'notifications' && origin === new URL(HOME).origin && isFooty(contents.getURL()));
  session.setPermissionRequestHandler(async (webContents, permission, callback, details) => {
    if (webContents !== contents || permission !== 'notifications' || !details.isMainFrame || !isFooty(details.requestingUrl) || !isFooty(contents.getURL())) return callback(false);
    const { response } = await dialog.showMessageBox(mainWindow, {
      type: 'question', title: 'Footy notifications',
      message: 'Allow Footy to show match notifications while the app is open?',
      buttons: ['Allow', 'Cancel'], defaultId: 1, cancelId: 1
    });
    notificationsAllowed = response === 0 && !contents.isDestroyed() && isFooty(contents.getURL());
    callback(notificationsAllowed);
  });
  contents.on('will-attach-webview', event => event.preventDefault());
  contents.setWindowOpenHandler(({ url }) => { openExternal(url); return { action: 'deny' }; });
  const navigate = (event, url) => {
    if (!isFooty(url)) { event.preventDefault(); openExternal(url); }
  };
  contents.on('will-navigate', navigate);
  contents.on('will-redirect', navigate);
  mainWindow.once('ready-to-show', () => mainWindow.show());
  contents.on('did-fail-load', (_event, code, _description, url, isMainFrame) => {
    if (!isMainFrame || code === -3 || !isFooty(url)) return;
    if (process.argv.includes('--smoke-test')) return app.exit(1);
    if (!contents.isDestroyed()) contents.loadFile(path.join(__dirname, 'offline.html')).catch(() => {});
  });
  const loadHome = () => contents.loadURL(HOME).catch(() => {});
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'Footy', submenu: [
      { label: 'Match centre', click: loadHome, accelerator: 'CmdOrCtrl+Home' },
      { label: 'Reload', click: () => isFooty(contents.getURL()) ? contents.reload() : loadHome(), accelerator: 'CmdOrCtrl+R' },
      { label: 'Downloads and updates', click: () => openExternal(HOME + 'download.html') },
      { type: 'separator' }, { role: 'quit' }
    ] },
    { label: 'Edit', submenu: [{ role: 'undo' }, { role: 'redo' }, { type: 'separator' }, { role: 'cut' }, { role: 'copy' }, { role: 'paste' }, { role: 'selectAll' }] },
    { label: 'View', submenu: [{ role: 'resetZoom' }, { role: 'zoomIn' }, { role: 'zoomOut' }, { role: 'togglefullscreen' }] },
    { label: 'Help', submenu: [{ label: 'About Footy', click: () => dialog.showMessageBox(mainWindow, {
      title: 'About Footy', message: `Footy for Windows ${app.getVersion()}`,
      detail: 'Live football in a dedicated desktop window. Internet required. Accounts sync with the website. Alerts run while the app is open. Get desktop updates from Downloads and updates.'
    }) }] }
  ]));
  if (process.argv.includes('--smoke-test')) {
    const timeout = setTimeout(() => app.exit(1), 60000);
    contents.once('did-finish-load', async () => {
      try {
        const result = await contents.executeJavaScript(`({title: document.title, brand: !!document.querySelector('.brand'), node: typeof require})`);
        const prefs = contents.getLastWebPreferences();
        if (!result.brand || result.node !== 'undefined' || !prefs.sandbox || !prefs.contextIsolation || prefs.nodeIntegration) throw Error('Desktop smoke check failed');
        const screenshot = await contents.capturePage();
        require('node:fs').writeFileSync(path.join(process.cwd(), 'smoke.png'), screenshot.toPNG());
        console.log('Desktop smoke passed:', JSON.stringify(result));
        clearTimeout(timeout);
        app.exit(0);
      } catch (error) { console.error(error); app.exit(1); }
    });
  }
  loadHome();
}
