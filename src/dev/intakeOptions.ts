import { useEffect, useState } from 'react';

/** Survives reload with the other dev keys. Reset Game wipes `ossuarian*` storage. */
export const INTAKE_DEV_KEY = 'ossuarian-dev-intake';

export type IntakeDevOptions = {
  /** Slow Case Intake: two cases a day, 8–12 hours apart. */
  sci: boolean;
  /** No automatic arrivals until turned off. Wins over SCI. */
  pause: boolean;
};

const listeners = new Set<() => void>();

export function readIntakeDevOptions(): IntakeDevOptions {
  try {
    const raw = localStorage.getItem(INTAKE_DEV_KEY);
    if (!raw) return { sci: false, pause: false };
    const parsed = JSON.parse(raw) as Partial<IntakeDevOptions>;
    return { sci: parsed.sci === true, pause: parsed.pause === true };
  } catch {
    return { sci: false, pause: false };
  }
}

function writeIntakeDevOptions(next: IntakeDevOptions) {
  try {
    localStorage.setItem(INTAKE_DEV_KEY, JSON.stringify(next));
  } catch {
    /* private mode */
  }
  for (const fn of listeners) fn();
}

export function setSlowCaseIntake(sci: boolean) {
  writeIntakeDevOptions({ ...readIntakeDevOptions(), sci });
}

export function setPauseCaseIntake(pause: boolean) {
  writeIntakeDevOptions({ ...readIntakeDevOptions(), pause });
}

export function subscribeIntakeDevOptions(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useIntakeDevOptions(): IntakeDevOptions {
  const [opts, setOpts] = useState(readIntakeDevOptions);
  useEffect(
    () => subscribeIntakeDevOptions(() => setOpts(readIntakeDevOptions())),
    []
  );
  return opts;
}
