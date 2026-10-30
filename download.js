const api='https://api.github.com/repos/MO7KUN/Footy',button=document.querySelector('#androidDownload'),status=document.querySelector('#downloadStatus');
const downloads='https://github.com/MO7KUN/Footy/actions/workflows/android.yml';
async function json(url){const response=await fetch(url,{signal:AbortSignal.timeout(12000),headers:{Accept:'application/vnd.github+json'}});if(!response.ok)throw Error('Download listing unavailable');return response.json()}
function apkAsset(release,name){return !release?.draft&&release?.assets?.find(asset=>asset.name===name&&asset.browser_download_url?.startsWith('https://github.com/MO7KUN/Footy/releases/download/'))}
try{
 let release;try{release=await json(api+'/releases/latest')}catch{}
 let apk=apkAsset(release,'Footy.apk');
 if(apk){button.href=apk.browser_download_url;button.textContent='Download Android app ↓';status.textContent='Latest signed release · '+release.tag_name}
 else{
  let releases=[];try{releases=await json(api+'/releases?per_page=20')}catch{}
  const preview=releases.find(release=>release.prerelease&&apkAsset(release,'Footy-preview.apk'));
  apk=apkAsset(preview,'Footy-preview.apk');
  if(apk){button.href=apk.browser_download_url;button.textContent='Download Android preview APK ↓';status.textContent='Testing preview · '+preview.tag_name+' · No GitHub sign-in needed.'}
  else{
   const runs=await json(api+'/actions/workflows/android.yml/runs?branch=main&status=success&per_page=5');
   for(const run of runs.workflow_runs||[]){
    const data=await json(api+'/actions/runs/'+run.id+'/artifacts');
    if(!data.artifacts?.some(a=>a.name==='Footy-Android-preview'&&!a.expired))continue;
    // Artifact deep links return 404 for signed-out visitors. The build page remains public.
    button.href='https://github.com/MO7KUN/Footy/actions/runs/'+run.id;
    button.textContent='Open Android preview build ↗';
    status.textContent='A public APK has not been published yet. Open the build, sign in to GitHub, then select Footy-Android-preview under Artifacts.';
    break;
   }
   if(button.href===downloads)status.textContent='No downloadable APK is available yet. View Android builds for progress.';
  }
 }
}catch{button.href=downloads;button.textContent='View Android builds ↗';status.textContent='The download listing could not load. Open Android builds and select the latest successful build.'}
