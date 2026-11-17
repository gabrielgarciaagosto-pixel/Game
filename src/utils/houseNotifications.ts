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

const SMALL_ICON = 'ic_stat_ossuarian';
const INTAKE_ALARM = 81001;
const FAMILY_ALARM_BASE = 82000;
const FAMILY_ALARM_SLOTS = 12;
const LOAN_ALARM_BASE = 83000;
const LOAN_ALARM_SLOTS = 8;

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
            smallIcon: SMALL_ICON,
            schedule: { at: new Date(Date.now() + 800), allowWhileIdle: true },
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

export interface HouseAlarmPlan {
  enabled: boolean;
  /** Wall-clock ms. Null when nothing is due later. */
  intakeAt: number | null;
  /** True when the next intake will be lost if the cooler stays full. */
  intakeRival: boolean;
  families: { at: number; name: string }[];
  loans: { at: number }[];
}

/**
 * Hand future arrivals and family choices to Android so they still
 * ping if the WebView is asleep. Foreground races (the toe tag, decay,
 * the retort) are not scheduled.
 */
export async function syncHouseAlarms(plan: HouseAlarmPlan) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const local = await localPlugin();
    const ids = [{ id: INTAKE_ALARM }];
    for (let i = 0; i < FAMILY_ALARM_SLOTS; i += 1) {
      ids.push({ id: FAMILY_ALARM_BASE + i });
    }
    for (let i = 0; i < LOAN_ALARM_SLOTS; i += 1) {
      ids.push({ id: LOAN_ALARM_BASE + i });
    }
    await local.cancel({ notifications: ids });
    if (!plan.enabled || !gate()) return;
    const perm = await local.checkPermissions();
    if (perm.display !== 'granted') return;
    await ensureChannel(local);
    const now = Date.now();
    const queued: {
      id: number;
      title: string;
      body: string;
      at: number;
    }[] = [];
    if (plan.intakeAt != null && plan.intakeAt > now + 2000) {
      queued.push({
        id: INTAKE_ALARM,
        title: plan.intakeRival ? 'Another house' : 'New remains',
        body: plan.intakeRival
          ? 'A family called, but your cooler was full. Another funeral home took the call.'
          : 'A body is due at the house. Tag them in the cooler when you open the door.',
        at: plan.intakeAt,
      });
    }
    plan.loans.slice(0, LOAN_ALARM_SLOTS).forEach((loan, index) => {
      if (loan.at <= now + 2000) return;
      queued.push({
        id: LOAN_ALARM_BASE + index,
        title: 'The bank',
        body: 'A reminder from the bank: your payment is due.',
        at: loan.at,
      });
    });
    plan.families.slice(0, FAMILY_ALARM_SLOTS).forEach((family, index) => {
      if (family.at <= now + 2000) return;
      queued.push({
        id: FAMILY_ALARM_BASE + index,
        title: 'Family choice',
        body: `${family.name} is ready to choose from what you have in stock.`,
        at: family.at,
      });
    });
    if (queued.length === 0) return;
    await local.schedule({
      notifications: queued.map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        channelId: CHANNEL_ID,
        smallIcon: SMALL_ICON,
        schedule: { at: new Date(item.at), allowWhileIdle: true },
      })),
    });
  } catch {
    // Scheduling must not stall intake.
  }
}
