export function mountAppUpdates(updates, document) {
  const panel = document.createElement('section');
  panel.className = 'mobile-update-panel';
  panel.innerHTML = '<h3>App updates</h3><p id="mobileUpdateStatus" role="status">Checking update status…</p><button id="checkMobileUpdate" type="button">Check for updates</button> <button id="installMobileUpdate" type="button" hidden>Download and install update</button>';
  const dialog = document.querySelector('#settingsDialog');
  dialog.querySelector('.dialog-body').append(panel);
  const status = panel.querySelector('#mobileUpdateStatus');
  const checkButton = panel.querySelector('#checkMobileUpdate');
  const installButton = panel.querySelector('#installMobileUpdate');
  let busy = false;
  let available = false;

  function render(result) {
    available = Boolean(result.updateAvailable);
    installButton.hidden = !available;
    installButton.textContent = 'Download and install ' + (result.latestVersionName || 'update');
    status.textContent = available
      ? 'Version ' + result.latestVersionName + ' is ready. Android will ask you to approve installation.'
      : result.lastChecked ? 'No compatible update is available. Daily checks are enabled.' : 'Check for the latest signed Footy release.';
  }

  async function run(action, message) {
    if (busy) return;
    busy = true;
    checkButton.disabled = installButton.disabled = true;
    status.textContent = message;
    try { await action(); }
    catch (error) { status.textContent = error?.message || 'Update failed. Check your connection and try again.'; }
    finally {
      busy = false;
      checkButton.disabled = installButton.disabled = false;
    }
  }

  const check = () => run(async () => render(await updates.checkNow()), 'Checking for updates…');
  const install = () => run(async () => {
    const result = await updates.install();
    if (result.permissionRequired) {
      status.textContent = 'Allow Footy to install apps in Android Settings, return here, then tap Download and install again.';
    } else if (result.upToDate) {
      render(await updates.status());
    } else if (result.installerOpened) {
      status.textContent = 'The verified update is ready in Android’s installer. Approve installation there. If you cancel, you can try again.';
    } else {
      throw new Error('Android did not open the installer. Please try again.');
    }
  }, 'Downloading and verifying the update. Keep Footy open…');
  async function refresh() {
    if (busy) return;
    try { render(await updates.status()); }
    catch { status.textContent = 'Update status is unavailable. Tap Check for updates to retry.'; }
  }
  function open() {
    if (!dialog.open) dialog.showModal();
    panel.scrollIntoView({block: 'center'});
    check();
  }
  checkButton.onclick = check;
  installButton.onclick = () => { if (available) return install(); };
  document.addEventListener('click', event => {
    if (event.target.closest('#settings')) refresh();
  }, true);
  refresh();
  return {check, install, refresh, open};
}
