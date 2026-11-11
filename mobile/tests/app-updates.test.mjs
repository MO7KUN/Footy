import test from 'node:test';
import assert from 'node:assert/strict';
import {mountAppUpdates} from '../src/app-updates.js';

function setup(updates) {
  const nodes = new Map();
  const element = selector => {
    if (!nodes.has(selector)) nodes.set(selector, {textContent:'', hidden:false, disabled:false,
      querySelector: element, append(){}, scrollIntoView(){}, showModal(){this.open=true;}});
    return nodes.get(selector);
  };
  const document = {createElement: () => element('panel'), querySelector: element, addEventListener(){}};
  return {ui: mountAppUpdates(updates, document), element};
}
const available = {updateAvailable:true, latestVersionName:'1.0.1', lastChecked:1};
test('permission handoff preserves the update and only reports installer completion after native confirmation', async () => {
  let permissions = false;
  const {ui, element} = setup({status:async()=>available, checkNow:async()=>available,
    install:async()=>permissions ? {installerOpened:true} : {permissionRequired:true}});
  await ui.check();
  assert.equal(element('#installMobileUpdate').hidden,false);
  await ui.install();
  assert.match(element('#mobileUpdateStatus').textContent,/Allow Footy/);
  permissions=true;
  await ui.install();
  assert.match(element('#mobileUpdateStatus').textContent,/Android’s installer/);
});
test('failed downloads remain retryable and repeated taps do not start parallel downloads', async () => {
  let finish, calls=0;
  const {ui, element} = setup({status:async()=>available,checkNow:async()=>available,
    install:()=>{calls++;return new Promise((resolve,reject)=>{finish=reject;});}});
  await ui.check();
  const pending=ui.install();
  await ui.install();
  assert.equal(calls,1);
  finish(new Error('Checksum mismatch'));
  await pending;
  assert.equal(element('#installMobileUpdate').disabled,false);
  assert.match(element('#mobileUpdateStatus').textContent,/Checksum mismatch/);
});
test('checking an up-to-date app hides the install action', async () => {
  const {ui, element}=setup({status:async()=>available,checkNow:async()=>({updateAvailable:false,lastChecked:1})});
  await ui.check();
  assert.equal(element('#installMobileUpdate').hidden,true);
});
