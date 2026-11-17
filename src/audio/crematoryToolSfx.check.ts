/**
 * Locks which crematory clip a tool motion asks for.
 * The app does not import this file.
 */
import {
  fallClipFor,
  hearthHasBones,
  latchToolMoving,
  sweepClipFor,
} from './crematoryToolSfxPolicy.ts';

function check(cond: unknown, message: string): void {
  if (!cond) throw new Error(message);
}

check(latchToolMoving(false, 0.5) === false, 'a twitch does not start a sweep');
check(latchToolMoving(false, 0.7) === true, 'a real drag starts a sweep');
check(latchToolMoving(true, 0.3) === true, 'a sweep already going survives a slower drag');
check(latchToolMoving(true, 0.1) === false, 'a held-still tool drops the sweep');

check(
  sweepClipFor({
    tool: 'IRON_RAKE',
    moving: true,
    onHearth: true,
    touchingBones: false,
    phase: 'SWEEP',
  }) === 'dry',
  'rake on the empty retort is the dry scrape'
);
check(
  sweepClipFor({
    tool: 'BRISTLE_BRUSH',
    moving: true,
    onHearth: true,
    touchingBones: false,
    phase: 'SWEEP',
  }) === 'dry',
  'iron brush uses the same dry scrape'
);
check(
  sweepClipFor({
    tool: 'HAND_BRUSH',
    moving: true,
    onHearth: true,
    touchingBones: false,
    phase: 'SWEEP',
  }) === 'dry',
  'hand brush uses the same dry scrape'
);
check(
  sweepClipFor({
    tool: 'IRON_RAKE',
    moving: true,
    onHearth: true,
    touchingBones: true,
    phase: 'SWEEP',
  }) === 'bones',
  'rake on bones switches to the bone scrape'
);
check(
  sweepClipFor({
    tool: 'HAND_BRUSH',
    moving: true,
    onHearth: true,
    touchingBones: true,
    phase: 'BURN',
  }) === 'bones',
  'a brush on bones uses the bone scrape too'
);
check(
  sweepClipFor({
    tool: 'IRON_RAKE',
    moving: false,
    onHearth: true,
    touchingBones: true,
    phase: 'SWEEP',
  }) === null,
  'a still rake is silent'
);
check(
  sweepClipFor({
    tool: 'IRON_RAKE',
    moving: true,
    onHearth: false,
    touchingBones: false,
    phase: 'SWEEP',
  }) === null,
  'off the hearth floor is silent'
);
check(
  sweepClipFor({
    tool: 'STIRRING_ROD',
    moving: true,
    onHearth: true,
    touchingBones: true,
    phase: 'BURN',
  }) === null,
  'the stirring rod is not a sweeper'
);
check(
  sweepClipFor({
    tool: 'IRON_RAKE',
    moving: true,
    onHearth: true,
    touchingBones: true,
    phase: 'LOAD',
  }) === null,
  'a cold retort does not scrape just because the counters start full'
);
check(hearthHasBones(0, 0) === false, 'ash alone is not bones');
check(hearthHasBones(0, 12) === true, 'fragments still count as bones');

check(
  fallClipFor({
    tool: 'IRON_RAKE',
    largeBefore: 40,
    largeAfter: 20,
    mediumBefore: 100,
    mediumAfter: 100,
  }) === 'short',
  'a rake stroke that leaves large bones is the short fall'
);
check(
  fallClipFor({
    tool: 'IRON_RAKE',
    largeBefore: 20,
    largeAfter: 0,
    mediumBefore: 100,
    mediumAfter: 100,
  }) === 'long',
  'the rake stroke that empties large bones is the long fall'
);
check(
  fallClipFor({
    tool: 'BRISTLE_BRUSH',
    largeBefore: 0,
    largeAfter: 0,
    mediumBefore: 22,
    mediumAfter: 0,
  }) === 'short',
  'the iron brush, even on its last fragments, stays on the short fall'
);
check(
  fallClipFor({
    tool: 'HAND_BRUSH',
    largeBefore: 0,
    largeAfter: 0,
    mediumBefore: 0,
    mediumAfter: 0,
  }) === null,
  'the hand brush does not drop bones'
);
check(
  fallClipFor({
    tool: 'IRON_RAKE',
    largeBefore: 0,
    largeAfter: 0,
    mediumBefore: 40,
    mediumAfter: 40,
  }) === null,
  'a rake with nothing left to push is silent'
);

console.log('crematory tool sfx policy ok');
