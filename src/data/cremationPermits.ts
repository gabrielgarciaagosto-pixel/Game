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
  /** 24h time — VR-441 uses 4-digit HHMM; HH:MM also accepted when matching. */
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
 * Normalize TOD for exact match: strip colons → 4-digit HHMM with leading zeros.
 * "09:30" and "0930" both → "0930". "930" / "9:30" → null (leading zero required).
 */
export function normalizeTodToHhmm(raw: string): string | null {
  const digits = raw.trim().replace(/:/g, '');
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
