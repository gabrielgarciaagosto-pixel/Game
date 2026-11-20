package com.deathismybusiness.game;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/** Rebuilds a house notice from string extras. Never from a Notification parcel. */
public class HouseNoticeReceiver extends BroadcastReceiver {
    @Override
    public void onReceive(Context context, Intent intent) {
        if (context == null || intent == null) return;
        int id = intent.getIntExtra("id", 0);
        if (id == 0) return;
        String title = intent.getStringExtra("title");
        String body = intent.getStringExtra("body");
        HouseNoticePoster.post(context, id, title, body);
    }
}
