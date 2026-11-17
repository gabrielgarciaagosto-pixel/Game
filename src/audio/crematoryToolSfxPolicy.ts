import type { SweepTool } from '../types/game';

export type SweepClip = 'dry' | 'bones';
export type FallClip = 'short' | 'long';

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
 * Dry metal on the retort, or the same scrape once it meets bones.
 * The stirring rod is not a sweeper. Off the hearth floor, nothing.
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
  if (!input.moving || !input.onHearth) return null;
  if (!input.tool || !SWEEP_TOOLS.has(input.tool)) return null;
  return input.touchingBones ? 'bones' : 'dry';
}

/**
 * Bones leave the hearth on a credited downstroke. That stroke is the fall.
 * The long clatter is only the iron-rake stroke that empties the large bones.
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
    input.tool === 'BRISTLE_BRUSH' && input.mediumAfter < input.mediumBefore;
  if (largeDropped || fragmentsDropped) return 'short';
  return null;
}
