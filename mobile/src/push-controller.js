export function createPushController({plugin,configured,onMessage}){
  let account=null,token=null,active=false,pending=null,generation=0;
  async function save(value){const current=account,gen=generation;if(!current?.userId)throw Error('Sign in to receive background match alerts.');await current.register(value);if(gen!==generation){await current.remove(value).catch(()=>{});throw Error('Your account changed. Enable alerts again.')}token=value;active=true;return true}
  return {
    get active(){return active},
    async init(){await plugin.addListener('registration',async result=>{try{await save(result.value);pending?.resolve(true)}catch(error){pending?.reject(error)}finally{pending=null}});await plugin.addListener('registrationError',()=>{pending?.reject(Error('Push registration failed. Try again later.'));pending=null});await plugin.addListener('pushNotificationReceived',onMessage);},
    setAccount(value){if(value?.userId!==account?.userId){generation++;active=false;token=null;pending?.reject(Error('Your account changed.'));pending=null}account=value},
    async enable(){if(!configured)throw Error('Background push setup is pending. Foreground alerts are available.');if(!account?.userId)throw Error('Sign in to enable background match alerts.');const permission=await plugin.requestPermissions();if(permission.receive!=='granted')throw Error('Push notification permission was not granted.');return new Promise((resolve,reject)=>{const timer=setTimeout(()=>{pending=null;reject(Error('Push registration timed out. Try again.'))},15000);pending={resolve:value=>{clearTimeout(timer);resolve(value)},reject:error=>{clearTimeout(timer);reject(error)}};plugin.register().catch(error=>{pending?.reject(error);pending=null})})},
    async disable(){generation++;active=false;pending?.reject(Error('Push alerts disabled.'));pending=null;const previous=token;token=null;try{if(previous&&account?.remove)await account.remove(previous)}finally{if(configured)await plugin.unregister()}},
  }
}
