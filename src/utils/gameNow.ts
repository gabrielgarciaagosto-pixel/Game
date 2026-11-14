/**
 * Shared game clock. Offset is normally 0; Dev Tools advances it so rares,
 * family urn timers, and service deadlines move without waiting on wall time.
 */

const OFFSET_KEY = 'ossuarian-dev-clock-offset';

let offsetMs = 0;
try {
  const raw = localStorage.getItem(OFFSET_KEY);
  if (raw != null) {
    const n = Number(raw);
    if (Number.isFinite(n)) offsetMs = n;
  }
} catch {
  /* ignore */
}

type Listener = () => void;
const listeners = new Set<Listener>();

function persist() {
  try {
    localStorage.setItem(OFFSET_KEY, String(offsetMs));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function getClockOffsetMs(): number {
  return offsetMs;
}

export function setClockOffsetMs(ms: number): void {
  offsetMs = Math.trunc(ms);
  persist();
}

export function advanceClockBy(ms: number): void {
  offsetMs += Math.trunc(ms);
  persist();
}

export function resetClockOffset(): void {
  offsetMs = 0;
  persist();
}

export function gameNow(): number {
  return Date.now() + offsetMs;
}

export function gameDate(): Date {
  return new Date(gameNow());
}

export function subscribeClock(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
