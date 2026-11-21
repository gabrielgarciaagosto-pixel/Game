/**
 * Footprint of the Tutorial Spirit. It replaced the tutorial bell
 * and keeps the same drag math.
 */
export const TUTORIAL_SPIRIT_SIZE = 56;
export const TUTORIAL_BELL_SIZE = TUTORIAL_SPIRIT_SIZE;

export interface BellPoint {
  x: number;
  y: number;
}

export interface BellBounds {
  width: number;
  height: number;
  safeTop: number;
  safeLeft: number;
  safeRight: number;
  safeBottom: number;
}

export interface BellObstacle {
  x: number;
  y: number;
  w: number;
  h: number;
}

const GAP = 10;

/**
 * Left edge, under the hub chip row and the VR-441 back row, above DEV.
 * Right-edge snaps stay below station Back / Shut down and above FILES.
 * Live obstacles (passed by the overlay) push a snap off whatever is open.
 */
export function defaultTutorialBell(bounds: BellBounds): BellPoint {
  return snapTutorialBell(
    { x: bounds.safeLeft, y: bounds.safeTop + 168 },
    bounds,
    []
  );
}

/** Follow the finger, staying inside the play column. */
export function clampTutorialBell(raw: BellPoint, bounds: BellBounds): BellPoint {
  const size = TUTORIAL_SPIRIT_SIZE;
  const maxX = Math.max(bounds.safeLeft, bounds.width - bounds.safeRight - size);
  const maxY = Math.max(bounds.safeTop, bounds.height - bounds.safeBottom - size);
  return {
    x: Math.min(maxX, Math.max(bounds.safeLeft, raw.x)),
    y: Math.min(maxY, Math.max(bounds.safeTop, raw.y)),
  };
}

/**
 * Snap to the nearer side and into the band that clears back, close, and DEV.
 * Obstacles (the live DEV button) push the bell above or below them.
 */
export function snapTutorialBell(
  raw: BellPoint,
  bounds: BellBounds,
  obstacles: BellObstacle[]
): BellPoint {
  const size = TUTORIAL_SPIRIT_SIZE;
  const leftX = bounds.safeLeft;
  const rightX = Math.max(leftX, bounds.width - bounds.safeRight - size);
  const side: 'left' | 'right' =
    raw.x + size / 2 <= bounds.width / 2 ? 'left' : 'right';
  const x = side === 'left' ? leftX : rightX;

  const minY = bounds.safeTop + (side === 'left' ? 168 : 88);
  let maxY = bounds.height - (side === 'left' ? 168 : 156) - size;
  if (maxY < minY) maxY = minY;

  let y = Math.min(maxY, Math.max(minY, raw.y));
  for (let pass = 0; pass < 4; pass += 1) {
    const hit = obstacles.find((o) =>
      overlaps({ x, y, w: size, h: size }, o, GAP)
    );
    if (!hit) break;
    const below = hit.y + hit.h + GAP;
    const above = hit.y - GAP - size;
    if (below <= maxY) y = Math.max(minY, below);
    else if (above >= minY) y = Math.min(maxY, above);
    else break;
  }
  y = Math.min(maxY, Math.max(minY, y));
  return { x, y };
}

export function bellSide(pos: BellPoint, width: number): 'left' | 'right' {
  return pos.x + TUTORIAL_SPIRIT_SIZE / 2 <= width / 2 ? 'left' : 'right';
}

function overlaps(
  a: { x: number; y: number; w: number; h: number },
  b: BellObstacle,
  gap: number
): boolean {
  return (
    a.x < b.x + b.w + gap &&
    a.x + a.w + gap > b.x &&
    a.y < b.y + b.h + gap &&
    a.y + a.h + gap > b.y
  );
}
