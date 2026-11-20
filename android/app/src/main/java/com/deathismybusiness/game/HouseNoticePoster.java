package com.deathismybusiness.game;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Posts house notices without Capacitor's alarm parcel.
 *
 * LocalNotifications.schedule on this target SDK uses setAndAllowWhileIdle
 * when exact alarms are not granted. That alarm will not fire in five
 * seconds. The publisher then drops the notice if the Notification parcel
 * extra is missing. This poster rebuilds the notice from plain strings.
 * A living process shows a short delay on the main looper. The alarm is
 * only the backup for a frozen process, and it is cancelled if the looper
 * already posted.
 */
public final class HouseNoticePoster {
    static final String CHANNEL_ID = "house-notices";
    private static final long POST_NOW_MS = 1500L;
    private static final long LIVING_PROCESS_MS = 20000L;
    private static final Handler HANDLER = new Handler(Looper.getMainLooper());
    private static final ConcurrentHashMap<Integer, Runnable> SOON = new ConcurrentHashMap<>();

    private HouseNoticePoster() {}

    public static void schedule(Context context, int id, String title, String body, long atMs)
        throws SecurityException {
        Context app = context.getApplicationContext();
        if (!NotificationManagerCompat.from(app).areNotificationsEnabled()) {
            throw new SecurityException("notices disabled");
        }
        String safeTitle = title == null || title.isEmpty() ? "The house" : title;
        String safeBody = body == null ? "" : body;
        cancelSoon(id);
        cancelAlarm(app, id);
        long delay = atMs - System.currentTimeMillis();
        if (delay <= POST_NOW_MS) {
            post(app, id, safeTitle, safeBody);
            return;
        }
        if (delay <= LIVING_PROCESS_MS) {
            Runnable task = () -> {
                SOON.remove(id);
                post(app, id, safeTitle, safeBody);
                cancelAlarm(app, id);
            };
            SOON.put(id, task);
            HANDLER.postDelayed(task, delay);
        }
        armAlarm(app, id, safeTitle, safeBody, atMs);
    }

    public static void cancel(Context context, int id) {
        Context app = context.getApplicationContext();
        cancelSoon(id);
        cancelAlarm(app, id);
        NotificationManagerCompat.from(app).cancel(id);
    }

    public static void post(Context context, int id, String title, String body) {
        Context app = context.getApplicationContext();
        if (!NotificationManagerCompat.from(app).areNotificationsEnabled()) return;
        ensureChannel(app);
        int icon = app.getResources().getIdentifier(
            "ic_stat_ossuarian",
            "drawable",
            app.getPackageName()
        );
        if (icon == 0) return;
        String safeTitle = title == null || title.isEmpty() ? "The house" : title;
        String safeBody = body == null ? "" : body;
        NotificationCompat.Builder builder = new NotificationCompat.Builder(app, CHANNEL_ID)
            .setSmallIcon(icon)
            .setContentTitle(safeTitle)
            .setContentText(safeBody)
            .setStyle(new NotificationCompat.BigTextStyle().bigText(safeBody))
            .setPriority(NotificationCompat.PRIORITY_HIGH)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
            .setOnlyAlertOnce(false)
            .setContentIntent(openHouse(app, id));
        NotificationManagerCompat.from(app).notify(id, builder.build());
    }

    private static void ensureChannel(Context app) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager = app.getSystemService(NotificationManager.class);
        if (manager == null) return;
        if (manager.getNotificationChannel(CHANNEL_ID) != null) return;
        NotificationChannel channel = new NotificationChannel(
            CHANNEL_ID,
            "House notices",
            NotificationManager.IMPORTANCE_HIGH
        );
        channel.setDescription(
            "Arrivals, a finished retort, a service about to begin, family choices, permits, and the bank."
        );
        channel.enableVibration(true);
        channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        manager.createNotificationChannel(channel);
    }

    private static void armAlarm(Context app, int id, String title, String body, long atMs) {
        AlarmManager alarms = (AlarmManager) app.getSystemService(Context.ALARM_SERVICE);
        if (alarms == null) return;
        PendingIntent pending = broadcast(app, id, title, body);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                if (alarms.canScheduleExactAlarms()) {
                    alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMs, pending);
                    return;
                }
                alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMs, pending);
                return;
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarms.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMs, pending);
                return;
            }
            alarms.set(AlarmManager.RTC_WAKEUP, atMs, pending);
        } catch (SecurityException ex) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    alarms.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, atMs, pending);
                } else {
                    alarms.set(AlarmManager.RTC_WAKEUP, atMs, pending);
                }
            } catch (RuntimeException ignored) {
                // The living-process post still runs for a short delay.
            }
        }
    }

    private static void cancelAlarm(Context app, int id) {
        AlarmManager alarms = (AlarmManager) app.getSystemService(Context.ALARM_SERVICE);
        if (alarms == null) return;
        alarms.cancel(broadcast(app, id, "", ""));
    }

    private static void cancelSoon(int id) {
        Runnable pending = SOON.remove(id);
        if (pending != null) HANDLER.removeCallbacks(pending);
    }

    private static PendingIntent broadcast(Context app, int id, String title, String body) {
        Intent intent = new Intent(app, HouseNoticeReceiver.class);
        intent.putExtra("id", id);
        intent.putExtra("title", title);
        intent.putExtra("body", body);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getBroadcast(app, id, intent, flags);
    }

    private static PendingIntent openHouse(Context app, int id) {
        Intent open = new Intent(app, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(app, id, open, flags);
    }
}
