import type { DispositionDirective } from '../types/game';
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
  timeOfDeath: string; // HH:MM
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

/** Normalize TOD so "9:05" and "09:05" compare equal. */
export function normalizeTodInput(raw: string): string {
  const m = raw.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return raw.trim();
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (!Number.isFinite(h) || !Number.isFinite(min)) return raw.trim();
  if (h < 0 || h > 23 || min < 0 || min > 59) return raw.trim();
  return formatTod(h, min);
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
  if (normalizeTodInput(form.timeOfDeath) !== expected.timeOfDeath) {
    mismatches.push({ field: 'timeOfDeath', label: 'Time of death' });
  }
  if (form.placeOfBirth.trim() !== expected.placeOfBirth) {
    mismatches.push({ field: 'placeOfBirth', label: 'Place of birth' });
  }
  return mismatches;
}

/** Short in-game evaluation window (~8–14 family minutes). */
export function rollPermitEvaluationDueAt(nowMs: number): number {
  const minutes = 8 + Math.floor(Math.random() * 7);
  return nowMs + minutes * FAMILY_MINUTE_MS;
}

export const UNPERMITTED_CREMATION_FINE = 1500;
export const UNPERMITTED_CREMATION_REP_HIT = 25;
export const PERMIT_ERROR_STREAK_LIMIT = 3;
export const PERMIT_ERROR_STREAK_FINE = 500;
export const PERMIT_ERROR_STREAK_REP_HIT = 10;

export interface PermitSubmissionRecord {
  id: string;
  caseId: string;
  decedentName: string;
  submittedAt: number;
  evaluatesAt: number;
  evaluatedAt: number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  mismatchLabels: string[];
  form: PermitFormDraft;
}
