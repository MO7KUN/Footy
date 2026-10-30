import {spawnSync} from 'node:child_process';
import {readFile,writeFile,mkdir,access,cp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {firebaseConfig} from './firebase-config.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));process.chdir(root);
const exists=await access('android/app/src/main/AndroidManifest.xml').then(()=>true,()=>false);
const cli=path.join(root,'node_modules/@capacitor/cli/bin/capacitor');
for(const args of exists?[['sync','android']]:[['add','android']]){const result=spawnSync(process.execPath,[cli,...args],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1)}
const manifest='android/app/src/main/AndroidManifest.xml';
let xml=await readFile(manifest,'utf8');xml=xml.replace(/android:allowBackup="[^"]*"/,'android:allowBackup="false"');
for(const [name,value] of Object.entries({usesCleartextTraffic:'false',fullBackupContent:'false',dataExtractionRules:'@xml/data_extraction_rules'})){const attr=new RegExp('android:'+name+'="[^"]*"','g');xml=xml.replace(attr,'');xml=xml.replace('<application','<application android:'+name+'="'+value+'"');}
await mkdir('android/app/src/main/res/xml',{recursive:true});
await writeFile('android/app/src/main/res/xml/data_extraction_rules.xml','<data-extraction-rules><cloud-backup><exclude domain="root" path="."/><exclude domain="file" path="."/><exclude domain="database" path="."/><exclude domain="sharedpref" path="."/><exclude domain="external" path="."/></cloud-backup><device-transfer><exclude domain="root" path="."/><exclude domain="file" path="."/><exclude domain="database" path="."/><exclude domain="sharedpref" path="."/><exclude domain="external" path="."/></device-transfer></data-extraction-rules>');
const javaDir='android/app/src/main/java/me/mohamedlaaribi/footy';
await mkdir(javaDir,{recursive:true});
for(const name of ['MainActivity.java','SecureSessionPlugin.java','AppUpdatesPlugin.java','UpdateChecks.java'])await cp(path.join(root,'android-security',name),path.join(javaDir,name));
await cp(path.join(root,'android-security/release-signing.gradle'),'android/app/release-signing.gradle');
const gradleFile='android/app/build.gradle';let gradle=await readFile(gradleFile,'utf8');if(!gradle.includes("apply from: 'release-signing.gradle'"))await writeFile(gradleFile,gradle+"\napply from: 'release-signing.gradle'\n");
if(!xml.includes('android.permission.POST_NOTIFICATIONS'))xml=xml.replace('</manifest>','<uses-permission android:name="android.permission.POST_NOTIFICATIONS" /></manifest>');
await writeFile(manifest,xml);
// The launcher icon is a local vector: no remote image or starter branding.
const icon='<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="108dp" android:height="108dp" android:viewportWidth="108" android:viewportHeight="108"><path android:fillColor="#12382c" android:pathData="M0,0h108v108h-108z"/><path android:strokeColor="#d7f58d" android:strokeWidth="6" android:strokeLineCap="round" android:pathData="M54,29v50 M29,54h50 M36,36l36,36 M36,72l36,-36"/></vector>';
await mkdir('android/app/src/main/res/drawable',{recursive:true});await writeFile('android/app/src/main/res/drawable/footy_launcher.xml',icon);
await writeFile('android/app/src/main/res/drawable/footy_notification.xml','<vector xmlns:android="http://schemas.android.com/apk/res/android" android:width="24dp" android:height="24dp" android:viewportWidth="24" android:viewportHeight="24"><path android:strokeColor="#ffffffff" android:strokeWidth="2" android:strokeLineCap="round" android:pathData="M12,3v18 M3,12h18 M5,5l14,14 M5,19l14,-14"/></vector>');
let appGradle=await readFile(gradleFile,'utf8');if(!appGradle.includes('androidx.work:work-runtime:'))await writeFile(gradleFile,appGradle+"\ndependencies { implementation 'androidx.work:work-runtime:2.12.0' }\n");
if(!xml.includes('android.permission.ACCESS_NETWORK_STATE'))xml=xml.replace('</manifest>','<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" /></manifest>');
await writeFile('android/app/google-services.json',JSON.stringify(await firebaseConfig()));
xml=xml.replace(/android:icon="[^"]+"/,'android:icon="@drawable/footy_launcher"').replace(/android:roundIcon="[^"]+"/,'android:roundIcon="@drawable/footy_launcher"');await writeFile(manifest,xml);
console.log('Footy Android project ready. Open mobile/android in Android Studio or run its Gradle wrapper.');
