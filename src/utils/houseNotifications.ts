import { Capacitor } from '@capacitor/core';

const CHANNEL_ID = 'house';

let gate = () => false;
let nextId = 1;

/** The store registers this so notices follow the Settings toggle. */
export function setNotificationGate(read: () => boolean) {
  gate = read;
}

export type NotifyPermission = 'granted' | 'denied' | 'unsupported';

async function localPlugin() {
  const mod = await import('@capacitor/local-notifications');
  return mod.LocalNotifications;
}

async function ensureChannel(
  local: Awaited<ReturnType<typeof localPlugin>>
) {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return;
  }
  await local.createChannel({
    id: CHANNEL_ID,
    name: 'House notices',
    description: 'A body arriving, or a family choosing an urn or casket.',
    importance: 4,
    visibility: 1,
  });
}

/**
 * Ask only when the player turns notices on.
 * A declined prompt leaves the toggle off.
 */
export async function requestHouseNotificationPermission(): Promise<NotifyPermission> {
  try {
    if (Capacitor.isNativePlatform()) {
      const local = await localPlugin();
      const perm = await local.requestPermissions();
      if (perm.display === 'granted') {
        await ensureChannel(local);
        return 'granted';
      }
      return 'denied';
    }
    if (typeof Notification === 'undefined') return 'unsupported';
    const result = await Notification.requestPermission();
    return result === 'granted' ? 'granted' : 'denied';
  } catch {
    return 'unsupported';
  }
}

/**
 * System notice when the toggle is on and the phone allowed it.
 * The on-screen toast is separate and still shows while the house is open.
 */
export function notifyHouse(title: string, body: string) {
  if (!gate()) return;
  void deliver(title, body);
}

async function deliver(title: string, body: string) {
  try {
    if (Capacitor.isNativePlatform()) {
      const local = await localPlugin();
      const perm = await local.checkPermissions();
      if (perm.display !== 'granted') return;
      await ensureChannel(local);
      const id = nextId;
      nextId = (nextId % 2000000000) + 1;
      await local.schedule({
        notifications: [
          {
            id,
            title,
            body,
            channelId: CHANNEL_ID,
            schedule: { at: new Date(Date.now() + 400) },
          },
        ],
      });
      return;
    }
    if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
      new Notification(title, { body });
    }
  } catch {
    // A missing channel or a denied prompt should not stop the service.
  }
}
