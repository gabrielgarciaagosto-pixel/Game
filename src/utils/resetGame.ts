import { useGameStore, pauseGamePersistWrites, resumeGamePersistWrites } from '../store/useGameStore';
import { AUDIO_PREFS_KEY } from './audioManager';
import { clearClockOffsetStorage } from './gameNow';

const KNOWN_STORAGE_KEYS = [
  'ossuarian-first-urn-v1',
  'ossuarian-dev-clock-offset',
  'ossuarian-dev-fab-pos',
  'ossuarian-dev-intake',
] as const;

function wipeBrowserStorage() {
  clearClockOffsetStorage();

  try {
    sessionStorage.removeItem('ofu-demo-urn-phase');
    const sessionKill: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (k && (k.startsWith('ossuarian') || k.startsWith('ofu-'))) {
        sessionKill.push(k);
      }
    }
    for (const k of sessionKill) sessionStorage.removeItem(k);
  } catch {
    /* ignore */
  }

  try {
    for (const key of KNOWN_STORAGE_KEYS) {
      localStorage.removeItem(key);
    }
    const toRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k === AUDIO_PREFS_KEY) continue;
      if (k && (k.startsWith('ossuarian') || k.startsWith('ofu-'))) {
        toRemove.push(k);
      }
    }
    for (const k of toRemove) localStorage.removeItem(k);
  } catch {
    /* ignore */
  }

  try {
    if (typeof indexedDB?.databases === 'function') {
      void indexedDB.databases().then((dbs) => {
        for (const db of dbs) {
          if (
            db.name &&
            (db.name.includes('ossuarian') || db.name.includes('ofu-'))
          ) {
            indexedDB.deleteDatabase(db.name);
          }
        }
      });
    }
  } catch {
    /* ignore */
  }
}

/**
 * Capacitor-safe full wipe → title screen.
 * Pause persist writes, clear storage, then hard-reset in memory.
 * No native confirm and no location.reload dependency.
 */
export function resetGame(toast?: string | null) {
  pauseGamePersistWrites();

  try {
    resumeGamePersistWrites();
    useGameStore.persist.clearStorage();
  } catch {
    /* ignore */
  }
  wipeBrowserStorage();
  pauseGamePersistWrites();

  useGameStore.getState().hardResetGameState(toast);

  window.setTimeout(() => {
    try {
      resumeGamePersistWrites();
      useGameStore.setState((s) => ({ intakeToast: s.intakeToast }));
    } catch {
      /* ignore */
    }
  }, 150);
}
