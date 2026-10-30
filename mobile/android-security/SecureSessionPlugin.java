package me.mohamedlaaribi.footy;

import android.content.Context;
import android.content.SharedPreferences;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.nio.charset.StandardCharsets;
import java.security.KeyStore;
import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

@CapacitorPlugin(name = "SecureSession")
public class SecureSessionPlugin extends Plugin {
    private static final String ALIAS = "footy.auth.v1";
    private SharedPreferences prefs() {
        return getContext().getSharedPreferences("footy_encrypted_auth", Context.MODE_PRIVATE);
    }
    private String keyName(PluginCall call) {
        String key = call.getString("key");
        if (key == null || !key.matches("footy-auth(?:-[a-zA-Z0-9_-]{1,80})?")) {
            throw new IllegalArgumentException("Invalid session key");
        }
        return key;
    }
    private synchronized SecretKey encryptionKey() throws Exception {
        KeyStore store = KeyStore.getInstance("AndroidKeyStore");
        store.load(null);
        if (!store.containsAlias(ALIAS)) {
            KeyGenerator generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
            generator.init(new KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                .setRandomizedEncryptionRequired(true).build());
            generator.generateKey();
        }
        return (SecretKey) store.getKey(ALIAS, null);
    }
    @PluginMethod
    public void get(PluginCall call) {
        try {
            String key = keyName(call);
            String stored = prefs().getString(key, null);
            JSObject result = new JSObject();
            if (stored == null) { result.put("value", JSObject.NULL); call.resolve(result); return; }
            String[] parts = stored.split(":", -1);
            if (parts.length != 2) throw new IllegalStateException("Invalid encrypted session");
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, encryptionKey(), new GCMParameterSpec(128, Base64.decode(parts[0], Base64.NO_WRAP)));
            cipher.updateAAD(key.getBytes(StandardCharsets.UTF_8));
            result.put("value", new String(cipher.doFinal(Base64.decode(parts[1], Base64.NO_WRAP)), StandardCharsets.UTF_8));
            call.resolve(result);
        } catch (Exception error) { call.reject("Secure session storage is unavailable. Sign in again."); }
    }
    @PluginMethod
    public void set(PluginCall call) {
        try {
            String key = keyName(call), value = call.getString("value");
            if (value == null || value.length() > 131072) throw new IllegalArgumentException("Invalid session");
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, encryptionKey());
            cipher.updateAAD(key.getBytes(StandardCharsets.UTF_8));
            String stored = Base64.encodeToString(cipher.getIV(), Base64.NO_WRAP) + ":" +
                Base64.encodeToString(cipher.doFinal(value.getBytes(StandardCharsets.UTF_8)), Base64.NO_WRAP);
            if (!prefs().edit().putString(key, stored).commit()) throw new IllegalStateException("Session write failed");
            call.resolve();
        } catch (Exception error) { call.reject("Could not securely save your session."); }
    }
    @PluginMethod
    public void remove(PluginCall call) {
        try {
            if (!prefs().edit().remove(keyName(call)).commit()) throw new IllegalStateException("Session removal failed");
            call.resolve();
        } catch (Exception error) { call.reject("Could not remove your session."); }
    }
}
