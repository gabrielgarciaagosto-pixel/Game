import { resolvePlayerName } from '../data/playerName';
import { titleAtXp } from '../data/rankProgression';
import { useGameStore } from '../store/useGameStore';

const CASES_KEY = 'ossuarian-cases-handled';
const FIRST_SEEN_KEY = 'ossuarian-first-seen';

const STATIONS = [
  'OVERVIEW',
  'COOLER',
  'EMBALMING',
  'CREMATION',
  'URN_FILLING',
  'SHOWROOM',
  'URN_VAULT',
  'EMPORIUM',
  'COMPUTER',
] as const;

export interface PlayerStatPayload {
  playerName: string;
  cash: number;
  reputation: number;
  intermentScore: number;
  ossilegiumGrams: number;
  urnsCount: number;
  casesHandled: number;
  careerXp: number;
  rankTitle: string;
  homesKept: number;
  activeStation: string;
  ownedPropertyLabel: string;
  ownedPropertyCity: string;
  firstSeen: number;
}

export function collectPlayerStats(now: number): PlayerStatPayload {
  const state = useGameStore.getState();
  const urns = Object.values(state.urnInventory).reduce((sum, count) => sum + (count || 0), 0);
  const title = titleAtXp(state.careerXp).title;
  const station = STATIONS.includes(state.activeStation as (typeof STATIONS)[number])
    ? state.activeStation
    : 'OVERVIEW';
  return {
    playerName: resolvePlayerName(state.playerName).slice(0, 24),
    cash: clamp(state.cash, -1_000_000_000, 1_000_000_000),
    reputation: clamp(state.reputation, -1_000_000, 1_000_000),
    intermentScore: clamp(state.intermentScore, 0, 1_000_000_000),
    ossilegiumGrams: clamp(state.ossilegiumCommuneGrams, 0, 1_000_000_000),
    urnsCount: clamp(urns, 0, 1_000_000),
    casesHandled: rememberCases(state.archivedCases.map((file) => file.id)),
    careerXp: clamp(state.careerXp, 0, 1_000_000_000),
    rankTitle: title.slice(0, 40) || 'Mortician',
    homesKept: clamp(state.homesKept, 0, 1000),
    activeStation: station,
    ownedPropertyLabel: (state.ownedProperty?.label ?? '').replace(/\s+/g, ' ').trim().slice(0, 80),
    ownedPropertyCity: (state.ownedProperty?.city ?? '').replace(/\s+/g, ' ').trim().slice(0, 40),
    firstSeen: rememberFirstSeen(now),
  };
}

function rememberCases(ids: readonly string[]): number {
  let count = 0;
  let seen: string[] = [];
  try {
    const raw = localStorage.getItem(CASES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as { count?: unknown; ids?: unknown };
      if (typeof parsed.count === 'number' && Number.isFinite(parsed.count)) count = parsed.count;
      if (Array.isArray(parsed.ids)) {
        seen = parsed.ids.filter((id): id is string => typeof id === 'string');
      }
    }
  } catch {
    /* count what is in the archive this sitting */
  }
  const known = new Set(seen);
  let changed = seen.length === 0 && ids.length > 0;
  for (const id of ids) {
    if (!id || known.has(id)) continue;
    known.add(id);
    count += 1;
    changed = true;
  }
  count = clamp(count, 0, 10_000_000);
  if (changed) {
    try {
      localStorage.setItem(
        CASES_KEY,
        JSON.stringify({ count, ids: [...known].slice(-80) })
      );
    } catch {
      /* the number is still sent this time */
    }
  }
  return count;
}

function rememberFirstSeen(now: number): number {
  try {
    const raw = localStorage.getItem(FIRST_SEEN_KEY);
    const saved = Number(raw);
    if (Number.isFinite(saved) && saved > 0) return Math.round(saved);
    localStorage.setItem(FIRST_SEEN_KEY, String(now));
  } catch {
    /* this ping still carries the time */
  }
  return now;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.max(min, Math.min(max, Math.round(value)));
}
