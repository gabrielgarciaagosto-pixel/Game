package com.deathismybusiness.masterurn;

import android.content.SharedPreferences;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.IOException;
import java.security.GeneralSecurityException;

/**
 * Password and session tokens live in EncryptedSharedPreferences.
 * The key is a Keystore AES-256 master key. Values are never logged.
 */
@CapacitorPlugin(name = "MasterVault")
public class MasterVaultPlugin extends Plugin {
    private SharedPreferences prefs;

    private SharedPreferences prefs() throws GeneralSecurityException, IOException {
        if (prefs != null) return prefs;
        MasterKey key = new MasterKey.Builder(getContext())
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build();
        prefs = EncryptedSharedPreferences.create(
            getContext(),
            "master_urn_vault",
            key,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        );
        return prefs;
    }

    @PluginMethod
    public void get(PluginCall call) {
        String key = call.getString("key");
        if (key == null || key.isEmpty()) {
            call.reject("missing key");
            return;
        }
        try {
            JSObject ret = new JSObject();
            ret.put("value", prefs().getString(key, null));
            call.resolve(ret);
        } catch (GeneralSecurityException | IOException e) {
            call.reject("vault unavailable");
        }
    }

    @PluginMethod
    public void set(PluginCall call) {
        String key = call.getString("key");
        String value = call.getString("value");
        if (key == null || key.isEmpty() || value == null) {
            call.reject("missing value");
            return;
        }
        try {
            prefs().edit().putString(key, value).commit();
            call.resolve();
        } catch (GeneralSecurityException | IOException e) {
            call.reject("vault unavailable");
        }
    }

    @PluginMethod
    public void remove(PluginCall call) {
        String key = call.getString("key");
        if (key == null || key.isEmpty()) {
            call.reject("missing key");
            return;
        }
        try {
            prefs().edit().remove(key).commit();
            call.resolve();
        } catch (GeneralSecurityException | IOException e) {
            call.reject("vault unavailable");
        }
    }
}
