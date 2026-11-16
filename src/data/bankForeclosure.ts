import { FAMILY_MINUTE_MS } from './familyUrnTiming';
import { HOUR_MS } from './pacing';

/**
 * Family hour stays on the old scale for anything that still speaks it.
 * The overdraft clock does not. It counts open parlor time only.
 */
export const FAMILY_HOUR_MS = 60 * FAMILY_MINUTE_MS;

/** Open-parlor time overdrawn before the warning. Pauses while the app is closed. */
export const BANK_WARNING_AFTER_MS = 24 * HOUR_MS;

/** Still negative after this much open-parlor time → foreclosure. */
export const BANK_FORECLOSURE_AFTER_MS = 72 * HOUR_MS;

/** One real day between loan and mortgage drafts. */
export const LOAN_INSTALLMENT_MS = 24 * HOUR_MS;

export const BANK_WARNING_MESSAGE =
  'BANK NOTICE: Your accounts are overdrawn. This notice arrives after 24 hours of open parlor time. Restore a non-negative balance before 72 hours of open parlor time or the bank will foreclose. This clock pauses while Ossuarian is closed.';

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

/** Remaining open-parlor time before foreclosure. Ignores time the app was closed. */
export function foreclosureMsRemaining(accruedMs: number): number {
  return Math.max(0, BANK_FORECLOSURE_AFTER_MS - Math.max(0, accruedMs));
}

export function formatRealCountdown(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  if (h >= 48) {
    const d = Math.floor(h / 24);
    const rh = h % 24;
    return rh > 0 ? `${d}d ${rh}h` : `${d}d`;
  }
  return `${h}h ${String(m).padStart(2, '0')}m`;
}

export function formatFamilyCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const familyMinutes = Math.floor(totalSec / (FAMILY_MINUTE_MS / 1000));
  const h = Math.floor(familyMinutes / 60);
  const m = familyMinutes % 60;
  return `${h}h ${String(m).padStart(2, '0')}m`;
}
