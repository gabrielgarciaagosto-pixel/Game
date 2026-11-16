import type { HouseTierLetter } from './rankProgression';

/** Shelf is thin below this many units, urns and caskets counted apart. */
export const THIN_SELECTION_MIN = 4;

/** Points taken off the house rating for each thin shelf. */
export const THIN_SELECTION_PENALTY = 2;

/** Meeting a required preference, or missing it. Small on purpose. */
export const REQUIRED_PREF_DELTA = 2;

/**
 * Units on the shelf, plus the vessel already reserved for this case.
 * Reserving pulls one out of the count; it still belongs to the selection
 * the family was shown.
 */
export function inventoryUnits(
  inv: Record<string, number> | undefined,
  stagedId: string | null
): number {
  let total = 0;
  if (inv) {
    for (const count of Object.values(inv)) {
      if (typeof count === 'number' && count > 0) total += count;
    }
  }
  if (stagedId) total += 1;
  return total;
}

/** House letter ladder, high band first. Same letters as the career titles. */
const BANDS: ReadonlyArray<{ letter: HouseTierLetter; min: number }> = [
  { letter: 'S+', min: 93 },
  { letter: 'S', min: 85 },
  { letter: 'A', min: 75 },
  { letter: 'B', min: 63 },
  { letter: 'C', min: 50 },
  { letter: 'D', min: 35 },
  { letter: 'E', min: 20 },
  { letter: 'F', min: 0 },
];

export function ratingTier(score: number): HouseTierLetter {
  const n = Math.max(0, Math.min(100, Math.round(score)));
  for (const band of BANDS) {
    if (n >= band.min) return band.letter;
  }
  return 'F';
}

export function clampRating(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}
