import test from 'node:test';
import assert from 'node:assert/strict';
import {createPushController} from '../src/push-controller.js';

for(const action of ['disable','account-change'])test('permission prompt cannot re-enable push after '+action,async()=>{
 let release,registrations=0;
 const plugin={requestPermissions:()=>new Promise(resolve=>{release=resolve;}),register:async()=>{registrations++;},unregister:async()=>{}};
 const push=createPushController({plugin,configured:true});
 push.setAccount({userId:'first'});
 const enrolling=push.enable();
 const rejected=assert.rejects(enrolling,/cancelled|account changed/);
 if(action==='disable')await push.disable();else push.setAccount({userId:'second'});
 release({receive:'granted'});
 await rejected;assert.equal(registrations,0);assert.equal(push.active,false);
});
