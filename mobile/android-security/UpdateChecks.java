package me.mohamedlaaribi.footy.production;

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
        return release.optLong("versionCode",0)>0&&"me.mohamedlaaribi.footy.production".equals(release.optString("packageName"))&&UpdatePolicy.validAsset(url)&&hash.matches("[a-f0-9]{64}");
    }
    public static long versionCode(android.content.pm.PackageInfo info) {
        return Build.VERSION.SDK_INT >= 28 ? info.getLongVersionCode() : info.versionCode;
    }
    public static long installedVersion(Context context) throws Exception {
        return versionCode(context.getPackageManager().getPackageInfo(context.getPackageName(), 0));
    }
    public static JSONObject fetchRelease(Context context) throws Exception {
        java.io.ByteArrayOutputStream output = new java.io.ByteArrayOutputStream();
        UpdateDownload.copy(MANIFEST, output, 32768);
        JSONObject release = new JSONObject(new String(output.toByteArray(), StandardCharsets.UTF_8));
        if (!validRelease(release)) throw new java.io.IOException("Invalid release manifest");
        context.getSharedPreferences("footy_updates", 0).edit()
            .putLong("lastChecked", System.currentTimeMillis())
            .putLong("latestVersionCode", release.getLong("versionCode"))
            .putString("latestVersionName", release.optString("versionName"))
            .putInt("minAndroidSdk", release.optInt("minAndroidSdk", 24))
            .putString("downloadUrl", release.getString("downloadUrl")).apply();
        return release;
    }
    @NonNull @Override public Result doWork() {
        try {
            Context context = getApplicationContext();
            JSONObject release = fetchRelease(context);
            SharedPreferences prefs = context.getSharedPreferences("footy_updates", 0);
            long latest = release.getLong("versionCode");
            if (latest > installedVersion(context)
                && release.getString("packageName").equals(context.getPackageName())
                && release.optInt("minAndroidSdk", 24) <= Build.VERSION.SDK_INT
                && prefs.getLong("notifiedVersionCode", 0) < latest
                && NotificationManagerCompat.from(context).areNotificationsEnabled()) {
                NotificationManager manager = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
                if (Build.VERSION.SDK_INT >= 26) manager.createNotificationChannel(new NotificationChannel("app-updates", "App updates", NotificationManager.IMPORTANCE_DEFAULT));
                Intent intent = new Intent(context, MainActivity.class).setAction(Intent.ACTION_VIEW)
                    .setData(Uri.parse("footy://updates"))
                    .addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                PendingIntent open = PendingIntent.getActivity(context, 901, intent, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
                NotificationManagerCompat.from(context).notify(901, new NotificationCompat.Builder(context, "app-updates")
                    .setSmallIcon(R.drawable.footy_notification).setContentTitle("Footy update available")
                    .setContentText("Version " + release.optString("versionName") + " is ready. Tap to update in Footy.")
                    .setContentIntent(open).setAutoCancel(true).build());
                prefs.edit().putLong("notifiedVersionCode", latest).apply();
            }
            return Result.success();
        } catch (Exception error) { return Result.retry(); }
    }
}
