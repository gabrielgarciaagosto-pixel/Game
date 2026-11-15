/**
 * Which headlines are on the hub wire, and what they do.
 *
 * One economic effect at a time: either a volume shift or a price shift.
 * A celebrity file can sit beside that, and only one of those at a time.
 * Rival lines fill the crawl and do not change the game.
 * An in-game day is 24 family hours.
 */
import { PROPERTY_LISTINGS } from '../data/bankProducts';
import { FAMILY_MINUTE_MS } from '../data/familyUrnTiming';
import {
  headlineById,
  renderHeadline,
  NEWS_HEADLINES,
  type MarketGood,
  type NewsCategory,
  type NewsHeadline,
} from '../data/newsHeadlines';

export const NEWS_DAY_MS = 24 * 60 * FAMILY_MINUTE_MS;

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
  rng?: () => number;
}

export interface NewsTickResult {
  wire: NewsWireItem[];
  nextLiveAt: number;
  celebGate: number;
  recent: string[];
  spawn: NewsHeadline | null;
  changed: boolean;
}

const GAP = Math.round(NEWS_DAY_MS * 0.25);

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
  live: boolean
): NewsWireItem {
  const home = h.category === 'RIVAL' ? homeForHeadline(h.id, owned) : null;
  return {
    headlineId: h.id,
    startedAt: now,
    endsAt: now + h.days * NEWS_DAY_MS,
    live,
    ...(home ? { homeId: home.id, homeLabel: home.label } : {}),
  };
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

  const liveCat = (cat: NewsCategory) =>
    wire.some((item) => item.live && category(item.headlineId) === cat);

  const economic = liveCat('VOLUME') || liveCat('MARKET');
  if (!economic && input.now >= nextLiveAt) {
    const prefer: NewsCategory =
      Math.floor(input.now / NEWS_DAY_MS) % 2 === 0 ? 'MARKET' : 'VOLUME';
    const other: NewsCategory = prefer === 'MARKET' ? 'VOLUME' : 'MARKET';
    const blocked = blockedIds(wire, recent);
    const h = pick(prefer, blocked, rng) ?? pick(other, blocked, rng);
    if (h) {
      const item = makeItem(h, input.now, input.ownedListingId, true);
      wire.push(item);
      nextLiveAt = item.endsAt + GAP;
      changed = true;
    }
  }

  if (!liveCat('CELEBRITY') && input.now >= celebGate) {
    celebGate = input.now + Math.round(NEWS_DAY_MS * 0.5);
    changed = true;
    if (rng() < 0.7) {
      const blocked = blockedIds(wire, recent);
      const h = pick('CELEBRITY', blocked, rng);
      if (h) {
        const canSpawn = !!h.spawnsCase && !input.coolerFull;
        const item = makeItem(h, input.now, input.ownedListingId, canSpawn);
        if (canSpawn) spawn = h;
        const rivalAt = wire.findIndex(
          (row) => !row.live && category(row.headlineId) === 'RIVAL'
        );
        if (wire.length >= 4 && rivalAt >= 0) wire.splice(rivalAt, 1);
        wire.push(item);
      }
    }
  }

  while (wire.length < 3) {
    const blocked = blockedIds(wire, recent);
    const h = pick('RIVAL', blocked, rng);
    if (!h) break;
    const item = makeItem(h, input.now, input.ownedListingId, false);
    if (!item.homeId) break;
    wire.push(item);
    changed = true;
  }

  const capped = wire.slice(0, 4);
  if (capped.length !== wire.length) changed = true;

  return {
    wire: capped,
    nextLiveAt,
    celebGate,
    recent,
    spawn,
    changed,
  };
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
