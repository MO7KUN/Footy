import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
const readShared=async name=>{try{return await readFile(new URL('../dist/'+name,import.meta.url),'utf8');}catch(error){if(error.code!=='ENOENT')throw error;return readFile(new URL('../'+name,import.meta.url),'utf8');}};
const load=async path=>import('data:text/javascript;base64,'+Buffer.from(await readShared(path.split('/').at(-1))).toString('base64'));
const {needsSecondFactor,reauthenticate}=await load('../dist/auth-security.js');

function fakeAuth(level={currentLevel:'aal1',nextLevel:'aal2'}) {
  return {mfa:{getAuthenticatorAssuranceLevel:async()=>({data:level})},
    signInWithPassword:async()=>({data:{user:{id:'owner'}}})};
}
test('MFA is required for enrolled accounts before verification',async()=>{
  assert.equal(await needsSecondFactor(fakeAuth()),true);
  assert.equal(await needsSecondFactor(fakeAuth({currentLevel:'aal2',nextLevel:'aal2'})),false);
  assert.equal(await needsSecondFactor(fakeAuth({currentLevel:'aal1',nextLevel:'aal1'})),false);
});
test('assurance errors and missing sessions fail closed',async()=>{
  const auth=fakeAuth();auth.mfa.getAuthenticatorAssuranceLevel=async()=>({error:Error('offline')});
  await assert.rejects(needsSecondFactor(auth),/offline/);
  auth.mfa.getAuthenticatorAssuranceLevel=async()=>({data:{currentLevel:null,nextLevel:null}});
  await assert.rejects(needsSecondFactor(auth),/sign in/);
});
test('password reauthentication cannot proceed if MFA is cancelled or remains aal1',async()=>{
  const account={id:'owner',email:'fixture@example.invalid',password:'fixture'};
  await assert.rejects(reauthenticate(fakeAuth(),account,async()=>{throw Error('cancelled');}),/cancelled/);
  await assert.rejects(reauthenticate(fakeAuth(),account,async()=>{}),/two-factor/);
  let auth=fakeAuth(),verified=0;
  await reauthenticate(auth,account,async()=>{verified++;auth.mfa.getAuthenticatorAssuranceLevel=async()=>({data:{currentLevel:'aal2',nextLevel:'aal2'}});});
  assert.equal(verified,1);
});
test('wrong password or a changed account never reaches second-factor verification',async()=>{
  let called=false,auth=fakeAuth();auth.signInWithPassword=async()=>({data:{user:{id:'other'}}});
  await assert.rejects(reauthenticate(auth,{id:'owner'},async()=>{called=true;}),/password/);
  assert.equal(called,false);
});
test('restoring an enrolled password-only session never queries or exposes a profile',async()=>{
  const saved={document:globalThis.document,window:globalThis.window,location:globalThis.location};
  let account,reads=0;const node={setAttribute(){}};
  const auth=fakeAuth();auth.getUser=async()=>({data:{user:{id:'owner'}}});auth.onAuthStateChange=()=>{};
  globalThis.__footyTestClient={auth,from(){reads++;throw Error('Profile access before MFA');}};
  globalThis.document={querySelector(){return node;},addEventListener(){}};
  globalThis.window={FOOTY_CONFIG:{supabaseUrl:'https://fixture.invalid',supabasePublishableKey:'fixture'}};
  globalThis.location={hash:'#/'};
  try {
    let source=await readShared('profiles.js');
    source=source.replace(/^import .*;\r?\n/gm,'');
    source='const createAccountClient=()=>globalThis.__footyTestClient;const needsSecondFactor='+needsSecondFactor.toString()+';\n'+source;
    const profiles=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
    await profiles.initializeProfiles({onAccount(value){account=value;},toast(){}});
    assert.equal(reads,0);assert.equal(account.profile,null);
  } finally {
    Object.assign(globalThis,saved);delete globalThis.__footyTestClient;
  }
});
