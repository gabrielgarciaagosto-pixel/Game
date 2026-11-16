import type { DecedentCase, DispositionDirective } from '../types/game';
import type { CremationPermitStatus, DecedentVitals } from './decedentVitals';
import {
  formatTod,
  formatVitalsDob,
  formatVitalsDod,
  formatVitalsTod,
} from './decedentVitals';
import { FAMILY_MINUTE_MS } from './familyUrnTiming';

/** Cremation path directives require a state cremation permit. */
export function directiveNeedsCremationPermit(
  directive: DispositionDirective
): boolean {
  return (
    directive === 'CREMATION_DIRECT' ||
    directive === 'VIEWING_THEN_CREMATION' ||
    directive === 'CREMATION_THEN_VIEWING'
  );
}

export function initialPermitStatus(
  directive: DispositionDirective
): CremationPermitStatus {
  return directiveNeedsCremationPermit(directive) ? 'NONE' : 'NOT_REQUIRED';
}

export interface PermitFormDraft {
  legalName: string;
  dateOfBirth: string; // YYYY-MM-DD
  dateOfDeath: string;
  /**
   * Time of death. A finished VR-441 value is 12-hour text ("4:15 AM").
   * While the hour is still blank the draft may be "" or ":15 PM"; those
   * fragments are not a time. Matching also accepts legacy 24-hour HHMM and HH:MM.
   */
  timeOfDeath: string;
  placeOfBirth: string;
}

export interface PermitMismatch {
  field: keyof PermitFormDraft;
  label: string;
}

export function vitalsToFormDefaults(
  name: string,
  vitals: DecedentVitals
): PermitFormDraft {
  return {
    legalName: name,
    dateOfBirth: formatVitalsDob(vitals),
    dateOfDeath: formatVitalsDod(vitals),
    timeOfDeath: formatVitalsTod(vitals),
    placeOfBirth: vitals.placeOfBirth,
  };
}

export function emptyPermitForm(): PermitFormDraft {
  return {
    legalName: '',
    dateOfBirth: '',
    dateOfDeath: '',
    timeOfDeath: '',
    placeOfBirth: '',
  };
}

/**
 * Normalize TOD for exact match into 4-digit 24-hour HHMM.
 * "4:15 AM" and "04:15 AM" → "0415". "9:40 PM" → "2140".
 * Legacy "09:30" and "0930" still match. "930" / "9:30" without AM/PM do not.
 * A draft fragment ":15 PM" (hour not chosen yet) does not match.
 */
export function normalizeTodToHhmm(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  const twelve = trimmed.match(/^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/);
  if (twelve) {
    let h = Number(twelve[1]);
    const min = Number(twelve[2]);
    const pm = twelve[3].toUpperCase() === 'PM';
    if (h < 1 || h > 12 || min < 0 || min > 59) return null;
    if (h === 12) h = pm ? 12 : 0;
    else if (pm) h += 12;
    return `${String(h).padStart(2, '0')}${String(min).padStart(2, '0')}`;
  }
  const digits = trimmed.replace(/:/g, '');
  if (!/^\d{4}$/.test(digits)) return null;
  const h = Number(digits.slice(0, 2));
  const min = Number(digits.slice(2, 4));
  if (!Number.isFinite(h) || !Number.isFinite(min)) return null;
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return digits;
}

/** @deprecated Prefer normalizeTodToHhmm — kept for callers expecting HH:MM. */
export function normalizeTodInput(raw: string): string {
  const hhmm = normalizeTodToHhmm(raw);
  if (!hhmm) return raw.trim();
  return formatTod(Number(hhmm.slice(0, 2)), Number(hhmm.slice(2, 4)));
}

export function findPermitMismatches(
  form: PermitFormDraft,
  legalName: string,
  vitals: DecedentVitals
): PermitMismatch[] {
  const expected = vitalsToFormDefaults(legalName, vitals);
  const mismatches: PermitMismatch[] = [];
  if (form.legalName.trim() !== expected.legalName.trim()) {
    mismatches.push({ field: 'legalName', label: 'Legal name' });
  }
  if (form.dateOfBirth.trim() !== expected.dateOfBirth) {
    mismatches.push({ field: 'dateOfBirth', label: 'Date of birth' });
  }
  if (form.dateOfDeath.trim() !== expected.dateOfDeath) {
    mismatches.push({ field: 'dateOfDeath', label: 'Date of death' });
  }
  const formTod = normalizeTodToHhmm(form.timeOfDeath);
  const expectedTod = normalizeTodToHhmm(expected.timeOfDeath);
  if (formTod == null || expectedTod == null || formTod !== expectedTod) {
    mismatches.push({ field: 'timeOfDeath', label: 'Time of death' });
  }
  if (form.placeOfBirth.trim() !== expected.placeOfBirth) {
    mismatches.push({ field: 'placeOfBirth', label: 'Place of birth' });
  }
  return mismatches;
}

function caseVitals(c: DecedentCase): DecedentVitals {
  return {
    dateOfBirthMs: c.dateOfBirthMs,
    dateOfDeathMs: c.dateOfDeathMs,
    timeOfDeathHour: c.timeOfDeathHour,
    timeOfDeathMinute: c.timeOfDeathMinute,
    placeOfBirth: c.placeOfBirth,
  };
}

/**
 * Exact all-fields match against held cremation cases.
 * Mixed vitals from two files → no match. 0 or 2+ hits → null.
 */
export function findExactPermitCaseMatch(
  form: PermitFormDraft,
  cases: DecedentCase[]
): DecedentCase | null {
  const candidates = cases.filter(
    (c) =>
      directiveNeedsCremationPermit(c.directive) &&
      !c.isCremated &&
      c.isTagged &&
      c.cremationPermitStatus !== 'APPROVED' &&
      c.cremationPermitStatus !== 'PENDING'
  );
  const hits = candidates.filter(
    (c) => findPermitMismatches(form, c.name, caseVitals(c)).length === 0
  );
  return hits.length === 1 ? hits[0]! : null;
}

/** Short in-game evaluation window (~8–14 family minutes). */
export function rollPermitEvaluationDueAt(nowMs: number): number {
  const minutes = 8 + Math.floor(Math.random() * 7);
  return nowMs + minutes * FAMILY_MINUTE_MS;
}

/** State filing fee charged on every VR-441 submit (correct or wrong). */
export function rollPermitFilingFee(): number {
  return 50 + Math.floor(Math.random() * 101); // $50–$150
}

export const UNPERMITTED_CREMATION_FINE = 1500;
export const UNPERMITTED_CREMATION_REP_HIT = 25;
export const PERMIT_ERROR_STREAK_LIMIT = 3;
export const PERMIT_ERROR_STREAK_FINE = 500;
export const PERMIT_ERROR_STREAK_REP_HIT = 10;

export const PERMIT_REJECT_GENERIC =
  'Vital records could not be verified — needs correction.';

export interface PermitSubmissionRecord {
  id: string;
  /** Null when vitals matched no held case (wrong / mixed). */
  caseId: string | null;
  decedentName: string;
  submittedAt: number;
  evaluatesAt: number;
  /**
   * Foreground milliseconds left before Vital Records answers.
   * Missing on older saves; the next open tick starts the short race over
   * instead of resolving it while the app was closed.
   */
  remainingMs?: number;
  evaluatedAt: number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  /** Empty when exact match; non-empty / sentinel for wrong filings. */
  mismatchLabels: string[];
  form: PermitFormDraft;
  filingFee: number;
}

export interface FinanceLedgerEntry {
  id: string;
  at: number;
  /** Negative = outflow */
  amount: number;
  label: string;
  kind: 'PERMIT_FEE' | 'FINE' | 'OTHER';
}
