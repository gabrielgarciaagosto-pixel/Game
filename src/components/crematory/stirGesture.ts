/**
 * Circular stir detection for the retort stirring rod.
 * Credits progress from rotational motion around the charge — not
 * back-and-forth / top-down linear strokes.
 */

export type StirPoint = { x: number; y: number };

export type CircularStirState = {
  /** Unwrapped signed radians accumulated this gesture */
  accumAngle: number;
  /** Sum of |delta| for circularity ratio */
  absAngle: number;
  lastAngle: number | null;
  samples: StirPoint[];
};

export function createCircularStirState(): CircularStirState {
  return {
    accumAngle: 0,
    absAngle: 0,
    lastAngle: null,
    samples: [],
  };
}

function wrapDelta(d: number): number {
  let x = d;
  while (x > Math.PI) x -= Math.PI * 2;
  while (x < -Math.PI) x += Math.PI * 2;
  return x;
}

/** Orbit center ≈ hearth charge (chamber %). */
export const STIR_CENTER = { x: 50, y: 70 };

/** Minimum orbit radius (% of chamber) to count as stirring. */
const MIN_RADIUS = 5.5;
/** Max useful radius — still counts, just clamps feel. */
const MAX_RADIUS = 38;
/** ~0.55 turn of continuous rotation before a stir credit. */
const ANGLE_CREDIT = Math.PI * 1.05;
/** |net| / totalAbs — reject zig-zag. */
const MIN_CIRCULARITY = 0.48;

/**
 * Fold a new pointer sample into stir state.
 * Returns true when a stir should be credited (and resets accum partially).
 */
export function feedCircularStir(
  state: CircularStirState,
  point: StirPoint
): boolean {
  const dx = point.x - STIR_CENTER.x;
  const dy = point.y - STIR_CENTER.y;
  const radius = Math.hypot(dx, dy);
  if (radius < MIN_RADIUS || radius > MAX_RADIUS) {
    // Too close to center or outside chamber — don't reset entirely, but
    // don't accumulate (avoids jitter at pivot).
    state.lastAngle = null;
    return false;
  }

  const angle = Math.atan2(dy, dx);
  state.samples.push(point);
  if (state.samples.length > 16) state.samples.shift();

  if (state.lastAngle == null) {
    state.lastAngle = angle;
    return false;
  }

  const delta = wrapDelta(angle - state.lastAngle);
  state.lastAngle = angle;

  // Ignore tiny noise
  if (Math.abs(delta) < 0.04) return false;

  state.accumAngle += delta;
  state.absAngle += Math.abs(delta);

  const circularity =
    state.absAngle > 0.2 ? Math.abs(state.accumAngle) / state.absAngle : 0;

  if (
    Math.abs(state.accumAngle) >= ANGLE_CREDIT &&
    circularity >= MIN_CIRCULARITY
  ) {
    // Keep a little carry so continuous stirring feels fluid
    state.accumAngle = state.accumAngle > 0 ? 0.35 : -0.35;
    state.absAngle = Math.abs(state.accumAngle) / Math.max(circularity, 0.5);
    return true;
  }
  return false;
}

export function resetCircularStir(state: CircularStirState) {
  state.accumAngle = 0;
  state.absAngle = 0;
  state.lastAngle = null;
  state.samples = [];
}

/** Generous elliptical hit zone around remains (chamber %). */
export function nearRemains(x: number, y: number): boolean {
  const cx = 50;
  const cy = 72;
  const rx = 46;
  const ry = 32;
  const dx = (x - cx) / rx;
  const dy = (y - cy) / ry;
  return dx * dx + dy * dy <= 1;
}
