import type { Player } from './types';

const LIVE_MS = 3 * 60 * 1000;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_SESSION_MS = 48 * 60 * 60 * 1000;

export interface VersionCount {
  versionName: string;
  versionCode: number;
  players: number;
}

export interface CountReport {
  live: number;
  today: number;
  week: number;
  averageSessionMs: number | null;
  versions: VersionCount[];
}

export function aggregatePlayers(players: readonly Player[], now: number): CountReport {
  const today = new Date(now).toISOString().slice(0, 10);
  let live = 0;
  let todayCount = 0;
  let week = 0;
  const samples: number[] = [];
  const versions = new Map<string, VersionCount>();

  for (const player of players) {
    if (!Number.isFinite(player.lastSeen)) continue;
    const age = now - player.lastSeen;
    if (age <= LIVE_MS && age >= -60_000) live += 1;
    if (new Date(player.lastSeen).toISOString().slice(0, 10) === today) todayCount += 1;
    if (age > WEEK_MS || age < -60_000) continue;
    week += 1;
    if (sane(player.sessionMs)) samples.push(player.sessionMs);
    for (const sample of player.recentSessionMs) {
      if (sane(sample)) samples.push(sample);
    }
    const versionName = player.versionName || 'Unknown';
    const versionCode = Number.isFinite(player.versionCode) ? player.versionCode : 0;
    const key = `${versionName}\n${versionCode}`;
    const current = versions.get(key) ?? { versionName, versionCode, players: 0 };
    current.players += 1;
    versions.set(key, current);
  }

  const averageSessionMs = samples.length
    ? Math.round(samples.reduce((sum, sample) => sum + sample, 0) / samples.length)
    : null;
  const versionList = [...versions.values()].sort(
    (a, b) => b.players - a.players || b.versionCode - a.versionCode
  );
  return { live, today: todayCount, week, averageSessionMs, versions: versionList };
}

export function formatSessionLength(ms: number | null): string {
  if (ms == null) return 'No sessions yet';
  const minutes = Math.round(ms / 60000);
  if (minutes < 1) return 'Under a minute';
  if (minutes === 1) return '1 minute';
  if (minutes < 60) return `${minutes} minutes`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hourLabel = hours === 1 ? '1 hour' : `${hours} hours`;
  if (rest === 0) return hourLabel;
  const minuteLabel = rest === 1 ? '1 minute' : `${rest} minutes`;
  return `${hourLabel} ${minuteLabel}`;
}

export function ago(then: number, now: number): string {
  const minutes = Math.round(Math.max(0, now - then) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 36) return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}

function sane(ms: number): boolean {
  return Number.isFinite(ms) && ms > 0 && ms < MAX_SESSION_MS;
}
