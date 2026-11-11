package me.mohamedlaaribi.footy.production;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.content.FileProvider;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;
import java.io.FileOutputStream;
import java.security.DigestOutputStream;
import java.security.MessageDigest;
import java.util.concurrent.atomic.AtomicBoolean;
import org.json.JSONObject;
@CapacitorPlugin(name="AppUpdates")
public class AppUpdatesPlugin extends Plugin {
    private final AtomicBoolean installing = new AtomicBoolean(false);

    private JSObject currentStatus() throws Exception {
        android.content.SharedPreferences prefs = getContext().getSharedPreferences("footy_updates", 0);
        JSObject result = new JSObject();
        long installed = UpdateChecks.installedVersion(getContext());
        result.put("lastChecked", prefs.getLong("lastChecked", 0));
        result.put("latestVersionName", prefs.getString("latestVersionName", ""));
        result.put("installedVersionCode", installed);
        result.put("updateAvailable", prefs.getLong("latestVersionCode", 0) > installed
            && "me.mohamedlaaribi.footy.production".equals(getContext().getPackageName())
            && prefs.getInt("minAndroidSdk", 24) <= Build.VERSION.SDK_INT);
        return result;
    }

    @PluginMethod public void checkNow(PluginCall call) {
        getBridge().execute(() -> {
            try { UpdateChecks.fetchRelease(getContext()); call.resolve(currentStatus()); }
            catch (Exception error) { call.reject("Could not check for updates. Check your connection and retry."); }
        });
    }

    @PluginMethod public void status(PluginCall call) {
        try { call.resolve(currentStatus()); }
        catch (Exception error) { call.reject("Could not read update status."); }
    }

    private byte[][] signers(PackageInfo info) {
        Signature[] signatures = Build.VERSION.SDK_INT >= 28
            ? (info.signingInfo == null ? null : info.signingInfo.getApkContentsSigners()) : info.signatures;
        if (signatures == null) return null;
        byte[][] result = new byte[signatures.length][];
        for (int i = 0; i < signatures.length; i++) result[i] = signatures[i].toByteArray();
        return result;
    }

    @PluginMethod public void install(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 26 && !getContext().getPackageManager().canRequestPackageInstalls()) {
            getActivity().runOnUiThread(() -> {
                try {
                    getActivity().startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                        Uri.parse("package:" + getContext().getPackageName())));
                    JSObject result = new JSObject(); result.put("permissionRequired", true); call.resolve(result);
                } catch (Exception error) { call.reject("Android did not allow opening installation permissions."); }
            });
            return;
        }
        if (!installing.compareAndSet(false, true)) { call.reject("An update download is already running."); return; }
        getBridge().execute(() -> {
            File apk = null;
            boolean installerReady = false;
            try {
                JSONObject release = UpdateChecks.fetchRelease(getContext());
                if (!release.getString("packageName").equals(getContext().getPackageName())) throw new Exception("This build uses a different package");
                if (release.getLong("versionCode") <= UpdateChecks.installedVersion(getContext())) {
                    JSObject result = new JSObject(); result.put("upToDate", true); call.resolve(result); return;
                }
                if (release.optInt("minAndroidSdk", 24) > Build.VERSION.SDK_INT) throw new Exception("This update requires a newer Android version");
                File directory = new File(getContext().getCacheDir(), "footy-updates");
                if (!directory.isDirectory() && !directory.mkdirs()) throw new Exception("Could not create update storage");
                // Unique filenames preserve a previously opened installer during a retry.
                apk = File.createTempFile("footy-", ".apk", directory);
                MessageDigest digest = MessageDigest.getInstance("SHA-256");
                try (DigestOutputStream output = new DigestOutputStream(new FileOutputStream(apk), digest)) {
                    UpdateDownload.copy(release.getString("downloadUrl"), output, 128L * 1024 * 1024);
                }
                if (!UpdatePolicy.matchesDigest(release.getString("sha256"), digest.digest())) throw new Exception("Downloaded update failed its checksum");
                int flags = Build.VERSION.SDK_INT >= 28 ? PackageManager.GET_SIGNING_CERTIFICATES : PackageManager.GET_SIGNATURES;
                PackageManager manager = getContext().getPackageManager();
                PackageInfo candidate = manager.getPackageArchiveInfo(apk.getAbsolutePath(), flags);
                PackageInfo installed = manager.getPackageInfo(getContext().getPackageName(), flags);
                if (candidate == null || !getContext().getPackageName().equals(candidate.packageName)
                    || UpdateChecks.versionCode(candidate) != release.getLong("versionCode")
                    || UpdateChecks.versionCode(candidate) <= UpdateChecks.versionCode(installed)
                    || !UpdatePolicy.sameSigners(signers(installed), signers(candidate))
                    || candidate.applicationInfo == null
                    || candidate.applicationInfo.minSdkVersion > Build.VERSION.SDK_INT
                    || (candidate.applicationInfo.flags & android.content.pm.ApplicationInfo.FLAG_DEBUGGABLE) != 0) {
                    throw new Exception("Update identity or signature does not match this app");
                }
                Uri uri = FileProvider.getUriForFile(getContext(), getContext().getPackageName() + ".fileprovider", apk);
                Intent intent = new Intent(Intent.ACTION_VIEW).setDataAndType(uri, "application/vnd.android.package-archive")
                    .addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                File verified = apk;
                getActivity().runOnUiThread(() -> {
                    try {
                        getActivity().startActivity(intent);
                        JSObject result = new JSObject(); result.put("installerOpened", true); call.resolve(result);
                    } catch (Exception error) { verified.delete(); call.reject("Android could not open the installer."); }
                    finally { installing.set(false); }
                });
                installerReady = true;
            } catch (Exception error) { call.reject(error.getMessage() == null ? "Update download failed. Please retry." : error.getMessage()); }
            finally {
                if (!installerReady) {
                    if (apk != null) apk.delete();
                    installing.set(false);
                }
            }
        });
    }
}
