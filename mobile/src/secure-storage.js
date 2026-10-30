// Do not silently fall back to plaintext if the native keystore is unavailable.
export function secureAuthStorage(plugin) {
  return {
    getItem:async key=>(await plugin.get({key})).value??null,
    setItem:async(key,value)=>{await plugin.set({key,value});},
    removeItem:async key=>{await plugin.remove({key});}
  };
}

export async function clearLegacyAuthStorage(storage) {
  // Existing app sessions must sign in again after this upgrade. Do not move
  // plaintext refresh tokens into the new store and leave another copy behind.
  const keys=[];
  for(let i=0;i<storage.length;i++){const key=storage.key(i);if(key?.startsWith('footy-auth'))keys.push(key);}
  for(const key of keys)storage.removeItem(key);
}
