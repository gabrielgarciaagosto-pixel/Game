import { pickRandomUsPlace } from './usPlaces';

/** Vitals shown on Case Files and required for cremation permits. */
export interface DecedentVitals {
  /** Local calendar midnight of birth */
  dateOfBirthMs: number;
  /** Local calendar midnight of death */
  dateOfDeathMs: number;
  /** Hour of death 0–23 */
  timeOfDeathHour: number;
  /** Minute of death 0–59 */
  timeOfDeathMinute: number;
  /** "City, ST" from usPlaces */
  placeOfBirth: string;
}

export type CremationPermitStatus =
  | 'NOT_REQUIRED'
  | 'NONE'
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED';

export function formatDateMs(ms: number): string {
  const d = new Date(ms);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function formatTod(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function formatVitalsDob(v: DecedentVitals): string {
  return formatDateMs(v.dateOfBirthMs);
}

export function formatVitalsDod(v: DecedentVitals): string {
  return formatDateMs(v.dateOfDeathMs);
}

export function formatVitalsTod(v: DecedentVitals): string {
  return formatTod(v.timeOfDeathHour, v.timeOfDeathMinute);
}

export function permitStatusLabel(status: CremationPermitStatus): string {
  switch (status) {
    case 'NOT_REQUIRED':
      return 'Not required';
    case 'NONE':
      return 'Not filed';
    case 'PENDING':
      return 'Pending evaluation';
    case 'APPROVED':
      return 'Approved';
    case 'REJECTED':
      return 'Rejected — needs correction';
    default:
      return status;
  }
}

function atLocalMidnight(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function addCalendarYears(ms: number, years: number): number {
  const d = new Date(ms);
  d.setFullYear(d.getFullYear() + years);
  return d.getTime();
}

/** Slightly biased TOD toward overnight / early morning (realistic). */
function rollTimeOfDeath(): { hour: number; minute: number } {
  const roll = Math.random();
  let hour: number;
  if (roll < 0.35) {
    hour = Math.floor(Math.random() * 6); // 00–05
  } else if (roll < 0.55) {
    hour = 6 + Math.floor(Math.random() * 4); // 06–09
  } else if (roll < 0.75) {
    hour = 18 + Math.floor(Math.random() * 6); // 18–23
  } else {
    hour = 10 + Math.floor(Math.random() * 8); // 10–17
  }
  const minute = Math.floor(Math.random() * 60);
  return { hour, minute };
}

/**
 * Plausible vitals relative to intake/arrival time.
 * DOD is 0–4 days before arrival; age 28–94; DOB derived from age at death.
 */
export function generateDecedentVitals(arrivedAtMs: number): DecedentVitals {
  const arrivalDay = atLocalMidnight(arrivedAtMs);
  const daysBeforeDeath = Math.floor(Math.random() * 5); // 0–4
  const dateOfDeathMs = arrivalDay - daysBeforeDeath * 86_400_000;
  const ageAtDeath = 28 + Math.floor(Math.random() * 67); // 28–94
  let dateOfBirthMs = addCalendarYears(dateOfDeathMs, -ageAtDeath);
  // Nudge DOB day within the birth month for variety
  const dob = new Date(dateOfBirthMs);
  const maxDay = new Date(dob.getFullYear(), dob.getMonth() + 1, 0).getDate();
  dob.setDate(1 + Math.floor(Math.random() * maxDay));
  dateOfBirthMs = atLocalMidnight(dob.getTime());
  // Ensure DOB is still before DOD after day nudge
  if (dateOfBirthMs >= dateOfDeathMs) {
    dateOfBirthMs = addCalendarYears(dateOfDeathMs, -ageAtDeath);
  }
  const tod = rollTimeOfDeath();
  return {
    dateOfBirthMs,
    dateOfDeathMs,
    timeOfDeathHour: tod.hour,
    timeOfDeathMinute: tod.minute,
    placeOfBirth: pickRandomUsPlace(),
  };
}
