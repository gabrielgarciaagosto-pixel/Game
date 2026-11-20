/**
 * Hybrid clock.
 * Intake, services, news, and the bank live on real days.
 * Toe-tag, decay, embalming, and the retort stay foreground races.
 */

export const HOUR_MS = 3_600_000;
export const DAY_MS = 24 * HOUR_MS;

/** Automatic arrivals per local day at a normal parlor. */
export const DAILY_INTAKE_CAP = 5;
/** SCI: a slower daily band. Pause still writes no arrival. */
export const SCI_DAILY_INTAKE_CAP = 2;

export const INTAKE_GAP_MIN_MS = 4 * HOUR_MS;
export const INTAKE_GAP_MAX_MS = 8 * HOUR_MS;
export const SCI_GAP_MIN_MS = 8 * HOUR_MS;
export const SCI_GAP_MAX_MS = 12 * HOUR_MS;

/** Phone calls that land a body, on top of the daily automatic cap. */
export const PHONE_EXTRA_PER_DAY = 2;

/** A due arrival that found no open bay. The body is not kept. */
export const COOLER_RIVAL_NOTE =
  'A family called, but your cooler was full. Another funeral home took the call.';

/**
 * A service may run this long after the chosen hour.
 * Inside the window the house pays a small courtesy. After it, reschedule.
 */
export const SERVICE_GRACE_MS = 45 * 60 * 1000;
export const SERVICE_GRACE_FINE = 150;
export const SERVICE_RESCHEDULE_REP = 6;

export function localDayKey(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function startOfLocalDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

export function addLocalDays(ms: number, days: number): number {
  const d = new Date(startOfLocalDay(ms));
  d.setDate(d.getDate() + days);
  return d.getTime();
}

/** Property flow and a news headline nudge the gap. They cannot collapse the day. */
export function rollIntakeGapMs(
  slow: boolean,
  flow: number,
  rng: () => number = Math.random
): number {
  const min = slow ? SCI_GAP_MIN_MS : INTAKE_GAP_MIN_MS;
  const max = slow ? SCI_GAP_MAX_MS : INTAKE_GAP_MAX_MS;
  const base = min + Math.floor(rng() * (max - min + 1));
  const scale = Math.min(1.35, Math.max(0.75, Number.isFinite(flow) ? flow : 1));
  const adjusted = Math.round(base / scale);
  const floor = slow ? 6 * HOUR_MS : 3 * HOUR_MS;
  const ceil = slow ? 14 * HOUR_MS : 10 * HOUR_MS;
  return Math.min(ceil, Math.max(floor, adjusted));
}

export interface IntakeSchedule {
  dayKey: string;
  spawned: number;
  nextAt: number | null;
  bootstrapped: boolean;
}

export function advanceIntakeSchedule(input: {
  now: number;
  schedule: IntakeSchedule;
  pause: boolean;
  slow: boolean;
  flow: number;
  coolerEmpty: boolean;
  coolerFull: boolean;
  catchUpLimit: number;
  rng?: () => number;
}): { schedule: IntakeSchedule; spawnCount: number; lostToRival: number } {
  const rng = input.rng ?? Math.random;
  const today = localDayKey(input.now);
  let { dayKey, spawned, nextAt, bootstrapped } = input.schedule;
  if (dayKey !== today) {
    dayKey = today;
    spawned = 0;
  }
  const cap = input.slow ? SCI_DAILY_INTAKE_CAP : DAILY_INTAKE_CAP;
  const gap = () => rollIntakeGapMs(input.slow, input.flow, rng);

  if (input.pause) {
    return {
      schedule: { dayKey, spawned, nextAt: null, bootstrapped },
      spawnCount: 0,
      lostToRival: 0,
    };
  }

  let spawnCount = 0;
  let lostToRival = 0;
  if (nextAt == null) {
    if (!bootstrapped && input.coolerEmpty && !input.coolerFull && spawned < cap) {
      spawnCount = 1;
      spawned += 1;
    }
    bootstrapped = true;
    nextAt = input.now + gap();
    return {
      schedule: { dayKey, spawned, nextAt, bootstrapped },
      spawnCount,
      lostToRival: 0,
    };
  }

  // A due call is not held for a bay. If the cooler is full, that call is
  // lost and the next one is scheduled. It still counts toward today's cap,
  // so a long absence applies today's calls and does not dump every missed day.
  let guard = 0;
  while (
    nextAt <= input.now &&
    spawnCount + lostToRival < input.catchUpLimit &&
    guard < 64
  ) {
    guard += 1;
    const dueDay = localDayKey(nextAt);
    if (dueDay > today) break;
    if (spawned >= cap) break;
    if (input.coolerFull) {
      lostToRival += 1;
      spawned += 1;
      nextAt += gap();
      continue;
    }
    spawnCount += 1;
    spawned += 1;
    nextAt += gap();
  }
  if (
    nextAt <= input.now &&
    (spawnCount + lostToRival >= input.catchUpLimit || spawned >= cap)
  ) {
    nextAt = input.now + gap();
  }
  return {
    schedule: { dayKey, spawned, nextAt, bootstrapped },
    spawnCount,
    lostToRival,
  };
}

export type ServiceTiming = 'unset' | 'upcoming' | 'grace' | 'missed';

export function serviceTiming(
  serviceDateMs: number | null,
  now: number
): ServiceTiming {
  if (serviceDateMs == null) return 'unset';
  const late = now - serviceDateMs;
  if (late <= 0) return 'upcoming';
  if (late <= SERVICE_GRACE_MS) return 'grace';
  return 'missed';
}

/** Chapel gatherings. A direct cremation does not light the chapel. */
export function isChapelGathering(directive: string): boolean {
  return (
    directive === 'BURIAL_VIEWING' ||
    directive === 'VIEWING_THEN_CREMATION' ||
    directive === 'CREMATION_THEN_VIEWING'
  );
}

/** 0 at the scheduled hour, 100 at the end of the grace window. */
export function serviceProgressPct(serviceDateMs: number, now: number): number {
  const elapsed = now - serviceDateMs;
  if (elapsed <= 0) return 0;
  return Math.min(100, Math.max(0, Math.round((elapsed / SERVICE_GRACE_MS) * 100)));
}

export function formatHourSpan(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h <= 0) return `${m}m`;
  if (h >= 48) {
    const d = Math.floor(h / 24);
    const rh = h % 24;
    return rh > 0 ? `${d}d ${rh}h` : `${d}d`;
  }
  return `${h}h ${String(m).padStart(2, '0')}m`;
}
