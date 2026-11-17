import type { StationId } from '../types/game';

export type TutorialPhase = 'new' | 'offer' | 'active' | 'done';

export type TutorialMood = 'calm' | 'warm' | 'playful' | 'earnest' | 'excited';

/** Talk sits center stage. Drag asks for a pull. Point flies to a control. */
export type TutorialMode = 'talk' | 'drag' | 'point';

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
  mode: TutorialMode;
  mood: TutorialMood;
  /** 1 is a slow breath. 3 bounces. */
  intensity: 1 | 2 | 3;
  /** Control the spirit flies to. Talk and drag steps leave this empty. */
  target?: string;
  hint: (name: string) => string;
  done: (gate: TutorialGate) => boolean;
}

const never = () => false;

/**
 * One idea at a time.
 * Drag the spirit, then the toe tag and why it matters, then the rest of the loop.
 */
export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'drag',
    mode: 'drag',
    mood: 'playful',
    intensity: 2,
    hint: (name) =>
      `${name}, I'm the Tutorial Spirit. I stay for this first case. Drag me off to the side, so I'm not sitting on your buttons.`,
    done: (g) => g.spiritMoved,
  },
  {
    id: 'why-tag',
    mode: 'talk',
    mood: 'earnest',
    intensity: 1,
    hint: () =>
      'First job is the toe tag. It is the name, tied on the body. If two or three more come in while you are busy, an untagged one loses that name. Then you are guessing who is who.',
    done: never,
  },
  {
    id: 'tag-where',
    mode: 'point',
    mood: 'warm',
    intensity: 2,
    target: 'cooler',
    hint: () =>
      'The cooler is the cold room. Open it. Your case is waiting in a bay.',
    done: (g) => g.activeStation === 'COOLER',
  },
  {
    id: 'tag-button',
    mode: 'point',
    mood: 'earnest',
    intensity: 2,
    target: 'toe-tag',
    hint: () =>
      'That amber button is the tag. Tap it, and the name stays with them.',
    done: (g) => g.tagged || g.nameExpired,
  },
  {
    id: 'tagged-good',
    mode: 'talk',
    mood: 'excited',
    intensity: 3,
    hint: () =>
      'Ha. There it is. The name stays. That little tag is the whole trick.',
    done: never,
  },
  {
    id: 'files-why',
    mode: 'talk',
    mood: 'calm',
    intensity: 1,
    hint: () =>
      'The family already told us what they want. That note is called the directive. It lives in the files.',
    done: never,
  },
  {
    id: 'files-open',
    mode: 'point',
    mood: 'playful',
    intensity: 2,
    target: 'files',
    hint: () => 'Tap FILES. Orange button, down in the corner.',
    done: (g) => g.filesOpen,
  },
  {
    id: 'directive',
    mode: 'point',
    mood: 'warm',
    intensity: 1,
    target: 'directive',
    hint: () =>
      'Tap their name in the list. Read it slow. This family asked for a cremation.',
    done: (g) => g.fileRead,
  },
  {
    id: 'permit-why',
    mode: 'talk',
    mood: 'earnest',
    intensity: 1,
    hint: () =>
      'A cremation needs a permit. The state wants the same facts you just read. Name, dates, the rest. If they do not match, the form comes back.',
    done: never,
  },
  {
    id: 'computer',
    mode: 'point',
    mood: 'warm',
    intensity: 2,
    target: 'computer',
    hint: () => 'Open the COMPUTER. The permit desk is on that screen.',
    done: (g) => g.activeStation === 'COMPUTER',
  },
  {
    id: 'vr441',
    mode: 'point',
    mood: 'playful',
    intensity: 2,
    target: 'vr441',
    hint: () =>
      'See the little icon, State Vital Records? That is VR-441. Open it.',
    done: (g) => g.computerOpenApp === 'VR441',
  },
  {
    id: 'permit-copy',
    mode: 'talk',
    mood: 'calm',
    intensity: 1,
    hint: () =>
      'The form wants the same facts as the case file. Same name, same dates. The state sends it back if they differ.',
    done: never,
  },
  {
    id: 'permit-submit',
    mode: 'point',
    mood: 'earnest',
    intensity: 2,
    target: 'permit',
    hint: () =>
      'Copy those facts in, then press submit. The fee comes out of the house account.',
    done: (g) => g.permitFiled,
  },
  {
    id: 'after-permit',
    mode: 'talk',
    mood: 'calm',
    intensity: 1,
    hint: () =>
      'They read it on their own time. You do not have to watch this screen. The house can keep working.',
    done: never,
  },
  {
    id: 'leave-form',
    mode: 'point',
    mood: 'warm',
    intensity: 2,
    target: 'desk',
    hint: () =>
      'Tap Desktop, up at the top. That closes the form and puts you back on the office screen.',
    done: (g) => g.computerOpenApp !== 'VR441',
  },
  {
    id: 'leave-desk',
    mode: 'point',
    mood: 'playful',
    intensity: 2,
    target: 'shut-down',
    hint: () => 'Tap Shut down. You land back in the parlor, where the rooms are.',
    done: (g) => g.activeStation !== 'COMPUTER',
  },
  {
    id: 'crematory-why',
    mode: 'talk',
    mood: 'earnest',
    intensity: 1,
    hint: () =>
      'The burn happens in the crematory. We call the machine the retort. Wait until the permit is approved before you fire. Do it early, and the board fines the house.',
    done: never,
  },
  {
    id: 'crematory',
    mode: 'point',
    mood: 'warm',
    intensity: 2,
    target: 'crematory',
    hint: () => 'Open the CREMATORY, so you can see the door and the tools.',
    done: (g) => g.activeStation === 'CREMATION',
  },
  {
    id: 'chapel',
    mode: 'talk',
    mood: 'calm',
    intensity: 1,
    hint: () =>
      'A viewing, if the family wants one, is the chapel. Bier, flowers, a quiet hour. This case asked for cremation, so you can skip that.',
    done: never,
  },
  {
    id: 'urn',
    mode: 'talk',
    mood: 'warm',
    intensity: 2,
    hint: () =>
      'After the burn you still have bone. URN PROCESSING crushes it and fills the urn. The family picks the urn up, or it sits in the vault.',
    done: never,
  },
  {
    id: 'archives-why',
    mode: 'talk',
    mood: 'calm',
    intensity: 1,
    hint: () =>
      'A finished service leaves the live list. It is not thrown out. It goes to the archives.',
    done: never,
  },
  {
    id: 'archives',
    mode: 'point',
    mood: 'playful',
    intensity: 2,
    target: 'archives',
    hint: () => 'Open FILES, then ARCHIVES. Closed work waits on that shelf.',
    done: (g) => g.archivesOpen,
  },
];

/** Step that asks the player to tap the toe tag. The 60s clock starts here. */
export const TUTORIAL_TAG_STEP = TUTORIAL_STEPS.findIndex(
  (step) => step.id === 'tag-button'
);

export function tutorialTargetSelector(target: string | undefined): string | null {
  switch (target) {
    case 'cooler':
      return '[data-tutorial-target="cooler"]';
    case 'toe-tag':
      return '[data-tutorial-target="toe-tag"]';
    case 'files':
      return '[data-tutorial-target="files"]';
    case 'directive':
      return '[data-tutorial-target="directive"]';
    case 'computer':
      return '[data-tutorial-target="computer"]';
    case 'vr441':
      return '[data-tutorial-target="vr441"]';
    case 'permit':
      return '[data-tutorial-target="permit"]';
    case 'desk':
      return '[data-tutorial-target="desk"]';
    case 'shut-down':
      return '[data-tutorial-target="shut-down"]';
    case 'crematory':
      return '[data-tutorial-target="crematory"]';
    case 'archives':
      return '[data-tutorial-target="archives"], [data-tutorial-target="files"]';
    default:
      return null;
  }
}

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
