const HOME = 'https://mohamedlaaribi.me/Footy/';
function isFooty(value) {
  try {
    const url = new URL(value);
    return url.origin === new URL(HOME).origin && url.pathname.startsWith('/Footy/') && !url.username && !url.password;
  } catch { return false; }
}
function isExternal(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch { return false; }
}
module.exports = { HOME, isFooty, isExternal };
