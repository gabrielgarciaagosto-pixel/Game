import type { StationId } from '../types/game';

export type TutorialPhase = 'new' | 'offer' | 'active' | 'done';

export interface TutorialGate {
  /** The player has dragged the Tutorial Spirit at least once. */
  spiritMoved: boolean;
  filesOpen: boolean;
  archivesOpen: boolean;
  fileRead: boolean;
  activeStation: StationId;
  computerOpenApp: string | null;
  permitFiled: boolean;
  tagged: boolean;
  /** The tutorial case lost its name. The tag step can move on. */
  nameExpired: boolean;
}

export interface TutorialStep {
  id: string;
  hint: (name: string) => string;
  done: (gate: TutorialGate) => boolean;
}

/**
 * The Tutorial Spirit speaks these in order.
 * First the player drags it. Then they tag, before the name can be lost.
 */
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'drag',
    hint: (name) =>
      `${name}, this is the Tutorial Spirit. Drag it where you can still see your work.`,
    done: (g) => g.spiritMoved,
  },
  {
    id: 'tag',
    hint: (name) =>
      `${name}, open the COOLER and tag the case. If two or three more arrive while you are busy, an untagged body loses its name.`,
    done: (g) => g.tagged || g.nameExpired,
  },
  {
    id: 'files',
    hint: (name) => `${name}, a case just arrived. Tap FILES.`,
    done: (g) => g.filesOpen,
  },
  {
    id: 'directive',
    hint: (name) => `${name}, tap the case and read the family directive.`,
    done: (g) => g.fileRead,
  },
  {
    id: 'computer',
    hint: (name) => `${name}, open the COMPUTER.`,
    done: (g) => g.activeStation === 'COMPUTER',
  },
  {
    id: 'vr441',
    hint: (name) => `${name}, open State Vital Records — the VR-441 icon.`,
    done: (g) => g.computerOpenApp === 'VR441',
  },
  {
    id: 'permit',
    hint: (name) =>
      `${name}, copy the vitals from the case file and submit the permit.`,
    done: (g) => g.permitFiled,
  },
  {
    id: 'crematory',
    hint: (name) =>
      `${name}, open the CREMATORY. The retort runs once the permit is approved. Viewings are in the CHAPEL. Ashes finish in URN PROCESSING.`,
    done: (g) => g.activeStation === 'CREMATION',
  },
  {
    id: 'archives',
    hint: (name) =>
      `${name}, a closed service leaves the file list. Open FILES, then ARCHIVES.`,
    done: (g) => g.archivesOpen,
  },
];

/** Step that first asks the player to toe-tag. The 60s clock starts here. */
export const TUTORIAL_TAG_STEP = TUTORIAL_STEPS.findIndex(
  (step) => step.id === 'tag'
);

/**
 * While the walkthrough is still before the tag step, the tutorial case
 * keeps this long window so filing the permit cannot expire the name.
 */
export const TUTORIAL_TAG_HOLD_MS = 24 * 60 * 60 * 1000;

/** More than one normal toe-tag window is still left, so the 60s clock has not started. */
export function tagWindowIsHeld(
  tagExpiresAt: number,
  windowMs: number,
  now: number
): boolean {
  return tagExpiresAt - now > windowMs;
}

/** Start the normal toe-tag clock. A window that already started is left alone. */
export function releaseHeldTagWindow<
  T extends {
    isTagged: boolean;
    nameExpired: boolean;
    arrivedAt: number;
    tagExpiresAt: number;
    tagRemainingMs?: number;
  },
>(row: T, now: number, windowMs: number): T {
  if (row.isTagged || row.nameExpired) return row;
  const held =
    typeof row.tagRemainingMs === 'number'
      ? row.tagRemainingMs > windowMs
      : tagWindowIsHeld(row.tagExpiresAt, windowMs, now);
  if (!held) return row;
  return { ...row, tagExpiresAt: now + windowMs, tagRemainingMs: windowMs };
}
