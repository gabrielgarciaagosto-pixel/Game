/** Parlor headlines already fetched. The wire reads them like any other odd line. */
const HOUSE_LINES_KEY = 'ossuarian-house-lines';

/** How long a parlor line stays on the crawl. */
export const HOUSE_HOLD_MS = 12 * 60 * 60 * 1000;

export interface StoredHouseLine {
  id: string;
  text: string;
  createdAt: number;
}

let memory: StoredHouseLine[] | null = null;

export function cleanHouseText(raw: string): string {
  return raw.replace(/\s+/g, ' ').trim().slice(0, 160);
}

export function houseLineText(id: string): string | null {
  if (!id.startsWith('house')) return null;
  const found = readHouseLines().find((line) => line.id === id);
  return found?.text ?? null;
}

export function readHouseLines(): StoredHouseLine[] {
  if (memory) return memory;
  memory = [];
  try {
    if (typeof localStorage === 'undefined') return memory;
    const raw = localStorage.getItem(HOUSE_LINES_KEY);
    if (!raw) return memory;
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return memory;
    memory = parsed.filter(isStoredLine).slice(-8);
  } catch {
    memory = [];
  }
  return memory;
}

export function rememberHouseLines(lines: readonly StoredHouseLine[]): void {
  const merged = new Map<string, StoredHouseLine>();
  for (const line of readHouseLines()) merged.set(line.id, line);
  for (const line of lines) {
    const text = cleanHouseText(line.text);
    if (!line.id.startsWith('house') || !text || !Number.isFinite(line.createdAt)) continue;
    merged.set(line.id, { id: line.id, text, createdAt: line.createdAt });
  }
  const next = [...merged.values()]
    .sort((a, b) => a.createdAt - b.createdAt)
    .slice(-8);
  memory = next;
  try {
    localStorage.setItem(HOUSE_LINES_KEY, JSON.stringify(next));
  } catch {
    /* the line still shows until this sitting ends */
  }
}

function isStoredLine(value: unknown): value is StoredHouseLine {
  if (!value || typeof value !== 'object') return false;
  const line = value as Partial<StoredHouseLine>;
  return (
    typeof line.id === 'string' &&
    line.id.startsWith('house') &&
    typeof line.text === 'string' &&
    line.text.length > 0 &&
    typeof line.createdAt === 'number'
  );
}
