import type { StationId } from '../types/game';
import { getCremationTargets } from '../utils/mortuaryMath';

export type TutorialPhase = 'new' | 'offer' | 'active' | 'done';

export type TutorialMood = 'calm' | 'warm' | 'playful' | 'earnest' | 'excited';

/** Talk sits center stage. Drag asks for a pull. Point flies to a control. Beat is timed. */
export type TutorialMode = 'talk' | 'drag' | 'point' | 'beat';

/** Local urn-processor phases, plus the extractor click, furthest-only. */
const URN_BEATS = [
  'CRUSH',
  'EXTRACTOR',
  'MAGNET',
  'HATCH',
  'PROCESSOR',
  'SELECT_URN',
  'POUR',
  'DONE',
] as const;

export const TUTORIAL_CASE2_ARRIVE_ID = 'case2-arrive';
export const TUTORIAL_CASE2_TAG_ID = 'case2-tag';

export interface TutorialWorld {
  tutorialCaseId: string | null;
  tutorialSpiritMoved: boolean;
  tutorialFileRead: boolean;
  tutorialSawRejection: boolean;
  tutorialBeat: string | null;
  filesPanelOpen: boolean;
  archivesPanelOpen: boolean;
  activeStation: StationId;
  computerOpenApp: string | null;
  serviceFeedback: unknown;
  cases: Array<{
    id: string;
    arrivedAt: number;
    isTagged: boolean;
    nameExpired: boolean;
    cremationPermitStatus?: string;
    location: string;
    weightLbs: number;
    isCremated: boolean;
    isUrnFilled: boolean;
    urnAshReady: boolean;
    offeredUrnId: string | null;
    isEmbalmed: boolean;
    offeredCasketId: string | null;
    familyChapelPrefs?: { musicTrackId: string | null };
    serviceDateMs?: number | null;
  }>;
  permitSubmissions: Array<{
    caseId: string | null;
    submittedAt: number;
    status: string;
    mismatchLabels: string[];
  }>;
  archivedCases: Array<{ id: string }>;
  retort: {
    caseId: string | null;
    phase: string;
    blowerOn: boolean;
    purging: boolean;
    heated: boolean;
    secondaryOn: boolean;
    primaryOn: boolean;
    doorOpen: number;
    stirCount: number;
    largeBonesLeft: number;
    mediumBonesLeft: number;
    fineAshLeft: number;
  };
  chapelLayouts: Record<
    string,
    | {
        pieces?: Array<{ kind: string }>;
        serviceMusicId?: string | null;
      }
    | undefined
  >;
}

export interface TutorialGate {
  spiritMoved: boolean;
  filesOpen: boolean;
  archivesOpen: boolean;
  fileRead: boolean;
  activeStation: StationId;
  computerOpenApp: string | null;
  permitFiled: boolean;
  permitSloppy: boolean;
  permitRejected: boolean;
  permitStatus: string;
  tagged: boolean;
  nameExpired: boolean;
  location: string;
  inRetort: boolean;
  phase: string;
  blowerOn: boolean;
  heated: boolean;
  purging: boolean;
  secondaryOn: boolean;
  primaryOn: boolean;
  doorOpen: number;
  stirCount: number;
  requiredStirs: number;
  largeBonesLeft: number;
  mediumBonesLeft: number;
  fineAshLeft: number;
  isCremated: boolean;
  isUrnFilled: boolean;
  urnAshReady: boolean;
  hasUrn: boolean;
  isEmbalmed: boolean;
  hasCasket: boolean;
  rosesPlaced: boolean;
  musicMet: boolean;
  serviceSet: boolean;
  familyCard: boolean;
  caseClosed: boolean;
  sawRejection: boolean;
  beat: string | null;
  beatRank: number;
}

export interface TutorialStep {
  id: string;
  mode: TutorialMode;
  mood: TutorialMood;
  /** 1 is a slow breath. 3 bounces. */
  intensity: 1 | 2 | 3;
  /** Control the spirit flies to. Talk and drag steps leave this empty. */
  target?: string;
  /** Timed lines. The player does not tap Okay. */
  beatMs?: number;
  hint: (name: string) => string;
  done: (gate: TutorialGate) => boolean;
}

const never = () => false;
const say = (line: string) => () => line;

function talk(
  id: string,
  mood: TutorialMood,
  intensity: 1 | 2 | 3,
  hint: (name: string) => string,
  done: (gate: TutorialGate) => boolean = never
): TutorialStep {
  return { id, mode: 'talk', mood, intensity, hint, done };
}

function point(
  id: string,
  target: string,
  mood: TutorialMood,
  intensity: 1 | 2 | 3,
  hint: (name: string) => string,
  done: (gate: TutorialGate) => boolean
): TutorialStep {
  return { id, mode: 'point', target, mood, intensity, hint, done };
}

function beat(
  id: string,
  hint: string,
  beatMs: number,
  mood: TutorialMood = 'playful'
): TutorialStep {
  return {
    id,
    mode: 'beat',
    mood,
    intensity: mood === 'calm' ? 1 : 2,
    hint: say(hint),
    done: never,
    beatMs,
  };
}

function toLobby(id: string, line: string): TutorialStep {
  return point(id, 'lobby-out', 'warm', 2, say(line), (g) =>
    (g.activeStation === 'OVERVIEW' || g.activeStation === 'COMPUTER') &&
    !g.filesOpen
  );
}

/** A viewing does not need a corrected resubmit. A cremation does. */
function permitLesson(prefix: string, fix: boolean): TutorialStep[] {
  const steps: TutorialStep[] = [
    talk(
      `${prefix}-warn`,
      'earnest',
      2,
      say('You submitted that incorrectly, so expect a rejection.'),
      (g) => !g.permitSloppy
    ),
    point(
      `${prefix}-wait`,
      'permit-rejection',
      'calm',
      1,
      say('The state is reading that filing. Wait here for the answer.'),
      (g) => !g.permitSloppy || g.permitRejected
    ),
    point(
      `${prefix}-see`,
      'permit-rejection',
      'earnest',
      2,
      say(
        'See. That line says REJECTED. The facts did not match. Close the file if it is covering the screen.'
      ),
      (g) => !g.permitSloppy || g.sawRejection
    ),
    talk(
      `${prefix}-next`,
      'warm',
      1,
      say('Next time, make sure the information is written correctly.'),
      (g) => !g.permitSloppy
    ),
  ];
  if (!fix) return steps;
  steps.push(
    point(
      `${prefix}-again`,
      'permit',
      'earnest',
      2,
      say(
        'Open the form again if you left it. Write the facts as they are on the file, then submit.'
      ),
      (g) => !g.permitSloppy
    ),
    point(
      `${prefix}-approved`,
      'permit-status',
      'calm',
      1,
      say('The state is checking the filing. Wait until the permit is approved.'),
      (g) =>
        g.permitStatus === 'APPROVED' ||
        g.permitStatus === 'NOT_REQUIRED' ||
        (g.permitStatus === 'NONE' && !g.permitFiled)
    )
  );
  return steps;
}

function latestSubmission(world: TutorialWorld, arrivedAt: number, caseId: string) {
  const relevant = world.permitSubmissions.filter(
    (sub) =>
      sub.caseId === caseId ||
      (sub.caseId == null && sub.submittedAt >= arrivedAt - 2000)
  );
  if (relevant.length === 0) return null;
  return relevant.reduce((best, sub) =>
    sub.submittedAt >= best.submittedAt ? sub : best
  );
}

export function tutorialBeatRank(beat: string | null): number {
  if (!beat) return -1;
  return URN_BEATS.indexOf(beat as (typeof URN_BEATS)[number]);
}

/** Keep the furthest processor beat. A later phase must not wipe an earlier click. */
export function nextTutorialBeat(
  current: string | null,
  incoming: string
): string | null {
  const next = tutorialBeatRank(incoming);
  if (next < 0) return current;
  if (next <= tutorialBeatRank(current)) return current;
  return URN_BEATS[next] ?? current;
}

export function readTutorialGate(world: TutorialWorld): TutorialGate {
  const row = world.cases.find((c) => c.id === world.tutorialCaseId) ?? null;
  const latest = row
    ? latestSubmission(world, row.arrivedAt, row.id)
    : null;
  const machine = row && world.retort.caseId === row.id ? world.retort : null;
  const layout = row ? world.chapelLayouts[row.id] : undefined;
  const wantedMusic = row?.familyChapelPrefs?.musicTrackId ?? null;
  const playing = layout?.serviceMusicId ?? null;
  const closed =
    world.tutorialCaseId != null &&
    world.archivedCases.some((file) => file.id === world.tutorialCaseId);
  return {
    spiritMoved: world.tutorialSpiritMoved,
    filesOpen: world.filesPanelOpen,
    archivesOpen: world.archivesPanelOpen,
    fileRead: world.tutorialFileRead,
    activeStation: world.activeStation,
    computerOpenApp: world.computerOpenApp,
    permitFiled: latest != null,
    permitSloppy: !!latest && latest.mismatchLabels.length > 0,
    permitRejected:
      !!latest &&
      latest.status === 'REJECTED' &&
      latest.mismatchLabels.length > 0,
    permitStatus: row?.cremationPermitStatus ?? 'NONE',
    tagged: row?.isTagged === true,
    nameExpired: row?.nameExpired === true,
    location: row?.location ?? '',
    inRetort: !!machine && machine.phase !== 'IDLE',
    phase: machine?.phase ?? 'IDLE',
    blowerOn: machine?.blowerOn === true,
    heated: machine?.heated === true,
    purging: machine?.purging === true,
    secondaryOn: machine?.secondaryOn === true,
    primaryOn: machine?.primaryOn === true,
    doorOpen: machine?.doorOpen ?? 0,
    stirCount: machine?.stirCount ?? 0,
    requiredStirs: row ? getCremationTargets(row.weightLbs).requiredStirs : 2,
    largeBonesLeft: machine?.largeBonesLeft ?? 100,
    mediumBonesLeft: machine?.mediumBonesLeft ?? 100,
    fineAshLeft: machine?.fineAshLeft ?? 100,
    isCremated: row?.isCremated === true,
    isUrnFilled: row?.isUrnFilled === true,
    urnAshReady: row?.urnAshReady === true,
    hasUrn: !!row?.offeredUrnId,
    isEmbalmed: row?.isEmbalmed === true,
    hasCasket: !!row?.offeredCasketId,
    rosesPlaced: !!layout?.pieces?.some((piece) => piece.kind === 'ROSES'),
    musicMet: !wantedMusic || playing === wantedMusic,
    serviceSet: row?.serviceDateMs != null,
    familyCard: world.serviceFeedback != null,
    caseClosed: closed,
    sawRejection: world.tutorialSawRejection,
    beat: world.tutorialBeat,
    beatRank: tutorialBeatRank(world.tutorialBeat),
  };
}

export function tutorialGateKey(gate: TutorialGate): string {
  const door =
    gate.doorOpen > 0.35 ? 'open' : gate.doorOpen > 0.16 ? 'crack' : 'shut';
  return [
    gate.spiritMoved ? 1 : 0,
    gate.filesOpen ? 1 : 0,
    gate.archivesOpen ? 1 : 0,
    gate.fileRead ? 1 : 0,
    gate.activeStation,
    gate.computerOpenApp ?? '',
    gate.permitFiled ? 1 : 0,
    gate.permitSloppy ? 1 : 0,
    gate.permitRejected ? 1 : 0,
    gate.permitStatus,
    gate.tagged ? 1 : 0,
    gate.nameExpired ? 1 : 0,
    gate.location,
    gate.phase,
    gate.blowerOn ? 1 : 0,
    gate.heated ? 1 : 0,
    gate.purging ? 1 : 0,
    gate.secondaryOn ? 1 : 0,
    gate.primaryOn ? 1 : 0,
    door,
    gate.stirCount,
    gate.requiredStirs,
    gate.largeBonesLeft,
    gate.mediumBonesLeft,
    gate.fineAshLeft,
    gate.isCremated ? 1 : 0,
    gate.isUrnFilled ? 1 : 0,
    gate.urnAshReady ? 1 : 0,
    gate.hasUrn ? 1 : 0,
    gate.isEmbalmed ? 1 : 0,
    gate.hasCasket ? 1 : 0,
    gate.rosesPlaced ? 1 : 0,
    gate.musicMet ? 1 : 0,
    gate.serviceSet ? 1 : 0,
    gate.familyCard ? 1 : 0,
    gate.caseClosed ? 1 : 0,
    gate.sawRejection ? 1 : 0,
    gate.beat ?? '',
  ].join('|');
}

export function resolveTutorialTarget(
  target: string | undefined,
  filesOpen: boolean
): string | undefined {
  if (target === 'lobby-out') return filesOpen ? 'files' : 'back';
  return target;
}

export function tutorialReleasesTag(stepId: string | undefined): boolean {
  return stepId === 'tag-button' || stepId === TUTORIAL_CASE2_TAG_ID;
}

const burned = (g: TutorialGate) => g.phase === 'SWEEP' || g.isCremated;
const swept = (g: TutorialGate) => g.isCremated;

/**
 * Two full cases. A direct cremation through the urn, then a burial viewing.
 * A save that stopped halfway through an older, shorter list will not line up.
 */
export const TUTORIAL_STEPS: TutorialStep[] = [
  beat('hey', 'Hey!', 700),
  beat('ellipsis', '...', 1100, 'calm'),
  beat('listen', 'Listen!', 700),
  talk('who', 'warm', 1, say('I am the Tutorial Spirit.')),
  {
    id: 'drag',
    mode: 'drag',
    mood: 'playful',
    intensity: 2,
    hint: (name) =>
      `${name}, I stay for your first two cases. A cremation, then a viewing. Drag me off to the side, so I am not sitting on your buttons.`,
    done: (g) => g.spiritMoved,
  },
  talk(
    'why-tag',
    'earnest',
    1,
    say(
      'First job is the toe tag. It is the name, tied on the body. If more come in while you are busy, an untagged one loses that name. Then you are guessing who is who.'
    )
  ),
  point(
    'tag-where',
    'cooler',
    'warm',
    2,
    say('The cooler is the cold room. Open it. Your case is waiting in a bay.'),
    (g) => g.activeStation === 'COOLER'
  ),
  point(
    'tag-button',
    'toe-tag',
    'earnest',
    2,
    say('That amber button is the tag. Tap it, and the name stays with them.'),
    (g) => g.tagged || g.nameExpired
  ),
  talk(
    'tagged-good',
    'warm',
    1,
    say('Good. The name stays. Now look at what the family asked for.')
  ),
  talk(
    'files-why',
    'calm',
    1,
    say('The file is the family request. It says who they are, and what they want done.')
  ),
  point('files-open', 'files', 'warm', 2, say('Open FILES.'), (g) => g.filesOpen),
  point(
    'directive',
    'directive',
    'earnest',
    2,
    say('Tap their name. Read the directive. This one is a cremation.'),
    (g) => g.fileRead
  ),
  talk(
    'permit-why',
    'earnest',
    1,
    say(
      'A cremation needs a permit. The form has to match the file. Name, dates, place of birth. If it does not match, the state sends it back.'
    )
  ),
  toLobby(
    'lobby-computer',
    'You are still in a room. Close the file if it is open, tap Back, and come out to the lobby. The computer is on that floor.'
  ),
  point(
    'computer',
    'computer',
    'warm',
    2,
    say('If a file is still open, close it. Then open the COMPUTER.'),
    (g) => g.activeStation === 'COMPUTER'
  ),
  point(
    'vr441',
    'vr441',
    'warm',
    2,
    say('Open State Vital Records. The form is VR-441.'),
    (g) => g.computerOpenApp === 'VR441'
  ),
  talk(
    'permit-copy',
    'earnest',
    1,
    say('Copy the facts from the file. Do not guess a date. Do not tidy the name.')
  ),
  point(
    'permit-submit',
    'permit',
    'earnest',
    2,
    say('Submit the form. The fee comes out of the house.'),
    (g) => g.permitFiled
  ),
  ...permitLesson('permit', true),
  talk(
    'after-permit',
    'calm',
    1,
    say('They read it on their own time. You do not have to stand over the desk.')
  ),
  point(
    'leave-form',
    'desk',
    'warm',
    1,
    say('Go back to the desktop.'),
    (g) => g.computerOpenApp !== 'VR441' || g.activeStation !== 'COMPUTER'
  ),
  point(
    'leave-desk',
    'shut-down',
    'warm',
    1,
    say('Shut the computer down.'),
    (g) => g.activeStation !== 'COMPUTER'
  ),
  talk(
    'move-why',
    'earnest',
    1,
    say(
      'The crematory room is empty until you move the body. Go back to the cooler and send them in.'
    )
  ),
  toLobby(
    'move-lobby',
    'Come out to the lobby if you are still inside a room. The cooler is on that floor.'
  ),
  point(
    'move-cooler',
    'cooler',
    'warm',
    2,
    say('Open the cooler.'),
    (g) => g.activeStation === 'COOLER' || g.location === 'CREMATION'
  ),
  point(
    'move-cremate',
    'cremate',
    'earnest',
    2,
    say(
      'Tap the bay if you do not see the buttons. Then tap Cremate. That puts the body in the retort.'
    ),
    (g) => g.location === 'CREMATION' && g.inRetort
  ),
  point(
    'crematory-room',
    'crematory',
    'warm',
    2,
    say('Open the CREMATORY if you are not already at the door.'),
    (g) => g.activeStation === 'CREMATION' || g.isCremated
  ),
  point(
    'blower',
    'blower-start',
    'warm',
    2,
    say(
      'Tap the panel if the buttons are small. Start the blower. It has to purge before the chamber will heat.'
    ),
    (g) => g.blowerOn || g.heated || burned(g)
  ),
  point(
    'heated',
    'heated',
    'calm',
    1,
    say('Wait until the lamp says heated. The purge takes a little while.'),
    (g) => (g.heated && !g.purging) || burned(g)
  ),
  point(
    'secondary',
    'secondary-start',
    'warm',
    2,
    say('Start the secondary chamber.'),
    (g) => g.secondaryOn || burned(g)
  ),
  point(
    'primary',
    'primary-start',
    'earnest',
    2,
    say('When the secondary is hot enough, start the primary.'),
    (g) => g.primaryOn || burned(g)
  ),
  point(
    'door',
    'door-up',
    'warm',
    2,
    say('Hold Door UP until the hearth is open enough to work. A crack is not enough.'),
    (g) => g.doorOpen > 0.35 || burned(g)
  ),
  point(
    'stir',
    'tool-STIRRING_ROD',
    'warm',
    2,
    say(
      'Open TOOLS and take the Stirring Rod. Circle the charge until the stirs are done.'
    ),
    (g) => g.stirCount >= g.requiredStirs || burned(g)
  ),
  point(
    'sweep-wait',
    'begin-sweep',
    'calm',
    1,
    say(
      'The burn takes a few minutes. When it finishes, the hearth cools and the sweep begins. You can also tap Cool and Begin when it is offered.'
    ),
    (g) => burned(g)
  ),
  point(
    'rake',
    'tool-IRON_RAKE',
    'earnest',
    2,
    say('Open TOOLS and take the Iron Rake. Clear the large bones.'),
    (g) => g.largeBonesLeft <= 0 || swept(g)
  ),
  point(
    'fragment',
    'tool-HAND_BRUSH',
    'warm',
    2,
    say('Large bones are clear. Take the Fragment Brush and sweep the fragments.'),
    (g) => g.mediumBonesLeft <= 0 || swept(g)
  ),
  point(
    'hand-brush',
    'tool-BRISTLE_BRUSH',
    'warm',
    2,
    say('Fragments are clear. Take the Hand Brush and sweep the fine ash.'),
    (g) => g.fineAshLeft <= 0 || swept(g)
  ),
  point(
    'transfer',
    'transfer-tray',
    'earnest',
    2,
    say('Tap the panel if you need the buttons. Transfer the tray to the urn processor.'),
    (g) => g.isCremated
  ),
  point(
    'urn-back',
    'back',
    'warm',
    1,
    say('Tap Back. The processor is on the lobby floor.'),
    (g) => g.activeStation === 'OVERVIEW' || g.activeStation === 'URN_FILLING'
  ),
  point(
    'urn-open',
    'urn',
    'warm',
    2,
    say('Open URN PROCESSING.'),
    (g) => g.activeStation === 'URN_FILLING' || g.isUrnFilled
  ),
  point(
    'crush',
    'hammer',
    'earnest',
    2,
    say(
      'Tap the bones with the hammer until they are dust. Start the extractor if the dust blinds you. Then tap Bones Crushed.'
    ),
    (g) => g.beatRank >= tutorialBeatRank('MAGNET') || g.urnAshReady || g.isUrnFilled
  ),
  point(
    'magnet',
    'magnet',
    'warm',
    2,
    say(
      'Drag the magnet over the metal in this tray, or use the button when the tray is clear. Then go on to the hatch.'
    ),
    (g) => g.beatRank >= tutorialBeatRank('HATCH') || g.urnAshReady || g.isUrnFilled
  ),
  point(
    'hatch',
    'hatch',
    'warm',
    2,
    say('Sweep the remains into the hatch, then open the processor.'),
    (g) =>
      g.beatRank >= tutorialBeatRank('PROCESSOR') || g.urnAshReady || g.isUrnFilled
  ),
  point(
    'engage',
    'engage',
    'earnest',
    2,
    say(
      'Press Engage. The cremulator turns the bone to ash. Do the magnet pass before you engage, if you can.'
    ),
    (g) => g.urnAshReady || g.beatRank >= tutorialBeatRank('SELECT_URN') || g.isUrnFilled
  ),
  point(
    'choose-urn',
    'choose-urn',
    'warm',
    2,
    say('Choose an urn. The family taste is marked if you have that one.'),
    (g) => g.hasUrn || g.beatRank >= tutorialBeatRank('POUR') || g.isUrnFilled
  ),
  point(
    'seal',
    'seal',
    'earnest',
    2,
    say('Pour the ash to the line, then seal the urn.'),
    (g) => g.isUrnFilled
  ),
  point(
    'hand-urn',
    'hand-urn',
    'warm',
    2,
    say(
      'Open FILES, tap their name, then Schedule Family Urn Pickup. Hand the urn to the family now. When they write back, tap Continue.'
    ),
    (g) => g.caseClosed && !g.familyCard
  ),
  talk(
    TUTORIAL_CASE2_ARRIVE_ID,
    'warm',
    2,
    say(
      'A second family is here. This one is a viewing. We walk it the same way, through to the close.'
    )
  ),
  talk(
    'case2-tag-why',
    'earnest',
    1,
    say('The toe tag again. A viewing still needs the name on the body.')
  ),
  point(
    'case2-cooler',
    'cooler',
    'warm',
    2,
    say('Open the cooler.'),
    (g) => g.activeStation === 'COOLER' || g.tagged
  ),
  point(
    TUTORIAL_CASE2_TAG_ID,
    'toe-tag',
    'earnest',
    2,
    say('Tap the amber button for this new name.'),
    (g) => g.tagged || g.nameExpired
  ),
  talk(
    'case2-file-why',
    'calm',
    1,
    say(
      'Open the file and read what they asked. This is a burial viewing. Embalming, then the chapel.'
    )
  ),
  point(
    'case2-files',
    'files',
    'warm',
    2,
    say('Open FILES.'),
    (g) => g.filesOpen || g.fileRead
  ),
  point(
    'case2-directive',
    'directive',
    'earnest',
    2,
    say('Tap their name. Read the directive before you do anything else.'),
    (g) => g.fileRead
  ),
  point(
    'case2-date',
    'schedule',
    'warm',
    2,
    say('Set the hour for the viewing. Tap a day on the calendar.'),
    (g) => g.serviceSet
  ),
  toLobby(
    'case2-lobby',
    'Close the file if it is open, tap Back, and come out to the lobby. The computer is on that floor.'
  ),
  point(
    'case2-computer',
    'computer',
    'warm',
    2,
    say('Open the COMPUTER.'),
    (g) => g.activeStation === 'COMPUTER'
  ),
  point(
    'case2-vr441',
    'vr441',
    'warm',
    2,
    say('Open State Vital Records. Look at VR-441.'),
    (g) => g.computerOpenApp === 'VR441'
  ),
  point(
    'case2-permit-choice',
    'permit',
    'calm',
    1,
    say(
      'This viewing does not need a cremation permit. You can close the form. If you file it wrong, the state still sends it back.'
    ),
    (g) => g.computerOpenApp !== 'VR441' || g.permitSloppy || g.permitFiled
  ),
  ...permitLesson('case2-permit', false),
  point(
    'case2-leave-form',
    'desk',
    'warm',
    1,
    say('Go back to the desktop.'),
    (g) => g.computerOpenApp !== 'VR441' || g.activeStation !== 'COMPUTER'
  ),
  point(
    'case2-leave-desk',
    'shut-down',
    'warm',
    1,
    say('Shut the computer down.'),
    (g) => g.activeStation !== 'COMPUTER'
  ),
  talk(
    'case2-prep-why',
    'earnest',
    1,
    say('A viewing needs embalming. Unprepared remains are not brought into the chapel.')
  ),
  toLobby('case2-prep-lobby', 'Come out to the lobby. The cooler is on that floor.'),
  point(
    'case2-prep-cooler',
    'cooler',
    'warm',
    2,
    say('Open the cooler.'),
    (g) => g.activeStation === 'COOLER' || g.location === 'EMBALMING' || g.isEmbalmed
  ),
  point(
    'case2-prep',
    'prep',
    'earnest',
    2,
    say('Tap the bay, then Prep. That is the embalming room.'),
    (g) => g.location === 'EMBALMING' || g.isEmbalmed
  ),
  point(
    'case2-inject',
    'inject',
    'warm',
    2,
    say('Choose the fluids, then Inject Mixture.'),
    (g) => g.isEmbalmed
  ),
  point(
    'case2-chapel-back',
    'back',
    'warm',
    1,
    say('Tap Back. We go through the cooler to the chapel.'),
    (g) =>
      g.activeStation === 'OVERVIEW' ||
      g.activeStation === 'COOLER' ||
      g.location === 'CHAPEL'
  ),
  point(
    'case2-chapel-cooler',
    'cooler',
    'warm',
    2,
    say('Open the cooler again.'),
    (g) => g.activeStation === 'COOLER' || g.location === 'CHAPEL'
  ),
  point(
    'case2-chapel-move',
    'chapel-move',
    'earnest',
    2,
    say('Tap the bay, then Chapel.'),
    (g) => g.location === 'CHAPEL'
  ),
  point(
    'case2-casket',
    'casket',
    'warm',
    2,
    say('Offer a casket. Any one you own will do.'),
    (g) => g.hasCasket
  ),
  point(
    'case2-roses',
    'roses',
    'warm',
    2,
    say('Place the roses. The chapel asks for them.'),
    (g) => g.rosesPlaced
  ),
  point(
    'case2-music',
    'chapel-music',
    'calm',
    1,
    say('Set the music they asked for. The one marked required.'),
    (g) => g.musicMet
  ),
  point(
    'case2-finalize',
    'finalize-burial',
    'earnest',
    2,
    say(
      'Tap Finalize Burial. Do not send this family to the fire. When they write back, tap Continue.'
    ),
    (g) => g.caseClosed && !g.familyCard
  ),
  talk(
    'archives-why',
    'calm',
    1,
    say(
      'Both cases leave the live list. They are not thrown out. They go to the archives.'
    )
  ),
  point(
    'archives',
    'archives',
    'playful',
    2,
    say('Open FILES, then ARCHIVES. Closed work waits on that shelf.'),
    (g) => g.archivesOpen
  ),
];

/** Step that asks the player to tap the first toe tag. The 60s clock starts here. */
export const TUTORIAL_TAG_STEP = TUTORIAL_STEPS.findIndex(
  (step) => step.id === 'tag-button'
);

export function tutorialTargetSelector(target: string | undefined): string | null {
  if (!target) return null;
  if (target === 'archives') {
    return '[data-tutorial-target="archives"], [data-tutorial-target="files"]';
  }
  if (!/^[A-Za-z0-9-]+$/.test(target)) return null;
  return `[data-tutorial-target="${target}"]`;
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
