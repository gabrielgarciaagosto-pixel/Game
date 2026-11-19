import { Capacitor, registerPlugin } from '@capacitor/core';

const CHANNEL_ID = 'house-notices';
const RETIRED_CHANNEL_ID = 'house';

let gate = () => false;
let nextId = 1;

interface HouseNoticesPlugin {
  openNotificationSettings(): Promise<void>;
}

const HouseNotices = registerPlugin<HouseNoticesPlugin>('HouseNotices');

/** The store registers this so notices follow the Settings toggle. */
export function setNotificationGate(read: () => boolean) {
  gate = read;
}

export type NotifyPermission = 'granted' | 'denied' | 'unsupported';

async function localPlugin() {
  const mod = await import('@capacitor/local-notifications');
  return mod.LocalNotifications;
}

/**
 * Inexact, idle-safe schedule.
 * Exact alarms default to on in Capacitor 8 and, on Android 12+, open
 * Alarms & reminders instead of posting when that grant is missing.
 */
function houseWhen(atMs: number) {
  return {
    at: new Date(atMs),
    allowWhileIdle: true,
    isExactNotification: false as const,
  };
}

async function ensureChannel(
  local: Awaited<ReturnType<typeof localPlugin>>
) {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
    return;
  }
  try {
    await local.deleteChannel({ id: RETIRED_CHANNEL_ID });
  } catch {
    // The first install never created the old channel.
  }
  await local.createChannel({
    id: CHANNEL_ID,
    name: 'House notices',
    description:
      'Arrivals, a finished retort, a service about to begin, family choices, permits, and the bank.',
    importance: 4,
    visibility: 1,
    vibration: true,
    lights: true,
    lightColor: '#c4a574',
  });
}

/**
 * Ask the phone. A declined or thrown native call stays denied
 * so the toggle is not turned on without a real grant.
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
    return Capacitor.isNativePlatform() ? 'denied' : 'unsupported';
  }
}

/** Android notification settings for this house. False on a browser. */
export async function openHouseNotificationSettings(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  try {
    await HouseNotices.openNotificationSettings();
    return true;
  } catch {
    return false;
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
const TEST_ALARM = 80001;
const INTAKE_ALARM = 81001;
const FAMILY_ALARM_BASE = 82000;
const FAMILY_ALARM_SLOTS = 12;
const LOAN_ALARM_BASE = 83000;
const LOAN_ALARM_SLOTS = 8;
const SERVICE_ALARM_BASE = 84000;
const SERVICE_ALARM_SLOTS = 8;
const RETORT_ALARM_BASE = 85000;
const RETORT_ALARM_SLOTS = 4;
const PERMIT_ALARM_BASE = 86000;
const PERMIT_ALARM_SLOTS = 8;
const DECAY_ALARM_BASE = 87000;
const DECAY_ALARM_SLOTS = 8;
const TAG_ALARM_BASE = 88000;
const TAG_ALARM_SLOTS = 8;
const BANK_WARNING_ALARM = 89001;
const BANK_FORECLOSURE_ALARM = 89002;

function rangedIds(base: number, count: number): { id: number }[] {
  const ids: { id: number }[] = [];
  for (let i = 0; i < count; i += 1) ids.push({ id: base + i });
  return ids;
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
            smallIcon: SMALL_ICON,
            schedule: houseWhen(Date.now() + 800),
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

export type HouseTestResult = NotifyPermission | 'scheduled';

/**
 * One notice five seconds out, so the phone can be closed before it arrives.
 * Does not require the gameplay toggle. It does require the system grant.
 */
export async function scheduleHouseTestNotification(): Promise<HouseTestResult> {
  const perm = await requestHouseNotificationPermission();
  if (perm !== 'granted') return perm;
  try {
    if (Capacitor.isNativePlatform()) {
      const local = await localPlugin();
      await ensureChannel(local);
      await local.schedule({
        notifications: [
          {
            id: TEST_ALARM,
            title: 'The house',
            body: 'This is a test notice. If you can read it, the phone will reach you while the house is closed.',
            channelId: CHANNEL_ID,
            smallIcon: SMALL_ICON,
            schedule: houseWhen(Date.now() + 5000),
          },
        ],
      });
      return 'scheduled';
    }
    if (typeof Notification === 'undefined') return 'unsupported';
    window.setTimeout(() => {
      try {
        if (Notification.permission === 'granted') {
          new Notification('The house', {
            body: 'This is a test notice. If you can read it, the phone will reach you while the house is closed.',
          });
        }
      } catch {
        // The page may already be gone.
      }
    }, 5000);
    return 'scheduled';
  } catch {
    return Capacitor.isNativePlatform() ? 'denied' : 'unsupported';
  }
}

export interface NamedAlarm {
  at: number;
  name: string;
}

export interface ServiceAlarm extends NamedAlarm {
  whenLabel: string;
}

export interface HouseAlarmPlan {
  enabled: boolean;
  /** Wall-clock ms. Null when nothing is due later. */
  intakeAt: number | null;
  /** True when the next intake will be lost if the cooler stays full. */
  intakeRival: boolean;
  families: NamedAlarm[];
  loans: { at: number }[];
  services: ServiceAlarm[];
  retorts: NamedAlarm[];
  permits: NamedAlarm[];
  decay: NamedAlarm[];
  tags: NamedAlarm[];
  bankWarningAt: number | null;
  foreclosureAt: number | null;
}

interface QueuedNotice {
  id: number;
  title: string;
  body: string;
  at: number;
}

function pushFuture(
  queued: QueuedNotice[],
  id: number,
  title: string,
  body: string,
  at: number,
  now: number
) {
  if (at <= now + 2000) return;
  queued.push({ id, title, body, at });
}

/**
 * Replace every house alarm. Stable ids, so a save or a reopen
 * cannot leave a stale or duplicate notice.
 */
export async function syncHouseAlarms(plan: HouseAlarmPlan) {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const local = await localPlugin();
    const ids = [
      { id: INTAKE_ALARM },
      { id: BANK_WARNING_ALARM },
      { id: BANK_FORECLOSURE_ALARM },
      ...rangedIds(FAMILY_ALARM_BASE, FAMILY_ALARM_SLOTS),
      ...rangedIds(LOAN_ALARM_BASE, LOAN_ALARM_SLOTS),
      ...rangedIds(SERVICE_ALARM_BASE, SERVICE_ALARM_SLOTS),
      ...rangedIds(RETORT_ALARM_BASE, RETORT_ALARM_SLOTS),
      ...rangedIds(PERMIT_ALARM_BASE, PERMIT_ALARM_SLOTS),
      ...rangedIds(DECAY_ALARM_BASE, DECAY_ALARM_SLOTS),
      ...rangedIds(TAG_ALARM_BASE, TAG_ALARM_SLOTS),
    ];
    await local.cancel({ notifications: ids });
    if (!plan.enabled || !gate()) return;
    const perm = await local.checkPermissions();
    if (perm.display !== 'granted') return;
    await ensureChannel(local);
    const now = Date.now();
    const queued: QueuedNotice[] = [];
    if (plan.intakeAt != null) {
      pushFuture(
        queued,
        INTAKE_ALARM,
        plan.intakeRival ? 'Another house' : 'New remains',
        plan.intakeRival
          ? 'A family called, but your cooler was full. Another funeral home took the call.'
          : 'A body is due at the house. Tag them in the cooler when you open the door.',
        plan.intakeAt,
        now
      );
    }
    plan.loans.slice(0, LOAN_ALARM_SLOTS).forEach((loan, index) => {
      pushFuture(
        queued,
        LOAN_ALARM_BASE + index,
        'The bank',
        'A reminder from the bank: your payment is due.',
        loan.at,
        now
      );
    });
    plan.families.slice(0, FAMILY_ALARM_SLOTS).forEach((family, index) => {
      pushFuture(
        queued,
        FAMILY_ALARM_BASE + index,
        'Family choice',
        `${family.name} is ready to choose from what you have in stock.`,
        family.at,
        now
      );
    });
    plan.services.slice(0, SERVICE_ALARM_SLOTS).forEach((service, index) => {
      pushFuture(
        queued,
        SERVICE_ALARM_BASE + index,
        'Service soon',
        `The viewing for ${service.name} begins at ${service.whenLabel}. Have the chapel ready.`,
        service.at,
        now
      );
    });
    plan.retorts.slice(0, RETORT_ALARM_SLOTS).forEach((retort, index) => {
      pushFuture(
        queued,
        RETORT_ALARM_BASE + index,
        'The retort',
        `The retort has finished with ${retort.name}. It was left running. Open the crematory.`,
        retort.at,
        now
      );
    });
    plan.permits.slice(0, PERMIT_ALARM_SLOTS).forEach((permit, index) => {
      pushFuture(
        queued,
        PERMIT_ALARM_BASE + index,
        'The permit',
        `Vital records have an answer on ${permit.name}.`,
        permit.at,
        now
      );
    });
    plan.decay.slice(0, DECAY_ALARM_SLOTS).forEach((row, index) => {
      pushFuture(
        queued,
        DECAY_ALARM_BASE + index,
        'Decay',
        `${row.name} is spoiling outside the cooler.`,
        row.at,
        now
      );
    });
    plan.tags.slice(0, TAG_ALARM_SLOTS).forEach((row, index) => {
      pushFuture(
        queued,
        TAG_ALARM_BASE + index,
        'The toe tag',
        `${row.name} is still untagged. The name is about to be lost.`,
        row.at,
        now
      );
    });
    if (plan.bankWarningAt != null) {
      pushFuture(
        queued,
        BANK_WARNING_ALARM,
        'The bank',
        'The house has been overdrawn for a day. The clock keeps running while the doors are shut.',
        plan.bankWarningAt,
        now
      );
    }
    if (plan.foreclosureAt != null) {
      pushFuture(
        queued,
        BANK_FORECLOSURE_ALARM,
        'The bank',
        'The parlor is about to be taken. The overdraft clock did not pause.',
        plan.foreclosureAt,
        now
      );
    }
    if (queued.length === 0) return;
    await local.schedule({
      notifications: queued.map((item) => ({
        id: item.id,
        title: item.title,
        body: item.body,
        channelId: CHANNEL_ID,
        smallIcon: SMALL_ICON,
        schedule: houseWhen(item.at),
      })),
    });
  } catch {
    // Scheduling must not stall intake.
  }
}
