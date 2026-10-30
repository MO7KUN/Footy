// The database enforces this too. Never treat a failed assurance check as login.
export async function needsSecondFactor(auth) {
  const {data,error}=await auth.mfa.getAuthenticatorAssuranceLevel();
  if(error)throw error;
  if(!data?.currentLevel||!data?.nextLevel)throw Error('Please sign in again.');
  return data.nextLevel==='aal2'&&data.currentLevel!=='aal2';
}

export async function reauthenticate(auth, {email,id,password}, verifyFactor) {
  const result=await auth.signInWithPassword({email,password});
  if(result.error||result.data?.user?.id!==id)throw Error('Your current password could not be verified.');
  if(await needsSecondFactor(auth))await verifyFactor();
  if(await needsSecondFactor(auth))throw Error('Complete two-factor authentication first.');
}
