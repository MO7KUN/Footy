import { desktopRelease, releaseAsset } from './download-model.js';
const button = document.querySelector('#windowsDownload');
const status = document.querySelector('#windowsStatus');
try {
  const response = await fetch('https://api.github.com/repos/MO7KUN/Footy/releases?per_page=100', {
    signal: AbortSignal.timeout(12000), headers: { Accept: 'application/vnd.github+json' }
  });
  if (!response.ok) throw Error('Release listing unavailable');
  const release = desktopRelease(await response.json());
  const installer = releaseAsset(release, 'Footy-Windows-Setup.exe');
  if (installer) {
    button.href = installer.browser_download_url;
    button.textContent = 'Download for Windows ↓';
    status.textContent = 'Windows 10 / 11 · 64-bit (x64) · ' + release.tag_name.replace('desktop-v', 'Version ');
    const checksum = releaseAsset(release, 'SHA256SUMS.txt');
    if (checksum) { const link = document.querySelector('#windowsChecksum'); link.href = checksum.browser_download_url; link.hidden = false; }
  } else {
    status.textContent = 'The first Windows installer is being prepared. View desktop releases for availability.';
  }
} catch {
  status.textContent = 'The download listing could not load. Open desktop releases to download the Windows installer.';
}
