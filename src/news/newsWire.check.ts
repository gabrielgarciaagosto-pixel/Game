/**
 * Locks the v0.9.36 wire, fuel memo, and decode-timeout behavior.
 * The app does not import this file. Bundle it and run it with node.
 */
import { fuelMemoDollars } from '../data/crematoryCatalog';
import {
  headlineById,
  headlineGroupCounts,
  NEWS_HEADLINES,
} from '../data/newsHeadlines';
import {
  EFFECT_COOLDOWN_MS,
  MISC_HOLD_MS,
  NEWS_DAY_MS,
  advanceNewsWire,
  intakeNewsFactor,
  preferMiscIndex,
  quotedPrice,
  type NewsTickResult,
  type NewsWireItem,
} from './newsWire';
import { audioManager, withDeadline } from '../utils/audioManager';

function check(cond: unknown, message: string): void {
  if (!cond) throw new Error(message);
}

function flavor(id: string, at: number): NewsWireItem {
  return {
    headlineId: id,
    startedAt: at,
    endsAt: at + NEWS_DAY_MS * 2,
    live: false,
  };
}

const base = {
  recent: [] as string[],
  ownedListingId: '',
  openCaseIds: new Set<string>(),
  coolerFull: false,
  headlineCaseOpen: false,
};

function counts(wire: readonly NewsWireItem[]) {
  let effect = 0;
  let misc = 0;
  let spawn = 0;
  for (const item of wire) {
    const headline = headlineById(item.headlineId);
    if (!headline) continue;
    if (headline.category === 'CELEBRITY' && headline.spawnsCase && item.live) spawn += 1;
    else if (headline.category === 'VOLUME' || headline.category === 'MARKET') effect += 1;
    else misc += 1;
  }
  return { effect, misc, spawn };
}

function effectItem(wire: readonly NewsWireItem[]): NewsWireItem | undefined {
  return wire.find((item) => {
    const headline = headlineById(item.headlineId);
    return item.live && (headline?.category === 'MARKET' || headline?.category === 'VOLUME');
  });
}

const now = 5_000_000;
const crowded = advanceNewsWire({
  ...base,
  wire: ['cel-02', 'cel-04', 'cel-06', 'cel-08'].map((id) => flavor(id, now)),
  nextLiveAt: 0,
  celebGate: now + NEWS_DAY_MS,
  now,
  rng: () => 0.99,
});
const crowdedCounts = counts(crowded.wire);
check(crowdedCounts.effect === 1, 'flavor lines must not push a price or volume line off');
check(crowded.spawn == null, 'a closed celebrity gate does not open a case');
check(crowded.wire.length > 4, 'misc lines stay beside the effect');
const effect = effectItem(crowded.wire);
if (!effect) throw new Error('effect line is on the wire');
const goods = ['URNS', 'CASKETS', 'FUEL', 'FLOWERS', 'EMBALMING'] as const;
const priceMoved = goods.some(
  (good) => quotedPrice(100, good, crowded.wire, now) !== quotedPrice(100, good, [], now)
);
check(priceMoved || intakeNewsFactor(crowded.wire, now) !== 1, 'the kept effect still changes price or volume');
check(crowded.landedEffects.length === 1, 'a new price or volume line lands once');
const landedHead = headlineById(crowded.landedEffects[0] ?? '');
check(
  landedHead?.group === 'EFFECT' &&
    (landedHead.category === 'VOLUME' || landedHead.category === 'MARKET'),
  'the landing is a price or volume effect'
);
const held = advanceNewsWire({
  ...base,
  wire: crowded.wire,
  nextLiveAt: crowded.nextLiveAt,
  celebGate: crowded.celebGate,
  recent: crowded.recent,
  now: now + 1000,
  rng: () => 0.01,
});
check(held.landedEffects.length === 0, 'an effect already on the wire does not land again');

const early = advanceNewsWire({
  ...base,
  wire: crowded.wire,
  nextLiveAt: crowded.nextLiveAt,
  celebGate: crowded.celebGate,
  recent: crowded.recent,
  now: effect.endsAt + 1,
  rng: () => 0.01,
});
check(counts(early.wire).effect === 0, 'cooldown blocks the next effect');
check(early.nextLiveAt === crowded.nextLiveAt, 'cooldown stamp stays put');

const later = advanceNewsWire({
  ...base,
  wire: early.wire,
  nextLiveAt: crowded.nextLiveAt,
  celebGate: now + NEWS_DAY_MS * 3,
  recent: early.recent,
  now: crowded.nextLiveAt,
  rng: () => 0.99,
});
check(counts(later.wire).effect === 1, 'one effect starts when the cooldown ends');
const started = effectItem(later.wire);
if (!started) throw new Error('the new effect is live');
check(later.nextLiveAt === started.endsAt + EFFECT_COOLDOWN_MS, 'cooldown follows the new effect');

const opened = advanceNewsWire({
  ...base,
  wire: [],
  nextLiveAt: Number.POSITIVE_INFINITY,
  celebGate: 0,
  now: 0,
  rng: () => 0.99,
});
check(opened.spawn == null, 'the first look only arms the celebrity gate');
check(opened.landedEffects.length === 0, 'miscellaneous lines do not chime');
const spawned = advanceNewsWire({
  ...base,
  wire: opened.wire,
  nextLiveAt: Number.POSITIVE_INFINITY,
  celebGate: opened.celebGate,
  recent: opened.recent,
  now: opened.celebGate,
  rng: () => 0,
});
check(spawned.spawn?.spawnsCase === true, 'the celebrity slot only draws a case line');
check(counts(spawned.wire).spawn === 1, 'one case line');
check(counts(spawned.wire).misc >= 4, 'misc lines fill the rest');
check(
  spawned.wire.some((item) => item.live && item.headlineId === spawned.spawn?.id),
  'the case line stays on the wire'
);
check(
  spawned.spawn != null && spawned.landedEffects.includes(spawned.spawn.id),
  'a celebrity case landing is an effect chime'
);
check(
  spawned.landedEffects.every((id) => headlineById(id)?.group === 'EFFECT'),
  'only effect lines are listed for the chime'
);

const blocked = advanceNewsWire({
  ...base,
  wire: spawned.wire.map((item) =>
    item.headlineId === spawned.spawn?.id ? { ...item, caseId: 'case-1' } : item
  ),
  nextLiveAt: Number.POSITIVE_INFINITY,
  celebGate: spawned.celebGate,
  recent: spawned.recent,
  now: spawned.celebGate,
  openCaseIds: new Set(['case-1']),
  headlineCaseOpen: true,
  rng: () => 0,
});
check(blocked.spawn == null, 'an open headline case blocks another');
check(counts(blocked.wire).spawn === 1, 'the open case line stays');

const full = advanceNewsWire({
  ...base,
  wire: [],
  nextLiveAt: Number.POSITIVE_INFINITY,
  celebGate: 0,
  now: 10_000_000,
  coolerFull: true,
  rng: () => 0,
});
const fullLater = advanceNewsWire({
  ...base,
  wire: full.wire,
  nextLiveAt: full.nextLiveAt,
  celebGate: full.celebGate,
  recent: full.recent,
  now: full.celebGate,
  coolerFull: true,
  rng: () => 0,
});
check(fullLater.spawn == null, 'a full cooler does not spawn');
check(counts(fullLater.wire).spawn === 0, 'a full cooler does not leave a live case line');

const fresh = advanceNewsWire({
  ...base,
  wire: [],
  nextLiveAt: 0,
  celebGate: now + NEWS_DAY_MS,
  now,
  rng: () => 0.5,
});
const freshCounts = counts(fresh.wire);
check(freshCounts.misc > freshCounts.effect, 'misc outnumbers the effect on a fresh wire');
for (const item of fresh.wire) {
  const headline = headlineById(item.headlineId);
  if (headline?.group !== 'MISCELLANEOUS') continue;
  check(item.endsAt - item.startedAt <= MISC_HOLD_MS, 'misc lines turn over within four family hours');
}

const groups = headlineGroupCounts();
check(groups.MISCELLANEOUS > groups.EFFECT, 'the pool has more miscellaneous lines');
check(groups.EFFECT + groups.MISCELLANEOUS === NEWS_HEADLINES.length, 'every headline has a group');
const ids = new Set<string>();
const texts = new Set<string>();
let priceVolume = 0;
let caseSpawn = 0;
for (const headline of NEWS_HEADLINES) {
  check(!ids.has(headline.id), headline.id);
  check(!texts.has(headline.text), headline.text);
  ids.add(headline.id);
  texts.add(headline.text);
  if (headline.group === 'EFFECT' && (headline.category === 'VOLUME' || headline.category === 'MARKET')) {
    priceVolume += 1;
  }
  if (headline.spawnsCase) {
    caseSpawn += 1;
    check(headline.group === 'EFFECT', headline.id);
  }
  if (headline.category === 'ODD' || headline.category === 'RIVAL') {
    check(headline.group === 'MISCELLANEOUS', headline.id);
  }
  if (headline.category === 'CELEBRITY' && !headline.spawnsCase) {
    check(headline.group === 'MISCELLANEOUS', headline.id);
  }
}
check(priceVolume === 90, 'price and volume pool');
check(caseSpawn === 12, 'case-spawn pool');
check(groups.EFFECT === priceVolume + caseSpawn, 'effect group is price, volume, and case lines');

check(preferMiscIndex([{ misc: true }, { misc: false }], 0, 0) === 0, 'skip an effect landing');
check(preferMiscIndex([{ misc: true }, { misc: false }], 0, 0.95) === 1, 'sometimes show the effect');
check(preferMiscIndex([{ misc: false }, { misc: false }], 0, 0) === 1, 'no misc to skip toward');

check(fuelMemoDollars(88, 0) === 88, 'stored fuel charge');
check(fuelMemoDollars(undefined, 0) === 180, 'old save uses the catalog price');
check(fuelMemoDollars(null, 1) === 60, 'tier fallback');

type Host = {
  process?: { on: (event: string, fn: () => void) => void };
};
let unhandled = false;
(globalThis as Host).process?.on('unhandledRejection', () => {
  unhandled = true;
});

const saved: Array<() => void> = [];
let cleared = 0;
const resolved = await withDeadline<string>(Promise.resolve('ok'), 12000, 'decode timeout theme', {
  set(fn: () => void) {
    saved.push(fn);
    return 4;
  },
  clear(id: number) {
    cleared = id;
  },
});
check(resolved === 'ok', 'deadline resolves with the decode');
check(cleared === 4, 'the decode timer is cleared');
const late = saved[0];
if (late) late();
await new Promise((resolve) => setTimeout(resolve, 0));
check(unhandled === false, 'a finished decode must not reject later');

const timeoutSaved: Array<() => void> = [];
let timeoutClears = 0;
const hanging = withDeadline(new Promise<string>(() => undefined), 12000, 'decode timeout bed', {
  set(fn: () => void) {
    timeoutSaved.push(fn);
    return 9;
  },
  clear() {
    timeoutClears += 1;
  },
});
const fireTimeout = timeoutSaved[0];
if (fireTimeout) fireTimeout();
const timeoutResult = await hanging.then(
  () => 'resolved',
  (err: unknown) => (err instanceof Error ? err.message : 'bad')
);
check(timeoutResult === 'decode timeout bed', 'a hung decode rejects on the timer');
check(timeoutClears >= 1, 'the timer is cleared after it fires');

class FallbackAudio {
  static allow = false;
  static latest: FallbackAudio | null = null;
  volume = 1;
  loop = false;
  preload = 'auto';
  paused = true;
  duration = 12;
  currentTime = 0;
  constructor() {
    FallbackAudio.latest = this;
  }
  play(): Promise<void> {
    if (!FallbackAudio.allow) return Promise.reject(new Error('NotAllowedError'));
    this.paused = false;
    return Promise.resolve();
  }
  pause(): void {
    this.paused = true;
  }
  addEventListener(): void {}
  removeEventListener(): void {}
}

const ticks: Array<() => void> = [];
const host = globalThis as unknown as {
  window: unknown;
  Audio: unknown;
  fetch: unknown;
};
host.Audio = FallbackAudio;
host.fetch = async () => ({
  ok: true,
  arrayBuffer: async () => new ArrayBuffer(8),
});
host.window = {
  setTimeout: (fn: () => void, ms?: number) => setTimeout(fn, ms) as unknown as number,
  clearTimeout: (id: number) => clearTimeout(id),
  setInterval: (fn: () => void) => {
    ticks.push(fn);
    return ticks.length;
  },
  clearInterval: (id: number) => {
    ticks[id - 1] = () => undefined;
  },
  addEventListener: () => undefined,
  AudioContext: class {
    state = 'running';
    currentTime = 0;
    destination = {};
    resume(): Promise<void> {
      return Promise.resolve();
    }
    decodeAudioData(): Promise<AudioBuffer> {
      return Promise.reject(new Error('decode'));
    }
    createGain() {
      return {
        gain: {
          value: 0.2,
          setValueAtTime() {},
          linearRampToValueAtTime() {},
          cancelScheduledValues() {},
          exponentialRampToValueAtTime() {},
        },
        connect() {},
      };
    }
    createBufferSource() {
      return { connect() {}, start() {}, stop() {}, loop: false, buffer: null };
    }
  },
};

FallbackAudio.allow = false;
await audioManager.crossfadeTo('theme', { loop: true, volume: 0.4, durationMs: 80 });
await new Promise((resolve) => setTimeout(resolve, 0));
check(audioManager.getCurrentId() == null, 'a blocked play() does not count as playing');
const bed = FallbackAudio.latest;
if (!bed) throw new Error('fallback element exists');
const beforeDuck = bed.volume;
audioManager.setCurrentVolume(0.2, 80);
for (let step = 0; step < 8; step += 1) {
  for (const tick of [...ticks]) tick();
}
check(bed.volume !== beforeDuck, 'room duck changes the fallback bed volume');
FallbackAudio.allow = true;
await audioManager.unlock();
await new Promise((resolve) => setTimeout(resolve, 0));
check(audioManager.getCurrentId() === 'theme', 'the next gesture starts the blocked bed');

const summary: NewsTickResult | { groups: typeof groups; priceVolume: number; caseSpawn: number; headlines: number } =
  {
    groups,
    priceVolume,
    caseSpawn,
    headlines: NEWS_HEADLINES.length,
  };
console.log(JSON.stringify(summary));
