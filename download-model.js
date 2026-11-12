export const releasePrefix = 'https://github.com/MO7KUN/Footy/releases/download/';
export function releaseAsset(release, name) {
  return !release?.draft && !release?.prerelease && release?.assets?.find(asset =>
    asset.name === name && asset.browser_download_url?.startsWith(releasePrefix));
}
export function desktopRelease(releases) {
  return releases.find(release => release.tag_name?.startsWith('desktop-v') && releaseAsset(release, 'Footy-Windows-Setup.exe'));
}
