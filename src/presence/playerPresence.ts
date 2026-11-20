import { cleanHouseText, rememberHouseLines, type StoredHouseLine } from '../news/houseLines';
import { VERSION_CODE, VERSION_NAME } from '../version';
import { firebaseReady, readFirebaseConfig, type FirebasePublicConfig } from './config';
import { asDocuments, bearer, documentId, fsFetch, projectDocuments, readInt, readString, type FsFields } from './fsRest';
import { applyGift, giftAlreadySeen, markGiftSeen } from './gifts';
import { getInstallId } from './installId';
import { primeHouseWire } from './houseNotices';
import { playPlatform } from './platform';
import { collectPlayerStats } from './playerStats';
import { noteForeground, pauseSession, type SessionSnapshot } from './session';
import { SHARE_PLAY_COUNT_EVENT, sharePlayCount } from './sharePref';

/** Inside the 60 to 120 second range. The first ping is sooner so a live count is not a minute late. */
const INTERVAL_MS = 90_000;
const FIRST_MS = 2_000;

interface SavedAuth {
  idToken: string;
  refreshToken: string;
  localId: string;
  expiresAt: number;
}

const AUTH_KEY = 'ossuarian-anon-auth';

/**
 * Public player build. One beat at a time. A failed ping, gift check, or wire
 * read is ignored. The next try waits for the regular beat. Nothing is shown.
 */
export function startPlayerPresence(): () => void {
  if (!firebaseReady()) return () => {};

  let timer: number | null = null;
  let controller: AbortController | null = null;
  let stopped = false;

  const clearTimer = () => {
    if (timer != null) {
      window.clearTimeout(timer);
      timer = null;
    }
  };

  const abortInFlight = () => {
    controller?.abort();
    controller = null;
  };

  const canRun = () => !stopped && sharePlayCount() && document.visibilityState === 'visible';

  const schedule = (delay: number) => {
    clearTimer();
    if (!canRun()) return;
    timer = window.setTimeout(() => {
      timer = null;
      void beat();
    }, delay);
  };

  const beat = async () => {
    if (!canRun()) return;
    if (controller) return;
    const ac = new AbortController();
    controller = ac;
    try {
      const config = readFirebaseConfig();
      if (!firebaseReady(config) || !canRun()) return;
      const session = noteForeground(Date.now());
      let auth = await anonymousToken(config, ac.signal);
      if (!auth || !canRun()) return;
      const status = await writePresence(config, auth, session, ac.signal);
      const saved = readAuth();
      if (status === 401 && saved?.refreshToken && canRun()) {
        const refreshed = await refreshAnon(config, saved.refreshToken, ac.signal);
        if (refreshed && canRun()) {
          auth = refreshed;
          await writePresence(config, refreshed, session, ac.signal);
        }
      }
      if (!canRun()) return;
      await pullNews(config, auth, ac.signal);
      if (!canRun()) return;
      await pullGifts(config, auth, ac.signal);
    } catch {
      /* offline, a bad clock, or a missing project stays quiet */
    } finally {
      if (controller === ac) controller = null;
      if (canRun()) schedule(INTERVAL_MS);
    }
  };

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') {
      pauseSession(Date.now());
      clearTimer();
      abortInFlight();
      return;
    }
    if (canRun()) schedule(FIRST_MS);
  };

  const onShare = () => {
    if (!sharePlayCount()) {
      clearTimer();
      abortInFlight();
      return;
    }
    if (canRun()) schedule(FIRST_MS);
  };

  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener(SHARE_PLAY_COUNT_EVENT, onShare);
  if (canRun()) schedule(FIRST_MS);

  return () => {
    stopped = true;
    clearTimer();
    abortInFlight();
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener(SHARE_PLAY_COUNT_EVENT, onShare);
  };
}

async function pullNews(
  config: FirebasePublicConfig,
  auth: { idToken: string },
  signal: AbortSignal
): Promise<void> {
  const url = `${projectDocuments(config.projectId)}:runQuery`;
  const response = await fsFetch(
    url,
    {
      method: 'POST',
      headers: bearer(auth.idToken),
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'houseNews' }],
          orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
          limit: 5,
        },
      }),
    },
    signal
  );
  if (!response.ok) return;
  const lines: StoredHouseLine[] = [];
  for (const document of asDocuments(await response.json())) {
    const text = cleanHouseText(readString(document.fields, 'text'));
    const createdAt = readInt(document.fields, 'createdAt');
    const rawId = documentId(document.name).replace(/[^A-Za-z0-9]/g, '');
    if (!text || !rawId || createdAt <= 0) continue;
    lines.push({ id: `house${rawId}`, text, createdAt });
  }
  if (lines.length === 0) return;
  rememberHouseLines(lines);
  primeHouseWire();
}

async function pullGifts(
  config: FirebasePublicConfig,
  auth: { idToken: string; localId: string },
  signal: AbortSignal
): Promise<void> {
  const installId = getInstallId();
  const base = projectDocuments(config.projectId);
  const broadcasts = await queryGifts(
    `${base}:runQuery`,
    {
      structuredQuery: {
        from: [{ collectionId: 'commands' }],
        where: {
          fieldFilter: {
            field: { fieldPath: 'target' },
            op: 'EQUAL',
            value: { stringValue: 'all' },
          },
        },
        orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
        limit: 10,
      },
    },
    auth.idToken,
    signal
  );
  const directResponse = await fsFetch(
    `${base}/direct/${encodeURIComponent(installId)}:runQuery`,
    {
      method: 'POST',
      headers: bearer(auth.idToken),
      body: JSON.stringify({
        structuredQuery: {
          from: [{ collectionId: 'commands' }],
          orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }],
          limit: 10,
        },
      }),
    },
    signal
  );
  const direct = directResponse.ok ? asDocuments(await directResponse.json()) : [];
  const gifts = [...broadcasts, ...direct];
  gifts.sort((a, b) => giftRank(a.fields) - giftRank(b.fields));
  for (const gift of gifts) {
    if (!sharePlayCount() || signal.aborted || document.visibilityState === 'hidden') return;
    await consumeGift(gift, installId, auth, signal);
  }
}

function giftRank(fields: FsFields): number {
  return readString(fields, 'kind') === 'money' ? 0 : 1;
}

async function queryGifts(
  url: string,
  body: unknown,
  idToken: string,
  signal: AbortSignal
): Promise<Array<{ name: string; fields: FsFields }>> {
  const response = await fsFetch(
    url,
    { method: 'POST', headers: bearer(idToken), body: JSON.stringify(body) },
    signal
  );
  if (!response.ok) return [];
  return asDocuments(await response.json());
}

async function consumeGift(
  gift: { name: string; fields: FsFields },
  installId: string,
  auth: { idToken: string; localId: string },
  signal: AbortSignal
): Promise<void> {
  const kind = readString(gift.fields, 'kind');
  if (kind !== 'remains' && kind !== 'money') return;
  if (giftAlreadySeen(gift.name)) return;
  const receiptUrl = `https://firestore.googleapis.com/v1/${gift.name}/receipts/${encodeURIComponent(installId)}`;
  const existing = await fsFetch(receiptUrl, { headers: bearer(auth.idToken) }, signal);
  if (existing.ok) {
    markGiftSeen(gift.name);
    return;
  }
  if (existing.status !== 404) return;
  const amount = readInt(gift.fields, 'amount');
  const landed = applyGift(kind, kind === 'remains' ? 1 : amount);
  if (!landed) return;
  markGiftSeen(gift.name);
  await fsFetch(
    `https://firestore.googleapis.com/v1/${gift.name}/receipts?documentId=${encodeURIComponent(installId)}`,
    {
      method: 'POST',
      headers: bearer(auth.idToken),
      body: JSON.stringify({
        fields: {
          owner: { stringValue: auth.localId },
          consumedAt: { integerValue: String(Date.now()) },
        },
      }),
    },
    signal
  );
}

async function anonymousToken(
  config: FirebasePublicConfig,
  signal: AbortSignal
): Promise<{ idToken: string; localId: string } | null> {
  const saved = readAuth();
  if (saved && saved.expiresAt > Date.now() + 30_000) {
    return { idToken: saved.idToken, localId: saved.localId };
  }
  if (saved?.refreshToken) {
    const refreshed = await refreshAnon(config, saved.refreshToken, signal);
    if (refreshed) return refreshed;
    if (signal.aborted) return null;
  }
  if (saved?.refreshToken) return null;
  return signUpAnon(config, signal);
}

async function signUpAnon(
  config: FirebasePublicConfig,
  signal: AbortSignal
): Promise<{ idToken: string; localId: string } | null> {
  const response = await fsFetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(config.apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnSecureToken: true }),
    },
    signal
  );
  if (!response.ok) return null;
  const body = (await response.json()) as {
    idToken?: string;
    refreshToken?: string;
    localId?: string;
    expiresIn?: string;
  };
  if (!body.idToken || !body.refreshToken || !body.localId) return null;
  writeAuth(body.idToken, body.refreshToken, body.localId, body.expiresIn);
  return { idToken: body.idToken, localId: body.localId };
}

async function refreshAnon(
  config: FirebasePublicConfig,
  refreshToken: string,
  signal: AbortSignal
): Promise<{ idToken: string; localId: string } | null> {
  const response = await fsFetch(
    `https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(config.apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    },
    signal
  );
  if (!response.ok) return null;
  const body = (await response.json()) as {
    id_token?: string;
    refresh_token?: string;
    user_id?: string;
    expires_in?: string;
  };
  if (!body.id_token || !body.refresh_token || !body.user_id) return null;
  writeAuth(body.id_token, body.refresh_token, body.user_id, body.expires_in);
  return { idToken: body.id_token, localId: body.user_id };
}

async function writePresence(
  config: FirebasePublicConfig,
  auth: { idToken: string; localId: string },
  session: SessionSnapshot,
  signal: AbortSignal
): Promise<number> {
  const installId = getInstallId();
  const now = Date.now();
  const stats = collectPlayerStats(now);
  const recent = session.recentSessionMs
    .filter((ms) => Number.isFinite(ms) && ms > 0 && ms < 48 * 60 * 60 * 1000)
    .slice(-8);
  const fields: FsFields = {
    owner: { stringValue: auth.localId },
    installId: { stringValue: installId },
    versionName: { stringValue: VERSION_NAME },
    versionCode: { integerValue: String(VERSION_CODE) },
    platform: { stringValue: playPlatform() },
    firstSeen: { integerValue: String(stats.firstSeen) },
    lastSeen: { integerValue: String(now) },
    sessionStartedAt: { integerValue: String(session.sessionStartedAt) },
    sessionMs: { integerValue: String(Math.min(session.sessionMs, 48 * 60 * 60 * 1000 - 1)) },
    recentSessionMs: {
      arrayValue: {
        values: recent.map((ms) => ({ integerValue: String(Math.round(ms)) })),
      },
    },
    playerName: { stringValue: stats.playerName },
    cash: { integerValue: String(stats.cash) },
    reputation: { integerValue: String(stats.reputation) },
    intermentScore: { integerValue: String(stats.intermentScore) },
    ossilegiumGrams: { integerValue: String(stats.ossilegiumGrams) },
    urnsCount: { integerValue: String(stats.urnsCount) },
    casesHandled: { integerValue: String(stats.casesHandled) },
    careerXp: { integerValue: String(stats.careerXp) },
    rankTitle: { stringValue: stats.rankTitle },
    homesKept: { integerValue: String(stats.homesKept) },
    activeStation: { stringValue: stats.activeStation },
    ownedPropertyLabel: { stringValue: stats.ownedPropertyLabel },
    ownedPropertyCity: { stringValue: stats.ownedPropertyCity },
  };
  const mask = Object.keys(fields)
    .map((name) => `updateMask.fieldPaths=${encodeURIComponent(name)}`)
    .join('&');
  const url = `${projectDocuments(config.projectId)}/presence/${encodeURIComponent(installId)}?${mask}`;
  const patch = await fsFetch(
    url,
    {
      method: 'PATCH',
      headers: bearer(auth.idToken),
      body: JSON.stringify({ fields }),
    },
    signal
  );
  if (patch.ok || patch.status !== 404) return patch.status;
  const created = await fsFetch(
    `${projectDocuments(config.projectId)}/presence?documentId=${encodeURIComponent(installId)}`,
    {
      method: 'POST',
      headers: bearer(auth.idToken),
      body: JSON.stringify({ fields }),
    },
    signal
  );
  return created.status;
}

function readAuth(): SavedAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedAuth>;
    if (!parsed.refreshToken || !parsed.localId || !parsed.idToken) return null;
    if (typeof parsed.expiresAt !== 'number') return null;
    return {
      idToken: parsed.idToken,
      refreshToken: parsed.refreshToken,
      localId: parsed.localId,
      expiresAt: parsed.expiresAt,
    };
  } catch {
    return null;
  }
}

function writeAuth(idToken: string, refreshToken: string, localId: string, expiresIn: string | undefined): void {
  const seconds = Number(expiresIn);
  const expiresAt = Date.now() + (Number.isFinite(seconds) ? Math.max(0, seconds - 60) : 3000) * 1000;
  try {
    const saved: SavedAuth = { idToken, refreshToken, localId, expiresAt };
    localStorage.setItem(AUTH_KEY, JSON.stringify(saved));
  } catch {
    /* the next open will sign in again */
  }
}
