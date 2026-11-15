import type { StationId } from '../types/game';

export type TutorialPhase = 'new' | 'offer' | 'active' | 'done';

export interface TutorialGate {
  filesOpen: boolean;
  archivesOpen: boolean;
  fileRead: boolean;
  activeStation: StationId;
  computerOpenApp: string | null;
  permitFiled: boolean;
  tagged: boolean;
}

export interface TutorialStep {
  hint: (name: string) => string;
  done: (gate: TutorialGate) => boolean;
}

/** Short taps through one case. Each step waits until its tap has happened. */
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    hint: (name) => `${name}, a case just arrived. Tap FILES.`,
    done: (g) => g.filesOpen,
  },
  {
    hint: (name) => `${name}, tap the case and read the family directive.`,
    done: (g) => g.fileRead,
  },
  {
    hint: (name) => `${name}, open the COMPUTER.`,
    done: (g) => g.activeStation === 'COMPUTER',
  },
  {
    hint: (name) => `${name}, open State Vital Records — the VR-441 icon.`,
    done: (g) => g.computerOpenApp === 'VR441',
  },
  {
    hint: (name) =>
      `${name}, copy the vitals from the case file and submit the permit.`,
    done: (g) => g.permitFiled,
  },
  {
    hint: (name) => `${name}, open the COOLER and tag the case.`,
    done: (g) => g.tagged,
  },
  {
    hint: (name) =>
      `${name}, open the CREMATORY. The retort runs once the permit is approved. Viewings are in the CHAPEL. Ashes finish in URN PROCESSING.`,
    done: (g) => g.activeStation === 'CREMATION',
  },
  {
    hint: (name) =>
      `${name}, a closed service leaves the file list. Open FILES, then ARCHIVES.`,
    done: (g) => g.archivesOpen,
  },
];
