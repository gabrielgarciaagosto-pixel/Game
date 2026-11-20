import {
  VERSION_CODE,
  VERSION_FEED_URL,
  VERSION_NAME,
} from '../version.ts';

export type VersionOffer = {
  versionName: string;
  versionCode: number;
  apkUrl: string;
  notes?: string;
};

const FEED_TIMEOUT_MS = 4000;

/** One request for the whole launch, shared if the screen mounts twice. */
let flight: Promise<VersionOffer | null> | null = null;
/** Later, Download, or Back. A remount must not ask again. */
let silenced = false;

export function silenceUpdateNotice(): void {
  silenced = true;
}

function versionParts(name: string): number[] {
  return (name.match(/\d+/g) ?? []).map((part) => Number(part));
}

/** Positive when `remote` is a newer dotted name than `installed`. */
export function compareVersionNames(remote: string, installed: string): number {
  const a = versionParts(remote);
  const b = versionParts(installed);
  const count = Math.max(a.length, b.length);
  for (let i = 0; i < count; i += 1) {
    const diff = (a[i] ?? 0) - (b[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

export function isNewerRelease(
  installedCode: number,
  installedName: string,
  remoteCode: number | null,
  remoteName: string
): boolean {
  if (remoteCode != null && Number.isFinite(remoteCode)) {
    return remoteCode > installedCode;
  }
  if (!remoteName) return false;
  return compareVersionNames(remoteName, installedName) > 0;
}

function httpsDownload(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:') return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function parseVersionOffer(raw: unknown): VersionOffer | null {
  if (!raw || typeof raw !== 'object') return null;
  const row = raw as {
    versionName?: unknown;
    versionCode?: unknown;
    apkUrl?: unknown;
    notes?: unknown;
  };
  const apkUrl = httpsDownload(row.apkUrl);
  if (!apkUrl) return null;
  const versionName = typeof row.versionName === 'string' ? row.versionName.trim() : '';
  const versionCode =
    typeof row.versionCode === 'number' && Number.isFinite(row.versionCode)
      ? row.versionCode
      : null;
  if (
    !isNewerRelease(VERSION_CODE, VERSION_NAME, versionCode, versionName) ||
    versionCode == null
  ) {
    return null;
  }
  const notes =
    typeof row.notes === 'string' && row.notes.trim()
      ? row.notes.trim().slice(0, 160)
      : undefined;
  return { versionName, versionCode, apkUrl, notes };
}

/**
 * One try per launch. A miss, a bad file, or no network returns null.
 * Does not throw.
 */
export function checkForUpdate(): Promise<VersionOffer | null> {
  if (silenced) return Promise.resolve(null);
  if (flight) return flight;
  if (typeof fetch !== 'function') {
    flight = Promise.resolve(null);
    return flight;
  }
  const ctrl = new AbortController();
  const timer = window.setTimeout(() => ctrl.abort(), FEED_TIMEOUT_MS);
  flight = fetch(VERSION_FEED_URL, { signal: ctrl.signal, cache: 'no-store' })
    .then((res) => (res.ok ? res.json() : null))
    .then((raw) => parseVersionOffer(raw))
    .catch(() => null)
    .finally(() => window.clearTimeout(timer));
  return flight;
}

export function openUpdateDownload(url: string): void {
  const safe = httpsDownload(url);
  if (!safe) return;
  const opened = window.open(safe, '_blank', 'noopener,noreferrer');
  if (opened) return;
  const link = document.createElement('a');
  link.href = safe;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.click();
}
