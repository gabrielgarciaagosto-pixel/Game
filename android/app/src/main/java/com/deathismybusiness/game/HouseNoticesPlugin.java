package com.deathismybusiness.game;

import android.Manifest;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.util.HashSet;
import java.util.Set;

/**
 * Notification settings, and the Android 13+ notice permission.
 *
 * Capacitor runs plugin methods on a background HandlerThread. Local
 * Notifications then calls ActivityResultLauncher.launch from that thread.
 * Activity.requestPermissions touches the window, throws off the main thread,
 * and Bridge.callPluginMethod does not resolve or reject the call. The system
 * dialog never appears and the web promise stays pending. This method asks on
 * the main thread and answers the call on every path.
 */
@CapacitorPlugin(
    name = "HouseNotices",
    permissions = {
        @Permission(strings = { Manifest.permission.POST_NOTIFICATIONS }, alias = "display")
    }
)
public class HouseNoticesPlugin extends Plugin {
    private static final int POST_NOTIFICATIONS_API = 33;
    private final Set<String> settledCalls = new HashSet<>();

    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        if (getActivity() == null) {
            call.reject("No activity");
            return;
        }
        getActivity().runOnUiThread(() -> {
            try {
                Intent intent = new Intent();
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    intent.setAction(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                    intent.putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName());
                } else {
                    intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                    intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                }
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getActivity().startActivity(intent);
                call.resolve();
            } catch (RuntimeException ex) {
                call.reject("Could not open notification settings");
            }
        });
    }

    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        if (getActivity() == null) {
            finish(call);
            return;
        }
        getActivity().runOnUiThread(() -> askOnMainThread(call));
    }

    private void askOnMainThread(PluginCall call) {
        try {
            if (Build.VERSION.SDK_INT < POST_NOTIFICATIONS_API) {
                finish(call);
                return;
            }
            if (
                ContextCompat.checkSelfPermission(getContext(), Manifest.permission.POST_NOTIFICATIONS) ==
                PackageManager.PERMISSION_GRANTED
            ) {
                finish(call);
                return;
            }
            requestPermissionForAlias("display", call, "onNotificationPermission");
        } catch (RuntimeException ex) {
            finish(call);
        }
    }

    @PermissionCallback
    private void onNotificationPermission(PluginCall call) {
        finish(call);
    }

    private void finish(PluginCall call) {
        if (call == null) return;
        synchronized (settledCalls) {
            String id = call.getCallbackId();
            if (id != null && !settledCalls.add(id)) return;
        }
        boolean enabled = NotificationManagerCompat.from(getContext()).areNotificationsEnabled();
        JSObject result = new JSObject();
        result.put("display", enabled ? "granted" : "denied");
        call.resolve(result);
    }
}
