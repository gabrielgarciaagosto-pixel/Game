import type { SweepTool } from '../types/game';

export type SweepClip = 'dry' | 'bones' | 'rod';
export type FallClip = 'short' | 'long';

/**
 * Bone-scrape variations for the iron rake and the brushes.
 * `bones` is the original metal-on-bone loop. The sweep ids are the new clips.
 */
export const RAKE_BONE_SWEEP_IDS = [
  'bones',
  'sweep1',
  'sweep2',
  'sweep3',
  'sweep5',
] as const;

/** The rod gets the new bone scrapes, not the dry metal loop and not the rake's old one. */
export const ROD_BONE_SWEEP_IDS = [
  'sweep1',
  'sweep2',
  'sweep3',
  'sweep5',
] as const;

/** Four strikes split out of the one crushing take, in the order they were hit. */
export const BONE_CRUSH_IDS = ['crushA', 'crushB', 'crushC', 'crushD'] as const;

export type RakeBoneSweepId = (typeof RAKE_BONE_SWEEP_IDS)[number];
export type RodBoneSweepId = (typeof ROD_BONE_SWEEP_IDS)[number];
export type BoneCrushId = (typeof BONE_CRUSH_IDS)[number];

/** Chamber percent that starts a sweep. Under this, a still tool stays quiet. */
export const TOOL_AUDIO_START = 0.6;
/** Once a sweep is sounding, it keeps going through a slower drag. */
export const TOOL_AUDIO_KEEP = 0.18;

const SWEEP_TOOLS = new Set<SweepTool>([
  'IRON_RAKE',
  'BRISTLE_BRUSH',
  'HAND_BRUSH',
]);

export function latchToolMoving(wasMoving: boolean, distance: number): boolean {
  return distance > (wasMoving ? TOOL_AUDIO_KEEP : TOOL_AUDIO_START);
}

export function hearthHasBones(
  largeBonesLeft: number,
  mediumBonesLeft: number
): boolean {
  return largeBonesLeft > 0 || mediumBonesLeft > 0;
}

/**
 * Dry metal on the retort, or a bone scrape once the rake or a brush meets bones.
 * The stirring rod stays quiet on the empty hearth. Through bones, it gets a
 * bone scrape, not the dry metal loop. Off the hearth floor, nothing.
 */
export function sweepClipFor(input: {
  tool: SweepTool | null;
  moving: boolean;
  onHearth: boolean;
  touchingBones: boolean;
  /** Bone counters default to full before a firing. Only a live charge counts. */
  phase: string;
}): SweepClip | null {
  if (input.phase !== 'SWEEP' && input.phase !== 'BURN') return null;
  if (!input.moving || !input.onHearth || !input.tool) return null;
  if (input.tool === 'STIRRING_ROD') {
    return input.touchingBones ? 'rod' : null;
  }
  if (!SWEEP_TOOLS.has(input.tool)) return null;
  return input.touchingBones ? 'bones' : 'dry';
}

/**
 * Next clip in a pool. Skips the one that just played when there is another.
 * A pool of one may repeat. `random` is `[0, 1)`.
 */
export function pickVariation<T extends string>(
  pool: readonly T[],
  previous: T | null,
  random: () => number = Math.random
): T {
  if (pool.length === 0) {
    throw new Error('empty variation pool');
  }
  const choices =
    previous == null || pool.length < 2
      ? pool
      : pool.filter((item) => item !== previous);
  const bag = choices.length > 0 ? choices : pool;
  let index = Math.floor(random() * bag.length);
  if (index < 0) index = 0;
  if (index >= bag.length) index = bag.length - 1;
  return bag[index]!;
}

/**
 * Bones leave the hearth on a credited downstroke. That stroke is the fall.
 * The long clatter is only the iron-rake stroke that empties the large bones.
 * The short fall is the fragment brush clearing smaller bones. The hand brush sweeps ash and stays quiet.
 * The retort has no separate "full sweep finished" flag.
 */
export function fallClipFor(input: {
  tool: SweepTool;
  largeBefore: number;
  largeAfter: number;
  mediumBefore: number;
  mediumAfter: number;
}): FallClip | null {
  if (
    input.tool === 'IRON_RAKE' &&
    input.largeBefore > 0 &&
    input.largeAfter <= 0
  ) {
    return 'long';
  }
  const largeDropped =
    input.tool === 'IRON_RAKE' && input.largeAfter < input.largeBefore;
  const fragmentsDropped =
    input.tool === 'HAND_BRUSH' && input.mediumAfter < input.mediumBefore;
  if (largeDropped || fragmentsDropped) return 'short';
  return null;
}
