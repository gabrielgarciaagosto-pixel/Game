import { FAMILY_MINUTE_MS } from './familyUrnTiming';
import { DAY_MS, HOUR_MS } from './pacing';

/**
 * Family hour stays on the old scale for anything that still speaks it.
 * The overdraft clock counts wall time, including while the house is closed.
 */
export const FAMILY_HOUR_MS = 60 * FAMILY_MINUTE_MS;

/** Wall time overdrawn before the warning. It keeps running while the app is closed. */
export const BANK_WARNING_AFTER_MS = 24 * HOUR_MS;

/** Still negative after this much wall time, and the bank forecloses. */
export const BANK_FORECLOSURE_AFTER_MS = 72 * HOUR_MS;

/** One real day between loan and mortgage drafts. */
export const LOAN_INSTALLMENT_MS = 24 * HOUR_MS;

/**
 * After a payment comes due and the house cannot pay, the bank waits this long.
 * Two in-game days. An in-game day is one real day. Gabriel can change this.
 */
export const BANK_LOAN_GRACE_MS = 2 * DAY_MS;

export const BANK_PAYMENT_DUE =
  'A reminder from the bank: your payment is due.';
export const BANK_PAYMENT_OVERDUE =
  'A reminder from the bank: your payment is overdue.';
export const BANK_PAYMENT_DRAFTED = 'The bank drafted your payment.';

export const BANK_WARNING_MESSAGE =
  'BANK NOTICE: Your accounts are overdrawn. The clock keeps running while the house is closed. Restore a non-negative balance before 72 hours or the bank will foreclose.';

export const BANK_FORECLOSURE_TITLE = 'The parlor is closed';
export const BANK_FORECLOSURE_BODY =
  'The bank waited, and the payment did not come. They have taken the parlor. This house is no longer yours.';

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

/** Remaining wall time before foreclosure. Closed time counts. */
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
