import type { Player } from './types';
import type { GiftKind } from './types';
import { nativeVault, vaultGet, vaultRemove, vaultSet } from './vault';

export interface FirebasePublicConfig {
  apiKey: string;
  projectId: string;
}

interface Session {
  idToken: string;
  refreshToken: string;
  expiresAt: number;
}

const SESSION_KEY = 'master-urn-session';
const EMAIL_KEY = 'email';
const PASSWORD_KEY = 'password';
const ID_KEY = 'idToken';
const REFRESH_KEY = 'refreshToken';
const EXPIRES_KEY = 'expiresAt';

/** Runtime copy. The Android copy lives in the vault, not in web storage. */
let memory: Session | null = null;

export function readConfig(): FirebasePublicConfig {
  return {
    apiKey: clean(import.meta.env.VITE_FIREBASE_API_KEY),
    projectId: clean(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  };
}

export function configReady(config = readConfig()): boolean {
  return Boolean(config.apiKey && config.projectId);
}

export function savedSession(): boolean {
  return readSession() != null;
}

/** Load the vault before the first paint. Web keeps the tab session only. */
export async function restoreVault(): Promise<{ email: string; password: string; signedIn: boolean }> {
  if (!nativeVault()) {
    memory = readStoredSession();
    return { email: '', password: '', signedIn: memory != null };
  }
  const [email, password, idToken, refreshToken, expiresRaw] = await Promise.all([
    vaultGet(EMAIL_KEY),
    vaultGet(PASSWORD_KEY),
    vaultGet(ID_KEY),
    vaultGet(REFRESH_KEY),
    vaultGet(EXPIRES_KEY),
  ]);
  const expiresAt = Number(expiresRaw);
  memory =
    idToken && refreshToken && Number.isFinite(expiresAt)
      ? { idToken, refreshToken, expiresAt }
      : null;
  return { email: email ?? '', password: password ?? '', signedIn: memory != null };
}

/** Leave. The saved email and password stay so the next open is one tap. */
export async function clearSession(): Promise<void> {
  memory = null;
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* private mode */
  }
  if (!nativeVault()) return;
  await Promise.all([vaultRemove(ID_KEY), vaultRemove(REFRESH_KEY), vaultRemove(EXPIRES_KEY)]);
}

export async function signIn(email: string, password: string): Promise<void> {
  const config = readConfig();
  if (!configReady(config)) throw new Error('unconfigured');
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${encodeURIComponent(config.apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password, returnSecureToken: true }),
    }
  );
  if (!response.ok) throw new Error('signin');
  const body = (await response.json()) as {
    idToken?: string;
    refreshToken?: string;
    expiresIn?: string;
  };
  if (!body.idToken || !body.refreshToken) throw new Error('signin');
  if (nativeVault()) {
    await vaultSet(EMAIL_KEY, email.trim());
    await vaultSet(PASSWORD_KEY, password);
  }
  await writeSession(body.idToken, body.refreshToken, body.expiresIn);
}

export async function loadPlayers(): Promise<Player[]> {
  const token = await tokenOrThrow();
  const config = readConfig();
  const players: Player[] = [];
  let pageToken = '';
  for (let page = 0; page < 5; page += 1) {
    const url =
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}` +
      `/databases/(default)/documents/presence?pageSize=300` +
      (pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : '');
    const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error('load');
    const body = (await response.json()) as {
      documents?: Array<{ name?: string; fields?: Fields }>;
      nextPageToken?: string;
    };
    for (const document of body.documents ?? []) {
      if (!document.fields) continue;
      players.push(playerFrom(document.name ?? '', document.fields));
    }
    if (!body.nextPageToken) break;
    pageToken = body.nextPageToken;
  }
  return players;
}

export async function sendGift(input: {
  target: 'all' | string;
  kind: GiftKind;
  amount: number;
}): Promise<void> {
  const token = await tokenOrThrow();
  const config = readConfig();
  const fields = {
    target: { stringValue: input.target },
    kind: { stringValue: input.kind },
    amount: { integerValue: String(input.kind === 'remains' ? 1 : input.amount) },
    createdAt: { integerValue: String(Date.now()) },
  };
  const base =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}` +
    `/databases/(default)/documents`;
  const url =
    input.target === 'all'
      ? `${base}/commands`
      : `${base}/direct/${encodeURIComponent(input.target)}/commands`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ fields }),
  });
  if (!response.ok) throw new Error('gift');
}

export async function pushNews(text: string): Promise<void> {
  const token = await tokenOrThrow();
  const config = readConfig();
  const url =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}` +
    `/databases/(default)/documents/houseNews`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      fields: {
        text: { stringValue: text },
        createdAt: { integerValue: String(Date.now()) },
      },
    }),
  });
  if (!response.ok) throw new Error('news');
}

async function tokenOrThrow(): Promise<string> {
  const config = readConfig();
  if (!configReady(config)) throw new Error('unconfigured');
  const saved = readSession();
  if (!saved) throw new Error('signedout');
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
    }
  );
  if (!response.ok) {
    await clearSession();
    throw new Error('signedout');
  }
  const body = (await response.json()) as {
    id_token?: string;
    refresh_token?: string;
    expires_in?: string;
  };
  if (!body.id_token || !body.refresh_token) {
    await clearSession();
    throw new Error('signedout');
  }
  await writeSession(body.id_token, body.refresh_token, body.expires_in);
  return body.id_token;
}

type Fields = Record<string, { stringValue?: string; integerValue?: string; arrayValue?: { values?: Array<{ integerValue?: string }> } }>;

function playerFrom(name: string, fields: Fields): Player {
  const fromName = name.split('/').pop() ?? '';
  return {
    installId: str(fields, 'installId') || fromName,
    playerName: str(fields, 'playerName') || 'Mortician',
    firstSeen: num(fields, 'firstSeen') || num(fields, 'lastSeen'),
    lastSeen: num(fields, 'lastSeen'),
    sessionStartedAt: num(fields, 'sessionStartedAt'),
    sessionMs: num(fields, 'sessionMs'),
    recentSessionMs: (fields.recentSessionMs?.arrayValue?.values ?? [])
      .map((value) => Number(value.integerValue))
      .filter((value) => Number.isFinite(value)),
    versionName: str(fields, 'versionName'),
    versionCode: num(fields, 'versionCode'),
    platform: str(fields, 'platform') || 'web',
    cash: num(fields, 'cash'),
    reputation: num(fields, 'reputation'),
    intermentScore: num(fields, 'intermentScore'),
    ossilegiumGrams: num(fields, 'ossilegiumGrams'),
    urnsCount: num(fields, 'urnsCount'),
    casesHandled: num(fields, 'casesHandled'),
    careerXp: num(fields, 'careerXp'),
    rankTitle: str(fields, 'rankTitle'),
    homesKept: num(fields, 'homesKept'),
    activeStation: str(fields, 'activeStation') || 'OVERVIEW',
    ownedPropertyLabel: str(fields, 'ownedPropertyLabel'),
    ownedPropertyCity: str(fields, 'ownedPropertyCity'),
  };
}

function str(fields: Fields, key: string): string {
  return fields[key]?.stringValue ?? '';
}

function num(fields: Fields, key: string): number {
  const value = Number(fields[key]?.integerValue);
  return Number.isFinite(value) ? value : 0;
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function readSession(): Session | null {
  return memory ?? readStoredSession();
}

function readStoredSession(): Session | null {
  if (nativeVault()) return memory;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Session>;
    if (!parsed.idToken || !parsed.refreshToken || typeof parsed.expiresAt !== 'number') return null;
    return { idToken: parsed.idToken, refreshToken: parsed.refreshToken, expiresAt: parsed.expiresAt };
  } catch {
    return null;
  }
}

async function writeSession(idToken: string, refreshToken: string, expiresIn: string | undefined): Promise<void> {
  const seconds = Number(expiresIn);
  const expiresAt = Date.now() + (Number.isFinite(seconds) ? Math.max(0, seconds - 60) : 3000) * 1000;
  const saved: Session = { idToken, refreshToken, expiresAt };
  memory = saved;
  if (nativeVault()) {
    await vaultSet(ID_KEY, saved.idToken);
    await vaultSet(REFRESH_KEY, saved.refreshToken);
    await vaultSet(EXPIRES_KEY, String(saved.expiresAt));
    return;
  }
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(saved));
  } catch {
    /* the sitting still has the memory copy */
  }
}
