package com.deathismybusiness.game;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.view.View;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import java.util.HashSet;
import java.util.Set;

/**
 * Notification settings, and the Android 13+ notice permission.
 *
 * Capacitor runs plugin methods on a background HandlerThread.
 * ActivityResultLauncher.launch has to run on the main thread or the dialog
 * never appears and the bridge drops the exception. v0.9.80 asked on the main
 * thread, so the dialog showed, but the JavaScript call still never settled.
 *
 * Capacitor's permission callback does not receive the PluginCall. It polls a
 * queue and then invokes the method. If that poll is empty, the method is
 * called with null and the promise stays pending. AndroidX also unregisters
 * the launcher callback while the permission UI has stopped this activity, and
 * a result that is not replayed never reaches the call. This plugin keeps the
 * call itself, asks with its own launcher, and resolves that call when the
 * activity result arrives or when the activity resumes.
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
    private ActivityResultLauncher<String> permissionLauncher;
    private PluginCall pendingAsk;

    @Override
    public void load() {
        AppCompatActivity activity = getActivity();
        if (activity == null) return;
        permissionLauncher = activity.registerForActivityResult(
            new ActivityResultContracts.RequestPermission(),
            granted -> {
                if (pendingAsk == null) return;
                if (Boolean.TRUE.equals(granted) && noticesGranted()) {
                    settle(pendingAsk);
                    return;
                }
                watchPending(pendingAsk);
            }
        );
    }

    @PluginMethod
    public void checkNotificationPermission(PluginCall call) {
        call.resolve(result());
    }

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
        AppCompatActivity activity = getActivity();
        if (activity == null) {
            settle(call);
            return;
        }
        activity.runOnUiThread(() -> askOnMainThread(call));
    }

    /**
     * MainActivity calls this from onRequestPermissionsResult so a result the
     * activity-result registry does not deliver still settles the open call.
     */
    public void onHostPermissionResult() {
        PluginCall call = pendingAsk;
        if (call == null) return;
        if (noticesGranted()) {
            settle(call);
            return;
        }
        watchPending(call);
    }

    @Override
    protected void handleOnResume() {
        notifyListeners("resume", result());
        PluginCall call = pendingAsk;
        if (call == null) return;
        watchPending(call);
    }

    private void askOnMainThread(PluginCall call) {
        try {
            if (noticesGranted() || Build.VERSION.SDK_INT < POST_NOTIFICATIONS_API) {
                settle(call);
                return;
            }
            if (permissionLauncher == null) {
                settle(call);
                return;
            }
            pendingAsk = call;
            permissionLauncher.launch(Manifest.permission.POST_NOTIFICATIONS);
        } catch (RuntimeException ex) {
            settle(call);
        }
    }

    /**
     * The grant is sometimes visible a beat after the dialog closes. Look
     * twice, then answer with whatever the phone reports so the call cannot
     * stay pending.
     */
    private void watchPending(PluginCall expected) {
        AppCompatActivity activity = getActivity();
        if (activity == null) {
            settle(expected);
            return;
        }
        View decor = activity.getWindow().getDecorView();
        decor.post(() -> stepPending(decor, expected, 0));
    }

    private void stepPending(View decor, PluginCall expected, int attempt) {
        if (pendingAsk != expected) return;
        if (noticesGranted() || attempt >= 2) {
            settle(expected);
            return;
        }
        decor.postDelayed(() -> stepPending(decor, expected, attempt + 1), attempt == 0 ? 250 : 600);
    }

    private void settle(PluginCall call) {
        if (call == null) return;
        if (pendingAsk == call) pendingAsk = null;
        synchronized (settledCalls) {
            String id = call.getCallbackId();
            if (id != null && !settledCalls.add(id)) return;
        }
        call.resolve(result());
    }

    private JSObject result() {
        JSObject result = new JSObject();
        result.put("display", noticesGranted() ? "granted" : "denied");
        return result;
    }

    private boolean noticesGranted() {
        Context context = getContext();
        if (context == null) return false;
        boolean enabled = NotificationManagerCompat.from(context).areNotificationsEnabled();
        if (Build.VERSION.SDK_INT < POST_NOTIFICATIONS_API) return enabled;
        boolean runtime =
            ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS) ==
            PackageManager.PERMISSION_GRANTED;
        return runtime && enabled;
    }
}
