import { SERVICE_GRACE_MS, serviceTiming } from '../data/pacing';
import { formatDeviceDate, formatTimeOf } from '../utils/clock12';

/** A short app switch must not file a letter. */
export const ABSENCE_MAIL_MIN_MS = 15 * 60 * 1000;

export const HOUSE_MAIL_CAP = 40;

export interface HouseLetter {
  id: string;
  from: string;
  to: string;
  subject: string;
  sentAt: number;
  body: string;
  read: boolean;
}

export interface AbsenceFamilyBefore {
  urn: string | null;
  casket: string | null;
  due: number | null;
}

export interface AbsenceSnap {
  closedAt: number;
  caseIds: string[];
  newsIds: string[];
  family: Record<string, AbsenceFamilyBefore>;
  lostCalls: number;
}

export interface AbsenceCaseView {
  id: string;
  name: string;
  serviceDateMs: number | null;
  urnId: string | null;
  casketId: string | null;
  urnName: string | null;
  casketName: string | null;
  needsUrn: boolean;
  needsCasket: boolean;
}

export interface AbsenceWireLine {
  id: string;
  text: string;
  weight: number;
}

export function takeAbsenceSnap(
  cases: ReadonlyArray<{
    id: string;
    familyRequestedUrnId?: string | null;
    familyRequestedCasketId?: string | null;
    familyUrnDueAt?: number | null;
  }>,
  newsIds: readonly string[],
  closedAt: number
): AbsenceSnap {
  const family: Record<string, AbsenceFamilyBefore> = {};
  for (const item of cases) {
    family[item.id] = {
      urn: item.familyRequestedUrnId ?? null,
      casket: item.familyRequestedCasketId ?? null,
      due: item.familyUrnDueAt ?? null,
    };
  }
  return {
    closedAt,
    caseIds: cases.map((item) => item.id),
    newsIds: [...newsIds],
    family,
    lostCalls: 0,
  };
}

export function wireWeight(category: string, group: string): number {
  if (group === 'EFFECT') return 0;
  if (category === 'RIVAL') return 1;
  if (category === 'ODD') return 3;
  return 2;
}

export function readHouseMail(value: unknown): HouseLetter[] {
  if (!Array.isArray(value)) return [];
  const letters: HouseLetter[] = [];
  for (const row of value) {
    if (!row || typeof row !== 'object') continue;
    const letter = row as Partial<HouseLetter>;
    if (typeof letter.id !== 'string' || typeof letter.body !== 'string') continue;
    if (typeof letter.subject !== 'string' || typeof letter.sentAt !== 'number') continue;
    letters.push({
      id: letter.id,
      from: typeof letter.from === 'string' ? letter.from : 'Night Desk',
      to: typeof letter.to === 'string' ? letter.to : 'The house',
      subject: letter.subject,
      sentAt: letter.sentAt,
      body: letter.body,
      read: letter.read === true,
    });
    if (letters.length >= HOUSE_MAIL_CAP) break;
  }
  return letters;
}

function joinList(items: string[]): string {
  if (items.length <= 1) return items[0] ?? '';
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

function awaySpan(ms: number): string {
  const minutes = Math.max(1, Math.round(ms / 60000));
  if (minutes < 60) return minutes === 1 ? '1 minute' : `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hourLabel = hours === 1 ? '1 hour' : `${hours} hours`;
  if (rest === 0) return hourLabel;
  const minuteLabel = rest === 1 ? '1 minute' : `${rest} minutes`;
  return `${hourLabel} and ${minuteLabel}`;
}

function clockStamp(ms: number): string {
  const date = new Date(ms);
  return `${formatDeviceDate(date)} at ${formatTimeOf(date)}`;
}

function sentence(text: string): string {
  const trimmed = text.replaceAll('—', ', ').replaceAll('–', '-').trim();
  if (!trimmed) return '';
  return /[.!?]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function countWord(count: number): string {
  const words = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  return words[count] ?? String(count);
}

function arrivalSentence(names: string[]): string {
  const people = names.filter((name) => name && name !== 'UNIDENTIFIED REMAINS');
  const unnamed = names.length - people.length;
  if (names.length === 0) return 'No remains came in.';
  if (people.length === 0) {
    return names.length === 1
      ? 'One set of remains came in. No name was on the tag.'
      : `${countWord(names.length)} sets of remains came in. No names were on the tags.`;
  }
  const shown = people.slice(0, 4);
  const hidden = people.length - shown.length;
  const tail = [
    ...shown,
    ...(hidden > 0 ? [`${hidden} more`] : []),
    ...(unnamed === 1 ? ['one without a name'] : unnamed > 1 ? [`${unnamed} without names`] : []),
  ];
  if (names.length === 1) return `One set of remains came in: ${people[0]}.`;
  return `${countWord(names.length)} sets of remains came in: ${joinList(tail)}.`;
}

function lostSentence(count: number): string | null {
  if (count <= 0) return null;
  if (count === 1) {
    return 'One call was lost. The cooler was full, and another funeral home took it.';
  }
  return `${countWord(count)} calls were lost. The cooler was full, and another funeral home took them.`;
}

function pickHeadlines(lines: readonly AbsenceWireLine[]): string[] {
  const effects = lines.filter((line) => line.weight === 0);
  const serious = lines.filter((line) => line.weight < 3);
  const pool = (effects.length > 0 ? effects : serious.length > 0 ? serious : lines)
    .slice()
    .sort((a, b) => a.weight - b.weight);
  const seen = new Set<string>();
  const chosen: string[] = [];
  for (const line of pool) {
    if (seen.has(line.id)) continue;
    const text = sentence(line.text);
    if (!text) continue;
    seen.add(line.id);
    chosen.push(text);
    if (chosen.length === 2) break;
  }
  return chosen;
}

function familySentences(
  snap: AbsenceSnap,
  cases: readonly AbsenceCaseView[],
  until: number
): string[] {
  const lines: string[] = [];
  for (const item of cases) {
    const before = snap.family[item.id];
    if (!before) continue;
    const dueFell = before.due != null && before.due >= snap.closedAt && before.due <= until;
    const urnChanged = Boolean(item.urnId) && item.urnId !== before.urn;
    const casketChanged = Boolean(item.casketId) && item.casketId !== before.casket;
    if (!dueFell && !urnChanged && !casketChanged) continue;
    const chosen: string[] = [];
    if (urnChanged && item.urnName) chosen.push(item.urnName);
    if (casketChanged && item.casketName) chosen.push(item.casketName);
    const waiting: string[] = [];
    if (item.needsUrn && !item.urnId) waiting.push('an urn');
    if (item.needsCasket && !item.casketId) waiting.push('a casket');
    const who = item.name === 'UNIDENTIFIED REMAINS' ? 'unnamed remains' : item.name;
    if (chosen.length > 0 && waiting.length > 0) {
      lines.push(
        `The family called about ${who}, chose ${joinList(chosen)}, and is still waiting on ${joinList(waiting)}.`
      );
    } else if (chosen.length > 0) {
      lines.push(`The family called about ${who} and chose ${joinList(chosen)}.`);
    } else if (dueFell && waiting.length > 0) {
      lines.push(
        `The family of ${who} called and is still waiting on ${joinList(waiting)}. Nothing suitable was in stock.`
      );
    }
    if (lines.length >= 4) break;
  }
  return lines;
}

function serviceSentences(
  cases: readonly AbsenceCaseView[],
  since: number,
  until: number
): string[] {
  const lines: string[] = [];
  for (const item of cases) {
    const due = item.serviceDateMs;
    if (due == null) continue;
    const missedAt = due + SERVICE_GRACE_MS;
    const dueInWindow = due >= since && due <= until;
    const missedInWindow = missedAt >= since && missedAt <= until && until > missedAt;
    if (!dueInWindow && !missedInWindow) continue;
    const who = item.name === 'UNIDENTIFIED REMAINS' ? 'unnamed remains' : item.name;
    const timing = serviceTiming(due, until);
    if (timing === 'missed') {
      lines.push(`The service for ${who} was missed. It will need another hour.`);
    } else if (due <= until) {
      lines.push(`The service for ${who} came due at ${formatTimeOf(new Date(due))}.`);
    }
    if (lines.length >= 3) break;
  }
  return lines;
}

/**
 * One office letter for a closed stretch. Null when the gap is only a switch.
 */
export function composeAbsenceLetter(input: {
  snap: AbsenceSnap;
  until: number;
  playerName: string;
  cases: readonly AbsenceCaseView[];
  arrivedNames: readonly string[];
  wire: readonly AbsenceWireLine[];
}): HouseLetter | null {
  const since = input.snap.closedAt;
  const elapsed = input.until - since;
  if (!Number.isFinite(elapsed) || elapsed < ABSENCE_MAIL_MIN_MS) return null;
  const headlines = pickHeadlines(input.wire);
  const family = familySentences(input.snap, input.cases, input.until);
  const services = serviceSentences(input.cases, since, input.until);
  const lost = lostSentence(input.snap.lostCalls);
  const remains = [arrivalSentence([...input.arrivedNames]), lost].filter(
    (line): line is string => Boolean(line)
  );
  const wire =
    headlines.length === 0
      ? 'The wire was quiet.'
      : headlines.length === 1
        ? `The wire carried one line. ${headlines[0]}`
        : `The wire carried two lines. ${headlines[0]} ${headlines[1]}`;
  const house =
    family.length === 0 && services.length === 0
      ? 'No family called, and no service came due.'
      : [...family, ...services].join(' ');
  const body = [
    `You were away for ${awaySpan(elapsed)}, from ${clockStamp(since)} until ${clockStamp(input.until)}.`,
    remains.join(' '),
    wire,
    house,
    'The doors are open again.',
    'Night Desk',
  ].join('\n\n');
  return {
    id: `mail-${input.until}-${Math.random().toString(36).slice(2, 8)}`,
    from: 'Night Desk',
    to: input.playerName,
    subject: 'While the house was closed',
    sentAt: input.until,
    body,
    read: false,
  };
}
