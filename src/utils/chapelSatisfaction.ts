/**
 * Chapel flower / décor satisfaction scoring.
 *
 * Total = clamp(0..100,
 *   countScore
 * + symmetryScore
 * + proximityScore
 * + varietyScore
 * + preferenceScore
 * + freshnessScore
 * + decorBonus
 * − clutterPenalty
 * )
 *
 * Each term is documented below; live UI shows the breakdown.
 */

import type { FlowerKind } from '../data/chapelDecor';
import {
  ownedDecorBonus,
  type ChapelLayoutPiece,
  type ChapelThemeSelection,
} from '../data/chapelDecor';

export interface ChapelScoreBreakdown {
  count: number;
  symmetry: number;
  proximity: number;
  variety: number;
  preference: number;
  freshness: number;
  decor: number;
  /** Prestige of the offered urn on the stand (memorial services) */
  urnVessel: number;
  clutter: number;
  total: number;
}

const FLOWER_KINDS: FlowerKind[] = ['LILIES', 'ROSES', 'WREATH'];

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy);
}

/**
 * @param pieces          Current chapel layout pieces
 * @param preferred       Family preferred floral type
 * @param ownedDecorIds   Permanent Emporium décor owned
 * @param theme           Themes selected for this service (owned pieces only)
 * @param decayLevel      Case decay 0–100 — freshness proxy
 * @param flowerAgeMinutes Avg minutes since each spray was placed (0 = fresh)
 * @param urnPrestige      Catalog prestigeBonus of the urn on the stand (0 if none)
 */
export function scoreChapelArrangement(opts: {
  pieces: ChapelLayoutPiece[];
  preferred: FlowerKind;
  ownedDecorIds: string[];
  theme: ChapelThemeSelection;
  decayLevel: number;
  flowerAgeMinutes?: number;
  urnPrestige?: number;
}): ChapelScoreBreakdown {
  const { pieces, preferred, ownedDecorIds, theme, decayLevel } = opts;
  const flowerAgeMinutes = opts.flowerAgeMinutes ?? 0;
  const urnPrestige = opts.urnPrestige ?? 0;

  // Focal is bier or urn stand — proximity / symmetry revolve around it
  const focal =
    pieces.find((p) => p.kind === 'URN' || p.kind === 'COFFIN') ?? {
      x: 0.5,
      y: 0.42,
    };
  const flowers = pieces.filter((p) =>
    FLOWER_KINDS.includes(p.kind as FlowerKind)
  );
  const n = flowers.length;

  // --- Count with diminishing returns (cap ~22 pts at 6+ stands) ---
  // score = 8 * (1 + 0.7 + 0.7^2 + …) for each flower
  let count = 0;
  let weight = 8;
  for (let i = 0; i < n; i++) {
    count += weight;
    weight *= 0.7;
  }
  count = clamp(count, 0, 22);

  // --- Symmetry / balance around the bier (max 18) ---
  // Mirror pairs across focal.x within 0.12 y and 0.08 x-tolerance
  let symmetry = 0;
  if (n >= 2) {
    const left = flowers.filter((f) => f.x < focal.x - 0.02);
    const right = flowers.filter((f) => f.x > focal.x + 0.02);
    const pairs = Math.min(left.length, right.length);
    const balanceRatio =
      Math.min(left.length, right.length) /
      Math.max(1, Math.max(left.length, right.length));
    symmetry = clamp(pairs * 6 * balanceRatio, 0, 18);
  }

  // --- Proximity to bier — sweet spot ring 0.12–0.32 (max 16) ---
  let proximity = 0;
  if (n > 0) {
    const scores = flowers.map((f) => {
      const d = dist(f, focal);
      if (d < 0.06) return 2; // too close / on top
      if (d <= 0.32) return 16 * (1 - Math.abs(d - 0.2) / 0.2);
      return clamp(8 - (d - 0.32) * 20, 0, 8);
    });
    proximity = clamp(
      scores.reduce((a, b) => a + b, 0) / n,
      0,
      16
    );
  }

  // --- Variety / color harmony (max 12) ---
  const kindsUsed = new Set(flowers.map((f) => f.kind));
  const variety =
    n === 0
      ? 0
      : kindsUsed.size === 1
        ? 6
        : kindsUsed.size === 2
          ? 10
          : 12;

  // --- Match family preferred florals (max 14) ---
  const preferredCount = flowers.filter((f) => f.kind === preferred).length;
  const preference =
    n === 0
      ? 0
      : preferredCount === 0
        ? 0
        : clamp(6 + preferredCount * 4, 0, 14);

  // --- Freshness from case decay + how long sprays sat (max 10) ---
  const decayFresh = clamp(10 - decayLevel / 10, 0, 10);
  const ageFresh = clamp(10 - flowerAgeMinutes / 12, 0, 10);
  const freshness = clamp((decayFresh + ageFresh) / 2, 0, 10);

  // --- Permanent décor bonus (owned) + small bonus for themes in use ---
  const ownedBonus = ownedDecorBonus(ownedDecorIds);
  const themeIds = [
    theme.wallId,
    theme.floorId,
    theme.draperyId,
    theme.lightingId,
    theme.pewsId,
    theme.urnPedestalId,
    ...theme.ornamentIds,
  ].filter(Boolean) as string[];
  // Using owned décor in the active theme: +0.35 of that piece's bonus again
  // (rewards actually dressing the room, not just owning stock)
  let activeThemeExtra = 0;
  for (const id of themeIds) {
    if (!ownedDecorIds.includes(id)) continue;
    // Look up via ownedDecorBonus difference — approximate 0.35 * piece bonus
    // by reusing catalog through ownedDecorBonus on single id
    activeThemeExtra += ownedDecorBonus([id]) * 0.35;
  }
  const decor = clamp(ownedBonus * 0.45 + activeThemeExtra, 0, 28);

  // --- Vessel on the stand: rarer / prettier urns add a small presentation bonus ---
  const urnVessel = clamp(urnPrestige * 0.4, 0, 12);

  // --- Clutter: pairwise too-close flowers + overcrowding (penalty) ---
  let clutter = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const d = dist(flowers[i], flowers[j]);
      if (d < 0.08) clutter += 4;
      else if (d < 0.12) clutter += 2;
    }
  }
  if (n > 8) clutter += (n - 8) * 3;
  clutter = clamp(clutter, 0, 24);

  const raw =
    count +
    symmetry +
    proximity +
    variety +
    preference +
    freshness +
    decor +
    urnVessel -
    clutter;
  const total = Math.round(clamp(raw, 0, 100));

  return {
    count: Math.round(count * 10) / 10,
    symmetry: Math.round(symmetry * 10) / 10,
    proximity: Math.round(proximity * 10) / 10,
    variety: Math.round(variety * 10) / 10,
    preference: Math.round(preference * 10) / 10,
    freshness: Math.round(freshness * 10) / 10,
    decor: Math.round(decor * 10) / 10,
    urnVessel: Math.round(urnVessel * 10) / 10,
    clutter: Math.round(clutter * 10) / 10,
    total,
  };
}

/** Map satisfaction total → payout % boost and tip cash. */
export function satisfactionToRewards(total: number): {
  payoutBoostPct: number;
  tipCash: number;
  reputationDelta: number;
} {
  return {
    payoutBoostPct: Math.round(total * 0.35),
    tipCash: Math.round(total * 2.2),
    reputationDelta: Math.floor(total / 20),
  };
}
