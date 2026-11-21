/**
 * Snapshot whether a save existed before Zustand persist can write one.
 * Import this before the game store so the read wins the race.
 */
const SAVE_KEY = 'ossuarian-first-urn-v1';

type BootFlags = {
  __ofuSaveExisted?: boolean;
  __ofuFreshThemeDue?: boolean;
};

function bootFlags(): BootFlags {
  return globalThis as BootFlags;
}

function readSaveExisted(): boolean {
  try {
    return localStorage.getItem(SAVE_KEY) != null;
  } catch {
    return false;
  }
}

const flags = bootFlags();
if (flags.__ofuSaveExisted === undefined) {
  flags.__ofuSaveExisted = readSaveExisted();
  flags.__ofuFreshThemeDue = !flags.__ofuSaveExisted;
}

/** True when localStorage already held a save at process start. */
export const saveExistedAtBoot = flags.__ofuSaveExisted === true;

/**
 * The first menu bed of a save-less launch is still the Ossuarian theme.
 * Stays true across HMR so a refresh of the module does not skip or repeat it.
 */
export function freshThemeDue(): boolean {
  return bootFlags().__ofuFreshThemeDue === true;
}

export function markFreshThemePlayed(): void {
  bootFlags().__ofuFreshThemeDue = false;
}
