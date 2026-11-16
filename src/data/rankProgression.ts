/**
 * House rank. A title ladder, not a skill tree.
 * Letter tiers run F through S, and S+ is the Mortuary tier.
 * The last title is Master of the Mortuary.
 */

export type HouseTierLetter = 'F' | 'E' | 'D' | 'C' | 'B' | 'A' | 'S' | 'S+';

export interface HouseTitle {
  index: number;
  title: string;
  tier: HouseTierLetter;
  /** Spoken name of the letter band. S+ is Mortuary. */
  tierName: string;
}

const BANDS: ReadonlyArray<{
  tier: HouseTierLetter;
  tierName: string;
  titles: readonly string[];
}> = [
  {
    tier: 'F',
    tierName: 'Floor',
    titles: [
      'Porter',
      'Cooler Clerk',
      'Night Orderly',
      'Tag Writer',
      'First-Call Runner',
    ],
  },
  {
    tier: 'E',
    tierName: 'Entry',
    titles: [
      'Removal Driver',
      'Dressing Room Hand',
      'Chapel Usher',
      'Arrangement Aide',
      'Embalming Student',
    ],
  },
  {
    tier: 'D',
    tierName: 'Duty',
    titles: [
      'Licensed Embalmer',
      'Night Embalmer',
      'Crematory Operator',
      'Visitation Lead',
      'Arrangement Director',
    ],
  },
  {
    tier: 'C',
    tierName: 'Counsel',
    titles: [
      'Funeral Director',
      'Family Counselor',
      'Service Director',
      'House Director',
      'Columbarium Keeper',
    ],
  },
  {
    tier: 'B',
    tierName: 'Bearing',
    titles: [
      'Senior Director',
      'Pre-need Counselor',
      'Cortege Captain',
      'Chapel Master',
      'Estate Director',
    ],
  },
  {
    tier: 'A',
    tierName: 'Arrangement',
    titles: [
      'Managing Director',
      'Chief Embalmer',
      'Ossuary Warden',
      'Regional Director',
      'House Principal',
    ],
  },
  {
    tier: 'S',
    tierName: 'Steward',
    titles: [
      'Proprietor',
      'Mortuary Proprietor',
      'County Director',
      'Master Director',
      'Warden of the Rolls',
    ],
  },
  {
    tier: 'S+',
    tierName: 'Mortuary',
    titles: [
      'Fellow of the House',
      'Keeper of Names',
      'Ossuary Sovereign',
      'Mortuary Laureate',
      'Master of the Mortuary',
    ],
  },
];

export const HOUSE_TITLES: readonly HouseTitle[] = BANDS.flatMap((band) =>
  band.titles.map((title) => ({
    index: 0,
    title,
    tier: band.tier,
    tierName: band.tierName,
  }))
).map((row, index) => ({ ...row, index }));

export const HOUSE_TITLE_COUNT = HOUSE_TITLES.length;

/** Cumulative XP required to hold this index. Rank 0 is free. */
export function xpToReach(index: number): number {
  if (index <= 0) return 0;
  return Math.round(55 * index + 14 * index * index);
}

export function titleAt(index: number): HouseTitle {
  const clamped = Math.max(0, Math.min(HOUSE_TITLES.length - 1, index));
  return HOUSE_TITLES[clamped] ?? HOUSE_TITLES[0];
}

export function titleAtXp(xp: number): HouseTitle {
  const safe = Math.max(0, Math.floor(xp));
  let found = HOUSE_TITLES[0];
  for (const title of HOUSE_TITLES) {
    if (xpToReach(title.index) <= safe) found = title;
    else break;
  }
  return found;
}

export interface TitleProgress {
  current: HouseTitle;
  next: HouseTitle | null;
  /** XP earned inside the current title. */
  into: number;
  /** XP required to leave the current title. */
  span: number;
  pct: number;
}

export function titleProgress(xp: number): TitleProgress {
  const safe = Math.max(0, Math.floor(xp));
  const current = titleAtXp(safe);
  const next = HOUSE_TITLES[current.index + 1] ?? null;
  const floor = xpToReach(current.index);
  const ceil = next ? xpToReach(next.index) : floor;
  const span = Math.max(1, ceil - floor);
  const into = next ? Math.min(span, safe - floor) : span;
  const pct = next ? Math.round((into / span) * 100) : 100;
  return { current, next, into, span, pct };
}

/** A case file closed, even when the service went badly. */
export const XP_CASE_CLOSED = 24;
/** The family was served without a compliance fine. */
export const XP_SERVICE_WELL = 80;
/** Held inside the grace window. The courtesy fine keeps the full bonus back. */
export const XP_SERVICE_GRACE = 36;
/** Ashes poured and the urn closed. */
export const XP_URN_SEALED = 28;
/** A sealed urn left with the service. */
export const XP_URN_SOLD = 22;
/** A house beyond the starter parlor. */
export const XP_NEW_HOME = 160;

/**
 * Reputation marks that pay XP once, on the way up.
 * The parlor begins at 100, so the first mark sits above that.
 */
export const REP_MILESTONES = [120, 160, 220, 280, 360, 460, 580] as const;
export const XP_REP_MILESTONE = 50;

export function serviceCareerXp(input: {
  failed: boolean;
  grace: boolean;
  urnSold: boolean;
}): number {
  let xp = XP_CASE_CLOSED;
  if (!input.failed) xp += input.grace ? XP_SERVICE_GRACE : XP_SERVICE_WELL;
  if (input.urnSold) xp += XP_URN_SOLD;
  return xp;
}

export function claimRepMilestones(
  reputation: number,
  claimed: readonly number[]
): { claimed: number[]; xp: number } {
  const have = new Set(claimed);
  const next = [...claimed];
  let xp = 0;
  for (const mark of REP_MILESTONES) {
    if (reputation < mark || have.has(mark)) continue;
    next.push(mark);
    xp += XP_REP_MILESTONE;
  }
  return { claimed: next, xp };
}

export interface RankFanfare {
  fromIndex: number;
  toIndex: number;
}

export function grantCareer(input: {
  careerXp: number;
  homesKept: number;
  repMilestonesClaimed: readonly number[];
  reputation: number;
  gain: number;
  homesDelta?: number;
  fanfare: RankFanfare | null;
}): {
  careerXp: number;
  homesKept: number;
  repMilestonesClaimed: number[];
  rankFanfare: RankFanfare | null;
} {
  const homesKept = input.homesKept + (input.homesDelta ?? 0);
  const rep = claimRepMilestones(input.reputation, input.repMilestonesClaimed);
  const before = titleAtXp(input.careerXp);
  const careerXp = Math.max(0, Math.floor(input.careerXp + input.gain + rep.xp));
  const after = titleAtXp(careerXp);
  let fanfare = input.fanfare;
  if (after.index > before.index) {
    fanfare = {
      fromIndex:
        fanfare && fanfare.toIndex >= before.index
          ? fanfare.fromIndex
          : before.index,
      toIndex: after.index,
    };
  }
  return {
    careerXp,
    homesKept,
    repMilestonesClaimed: rep.claimed,
    rankFanfare: fanfare,
  };
}
