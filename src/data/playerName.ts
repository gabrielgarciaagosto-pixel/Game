/** Shown when a new game leaves the name blank. */
export const DEFAULT_PLAYER_NAME = 'Mortician';

const KIN = [
  'Mom',
  'Dad',
  'Grandma',
  'Grandpa',
  'Aunt',
  'Uncle',
  'their sister',
  'their brother',
] as const;

export function resolvePlayerName(raw: string | null | undefined): string {
  const trimmed = (raw ?? '').trim().replace(/\s+/g, ' ').slice(0, 24);
  return trimmed || DEFAULT_PLAYER_NAME;
}

export function rollFamilyKin(): string {
  return KIN[Math.floor(Math.random() * KIN.length)]!;
}

/** Stable kinship for a case that was saved before names existed. */
export function kinFromId(id: string): string {
  let n = 0;
  for (let i = 0; i < id.length; i++) n = (n + id.charCodeAt(i)) % KIN.length;
  return KIN[n]!;
}
