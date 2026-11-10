import {makeManifest} from './release-manifest.mjs';

const manifest = makeManifest(process.env.FOOTY_VERSION_CODE, process.env.FOOTY_VERSION_NAME, Buffer.alloc(0));
const response = await fetch('https://api.github.com/repos/MO7KUN/Footy/releases/latest', {
  headers: {Authorization: 'Bearer ' + process.env.GH_TOKEN}, signal: AbortSignal.timeout(20000)
});
if (response.status !== 404) {
  if (!response.ok) throw Error('Could not check the latest production release');
  const release = await response.json();
  const match = /^android-v.+-([1-9][0-9]*)$/.exec(release.tag_name);
  if (!match || manifest.versionCode <= Number(match[1])) {
    throw Error('Production versionCode must exceed the latest release');
  }
}
console.log('Production version is valid and increasing');
