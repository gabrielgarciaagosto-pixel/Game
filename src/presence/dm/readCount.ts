import { aggregatePresence, type CountReport, type PresenceRow } from '../aggregate';
import { firebaseReady, readFirebaseConfig, type FirebasePublicConfig } from '../config';

const DM_AUTH_KEY = 'ossuarian-dm-auth';

interface DmAuth {
  idToken: string;
  refreshToken: string;
  expiresAt: number;
  email: string;
}

export function masterConfigured(): boolean {
  return firebaseReady();
}

export function parlorSignedIn(): boolean {
  const saved = readDmAuth();
  return Boolean(saved?.refreshToken);
}

export async function signInParlor(email: string, password: string, signal: AbortSignal): Promise<void> {
  const config = readFirebaseConfig();
  if (!firebaseReady(config)) throw new Error('unconfigured');
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(config.apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
      signal,
    }
  );
  if (!response.ok) throw new Error('signin');
  const body = (await response.json()) as {
    idToken?: string;
    refreshToken?: string;
    expiresIn?: string;
  };
  if (!body.idToken || !body.refreshToken) throw new Error('signin');
  writeDmAuth(body.idToken, body.refreshToken, email, body.expiresIn);
}

export function signOutParlor(): void {
  try {
    localStorage.removeItem(DM_AUTH_KEY);
  } catch {
    /* already signed out */
  }
}

export async function readPlayerCount(signal: AbortSignal): Promise<CountReport> {
  const config = readFirebaseConfig();
  if (!firebaseReady(config)) throw new Error('unconfigured');
  const token = await dmToken(config, signal);
  if (!token) throw new Error('signin');
  const rows = await listPresence(config, token, signal);
  return aggregatePresence(rows, Date.now());
}

async function dmToken(config: FirebasePublicConfig, signal: AbortSignal): Promise<string | null> {
  const saved = readDmAuth();
  if (!saved) return null;
  if (saved.expiresAt > Date.now() + 30_000) return saved.idToken;
  const response = await fetch(
    `https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(config.apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: saved.refreshToken,
      }),
      signal,
    }
  );
  if (!response.ok) return null;
  const body = (await response.json()) as {
    id_token?: string;
    refresh_token?: string;
    expires_in?: string;
  };
  if (!body.id_token || !body.refresh_token) return null;
  writeDmAuth(body.id_token, body.refresh_token, saved.email, body.expires_in);
  return body.id_token;
}

async function listPresence(
  config: FirebasePublicConfig,
  idToken: string,
  signal: AbortSignal
): Promise<PresenceRow[]> {
  const rows: PresenceRow[] = [];
  let pageToken = '';
  for (let page = 0; page < 5; page += 1) {
    const url = new URL(
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}/databases/(default)/documents/presence`
    );
    url.searchParams.set('pageSize', '300');
    if (pageToken) url.searchParams.set('pageToken', pageToken);
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${idToken}` },
      signal,
    });
    if (response.status === 404) return rows;
    if (!response.ok) throw new Error('read');
    const body = (await response.json()) as {
      documents?: RawDoc[];
      nextPageToken?: string;
    };
    for (const doc of body.documents ?? []) {
      const row = toRow(doc);
      if (row) rows.push(row);
    }
    if (!body.nextPageToken) break;
    pageToken = body.nextPageToken;
  }
  return rows;
}

interface FsValue {
  stringValue?: string;
  integerValue?: string;
  arrayValue?: { values?: FsValue[] };
}

interface RawDoc {
  fields?: Record<string, FsValue>;
}

function toRow(doc: RawDoc): PresenceRow | null {
  const fields = doc.fields;
  if (!fields) return null;
  const lastSeen = intField(fields.lastSeen);
  if (lastSeen == null) return null;
  return {
    versionName: stringField(fields.versionName) ?? 'Unknown',
    versionCode: intField(fields.versionCode) ?? 0,
    lastSeen,
    sessionMs: intField(fields.sessionMs) ?? 0,
    recentSessionMs: listField(fields.recentSessionMs),
  };
}

function stringField(value: FsValue | undefined): string | null {
  return value?.stringValue ?? null;
}

function intField(value: FsValue | undefined): number | null {
  if (!value?.integerValue) return null;
  const n = Number(value.integerValue);
  return Number.isFinite(n) ? n : null;
}

function listField(value: FsValue | undefined): number[] {
  const values = value?.arrayValue?.values ?? [];
  const numbers: number[] = [];
  for (const item of values) {
    const n = intField(item);
    if (n != null) numbers.push(n);
  }
  return numbers;
}

function readDmAuth(): DmAuth | null {
  try {
    const raw = localStorage.getItem(DM_AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DmAuth>;
    if (!parsed.idToken || !parsed.refreshToken || typeof parsed.expiresAt !== 'number') return null;
    return {
      idToken: parsed.idToken,
      refreshToken: parsed.refreshToken,
      expiresAt: parsed.expiresAt,
      email: typeof parsed.email === 'string' ? parsed.email : '',
    };
  } catch {
    return null;
  }
}

function writeDmAuth(idToken: string, refreshToken: string, email: string, expiresIn: string | undefined): void {
  const seconds = Number(expiresIn);
  const expiresAt = Date.now() + (Number.isFinite(seconds) ? Math.max(0, seconds - 60) : 3000) * 1000;
  try {
    const saved: DmAuth = { idToken, refreshToken, expiresAt, email };
    localStorage.setItem(DM_AUTH_KEY, JSON.stringify(saved));
  } catch {
    /* the sign-in still works until this page closes */
  }
}
