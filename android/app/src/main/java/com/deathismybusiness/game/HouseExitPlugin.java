package com.deathismybusiness.game;

import android.app.Activity;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/** Closes the house and removes it from the recent-apps list. */
@CapacitorPlugin(name = "HouseExit")
public class HouseExitPlugin extends Plugin {
    @PluginMethod
    public void finishAndRemove(PluginCall call) {
        Activity activity = getActivity();
        if (activity == null) {
            call.reject("The house is not open.");
            return;
        }
        call.resolve();
        activity.runOnUiThread(activity::finishAndRemoveTask);
    }
}
