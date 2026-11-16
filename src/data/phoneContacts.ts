import type { DispositionDirective } from '../types/game';
import { titleAt } from './rankProgression';
import { HOUR_MS } from './pacing';

/**
 * Each desk contact keeps its own cooldown and its own odds.
 * Calling one does not silence the others.
 * Rank gates are optional so a house can open a line by standing or by title.
 */
export interface PhoneContact {
  id: string;
  name: string;
  desk: string;
  blurb: string;
  odds: number;
  cooldownMs: number;
  /** Preferred directive when the roll hits. Still mixed the rest of the time. */
  directiveBias: DispositionDirective | null;
  unlock: {
    minRankIndex?: number;
    minReputation?: number;
    minHomes?: number;
  };
  hit: readonly string[];
  miss: readonly string[];
}

export interface PhoneProgress {
  reputation: number;
  homesOwned: number;
  rankIndex: number;
  rankTitle?: string;
}

export const PHONE_CONTACTS: readonly PhoneContact[] = [
  {
    id: 'hospital',
    name: 'County Hospital',
    desk: 'Admitting',
    blurb: 'The night desk. Most first calls start here.',
    odds: 0.68,
    cooldownMs: 2 * HOUR_MS,
    directiveBias: null,
    unlock: {},
    hit: [
      'Admitting has a transfer ready. They are sending the paperwork with the cot.',
      'The charge nurse kept a name off the board for you. A van is already rolling.',
    ],
    miss: [
      'Admitting is quiet. The board is someone else’s problem until the line cools.',
      'They put you on hold, then the hold became a dial tone.',
    ],
  },
  {
    id: 'hospice',
    name: 'Ridge Hospice',
    desk: 'Family line',
    blurb: 'A standing arrangement with the house on the ridge.',
    odds: 0.64,
    cooldownMs: 2.5 * HOUR_MS,
    directiveBias: 'CREMATION_DIRECT',
    unlock: {},
    hit: [
      'The hospice kept a family who already asked for a simple cremation.',
      'A nurse on the ridge says the family would like the parlor they already know.',
    ],
    miss: [
      'The ridge is between calls. They will ring the parlor when a family asks.',
      'Everyone on the floor is still with the living. Try the line again later.',
    ],
  },
  {
    id: 'nursing',
    name: 'Riverside Nursing Home',
    desk: 'Social work',
    blurb: 'Long-stay halls. Viewings are common.',
    odds: 0.66,
    cooldownMs: 2.5 * HOUR_MS,
    directiveBias: 'BURIAL_VIEWING',
    unlock: { minReputation: 150, minRankIndex: 6 },
    hit: [
      'Social work has a family who want a viewing. The chart is on its way.',
      'Riverside held a room. They asked for the parlor with the quiet chapel.',
    ],
    miss: [
      'The social worker is in a care meeting. No transfer this hour.',
      'Riverside’s line is busy with the living. Nothing for the cooler.',
    ],
  },
  {
    id: 'retirement',
    name: 'Lantern Retirement',
    desk: 'Front office',
    blurb: 'Independent apartments. The office knows the families.',
    odds: 0.63,
    cooldownMs: 3 * HOUR_MS,
    directiveBias: 'VIEWING_THEN_CREMATION',
    unlock: { minReputation: 190, minRankIndex: 12 },
    hit: [
      'The front office has a resident whose family already chose a viewing, then cremation.',
      'Lantern kept your card. A daughter called them before she called anyone else.',
    ],
    miss: [
      'The office is doing mail. No one has asked for a parlor today.',
      'Lantern’s director is out. The desk will not release a name.',
    ],
  },
  {
    id: 'veterans',
    name: 'Veterans’ Home',
    desk: 'Chaplain',
    blurb: 'The chaplain keeps a short list of houses he trusts.',
    odds: 0.6,
    cooldownMs: 3 * HOUR_MS,
    directiveBias: 'BURIAL_VIEWING',
    unlock: { minReputation: 260, minHomes: 2, minRankIndex: 18 },
    hit: [
      'The chaplain has a veteran whose family want colors and a viewing.',
      'A flag case is already packed. They asked for your hearse.',
    ],
    miss: [
      'The chaplain is in the day room. He has no name for you yet.',
      'Another house took the morning call. The line goes quiet.',
    ],
  },
  {
    id: 'morgue',
    name: 'County Morgue',
    desk: 'Medical examiner',
    blurb: 'Unclaimed and examined. The paperwork is thicker.',
    odds: 0.58,
    cooldownMs: 3.5 * HOUR_MS,
    directiveBias: 'CREMATION_DIRECT',
    unlock: { minReputation: 340, minRankIndex: 24 },
    hit: [
      'The examiner released a case the county will pay the parlor to finish.',
      'A drawer is tagged for release. Direct cremation, if the family does not appear.',
    ],
    miss: [
      'The examiner is still in autopsy. Nothing is released.',
      'The morgue’s phone rings through to a recording.',
    ],
  },
  {
    id: 'coroner',
    name: 'Police Coroner',
    desk: 'Night sergeant',
    blurb: 'Scenes and identifications. They call a house they already know.',
    odds: 0.55,
    cooldownMs: 4 * HOUR_MS,
    directiveBias: 'CREMATION_THEN_VIEWING',
    unlock: { minReputation: 450, minRankIndex: 30 },
    hit: [
      'The sergeant has an identification and a family who want a memorial after cremation.',
      'Night shift kept your number. A case is cleared for the parlor.',
    ],
    miss: [
      'The sergeant says the scene is still open. No release.',
      'Dispatch thanks you and hangs up. The coroner is in the field.',
    ],
  },
] as const;

export interface PhoneCallResult {
  contactId: string;
  at: number;
  hit: boolean;
  text: string;
}

export function phoneContactById(id: string): PhoneContact | undefined {
  return PHONE_CONTACTS.find((c) => c.id === id);
}

function clauseMet(
  contact: PhoneContact,
  progress: PhoneProgress
): { met: boolean; waiting: string[] } {
  const need = contact.unlock;
  const waiting: string[] = [];
  const checks: boolean[] = [];
  if (need.minRankIndex != null && need.minRankIndex > 0) {
    const ok = progress.rankIndex >= need.minRankIndex;
    checks.push(ok);
    if (!ok) {
      const gate = titleAt(need.minRankIndex);
      waiting.push(`${gate.title} (${gate.tier})`);
    }
  }
  if (need.minReputation != null) {
    const ok = progress.reputation >= need.minReputation;
    checks.push(ok);
    if (!ok) waiting.push(`reputation ${need.minReputation}`);
  }
  if (need.minHomes != null) {
    const ok = progress.homesOwned >= need.minHomes;
    checks.push(ok);
    if (!ok) waiting.push(`${need.minHomes} funeral homes`);
  }
  if (checks.length === 0) return { met: true, waiting: [] };
  // Any one path opens the line: title, standing, or another house.
  const met = checks.some(Boolean);
  return { met, waiting: met ? [] : waiting };
}

export function contactAccess(
  contact: PhoneContact,
  progress: PhoneProgress
): { unlocked: boolean; reason: string } {
  const { met, waiting } = clauseMet(contact, progress);
  if (met) return { unlocked: true, reason: '' };
  return {
    unlocked: false,
    reason: `Unlocks with ${waiting.join(' or ')}`,
  };
}

export function pickPhoneLine(
  lines: readonly string[],
  rng: () => number = Math.random
): string {
  const i = Math.floor(rng() * lines.length);
  return lines[i] ?? lines[0] ?? '';
}
