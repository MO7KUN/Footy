import {Capacitor} from '@capacitor/core';
import {App} from '@capacitor/app';
import {Browser} from '@capacitor/browser';
import {LocalNotifications} from '@capacitor/local-notifications';
import {Share} from '@capacitor/share';
import {externalTarget} from './navigation.js';
const native=Capacitor.isNativePlatform();
const website='https://mohamedlaaribi.me/Footy/';
const openWebsite=()=>Browser.open({url:website+'#/profile'});
let notificationId=1;
if(native){
  window.FOOTY_NATIVE={
    enableAlerts:async()=>{const result=await LocalNotifications.requestPermissions();if(result.display!=='granted')return false;await LocalNotifications.createChannel({id:'match-updates',name:'Match updates',description:'Scores and status for followed clubs and leagues',importance:4});return true},
    notify:async(title,body,route)=>{if(document.hidden)return;const permission=await LocalNotifications.checkPermissions();if(permission.display==='granted')await LocalNotifications.schedule({notifications:[{id:notificationId++%2147483647,title,body,channelId:'match-updates',extra:{route}}]})},
    shareProfile:async text=>Share.share({title:'My Footy profile',text,dialogTitle:'Export your private profile'})
  };
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
