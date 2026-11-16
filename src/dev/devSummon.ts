import { useSyncExternalStore } from 'react';
import { DEV_TOOLS } from './flags';

/**
 * The DEV button stays hidden until the URNS chip is tapped seven times
 * inside a short window. Nothing is written to disk, so a fresh launch
 * starts hidden again.
 */
const NEED = 7;
const WINDOW_MS = 4000;

let summoned = false;
let taps: number[] = [];
const listeners = new Set<() => void>();

function emit(): void {
  listeners.forEach((fn) => fn());
}

export function isDevSummoned(): boolean {
  return summoned;
}

export function subscribeDevSummon(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function noteUrnsTap(): void {
  if (!DEV_TOOLS || summoned) return;
  const now = performance.now();
  taps = taps.filter((t) => now - t <= WINDOW_MS);
  taps.push(now);
  if (taps.length >= NEED) {
    summoned = true;
    taps = [];
    emit();
  }
}

export function hideDevTools(): void {
  if (!summoned) return;
  summoned = false;
  taps = [];
  emit();
}

export function useDevSummoned(): boolean {
  return useSyncExternalStore(subscribeDevSummon, isDevSummoned, () => false);
}
