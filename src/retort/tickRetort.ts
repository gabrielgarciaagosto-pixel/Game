import {
  BURN_TICK_MS,
  DOOR_STEP,
  PRIMARY_SP,
  SECONDARY_SP,
  type RetortMachine,
} from './retortTypes';

export function stepRetortDoor(r: RetortMachine): RetortMachine {
  if (!r.doorMoving) return r;
  const next = { ...r };
  if (next.doorMoving === 'UP') {
    const door = Math.min(1, next.doorOpen + DOOR_STEP);
    next.doorOpen = door;
    if (door >= 1) next.doorMoving = null;
  } else {
    const door = Math.max(0, next.doorOpen - DOOR_STEP);
    next.doorOpen = door;
    if (door <= 0) next.doorMoving = null;
  }
  return next;
}

/** Advance chamber heat / calcination by one burn tick (~250ms). */
export function stepRetortBurn(
  r: RetortMachine,
  maxSafeTemp: number
): RetortMachine {
  let next: RetortMachine = { ...r };

  if (next.purging && next.purgeEndsAt != null && Date.now() >= next.purgeEndsAt) {
    next.purging = false;
    next.heated = true;
    next.purgeEndsAt = null;
  }

  const doorLoss = Math.pow(next.doorOpen, 1.35) * 28;

  if (next.secondaryOn) {
    next.secondaryTemp = Math.min(
      SECONDARY_SP + 40,
      Math.max(
        72,
        next.secondaryTemp + 18 + Math.random() * 10 - doorLoss * 0.15
      )
    );
  } else if (next.blowerOn && next.heated) {
    next.secondaryTemp = Math.min(820, next.secondaryTemp + 6);
  } else if (next.blowerOn) {
    next.secondaryTemp = Math.min(200, next.secondaryTemp + 2);
  } else {
    next.secondaryTemp = Math.max(
      72,
      next.secondaryTemp - 4 - doorLoss * 0.1
    );
  }

  if (next.primaryOn) {
    const slow =
      next.secondaryTemp < 850 || next.earlyPrimaryStarts > 0 ? 0.55 : 1;
    const gain = (10 + Math.random() * 8) * slow;
    next.primaryTemp = Math.min(
      PRIMARY_SP + 60,
      Math.max(72, next.primaryTemp + gain - doorLoss)
    );
  } else if (next.secondaryOn) {
    next.primaryTemp = Math.max(
      72,
      Math.min(400, next.primaryTemp + 1 - doorLoss * 0.4)
    );
  } else {
    next.primaryTemp = Math.max(
      72,
      next.primaryTemp - 5 - doorLoss * 0.5
    );
  }

  if (next.phase === 'BURN' && next.primaryOn) {
    const heatFactor = Math.min(
      1.15,
      Math.max(0.15, next.primaryTemp / 1400)
    );
    const doorEfficiency = Math.max(0.2, 1 - next.doorOpen * 0.7);
    const burnRate =
      heatFactor *
      doorEfficiency *
      (next.secondaryTemp >= 850 ? 1 : 0.65) *
      (next.earlyPrimaryStarts > 0 ? 0.85 : 1);
    next.elapsedSec += (BURN_TICK_MS / 1000) * burnRate;
    if (next.primaryTemp > maxSafeTemp) {
      next.thermalWarnings += 1;
    }
  }

  if (next.phase === 'BURN' && next.primaryOn && next.audioMode === 'OFF') {
    next.audioMode = 'START';
  }

  if (
    (next.phase === 'SWEEP' || next.phase === 'DONE') &&
    next.audioMode !== 'OFF'
  ) {
    next.audioMode = 'OFF';
  }

  return next;
}
