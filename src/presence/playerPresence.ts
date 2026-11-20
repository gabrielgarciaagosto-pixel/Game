import { VERSION_CODE, VERSION_NAME } from '../version';
import { firebaseReady, readFirebaseConfig, type FirebasePublicConfig } from './config';
import { getInstallId } from './installId';
import { playPlatform } from './platform';
import { noteForeground, pauseSession, type SessionSnapshot } from './session';
import { SHARE_PLAY_COUNT_EVENT, sharePlayCount } from './sharePref';

/** Inside the 60 to 120 second range. The first ping is sooner so a live count is not a minute late. */
const INTERVAL_MS = 90_000;
const FIRST_MS = 2_000;
const REQUEST_MS = 8_000;

interface SavedAuth {
  idToken: string;
  refreshToken: string;
  localId: string;
  expiresAt: number;
}

const AUTH_KEY = 'ossuarian-anon-auth';

/**
 * Public player build only. One ping at a time. Failures are ignored.
 * The Dungeon Master build does not import this module.
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
    const timeout = window.setTimeout(() => ac.abort(), REQUEST_MS);
    try {
      const config = readFirebaseConfig();
      if (!firebaseReady(config)) return;
      const session = noteForeground(Date.now());
      let auth = await anonymousToken(config, ac.signal);
      if (!auth || !canRun()) return;
      const status = await writePresence(config, auth, session, ac.signal);
      const saved = readAuth();
      if (status === 401 && saved?.refreshToken && canRun()) {
        const refreshed = await refreshAnon(config, saved.refreshToken, ac.signal);
        if (refreshed && canRun()) await writePresence(config, refreshed, session, ac.signal);
      }
    } catch {
      /* offline, a bad clock, or a missing project stays quiet */
    } finally {
      window.clearTimeout(timeout);
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
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${encodeURIComponent(config.apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ returnSecureToken: true }),
      signal,
    }
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
  const response = await fetch(
    `https://securetoken.googleapis.com/v1/token?key=${encodeURIComponent(config.apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
      signal,
    }
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
  const fields = {
    owner: { stringValue: auth.localId },
    installId: { stringValue: installId },
    versionName: { stringValue: VERSION_NAME },
    versionCode: { integerValue: String(VERSION_CODE) },
    platform: { stringValue: playPlatform() },
    lastSeen: { integerValue: String(Date.now()) },
    sessionStartedAt: { integerValue: String(session.sessionStartedAt) },
    sessionMs: { integerValue: String(session.sessionMs) },
    recentSessionMs: {
      arrayValue: {
        values: session.recentSessionMs.map((ms) => ({ integerValue: String(Math.round(ms)) })),
      },
    },
  };
  const mask = Object.keys(fields)
    .map((name) => `updateMask.fieldPaths=${encodeURIComponent(name)}`)
    .join('&');
  const url =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}` +
    `/databases/(default)/documents/presence/${encodeURIComponent(installId)}?${mask}`;
  const patch = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.idToken}`,
    },
    body: JSON.stringify({ fields }),
    signal,
  });
  if (patch.ok || patch.status !== 404) return patch.status;
  const createUrl =
    `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(config.projectId)}` +
    `/databases/(default)/documents/presence?documentId=${encodeURIComponent(installId)}`;
  const created = await fetch(createUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${auth.idToken}`,
    },
    body: JSON.stringify({ fields }),
    signal,
  });
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
