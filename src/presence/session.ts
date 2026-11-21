/** Foreground time only. A gap longer than the live window starts a new session. */
const SESSION_KEY = 'ossuarian-play-session';
const MAX_RECENT = 8;
export const LIVE_WINDOW_MS = 3 * 60 * 1000;

interface StoredSession {
  startedAt: number;
  accumulatedMs: number;
  lastTickAt: number;
  recent: number[];
  paused: boolean;
}

export interface SessionSnapshot {
  sessionStartedAt: number;
  sessionMs: number;
  recentSessionMs: number[];
}

export function noteForeground(now: number): SessionSnapshot {
  const session = load(now);
  if (session.paused) {
    const hidden = now - session.lastTickAt;
    session.paused = false;
    if (hidden > LIVE_WINDOW_MS) roll(session, now);
    session.lastTickAt = now;
    save(session);
    return snapshot(session);
  }
  const gap = now - session.lastTickAt;
  if (gap > LIVE_WINDOW_MS) roll(session, now);
  else if (gap > 0) session.accumulatedMs += gap;
  session.lastTickAt = now;
  save(session);
  return snapshot(session);
}

/** Stop the clock while the app is hidden. The hidden gap is not play time. */
export function pauseSession(now: number): void {
  const session = load(now);
  if (!session.paused) {
    const gap = now - session.lastTickAt;
    if (gap > 0 && gap <= LIVE_WINDOW_MS) session.accumulatedMs += gap;
    session.paused = true;
  }
  session.lastTickAt = now;
  save(session);
}

function roll(session: StoredSession, now: number): void {
  if (session.accumulatedMs >= 1000) {
    session.recent = [...session.recent, session.accumulatedMs].slice(-MAX_RECENT);
  }
  session.startedAt = now;
  session.accumulatedMs = 0;
}

function snapshot(session: StoredSession): SessionSnapshot {
  return {
    sessionStartedAt: session.startedAt,
    sessionMs: Math.max(0, Math.round(session.accumulatedMs)),
    recentSessionMs: session.recent.filter((n) => n > 0).slice(-MAX_RECENT),
  };
}

function load(now: number): StoredSession {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StoredSession>;
      if (
        typeof parsed.startedAt === 'number' &&
        typeof parsed.accumulatedMs === 'number' &&
        typeof parsed.lastTickAt === 'number' &&
        Array.isArray(parsed.recent)
      ) {
        return {
          startedAt: parsed.startedAt,
          accumulatedMs: parsed.accumulatedMs,
          lastTickAt: parsed.lastTickAt,
          recent: parsed.recent.filter((n) => typeof n === 'number' && n > 0).slice(-MAX_RECENT),
          paused: parsed.paused === true,
        };
      }
    }
  } catch {
    /* start a fresh local session */
  }
  return { startedAt: now, accumulatedMs: 0, lastTickAt: now, recent: [], paused: false };
}

function save(session: StoredSession): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* session length stays in memory for this beat only */
  }
}
