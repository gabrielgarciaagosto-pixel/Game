/**
 * Which headlines are on the hub wire, and what they do.
 *
 * One price or volume effect at a time. It lasts the headline's one or two
 * in-game days, then waits half a day before another can start.
 * Miscellaneous lines fill the rest of the crawl and turn over faster.
 * A celebrity case can sit beside that, and only one of those at a time.
 * An in-game day is one real day.
 */
import { PROPERTY_LISTINGS } from '../data/bankProducts';
import { FAMILY_MINUTE_MS } from '../data/familyUrnTiming';
import { DAY_MS } from '../data/pacing';
import {
  headlineById,
  renderHeadline,
  NEWS_HEADLINES,
  type MarketGood,
  type NewsCategory,
  type NewsHeadline,
} from '../data/newsHeadlines';

export const NEWS_DAY_MS = DAY_MS;

/** Extra on the fee when a headline case is handled with care. Total about 2.35×. */
export const HEADLINE_CAREFUL_EXTRA = 1.35;
/** Taken off the fee when a headline case is handled poorly. */
export const HEADLINE_SLOPPY_CUT = 0.2;

export interface NewsWireItem {
  headlineId: string;
  startedAt: number;
  endsAt: number;
  /** Volume, market, or a celebrity file. Flavor lines are false. */
  live: boolean;
  homeId?: string;
  homeLabel?: string;
  caseId?: string;
}

export interface NewsTickInput {
  wire: readonly NewsWireItem[];
  nextLiveAt: number;
  celebGate: number;
  recent: readonly string[];
  now: number;
  ownedListingId: string;
  openCaseIds: ReadonlySet<string>;
  coolerFull: boolean;
  /** A headline case is already in the house, even if the wire lost the line. */
  headlineCaseOpen?: boolean;
  rng?: () => number;
}

export interface NewsTickResult {
  wire: NewsWireItem[];
  nextLiveAt: number;
  celebGate: number;
  recent: string[];
  spawn: NewsHeadline | null;
  changed: boolean;
  /** Volume, market, or case-spawn lines that just landed. Misc is never listed. */
  landedEffects: string[];
}

/** How long a miscellaneous line stays on the crawl. Four family hours. */
export const MISC_HOLD_MS = 4 * 60 * FAMILY_MINUTE_MS;
/**
 * After a price or volume line ends, the next one waits this long.
 * A one-day effect plus this gap cannot start twice in one in-game day.
 */
export const EFFECT_COOLDOWN_MS = Math.round(NEWS_DAY_MS * 0.5);
const MISC_SLOTS = 4;
/** Celebrity case lines are rolled once per in-game day, and miss more often than they hit. */
const CELEB_ROLL = 0.35;

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function homeForHeadline(
  headlineId: string,
  ownedListingId: string
): { id: string; label: string } | null {
  const open = PROPERTY_LISTINGS.filter((p) => p.id !== ownedListingId);
  if (open.length === 0) return null;
  const pick = open[hashId(headlineId) % open.length]!;
  return { id: pick.id, label: pick.label };
}

function category(id: string): NewsCategory | null {
  return headlineById(id)?.category ?? null;
}

function itemStillLive(item: NewsWireItem, now: number, open: ReadonlySet<string>, owned: string): boolean {
  const cat = category(item.headlineId);
  if (!cat) return false;
  if (cat === 'RIVAL' && item.homeId && item.homeId === owned) return false;
  if (item.live && cat === 'CELEBRITY' && item.caseId) {
    return open.has(item.caseId);
  }
  return item.endsAt > now;
}

function blockedIds(wire: readonly NewsWireItem[], recent: readonly string[]): Set<string> {
  const ids = new Set<string>(recent);
  for (const item of wire) ids.add(item.headlineId);
  return ids;
}

function pick(
  cat: NewsCategory,
  blocked: Set<string>,
  rng: () => number
): NewsHeadline | null {
  const pool = NEWS_HEADLINES.filter((h) => h.category === cat && !blocked.has(h.id));
  if (pool.length === 0) return null;
  return pool[Math.floor(rng() * pool.length)] ?? null;
}

function makeItem(
  h: NewsHeadline,
  now: number,
  owned: string,
  live: boolean,
  holdMs?: number
): NewsWireItem {
  const home = h.category === 'RIVAL' ? homeForHeadline(h.id, owned) : null;
  return {
    headlineId: h.id,
    startedAt: now,
    endsAt: now + (holdMs ?? h.days * NEWS_DAY_MS),
    live,
    ...(home ? { homeId: home.id, homeLabel: home.label } : {}),
  };
}

function isEconomicId(id: string): boolean {
  const cat = category(id);
  return cat === 'VOLUME' || cat === 'MARKET';
}

function isSpawnHeadline(h: NewsHeadline | null | undefined): boolean {
  return !!h && h.category === 'CELEBRITY' && h.spawnsCase === true;
}

function isSpawnItem(item: NewsWireItem): boolean {
  return item.live && isSpawnHeadline(headlineById(item.headlineId));
}

/** A celebrity file is on the wire and still has no body in the house. */
export function waitingSpawn(
  wire: readonly NewsWireItem[]
): { item: NewsWireItem; headline: NewsHeadline } | null {
  const item = wire.find((row) => isSpawnItem(row) && !row.caseId);
  if (!item) return null;
  const headline = headlineById(item.headlineId);
  if (!headline) return null;
  return { item, headline };
}

function miscCount(wire: readonly NewsWireItem[]): number {
  return wire.filter((item) => !isEconomicId(item.headlineId) && !isSpawnItem(item)).length;
}

function pickFrom(pool: readonly NewsHeadline[], rng: () => number): NewsHeadline | null {
  if (pool.length === 0) return null;
  return pool[Math.floor(rng() * pool.length)] ?? null;
}

function pickMisc(blocked: Set<string>, rng: () => number, owned: string): NewsHeadline | null {
  const pool = NEWS_HEADLINES.filter((h) => {
    if (h.group !== 'MISCELLANEOUS' || blocked.has(h.id)) return false;
    if (h.category === 'RIVAL' && !homeForHeadline(h.id, owned)) return false;
    return true;
  });
  return pickFrom(pool, rng);
}

function pickSpawn(blocked: Set<string>, rng: () => number): NewsHeadline | null {
  const pool = NEWS_HEADLINES.filter((h) => isSpawnHeadline(h) && !blocked.has(h.id));
  return pickFrom(pool, rng);
}

function settleWire(wire: readonly NewsWireItem[]): NewsWireItem[] {
  const economic = wire.filter((item) => item.live && isEconomicId(item.headlineId)).slice(-1);
  const spawn = wire.filter((item) => isSpawnItem(item)).slice(-1);
  const misc = wire.filter((item) => !isEconomicId(item.headlineId) && !isSpawnItem(item));
  return [...economic, ...spawn, ...misc.slice(-MISC_SLOTS)];
}

function remember(recent: string[], id: string): string[] {
  const next = recent.filter((x) => x !== id);
  next.push(id);
  return next.slice(-24);
}

export function advanceNewsWire(input: NewsTickInput): NewsTickResult {
  const rng = input.rng ?? Math.random;
  const recent = [...input.recent];
  let nextLiveAt = input.nextLiveAt;
  let celebGate = input.celebGate;
  let spawn: NewsHeadline | null = null;
  let changed = false;
  const landedEffects: string[] = [];

  const wire: NewsWireItem[] = [];
  for (const item of input.wire) {
    if (itemStillLive(item, input.now, input.openCaseIds, input.ownedListingId)) {
      wire.push({ ...item });
    } else {
      recent.splice(0, recent.length, ...remember(recent, item.headlineId));
      changed = true;
    }
  }

  if (celebGate === 0) {
    // First look at the celebrity wire after a short stretch, not at the opening bell.
    celebGate = input.now + 15 * FAMILY_MINUTE_MS;
    changed = true;
  }

  const economicLive = wire.some((item) => item.live && isEconomicId(item.headlineId));
  if (!economicLive && input.now >= nextLiveAt) {
    const prefer: NewsCategory =
      Math.floor(input.now / NEWS_DAY_MS) % 2 === 0 ? 'MARKET' : 'VOLUME';
    const other: NewsCategory = prefer === 'MARKET' ? 'VOLUME' : 'MARKET';
    const blocked = blockedIds(wire, recent);
    const h = pick(prefer, blocked, rng) ?? pick(other, blocked, rng);
    if (h) {
      const item = makeItem(h, input.now, input.ownedListingId, true);
      wire.push(item);
      landedEffects.push(h.id);
      nextLiveAt = item.endsAt + EFFECT_COOLDOWN_MS;
      changed = true;
    }
  }

  const spawnBusy = wire.some(isSpawnItem) || input.headlineCaseOpen === true;
  if (!spawnBusy && input.now >= celebGate && !input.coolerFull) {
    celebGate = input.now + NEWS_DAY_MS;
    changed = true;
    if (rng() < CELEB_ROLL) {
      const blocked = blockedIds(wire, recent);
      const h = pickSpawn(blocked, rng);
      if (h) {
        wire.push(makeItem(h, input.now, input.ownedListingId, true));
        spawn = h;
        landedEffects.push(h.id);
      }
    }
  }

  let guard = 0;
  while (miscCount(wire) < MISC_SLOTS && guard < 12) {
    guard += 1;
    const blocked = blockedIds(wire, recent);
    const h = pickMisc(blocked, rng, input.ownedListingId);
    if (!h) break;
    const hold = MISC_HOLD_MS - (guard - 1) * 60 * FAMILY_MINUTE_MS;
    const item = makeItem(h, input.now, input.ownedListingId, false, hold);
    if (h.category === 'RIVAL' && !item.homeId) break;
    wire.push(item);
    changed = true;
  }

  const settled = settleWire(wire);
  if (settled.length !== wire.length) changed = true;
  if (spawn && !settled.some((item) => item.live && item.headlineId === spawn!.id)) {
    spawn = null;
  }
  const kept = new Set(settled.map((item) => item.headlineId));

  return {
    wire: settled,
    nextLiveAt,
    celebGate,
    recent,
    spawn,
    changed,
    landedEffects: landedEffects.filter((id) => kept.has(id)),
  };
}

/**
 * The crawl lands on miscellaneous lines more often than on a price or volume line.
 * `roll` is 0–1. Below 0.7, an effect landing skips ahead to the next misc line.
 */
export function preferMiscIndex(
  lines: readonly { misc: boolean }[],
  index: number,
  roll: number
): number {
  const count = lines.length;
  if (count === 0) return 0;
  let i = ((index % count) + count) % count;
  i = (i + 1) % count;
  if (!lines.some((line) => line.misc)) return i;
  if (lines[i]?.misc) return i;
  if (roll >= 0.7) return i;
  for (let step = 0; step < count; step += 1) {
    i = (i + 1) % count;
    if (lines[i]?.misc) return i;
  }
  return i;
}

export function quotedPrice(
  base: number,
  good: MarketGood,
  wire: readonly NewsWireItem[],
  now: number
): number {
  for (const item of wire) {
    if (!item.live || item.endsAt <= now) continue;
    const h = headlineById(item.headlineId);
    if (!h || h.category !== 'MARKET' || h.good !== good || h.price == null) continue;
    return Math.max(1, Math.round(base * h.price));
  }
  return base;
}

export function intakeNewsFactor(wire: readonly NewsWireItem[], now: number): number {
  for (const item of wire) {
    if (!item.live || item.endsAt <= now) continue;
    const h = headlineById(item.headlineId);
    if (!h || h.category !== 'VOLUME' || h.flow == null) continue;
    return Math.max(0.75, Math.min(1.3, h.flow));
  }
  return 1;
}

export interface MarketBanner {
  dir: 'up' | 'down';
  pct: number;
  good: MarketGood;
  goodLabel: string;
  text: string;
}

const GOOD_LABEL: Record<MarketGood, string> = {
  URNS: 'Urns',
  CASKETS: 'Caskets',
  FUEL: 'Fuel',
  FLOWERS: 'Flowers',
  EMBALMING: 'Embalming supplies',
};

export function activeMarket(
  wire: readonly NewsWireItem[],
  now: number
): MarketBanner | null {
  for (const item of wire) {
    if (!item.live || item.endsAt <= now) continue;
    const h = headlineById(item.headlineId);
    if (!h || h.category !== 'MARKET' || h.good == null || h.price == null) continue;
    const pct = Math.round(Math.abs(h.price - 1) * 100);
    return {
      dir: h.price >= 1 ? 'up' : 'down',
      pct,
      good: h.good,
      goodLabel: GOOD_LABEL[h.good],
      text: h.text,
    };
  }
  return null;
}

export type NewsTrend = 'up' | 'down' | 'none';

export function trendFor(id: string): NewsTrend {
  const h = headlineById(id);
  if (!h) return 'none';
  if (h.category === 'VOLUME' && h.flow != null) return h.flow >= 1 ? 'up' : 'down';
  if (h.category === 'MARKET' && h.price != null) return h.price >= 1 ? 'up' : 'down';
  return 'none';
}

export function wireLine(item: NewsWireItem): string {
  const h = headlineById(item.headlineId);
  if (!h) return '';
  return renderHeadline(h.text, item.homeLabel);
}

export function headlineFeeDelta(input: {
  baseFee: number;
  failed: boolean;
  tagged: boolean;
  nameExpired: boolean;
  decay: number;
  embalmed: boolean;
  chapelTotal: number;
  needsEmbalm: boolean;
}): number {
  if (input.failed || input.baseFee <= 0) return 0;
  const careful =
    input.tagged &&
    !input.nameExpired &&
    input.decay < 20 &&
    input.chapelTotal >= 40 &&
    (!input.needsEmbalm || input.embalmed);
  const sloppy = input.nameExpired || input.decay >= 40 || input.chapelTotal < 15;
  if (careful) return Math.round(input.baseFee * HEADLINE_CAREFUL_EXTRA);
  if (sloppy) return -Math.round(input.baseFee * HEADLINE_SLOPPY_CUT);
  return 0;
}
