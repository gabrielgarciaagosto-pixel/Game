import type { Player } from './types';
import type { GiftKind } from './types';

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

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

/** The password is used for this call only. It is not written to storage. */
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
  writeSession(body.idToken, body.refreshToken, body.expiresIn);
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
    clearSession();
    throw new Error('signedout');
  }
  const body = (await response.json()) as {
    id_token?: string;
    refresh_token?: string;
    expires_in?: string;
  };
  if (!body.id_token || !body.refresh_token) {
    clearSession();
    throw new Error('signedout');
  }
  writeSession(body.id_token, body.refresh_token, body.expires_in);
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

function writeSession(idToken: string, refreshToken: string, expiresIn: string | undefined): void {
  const seconds = Number(expiresIn);
  const expiresAt = Date.now() + (Number.isFinite(seconds) ? Math.max(0, seconds - 60) : 3000) * 1000;
  const saved: Session = { idToken, refreshToken, expiresAt };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(saved));
}
