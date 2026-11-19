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

/** Burn seconds added per wall second while the primary is firing. */
export function steadyBurnRate(r: RetortMachine): number {
  if (r.phase !== 'BURN' || !r.primaryOn) return 0;
  const heatFactor = Math.min(1.15, Math.max(0.15, r.primaryTemp / 1400));
  const doorEfficiency = Math.max(0.2, 1 - r.doorOpen * 0.7);
  return (
    heatFactor *
    doorEfficiency *
    (r.secondaryTemp >= 850 ? 1 : 0.65) *
    (r.earlyPrimaryStarts > 0 ? 0.85 : 1)
  );
}

/** Advance chamber heat / calcination by one burn slice. */
export function stepRetortBurn(
  r: RetortMachine,
  maxSafeTemp: number,
  tickMs: number = BURN_TICK_MS,
  now: number = Date.now()
): RetortMachine {
  let next: RetortMachine = { ...r };

  if (next.purging && next.purgeEndsAt != null && now >= next.purgeEndsAt) {
    next.purging = false;
    next.heated = true;
    next.purgeEndsAt = null;
  }

  const doorLoss = Math.pow(next.doorOpen, 1.35) * 28;
  const secondarySp = next.secondarySetPoint || SECONDARY_SP;
  const primarySp = next.primarySetPoint || PRIMARY_SP;

  const approach = (current: number, target: number, maxStep: number, loss: number) => {
    const delta = target - current;
    const step = Math.sign(delta) * Math.min(Math.abs(delta), maxStep);
    return Math.max(72, current + step - loss);
  };
  /** Move toward a ceiling. Never jump down to it in one tick. */
  const towardCap = (current: number, cap: number, rise: number, fall: number) => {
    if (current > cap) return Math.max(cap, current - fall);
    return Math.min(cap, current + rise);
  };

  if (next.secondaryOn) {
    next.secondaryTemp = approach(
      next.secondaryTemp,
      secondarySp + 15,
      18 + Math.random() * 10,
      doorLoss * 0.15
    );
  } else if (next.blowerOn && next.heated) {
    next.secondaryTemp = towardCap(next.secondaryTemp, 820, 6, 8);
  } else if (next.blowerOn) {
    next.secondaryTemp = towardCap(next.secondaryTemp, 200, 2, 8);
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
    next.primaryTemp = approach(next.primaryTemp, primarySp + 20, gain, doorLoss);
  } else if (next.secondaryOn) {
    next.primaryTemp = Math.max(
      72,
      towardCap(next.primaryTemp, 400, 1, 8 + doorLoss * 0.4)
    );
  } else {
    next.primaryTemp = Math.max(
      72,
      next.primaryTemp - 5 - doorLoss * 0.5
    );
  }

  if (next.phase === 'BURN' && next.primaryOn) {
    const burnRate = steadyBurnRate(next);
    next.elapsedSec += (tickMs / 1000) * burnRate;
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

/**
 * Catch a closed gap. Short gaps replay the live slices.
 * A long gap settles the burners where they were left and applies
 * that rate for the whole absence, including time past the target.
 */
export function advanceRetortBy(
  r: RetortMachine,
  dtMs: number,
  maxSafeTemp: number,
  now: number = Date.now()
): RetortMachine {
  if (dtMs <= 0) return r;
  if (dtMs <= 3000) {
    let next = r;
    let left = dtMs;
    while (left > 0) {
      const slice = Math.min(BURN_TICK_MS, left);
      next = stepRetortBurn(next, maxSafeTemp, slice, now);
      left -= slice;
    }
    return next;
  }

  let next: RetortMachine = { ...r };
  if (next.purging && next.purgeEndsAt != null && now >= next.purgeEndsAt) {
    next.purging = false;
    next.heated = true;
    next.purgeEndsAt = null;
  }

  if (next.secondaryOn) {
    next.secondaryTemp = (next.secondarySetPoint || SECONDARY_SP) + 15;
  } else if (next.blowerOn && next.heated) {
    next.secondaryTemp = 820;
  } else if (next.blowerOn) {
    next.secondaryTemp = 200;
  } else {
    next.secondaryTemp = 72;
  }

  if (next.primaryOn) {
    next.primaryTemp = (next.primarySetPoint || PRIMARY_SP) + 20;
  } else if (next.secondaryOn) {
    next.primaryTemp = Math.min(400, Math.max(72, next.primaryTemp));
  } else {
    next.primaryTemp = 72;
  }

  if (next.phase === 'BURN' && next.primaryOn) {
    next.elapsedSec += (dtMs / 1000) * steadyBurnRate(next);
    if (next.primaryTemp > maxSafeTemp) {
      next.thermalWarnings += Math.min(120, Math.max(1, Math.floor(dtMs / BURN_TICK_MS)));
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
