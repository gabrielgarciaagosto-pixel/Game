/** Gabriel's locked pew, used as the nave sprite. */
export const PEW_SPRITE = '/chapel/pew-gabriel.png';

/** Pixel size of public/chapel/pew-gabriel.png. */
const PEW_PIXELS = { w: 1400, h: 790 };

/** Chapel floor box is aspect-[11/17] (width / height). */
const FLOOR_ASPECT = 11 / 17;

export function pewHeight(widthFrac: number): number {
  return (widthFrac / (PEW_PIXELS.w / PEW_PIXELS.h)) * FLOOR_ASPECT;
}

export interface PewPlace {
  id: string;
  side: 'left' | 'right';
  row: 'far' | 'mid' | 'near';
  /** Left edge, fraction of the floor. */
  x: number;
  /** Top edge, fraction of the floor. */
  y: number;
  /** Width, fraction of the floor. */
  w: number;
}

/**
 * Three rows each side of the center aisle.
 * Farther rows are smaller, higher, and the aisle narrows toward the bier.
 * Render far → near so the closer pew overlaps the one behind it.
 */
const ROWS: { row: PewPlace['row']; w: number; y: number; gap: number }[] = [
  { row: 'far', w: 0.3, y: 0.72, gap: 0.048 },
  { row: 'mid', w: 0.332, y: 0.802, gap: 0.064 },
  { row: 'near', w: 0.362, y: 0.846, gap: 0.08 },
];

export const PEW_PLACES: PewPlace[] = ROWS.flatMap((row) => [
  {
    id: `${row.row}-l`,
    side: 'left',
    row: row.row,
    x: 0.5 - row.gap - row.w,
    y: row.y,
    w: row.w,
  },
  {
    id: `${row.row}-r`,
    side: 'right',
    row: row.row,
    x: 0.5 + row.gap,
    y: row.y,
    w: row.w,
  },
]);

/** Floor-height fraction where a seated head clears the cap rail. */
export function pewHeadY(place: PewPlace): number {
  return place.y + pewHeight(place.w) * 0.16;
}
