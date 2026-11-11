import {mountAppUpdates} from './app-updates.js';
import {secureAuthStorage,clearLegacyAuthStorage} from './secure-storage.js';
import {Capacitor,registerPlugin} from '@capacitor/core';
import {App} from '@capacitor/app';
import {Browser} from '@capacitor/browser';
import {LocalNotifications} from '@capacitor/local-notifications';
import {Share} from '@capacitor/share';
import {externalTarget} from './navigation.js';
import {PushNotifications} from '@capacitor/push-notifications';
import {createPushController} from './push-controller.js';
const native=Capacitor.isNativePlatform();
const website='https://mohamedlaaribi.me/Footy/';
const openWebsite=()=>Browser.open({url:website+'#/profile'});
let notificationId=1;
if(native){
  const updates=registerPlugin('AppUpdates');
  const push=createPushController({plugin:PushNotifications,configured:Boolean(window.FOOTY_CONFIG?.pushConfigured),onMessage:async notification=>{if(document.hidden)return;await LocalNotifications.schedule({notifications:[{id:notificationId++%2147483647,title:notification.title||'Footy match update',body:notification.body||'',channelId:'match-updates',extra:{route:notification.data?.route}}]})}});
  await push.init();
  await PushNotifications.addListener('pushNotificationActionPerformed',event=>{const route=event.notification.data?.route;if(/^\/match\/[a-z0-9.]+\/\d+$/.test(route||''))location.hash=route});
  const sessionPlugin=registerPlugin('SecureSession');
  window.FOOTY_AUTH_STORAGE=secureAuthStorage(sessionPlugin);
  await clearLegacyAuthStorage(localStorage);
  window.FOOTY_NATIVE={
    alertStatus:'',
    enableAlerts:async()=>{const result=await LocalNotifications.requestPermissions();if(result.display!=='granted')return false;await LocalNotifications.createChannel({id:'match-updates',name:'Match updates',description:'Scores and status for followed clubs and leagues',importance:4});localStorage.setItem('footy:pushWanted','true');try{await push.enable();window.FOOTY_NATIVE.alertStatus='Background push notifications enabled.'}catch(error){window.FOOTY_NATIVE.alertStatus=error.message}return true},
    notify:async(title,body,route)=>{if(document.hidden||push.active)return;const permission=await LocalNotifications.checkPermissions();if(permission.display==='granted')await LocalNotifications.schedule({notifications:[{id:notificationId++%2147483647,title,body,channelId:'match-updates',extra:{route}}]})},
    syncPushAccount:async account=>{push.setAccount(account);if(account.userId&&window.FOOTY_CONFIG?.pushConfigured&&localStorage.getItem('footy:pushWanted')==='true'&&!push.active){const permission=await PushNotifications.checkPermissions();if(permission.receive==='granted')await push.enable().catch(()=>{})}},
    disableAlerts:async()=>{localStorage.removeItem('footy:pushWanted');await push.disable()},
    beforeSignOut:async()=>{await push.disable().catch(()=>{})},
    shareProfile:async text=>Share.share({title:'My Footy profile',text,dialogTitle:'Export your private profile'})
  };
  const migration=document.createElement('section');
  migration.className='mobile-update-panel';
  migration.innerHTML='<h3>Moving from a preview?</h3><p>Keep the old app while you check your data here. Sign in with the same Footy account to restore your profile, saved follows and preferences.</p><p>In the old app, open Profile / Football and choose Import club &amp; league follows from this browser to save guest follows to your account. Then reopen your profile here.</p><p>Enable notifications again on this installation. Copy a custom AI endpoint from the old Settings if you used one. Confirm your data before removing any old app.</p>';
  document.querySelector('#settingsDialog .dialog-body').append(migration);
  const updatesUI=mountAppUpdates(updates,document);
  await App.addListener('resume',()=>updatesUI.refresh());
  await App.addListener('appUrlOpen',event=>{if(event.url==='footy://updates')updatesUI.open()});
  const launch=await App.getLaunchUrl();
  if(launch?.url==='footy://updates')updatesUI.open();
  await LocalNotifications.addListener('localNotificationActionPerformed',event=>{const route=event.notification.extra?.route;if(/^\/match\/[a-z0-9.]+\/\d+$/.test(route||''))location.hash=route});
  await App.addListener('backButton',()=>{const dialog=document.querySelector('dialog[open]');if(dialog){dialog.close();return}if(location.hash&&location.hash!=='#/'){location.hash='/';return}App.minimizeApp()});
  document.addEventListener('click',event=>{const action=event.target.closest('[data-action]')?.dataset.action;if(['auth:signup','auth:reset','resend-entry','resend'].includes(action)){event.preventDefault();event.stopImmediatePropagation();openWebsite();return}const anchor=event.target.closest('a'),url=anchor&&externalTarget(anchor.href,location.origin);if(url){event.preventDefault();Browser.open({url})}},true);
  document.addEventListener('submit',event=>{if(event.target.id==='emailForm'){event.preventDefault();event.stopImmediatePropagation();openWebsite()}},true);
}
document.body.classList.add('mobile-app');
const nav=document.createElement('nav');nav.className='mobile-tabs';nav.setAttribute('aria-label','App navigation');
const items=[['/','◉','Matches'],['/following','☆','Following'],['/leagues','▤','Leagues'],['/clubs','⚑','Clubs'],['/profile','♙','Profile']];
nav.innerHTML=items.map(([route,icon,label])=>`<a href="#${route}"><span aria-hidden="true">${icon}</span>${label}</a>`).join('');document.body.append(nav);
const offline=document.createElement('div');offline.className='mobile-offline';offline.role='status';offline.textContent='You’re offline. Connect to refresh scores and your profile.';document.body.append(offline);
const syncNetwork=()=>offline.hidden=navigator.onLine;window.addEventListener('online',syncNetwork);window.addEventListener('offline',syncNetwork);syncNetwork();
function activeTab(){const hash=location.hash||'#/',route=/^#\/league\//.test(hash)?'#/leagues':/^#\/club\//.test(hash)?'#/clubs':hash;nav.querySelectorAll('a').forEach(a=>{const active=a.hash===route;a.classList.toggle('selected',active);if(active)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current')})}
window.addEventListener('hashchange',activeTab);activeTab();
if(native)new MutationObserver(()=>{const story=document.querySelector('.auth-links');if(story&&!document.querySelector('#nativeAccountNote')){const note=document.createElement('p');note.id='nativeAccountNote';note.className='muted';note.textContent='Use your existing Footy account. Account creation, email verification and password recovery open securely on the Footy website; then return here to sign in.';story.before(note)}}).observe(document.querySelector('#main'),{childList:true,subtree:true});
await import('../www/app.js');
