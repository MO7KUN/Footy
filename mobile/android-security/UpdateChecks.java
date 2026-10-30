package me.mohamedlaaribi.footy;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Build;
import androidx.annotation.NonNull;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.work.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.TimeUnit;
import org.json.JSONObject;

public class UpdateChecks extends Worker {
    public static final String MANIFEST="https://github.com/MO7KUN/Footy/releases/latest/download/footy-release.json";
    public UpdateChecks(@NonNull Context context,@NonNull WorkerParameters params){super(context,params);}
    public static void schedule(Context context){
        Constraints network=new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build();
        PeriodicWorkRequest request=new PeriodicWorkRequest.Builder(UpdateChecks.class,24,TimeUnit.HOURS).setConstraints(network).setBackoffCriteria(BackoffPolicy.EXPONENTIAL,30,TimeUnit.MINUTES).build();
        WorkManager.getInstance(context).enqueueUniquePeriodicWork("footy-daily-updates",ExistingPeriodicWorkPolicy.KEEP,request);
    }
    public static void checkNow(Context context){WorkManager.getInstance(context).enqueueUniqueWork("footy-check-update-now",ExistingWorkPolicy.KEEP,new OneTimeWorkRequest.Builder(UpdateChecks.class).setConstraints(new Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build()).build());}
    public static boolean validRelease(JSONObject release){
        String url=release.optString("downloadUrl"),hash=release.optString("sha256");
        return release.optLong("versionCode",0)>0&&"me.mohamedlaaribi.footy".equals(release.optString("packageName"))&&url.matches("https://github\\.com/MO7KUN/Footy/releases/download/[A-Za-z0-9._-]+/Footy\\.apk")&&hash.matches("[a-f0-9]{64}");
    }
    @NonNull @Override public Result doWork(){
        HttpURLConnection connection=null;
        try{
            connection=(HttpURLConnection)new URL(MANIFEST).openConnection();connection.setConnectTimeout(15000);connection.setReadTimeout(15000);connection.setRequestProperty("Accept","application/json");
            int code=connection.getResponseCode();
            if(code==404){getApplicationContext().getSharedPreferences("footy_updates",0).edit().putLong("lastChecked",System.currentTimeMillis()).apply();return Result.success();}
            if(code!=200)return Result.retry();
            java.io.ByteArrayOutputStream output=new java.io.ByteArrayOutputStream();byte[] chunk=new byte[2048];int count;
            try(java.io.InputStream input=connection.getInputStream()){while((count=input.read(chunk))!=-1){output.write(chunk,0,count);if(output.size()>32768)return Result.failure();}}
            byte[] data=output.toByteArray();
            JSONObject release=new JSONObject(new String(data,StandardCharsets.UTF_8));if(!validRelease(release))return Result.failure();
            Context context=getApplicationContext();SharedPreferences prefs=context.getSharedPreferences("footy_updates",0);long latest=release.getLong("versionCode");
            long installed=Build.VERSION.SDK_INT>=28?context.getPackageManager().getPackageInfo(context.getPackageName(),0).getLongVersionCode():context.getPackageManager().getPackageInfo(context.getPackageName(),0).versionCode;
            prefs.edit().putLong("lastChecked",System.currentTimeMillis()).putLong("latestVersionCode",latest).putString("latestVersionName",release.optString("versionName")).putString("downloadUrl",release.getString("downloadUrl")).apply();
            if(latest>installed&&prefs.getLong("notifiedVersionCode",0)<latest&&NotificationManagerCompat.from(context).areNotificationsEnabled()){
                NotificationManager manager=(NotificationManager)context.getSystemService(Context.NOTIFICATION_SERVICE);
                if(Build.VERSION.SDK_INT>=26)manager.createNotificationChannel(new NotificationChannel("app-updates","App updates",NotificationManager.IMPORTANCE_DEFAULT));
                Intent intent=new Intent(Intent.ACTION_VIEW,Uri.parse("https://mohamedlaaribi.me/Footy/download.html"));PendingIntent open=PendingIntent.getActivity(context,901,intent,PendingIntent.FLAG_UPDATE_CURRENT|PendingIntent.FLAG_IMMUTABLE);
                NotificationManagerCompat.from(context).notify(901,new NotificationCompat.Builder(context,"app-updates").setSmallIcon(R.drawable.footy_notification).setContentTitle("Footy update available").setContentText("Version "+release.optString("versionName")+" is ready. Tap to view downloads.").setContentIntent(open).setAutoCancel(true).build());
                prefs.edit().putLong("notifiedVersionCode",latest).apply();
            }
            return Result.success();
        }catch(Exception error){return Result.retry();}finally{if(connection!=null)connection.disconnect();}
    }
}
