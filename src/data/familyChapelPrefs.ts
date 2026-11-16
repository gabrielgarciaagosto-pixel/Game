import {
  CHAPEL_DECOR_CATALOG,
  getChapelDecorById,
  type ChapelThemeSelection,
  type FlowerKind,
} from './chapelDecor';
import { friendlyToken } from '../types/game';

/**
 * Family chapel wishes.
 * Roses and the musical selection are required and move the house rating
 * by a couple of points either way. Every other wish is bonus-only.
 */
export interface FamilyChapelPreferences {
  wallId: string | null;
  floorId: string | null;
  draperyId: string | null;
  lightingId: string | null;
  pewsId: string | null;
  /** Service playlist track id (e.g. chapel-service-1) */
  musicTrackId: string | null;
  flowers: FlowerKind;
}

export const DEFAULT_FAMILY_CHAPEL_PREFS: FamilyChapelPreferences = {
  wallId: null,
  floorId: null,
  draperyId: null,
  lightingId: null,
  pewsId: null,
  musicTrackId: null,
  flowers: 'LILIES',
};

const SERVICE_MUSIC_OPTIONS = [
  { id: 'chapel-service-1', label: 'Chapel Service I' },
  { id: 'chapel-service-2', label: 'Chapel Service II' },
  { id: 'chapel-service-3', label: 'Chapel Service III' },
  { id: 'chapel-service-4', label: 'Chapel Service IV' },
  { id: 'chapel-service-5', label: 'Chapel Service V' },
  { id: 'chapel-service-6', label: 'Chapel Service VI' },
] as const;

export function serviceMusicOptions(): ReadonlyArray<{
  id: string;
  label: string;
}> {
  return SERVICE_MUSIC_OPTIONS;
}

export function serviceMusicLabel(id: string | null | undefined): string {
  if (!id) return 'Any';
  return SERVICE_MUSIC_OPTIONS.find((t) => t.id === id)?.label ?? id;
}

function pickDecorId(kind: string): string | null {
  const pool = CHAPEL_DECOR_CATALOG.filter((d) => d.kind === kind);
  if (pool.length === 0) return null;
  // ~20% "no strong preference"
  if (Math.random() < 0.2) return null;
  return pool[Math.floor(Math.random() * pool.length)]!.id;
}

export function stableServiceMusicId(seed: string): string {
  let hash = 0;
  for (const ch of seed) hash = (hash * 33 + ch.charCodeAt(0)) >>> 0;
  return SERVICE_MUSIC_OPTIONS[hash % SERVICE_MUSIC_OPTIONS.length]!.id;
}

/** Every family requires roses and one musical selection. Decor stays optional. */
export function rollFamilyChapelPreferences(
  _preferredFlowers?: FlowerKind
): FamilyChapelPreferences {
  const music =
    SERVICE_MUSIC_OPTIONS[
      Math.floor(Math.random() * SERVICE_MUSIC_OPTIONS.length)
    ]!.id;
  return {
    wallId: pickDecorId('WALL'),
    floorId: pickDecorId('FLOOR'),
    draperyId: pickDecorId('DRAPERY'),
    lightingId: pickDecorId('LIGHTING'),
    pewsId: pickDecorId('PEWS'),
    musicTrackId: music,
    flowers: 'ROSES',
  };
}

export interface ChapelPrefMatch {
  key: keyof FamilyChapelPreferences;
  label: string;
  preferredName: string;
  matched: boolean;
}

export function evaluateChapelPrefMatches(opts: {
  prefs: FamilyChapelPreferences;
  theme: ChapelThemeSelection;
  flowersPlaced: FlowerKind[];
  serviceMusicId: string | null;
}): ChapelPrefMatch[] {
  const { prefs, theme, flowersPlaced, serviceMusicId } = opts;
  const rows: ChapelPrefMatch[] = [];

  const slot = (
    key: keyof FamilyChapelPreferences,
    label: string,
    preferredId: string | null,
    actualId: string | null
  ) => {
    if (!preferredId) return;
    const item = getChapelDecorById(preferredId);
    rows.push({
      key,
      label,
      preferredName: item?.name ?? preferredId,
      matched: actualId === preferredId,
    });
  };

  slot('wallId', 'Walls', prefs.wallId, theme.wallId);
  slot('floorId', 'Floor', prefs.floorId, theme.floorId);
  slot('draperyId', 'Drapery', prefs.draperyId, theme.draperyId);
  slot('lightingId', 'Lighting', prefs.lightingId, theme.lightingId);
  slot('pewsId', 'Pews', prefs.pewsId, theme.pewsId);

  if (prefs.musicTrackId) {
    rows.push({
      key: 'musicTrackId',
      label: 'Music',
      preferredName: serviceMusicLabel(prefs.musicTrackId),
      matched: serviceMusicId === prefs.musicTrackId,
    });
  }

  rows.push({
    key: 'flowers',
    label: 'Flowers',
    preferredName: friendlyToken(prefs.flowers),
    matched: flowersPlaced.includes(prefs.flowers),
  });

  return rows;
}

const OPTIONAL_PREF_KEYS = new Set<keyof FamilyChapelPreferences>([
  'wallId',
  'floorId',
  'draperyId',
  'lightingId',
  'pewsId',
]);

/** Bonus-only points from optional prefs. Roses and music are scored apart. */
export function chapelPrefMatchBonus(matches: ChapelPrefMatch[]): number {
  const honored = matches.filter(
    (m) => m.matched && OPTIONAL_PREF_KEYS.has(m.key)
  ).length;
  if (honored === 0) return 0;
  // Soft curve: first match +5, then +4 each, cap 28
  let pts = 0;
  for (let i = 0; i < honored; i++) {
    pts += Math.max(3, 6 - i);
  }
  return Math.min(28, pts);
}

export function decorPrefLabel(id: string | null | undefined): string {
  if (!id) return 'Any';
  return getChapelDecorById(id)?.name ?? id;
}
