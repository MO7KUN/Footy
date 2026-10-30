import test from 'node:test';
import assert from 'node:assert/strict';
import {secureAuthStorage,clearLegacyAuthStorage} from '../src/secure-storage.js';

test('native session adapter uses only the encrypted plugin',async()=>{
  const values=new Map(),storage=secureAuthStorage({
    get:async({key})=>({value:values.get(key)}),
    set:async({key,value})=>values.set(key,value),remove:async({key})=>values.delete(key)
  });
  assert.equal(await storage.getItem('footy-auth'),null);
  await storage.setItem('footy-auth','session-fixture');
  assert.equal(await storage.getItem('footy-auth'),'session-fixture');
  await storage.removeItem('footy-auth');assert.equal(await storage.getItem('footy-auth'),null);
});
test('keystore failures propagate rather than saving plaintext',async()=>{
  const fail=async()=>{throw Error('Keystore unavailable');};
  const storage=secureAuthStorage({get:fail,set:fail,remove:fail});
  for(const action of [()=>storage.getItem('footy-auth'),()=>storage.setItem('footy-auth','fixture'),()=>storage.removeItem('footy-auth')])await assert.rejects(action,/Keystore/);
});
test('upgrade clears old authentication tokens and keeps guest follows',async()=>{
  const map=new Map([['footy-auth','old'],['footy-auth-code-verifier','old'],['footy-follows','keep']]);
  const storage={get length(){return map.size;},key:i=>[...map.keys()][i],removeItem:key=>map.delete(key)};
  await clearLegacyAuthStorage(storage);
  assert.deepEqual([...map],[['footy-follows','keep']]);
});
