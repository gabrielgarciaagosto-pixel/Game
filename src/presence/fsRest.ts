/** One attempt. The caller waits for the next quiet beat. There is no retry loop here. */
const REQUEST_MS = 8_000;

export interface FsValue {
  stringValue?: string;
  integerValue?: string;
  arrayValue?: { values?: FsValue[] };
}

export type FsFields = Record<string, FsValue>;

export interface FsDocument {
  name: string;
  fields: FsFields;
}

export function projectDocuments(projectId: string): string {
  return `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents`;
}

export async function fsFetch(
  url: string,
  init: RequestInit,
  parent: AbortSignal
): Promise<Response> {
  const ac = new AbortController();
  const timer = window.setTimeout(() => ac.abort(), REQUEST_MS);
  const onAbort = () => ac.abort();
  if (parent.aborted) ac.abort();
  else parent.addEventListener('abort', onAbort, { once: true });
  try {
    return await fetch(url, { ...init, signal: ac.signal });
  } finally {
    window.clearTimeout(timer);
    parent.removeEventListener('abort', onAbort);
  }
}

export function bearer(idToken: string): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${idToken}`,
  };
}

export function readString(fields: FsFields, key: string): string {
  const value = fields[key]?.stringValue;
  return typeof value === 'string' ? value : '';
}

export function readInt(fields: FsFields, key: string): number {
  const raw = fields[key]?.integerValue;
  const number = typeof raw === 'string' ? Number(raw) : NaN;
  return Number.isFinite(number) ? number : 0;
}

export function readIntList(fields: FsFields, key: string): number[] {
  const values = fields[key]?.arrayValue?.values ?? [];
  const numbers: number[] = [];
  for (const value of values) {
    const number = typeof value.integerValue === 'string' ? Number(value.integerValue) : NaN;
    if (Number.isFinite(number)) numbers.push(number);
  }
  return numbers;
}

export function documentId(name: string): string {
  const parts = name.split('/');
  return parts[parts.length - 1] ?? '';
}

export function asDocuments(body: unknown): FsDocument[] {
  if (Array.isArray(body)) {
    const docs: FsDocument[] = [];
    for (const row of body) {
      if (!row || typeof row !== 'object') continue;
      const document = (row as { document?: FsDocument }).document;
      if (document?.name && document.fields) docs.push(document);
    }
    return docs;
  }
  if (!body || typeof body !== 'object') return [];
  const documents = (body as { documents?: FsDocument[] }).documents;
  if (!Array.isArray(documents)) return [];
  return documents.filter((document) => document?.name && document.fields);
}
