package me.mohamedlaaribi.footy;
import com.getcapacitor.*;
import com.getcapacitor.annotation.CapacitorPlugin;
@CapacitorPlugin(name="AppUpdates")
public class AppUpdatesPlugin extends Plugin {
    @PluginMethod public void checkNow(PluginCall call){UpdateChecks.checkNow(getContext());call.resolve();}
    @PluginMethod public void status(PluginCall call){android.content.SharedPreferences prefs=getContext().getSharedPreferences("footy_updates",0);JSObject result=new JSObject();result.put("lastChecked",prefs.getLong("lastChecked",0));result.put("latestVersionName",prefs.getString("latestVersionName",""));call.resolve(result);}
}
