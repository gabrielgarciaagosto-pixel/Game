/**
 * Rare Emporium stock keyed to the same wall-clock hours as 24h scheduling.
 *
 * Tone rule (Gabriel):
 * - Lighter/brighter vessels (white marble, pale porcelain, gold, clear glass)
 *   appear in morning / daytime windows.
 * - Darker vessels (black granite, obsidian, dark bronze, ebony) appear late night.
 *
 * Each rare has its own [startHour, endHour) window (end exclusive, wraps past midnight).
 * Stock is available during the window and for a short grace period after.
 * Rotation state (which slot rolled this day-cycle) is persisted in the save.
 */

export type ItemRarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'LEGENDARY';
export type RareTone = 'LIGHT' | 'DARK';

/**
 * Each rare appears at `startHour` and stays buyable for ~2 in-game hours
 * (Gabriel). `endHour` should be startHour+2 (wrapping midnight). A short
 * grace lets a purchase finish if the player is mid-checkout.
 */
export const RARE_DURATION_HOURS = 2;
export const RARE_GRACE_MINUTES = 15;

export interface RareScheduleEntry {
  id: string;
  kind: 'urn' | 'casket';
  rarity: ItemRarity;
  tone: RareTone;
  /** Inclusive start hour 0–23 */
  startHour: number;
  /** Exclusive end hour 0–23 (may be < startHour if wrapping midnight) */
  endHour: number;
  /** Limited copies while the window is live */
  stock: number;
  hint: string;
}

/**
 * Light = morning/day, dark = late night. Windows are staggered so the floor
 * changes across a real day of play.
 */
function endHourAfter(start: number, hours = RARE_DURATION_HOURS): number {
  return (start + hours) % 24;
}

export const RARE_SCHEDULE: RareScheduleEntry[] = [
  // —— LIGHT / daytime (~2h each) ——
  {
    id: 'urn_porcelain_lotus',
    kind: 'urn',
    rarity: 'RARE',
    tone: 'LIGHT',
    startHour: 8,
    endHour: endHourAfter(8),
    stock: 1,
    hint: 'White porcelain — around 08:00 for ~2 hours.',
  },
  {
    id: 'urn_amber_glass',
    kind: 'urn',
    rarity: 'RARE',
    tone: 'LIGHT',
    startHour: 11,
    endHour: endHourAfter(11),
    stock: 1,
    hint: 'Clear/amber glass — midday ~11:00–13:00.',
  },
  {
    id: 'urn_rose_bronze_vase',
    kind: 'urn',
    rarity: 'LEGENDARY',
    tone: 'LIGHT',
    startHour: 14,
    endHour: endHourAfter(14),
    stock: 1,
    hint: 'Warm gold-rose bronze — afternoon ~14:00–16:00.',
  },
  {
    id: 'casket_mahogany_full',
    kind: 'casket',
    rarity: 'RARE',
    tone: 'LIGHT',
    startHour: 10,
    endHour: endHourAfter(10),
    stock: 1,
    hint: 'Polished warm woods — late morning ~10:00–12:00.',
  },
  {
    id: 'casket_copper_panel',
    kind: 'casket',
    rarity: 'RARE',
    tone: 'LIGHT',
    startHour: 15,
    endHour: endHourAfter(15),
    stock: 1,
    hint: 'Bright copper — mid-afternoon ~15:00–17:00.',
  },

  // —— DARK / late night (~2h each) ——
  {
    id: 'urn_nero_marquina',
    kind: 'urn',
    rarity: 'UNCOMMON',
    tone: 'DARK',
    startHour: 21,
    endHour: endHourAfter(21),
    stock: 2,
    hint: 'Black marble — evening ~21:00–23:00.',
  },
  {
    id: 'urn_smoke_glass_tear',
    kind: 'urn',
    rarity: 'RARE',
    tone: 'DARK',
    startHour: 22,
    endHour: endHourAfter(22),
    stock: 1,
    hint: 'Smoke glass — late night ~22:00–00:00.',
  },
  {
    id: 'urn_porcelain_night',
    kind: 'urn',
    rarity: 'LEGENDARY',
    tone: 'DARK',
    startHour: 23,
    endHour: endHourAfter(23),
    stock: 1,
    hint: 'Obsidian porcelain — midnight window ~23:00–01:00.',
  },
  {
    id: 'urn_verdigris_tear',
    kind: 'urn',
    rarity: 'RARE',
    tone: 'DARK',
    startHour: 1,
    endHour: endHourAfter(1),
    stock: 1,
    hint: 'Dark bronze / verdigris — ~01:00–03:00.',
  },
  {
    id: 'urn_gunmetal_tower',
    kind: 'urn',
    rarity: 'RARE',
    tone: 'DARK',
    startHour: 2,
    endHour: endHourAfter(2),
    stock: 1,
    hint: 'Gunmetal towers — ~02:00–04:00.',
  },
  {
    id: 'casket_walnut_dome',
    kind: 'casket',
    rarity: 'UNCOMMON',
    tone: 'DARK',
    startHour: 20,
    endHour: endHourAfter(20),
    stock: 2,
    hint: 'Ebony walnut — ~20:00–22:00.',
  },
  {
    id: 'casket_steel_gunmetal',
    kind: 'casket',
    rarity: 'RARE',
    tone: 'DARK',
    startHour: 22,
    endHour: endHourAfter(22),
    stock: 1,
    hint: 'Gunmetal steel — ~22:00–00:00.',
  },
  {
    id: 'casket_bronze_octagon',
    kind: 'casket',
    rarity: 'LEGENDARY',
    tone: 'DARK',
    startHour: 0,
    endHour: endHourAfter(0),
    stock: 1,
    hint: 'Dark cast bronze — ~00:00–02:00.',
  },
];

/** Always-on floor stock (not hour-gated). */
export const ALWAYS_URN_IDS = [
  'urn_carrara_classic',
  'urn_bronze_laurel',
  'urn_walnut_pillar',
  'urn_celadon_vase',
  'urn_brushed_steel',
  'urn_slate_temple',
  'urn_oak_cube',
  'urn_cherry_keepsake',
  'urn_sandstone_vase',
  'urn_cobalt_art_deco',
] as const;

export const ALWAYS_CASKET_IDS = [
  'casket_oak_half',
  'casket_cherry_panel',
  'casket_steel_silver',
  'casket_oak_octagon',
] as const;

export interface ShopRotationState {
  /**
   * Per rare id: remaining limited stock for the *current* open window key.
   * Key format `${id}@${windowKey}` where windowKey is the start datetime day+hour.
   */
  stockByWindow: Record<string, number>;
}

export function createShopRotation(): ShopRotationState {
  return { stockByWindow: {} };
}

/** Minutes since window start; null if outside window+grace. */
export function minutesIntoAvailability(
  entry: RareScheduleEntry,
  now = new Date()
): number | null {
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const startMins = entry.startHour * 60;
  let endMins = entry.endHour * 60;
  if (entry.endHour <= entry.startHour) endMins += 24 * 60;
  const graceEnd = endMins + RARE_GRACE_MINUTES;

  // Check today and today+24h so wrapping windows keep their post-midnight grace
  // (e.g. 22:00–00:00 still buyable at 00:10).
  for (const cursor of [nowMins, nowMins + 24 * 60]) {
    if (cursor >= startMins && cursor < graceEnd) {
      return cursor - startMins;
    }
  }
  return null;
}

export function isRareAvailableNow(
  entry: RareScheduleEntry,
  now = new Date()
): boolean {
  return minutesIntoAvailability(entry, now) != null;
}

/** Stable key for the window instance that contains `now` (or grace). */
export function windowKeyFor(entry: RareScheduleEntry, now = new Date()): string {
  const d = new Date(now);
  const hour = d.getHours();
  // Wrapping window past midnight (including grace) belongs to the prior calendar day
  if (
    entry.endHour <= entry.startHour &&
    isRareAvailableNow(entry, now) &&
    hour < entry.startHour
  ) {
    d.setDate(d.getDate() - 1);
  }
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${entry.id}@${y}-${m}-${day}-h${entry.startHour}`;
}

export function liveRares(now = new Date()): RareScheduleEntry[] {
  return RARE_SCHEDULE.filter((e) => isRareAvailableNow(e, now));
}

export function upcomingRares(
  now = new Date(),
  withinHours = 6
): Array<RareScheduleEntry & { hoursUntil: number }> {
  const hour = now.getHours();
  const out: Array<RareScheduleEntry & { hoursUntil: number }> = [];
  for (const e of RARE_SCHEDULE) {
    if (isRareAvailableNow(e, now)) continue;
    let delta = e.startHour - hour;
    if (delta <= 0) delta += 24;
    if (delta <= withinHours) out.push({ ...e, hoursUntil: delta });
  }
  return out.sort((a, b) => a.hoursUntil - b.hoursUntil);
}

export function getRemainingRareStock(
  state: ShopRotationState,
  entry: RareScheduleEntry,
  now = new Date()
): number {
  if (!isRareAvailableNow(entry, now)) return 0;
  const key = windowKeyFor(entry, now);
  if (state.stockByWindow[key] == null) return entry.stock;
  return state.stockByWindow[key];
}

/** Ensure window key exists with full stock when first seen. */
export function ensureWindowStock(
  state: ShopRotationState,
  entry: RareScheduleEntry,
  now = new Date()
): ShopRotationState {
  if (!isRareAvailableNow(entry, now)) return state;
  const key = windowKeyFor(entry, now);
  if (state.stockByWindow[key] != null) return state;
  return {
    stockByWindow: { ...state.stockByWindow, [key]: entry.stock },
  };
}

export function consumeRareStock(
  state: ShopRotationState,
  entry: RareScheduleEntry,
  now = new Date()
): ShopRotationState | null {
  const ensured = ensureWindowStock(state, entry, now);
  const key = windowKeyFor(entry, now);
  const left = ensured.stockByWindow[key] ?? 0;
  if (left <= 0) return null;
  return {
    stockByWindow: { ...ensured.stockByWindow, [key]: left - 1 },
  };
}

export function urnRarity(id: string): ItemRarity {
  return RARE_SCHEDULE.find((e) => e.kind === 'urn' && e.id === id)?.rarity ?? 'COMMON';
}

export function casketRarity(id: string): ItemRarity {
  return (
    RARE_SCHEDULE.find((e) => e.kind === 'casket' && e.id === id)?.rarity ??
    'COMMON'
  );
}

export function isHourGatedUrn(id: string): boolean {
  return RARE_SCHEDULE.some((e) => e.kind === 'urn' && e.id === id);
}

export function isHourGatedCasket(id: string): boolean {
  return RARE_SCHEDULE.some((e) => e.kind === 'casket' && e.id === id);
}

export function formatHourRange(entry: RareScheduleEntry): string {
  const a = String(entry.startHour).padStart(2, '0');
  const b = String(entry.endHour).padStart(2, '0');
  return `${a}:00–${b}:00`;
}
