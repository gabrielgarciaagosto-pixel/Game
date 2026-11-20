/** How early a scheduled viewing is announced. */
export const SERVICE_HEADS_UP_MS = 15 * 60 * 1000;

/** Decay level that deserves a phone notice. Matches the embalming penalty band. */
export const DECAY_ALERT_LEVEL = 70;

export function toWall(gameAt: number, now: number, wall: number): number {
  return wall + (gameAt - now);
}

/** Game-clock ms when the primary will reach the target, or null if it is not firing. */
export function retortFinishGameAt(
  elapsedSec: number,
  targetSec: number,
  burnPerSec: number,
  now: number
): number | null {
  if (burnPerSec <= 0 || targetSec <= 0) return null;
  if (elapsedSec >= targetSec) return null;
  return now + ((targetSec - elapsedSec) / burnPerSec) * 1000;
}

/** Game-clock ms when decay reaches the alert level, or null if it already has. */
export function decayAlertGameAt(
  level: number,
  ratePerSec: number,
  now: number
): number | null {
  if (ratePerSec <= 0 || level >= DECAY_ALERT_LEVEL) return null;
  return now + ((DECAY_ALERT_LEVEL - level) / ratePerSec) * 1000;
}

/**
 * When the service heads-up should fire.
 * Inside the lead window it still fires, a few seconds from now,
 * so a house that is about to close still gets the warning.
 */
export function serviceHeadsUpGameAt(
  serviceDateMs: number,
  now: number
): number | null {
  if (serviceDateMs <= now) return null;
  const leadAt = serviceDateMs - SERVICE_HEADS_UP_MS;
  if (leadAt <= now + 2000) return now + 3000;
  return leadAt;
}
