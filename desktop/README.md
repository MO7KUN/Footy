# Footy for Windows

Download the installer from [Footy downloads](https://mohamedlaaribi.me/Footy/download.html). Supports Windows 10/11 x64. The installer adds Start menu and optional desktop shortcuts and supports uninstall from Windows Settings. It is currently unsigned; Windows may show an unknown-publisher warning.

The app opens the live HTTPS Footy website in a sandboxed Electron window. Internet is required. Site improvements appear without reinstalling the desktop shell. Account data syncs through the existing website; guest follows and sessions use a separate persistent desktop profile. Email verification and recovery links open the website in the mail client's browser; after verification, sign in to the desktop app with your password. No custom auth redirect or desktop credentials are needed.

External HTTPS links open the system browser. Other schemes are blocked. The renderer has no Node access, preload, IPC bridge, or webview. Only match notifications can request permission, through a native dialog, while the app is open. The app exits when its window closes. Device permissions, browser-only follows, and local settings do not transfer from Android or your browser.

## Develop and package

Use Node 24 or newer:

```powershell
cd desktop
npm ci
npm test
npm start
npm run smoke
npm run dist
```

The smoke check loads the production site, checks the renderer sandbox and absence of Node access, writes `smoke.png`, and exits. Packaging creates `release/Footy-Windows-Setup.exe`. Only explicitly listed runtime files enter the ASAR; source checkout, mobile signing keys, and build dependencies are excluded.

## Publish updates

The Windows desktop GitHub workflow tests and packages on PRs and feature branches. A successful main build publishes the installer and SHA-256 checksum under `desktop-v<version>`, without changing GitHub's latest Android release. The download page discovers desktop releases independently of Android. Increase `desktop/package.json` version for each desktop shell update; existing versioned releases are immutable. Manually rerun the workflow on main to retry a failed publication. Desktop updates are manual through Footy → Downloads and updates; reinstalling retains the persistent profile. This first release has no Windows code-signing certificate or automatic updater.

Installer smoke checks do not establish physical-device installation or all account flows. Validate the install/uninstall experience on a clean Windows machine when changing NSIS configuration.
