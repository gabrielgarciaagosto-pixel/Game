import { FAMILY_MINUTE_MS } from './familyUrnTiming';

/**
 * In-game time scale for bank debt (state choice):
 * 1 family hour = 60 family minutes ≈ 6 real minutes.
 */
export const FAMILY_HOUR_MS = 60 * FAMILY_MINUTE_MS;

/** Continuous negative cash → bank warning + HUD countdown. */
export const BANK_WARNING_AFTER_MS = 2 * FAMILY_HOUR_MS;

/** Still negative after this → foreclosure game over. */
export const BANK_FORECLOSURE_AFTER_MS = 4 * FAMILY_HOUR_MS;

export const BANK_WARNING_MESSAGE =
  'BANK NOTICE: Your accounts are overdrawn. Restore a non-negative balance within 2 family hours or the bank will foreclose on Ossuarian.';

export const BANK_FORECLOSURE_TITLE = 'FORECLOSED';
export const BANK_FORECLOSURE_BODY =
  'The bank has seized the funeral home. Your license is revoked. All progress is lost.';

export function bankDebtElapsedMs(
  negativeCashSinceMs: number | null,
  nowMs: number
): number {
  if (negativeCashSinceMs == null) return 0;
  return Math.max(0, nowMs - negativeCashSinceMs);
}

export function bankMsUntilForeclosure(
  negativeCashSinceMs: number | null,
  nowMs: number
): number | null {
  if (negativeCashSinceMs == null) return null;
  return Math.max(
    0,
    BANK_FORECLOSURE_AFTER_MS - bankDebtElapsedMs(negativeCashSinceMs, nowMs)
  );
}

export function formatFamilyCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const familyMinutes = Math.floor(totalSec / (FAMILY_MINUTE_MS / 1000));
  const h = Math.floor(familyMinutes / 60);
  const m = familyMinutes % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}
