import type { Rank } from '../types/game';

export interface EmbalmingTargets {
  totalVolumeOz: number;
  waterOz: number;
  formaldehydeOz: number;
  softenerOz: number;
}

/**
 * Calculates exact fluid targets based on 1 Gallon (128 oz) per 50 lbs rule
 */
export function calculateEmbalmingTargets(
  weightLbs: number,
  dehydrationFactor: number
): EmbalmingTargets {
  const totalVolumeOz = (weightLbs / 50) * 128;
  // 20-Index arterial fluid at 2.0% target dilution: (2.0 * V) / 20 = 0.10 * V
  const formaldehydeOz = +(totalVolumeOz * 0.1).toFixed(1);
  // Softener/Humectant: 4 oz per 50 lbs scaled by dehydration factor
  const softenerOz = +((weightLbs / 50) * 4 * dehydrationFactor).toFixed(1);
  const waterOz = +(totalVolumeOz - (formaldehydeOz + softenerOz)).toFixed(1);

  return {
    totalVolumeOz: +totalVolumeOz.toFixed(1),
    waterOz,
    formaldehydeOz,
    softenerOz,
  };
}

/**
 * Proximity Pour Physics: closer to the tank = steeper bottle tilt + quadratic flow + glug pulse
 */
export function calculatePourPhysics(
  proximityNormalized: number, // 0.0 (far shelf) to 1.0 (over tank rim)
  elapsedTimeSec: number,
  maxFlowOzPerSec = 45
): { tiltDegrees: number; currentFlowOzPerSec: number; isGlugging: boolean } {
  const d = Math.max(0, Math.min(1, proximityNormalized));
  const tiltDegrees = 15 + 75 * Math.pow(d, 1.5);
  const baseFlow = maxFlowOzPerSec * Math.pow(d, 2);

  const isGlugging = d > 0.85;
  const glugMultiplier = isGlugging
    ? 1 + 0.08 * Math.sin(elapsedTimeSec * 18)
    : 1;

  return {
    tiltDegrees: Math.round(tiltDegrees),
    currentFlowOzPerSec: +(baseFlow * glugMultiplier).toFixed(2),
    isGlugging,
  };
}

/**
 * Evaluates S+ to F rank from fluid deviation percentage
 */
export function evaluateEmbalmingRank(
  actual: { waterOz: number; formaldehydeOz: number; softenerOz: number },
  target: EmbalmingTargets
): { rank: Rank; errorPercent: number; tipMultiplier: number } {
  const waterErr = Math.abs(actual.waterOz - target.waterOz) / target.waterOz;
  const formErr =
    Math.abs(actual.formaldehydeOz - target.formaldehydeOz) /
    target.formaldehydeOz;
  const softErr =
    Math.abs(actual.softenerOz - target.softenerOz) / target.softenerOz;

  // Weighted average error (Formaldehyde & Softener carry higher precision weight)
  const totalErrorPercent = +(
    (waterErr * 0.25 + formErr * 0.45 + softErr * 0.3) *
    100
  ).toFixed(2);

  if (totalErrorPercent <= 1.5)
    return { rank: 'S+', errorPercent: totalErrorPercent, tipMultiplier: 1.5 };
  if (totalErrorPercent <= 4.0)
    return { rank: 'S', errorPercent: totalErrorPercent, tipMultiplier: 1.25 };
  if (totalErrorPercent <= 8.0)
    return { rank: 'A', errorPercent: totalErrorPercent, tipMultiplier: 1.0 };
  if (totalErrorPercent <= 15.0)
    return { rank: 'B', errorPercent: totalErrorPercent, tipMultiplier: 0.85 };
  if (totalErrorPercent <= 30.0)
    return { rank: 'C', errorPercent: totalErrorPercent, tipMultiplier: 0.6 };
  return { rank: 'F', errorPercent: totalErrorPercent, tipMultiplier: 0.2 };
}

/**
 * Cremation Hidden Target Duration & Stepped Temperature Ceiling
 */
export function getCremationTargets(weightLbs: number) {
  // 160 lbs = 180 seconds (3.0 game minutes)
  const targetDurationSec = Math.round((3.0 + (weightLbs - 160) / 60) * 60);
  const requiredStirs = Math.max(1, Math.floor(weightLbs / 75));
  const requiresSteppedRamp = weightLbs > 200;

  return {
    targetDurationSec,
    requiredStirs,
    requiresSteppedRamp,
    // Returns safe max temperature at a given burn progress (0.0 to 1.0)
    getMaxSafeTempF: (progress: number): number => {
      if (!requiresSteppedRamp) return 1600;
      if (progress < 0.25) return 1200;
      if (progress < 0.6) return 1400;
      return 1600;
    },
  };
}
