import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  directiveLabel,
  type CaseInboxFile,
  type CaseLocation,
  type DecedentCase,
  type PreferredCasketMaterial,
  type PreferredUrnMaterial,
  type Rank,
  type ShowroomItem,
  type StationId,
} from '../types/game';

/** Most recent intake or finished service, for the hub “Last case” line. */
export type LastCaseNote = {
  id: string;
  name: string;
  service: string;
  at: number;
};
import {
  IDLE_RETORT,
  type RetortMachine,
} from '../retort/retortTypes';
import { stepRetortBurn, stepRetortDoor } from '../retort/tickRetort';
import { playIntakeBell } from '../utils/soundEffects';
import { getCremationTargets } from '../utils/mortuaryMath';
import { getUrnById, URN_MATERIALS } from '../data/urnCatalog';
import {
  CASKET_MATERIALS,
  getCasketById,
} from '../data/casketCatalog';
import {
  CHAPEL_DECOR_CATALOG,
  defaultChapelLayout,
  maxFlowerStands,
  type ChapelLayoutPiece,
  type ChapelServiceLayout,
  type ChapelThemeSelection,
  type FlowerKind,
} from '../data/chapelDecor';
import {
  coolerBayCapacity,
  crematoryBurnSpeed,
  DEFAULT_FACILITY_LEVELS,
  missingCollectionReqs,
  nextFacilityTier,
  totalFacilitySpaceUsed,
  type FacilityUpgradeId,
  type FacilityUpgradeLevels,
  vaultSlotCapacity,
} from '../data/facilityUpgrades';
import {
  STARTER_PROPERTY,
  earlyPayoffAmount,
  getPropertyById,
  loanProductById,
  makeMortgageLoan,
  makePersonalLoan,
  ownedFromListing,
  type ActiveBankLoan,
  type OwnedProperty,
} from '../data/bankProducts';
import {
  EMPTY_FLEET_ASSIGNMENT,
  getFleetVehicle,
  normalizeFleetAssignment,
  resolveCortege,
  type FleetAssignment,
  type FleetClass,
} from '../data/funeralFleets';
import {
  BANK_FORECLOSURE_AFTER_MS,
  BANK_WARNING_AFTER_MS,
  BANK_WARNING_MESSAGE,
} from '../data/bankForeclosure';
import {
  directiveNeedsCremationPermit,
  findExactPermitCaseMatch,
  initialPermitStatus,
  PERMIT_ERROR_STREAK_FINE,
  PERMIT_ERROR_STREAK_LIMIT,
  PERMIT_ERROR_STREAK_REP_HIT,
  PERMIT_REJECT_GENERIC,
  rollPermitEvaluationDueAt,
  UNPERMITTED_CREMATION_FINE,
  UNPERMITTED_CREMATION_REP_HIT,
  type FinanceLedgerEntry,
  type PermitFormDraft,
  type PermitSubmissionRecord,
} from '../data/cremationPermits';
import {
  chapelPrefMatchBonus,
  evaluateChapelPrefMatches,
  rollFamilyChapelPreferences,
  type FamilyChapelPreferences,
} from '../data/familyChapelPrefs';
import {
  generateDecedentVitals,
  type CremationPermitStatus,
} from '../data/decedentVitals';
import {
  consumeRareStock,
  createShopRotation,
  isHourGatedCasket,
  isHourGatedUrn,
  RARE_SCHEDULE,
  type ShopRotationState,
} from '../data/shopRotation';
import {
  satisfactionToRewards,
  scoreChapelArrangement,
} from '../utils/chapelSatisfaction';
import { rollFamilyUrnDueAt } from '../data/familyUrnTiming';
import {
  caseUsesUrnStand,
  directiveNeedsUrn,
  pickFamilyUrnRequest,
} from '../data/familyUrnPick';
import { gameNow } from '../utils/gameNow';

const TAG_WINDOW_MS = 60_000;
const INTAKE_MIN_MS = 180_000;
const INTAKE_MAX_MS = 300_000;
/** Decay points per second outside cooler when not embalmed/cremated */
const DECAY_PER_SEC = 0.35;

interface GameState {
  hasStartedGame: boolean;
  cash: number;
  reputation: number;
  ossilegiumCommuneGrams: number;
  activeStation: StationId;
  /**
   * Which Computer desktop app to open (null = desktop).
   * EMPORIUM redirects here with 'SHOP'. Not persisted.
   */
  computerOpenApp: 'VR441' | 'SHOP' | 'BANK' | 'REALTY' | 'FLEETS' | null;
  /** Optional deep-link tab when opening BANK (not persisted) */
  bankOpenTab: 'overview' | 'loans' | 'listings' | null;
  cases: DecedentCase[];
  activeCaseId: string | null;
  inboxFiles: CaseInboxFile[];
  intakeToast: string | null;
  showroomInventory: ShowroomItem[];
  /** Owned counts keyed by urn catalog id */
  urnInventory: Record<string, number>;
  /** Owned counts keyed by casket catalog id (collection — not consumed by upgrades) */
  casketInventory: Record<string, number>;
  /** Permanent chapel décor ids owned via Emporium */
  chapelOwnedDecor: string[];
  /** Per-case chapel layout ( bier + flowers + theme ), persisted */
  chapelLayouts: Record<string, ChapelServiceLayout>;
  /** Tier levels for facility upgrades */
  facilityLevels: FacilityUpgradeLevels;
  /** Hour-window rare stock remaining (persisted) */
  shopRotation: ShopRotationState;
  placedFlowers: Array<'LILIES' | 'ROSES' | 'WREATH'>;
  serviceRatingBonus: number;
  legalAlert: string | null;
  /** Post-service family feedback (honored prefs + boost) — not persisted */
  serviceFeedback: {
    decedentName: string;
    honored: string[];
    missed: string[];
    prefBonus: number;
    tipCash: number;
    payoutBoostPct: number;
    reputationDelta: number;
    fleetRecovery: string | null;
    fleetEscort: string | null;
    fleetCoach: string | null;
    fleetRep: number;
    fleetCash: number;
    intermentThisService: number;
    intermentTotal: number;
  } | null;
  /** Computer portal — cremation permit filing history (wiped on Reset Game) */
  permitSubmissions: PermitSubmissionRecord[];
  /** Consecutive rejected permit filings → streak fine */
  permitWrongStreak: number;
  /** Simple cash ledger (permit fees, fines, …) — wiped on Reset Game */
  financeLedger: FinanceLedgerEntry[];
  /**
   * gameNow() when cash first went negative; null when cash >= 0.
   * Persisted so debt time survives restarts.
   */
  negativeCashSinceMs: number | null;
  /** True after the 2h bank warning toast was issued for this debt stretch */
  bankWarningIssued: boolean;
  /** True when 4h debt triggered foreclosure game-over */
  bankForeclosed: boolean;
  /** Current funeral home property (persisted) */
  ownedProperty: OwnedProperty;
  /** Open personal loans + mortgages (persisted) */
  activeLoans: ActiveBankLoan[];
  /** Owned Lampblack cortege vehicle ids (persisted) */
  ownedFleetIds: string[];
  /** Explicit cortege slots; null = auto-best in that class (persisted) */
  fleetAssignment: FleetAssignment;
  /** Lifetime interment from funeral coaches (persisted) */
  intermentScore: number;
  /** Newest intake or last finished service (persisted). */
  lastCase: LastCaseNote | null;
  /**
   * Wall-clock when the player left the embalming table.
   * Fumes linger on the hub. Not persisted.
   */
  embalmingLeftAtMs: number | null;
  /** Working cremulator available for urn processing */
  cremulatorOwned: boolean;
  cremulatorDamaged: boolean;
  /** Synced from Millennium retort — slows/stops decay while burning */
  cremationBurnActive: boolean;
  cremationBurnProgress: number;
  cremationHeatNormalized: number;
  /** Latches once burn reaches 15% — stays frozen through sweep / burner stops */
  cremationDecayArrested: boolean;
  /** Persistent Millennium retort — keeps burning while you leave the room */
  retort: RetortMachine;
  startGame: () => void;
  /**
   * Wipe gameplay progress in memory (title screen). Pair with pausing
   * persist writes so Capacitor reloads cannot resurrect the old save.
   */
  /** Wipe to title. Pass toast text for player-facing resets; omit for DEV default. */
  hardResetGameState: (toast?: string | null) => void;
  setActiveStation: (station: StationId) => void;
  setComputerOpenApp: (
    app: 'VR441' | 'SHOP' | 'BANK' | 'REALTY' | 'FLEETS' | null
  ) => void;
  buyFleetVehicle: (id: string) => { ok: boolean; message: string };
  assignFleetVehicle: (fleetClass: FleetClass, id: string | null) => void;
  setBankOpenTab: (tab: 'overview' | 'loans' | 'listings' | null) => void;
  patchRetort: (partial: Partial<RetortMachine>) => void;
  ensureRetortForCase: (caseId: string) => void;
  resetRetort: () => void;
  tickRetortDoor: () => void;
  tickRetortBurn: () => void;
  syncCremationDecayState: (state: {
    active: boolean;
    progress: number;
    heatNormalized: number;
  }) => void;
  clearCremationDecayState: () => void;
  selectActiveCase: (caseId: string) => void;
  /** Sync selection to the case currently on a station without clearing chapel décor */
  focusCase: (caseId: string) => void;
  tagBodyInCooler: (caseId: string) => void;
  markFileRead: (fileId: string) => void;
  setServiceDate: (caseId: string, serviceDateMs: number) => void;
  clearIntakeToast: () => void;
  receiveNewIntake: () => boolean;
  expireUntaggedNames: () => void;
  tickDecay: () => void;
  /** Fire due family urn requests → toast + case file update */
  tickFamilyUrnChoices: () => void;
  /** Resolve pending cremation permit evaluations that are due */
  tickPermitEvaluations: () => void;
  /** Track continuous negative cash → bank warning → foreclosure */
  tickBankForeclosure: () => void;
  /** Player dismisses foreclosure → wipe save like Reset Game */
  acknowledgeBankForeclosure: () => void;
  facilitySpaceUsed: () => number;
  facilitySpaceTotal: () => number;
  takeBankLoan: (productId: string) => { ok: boolean; message: string };
  payBankLoanInstallment: (loanId: string) => { ok: boolean; message: string };
  earlyPayoffBankLoan: (loanId: string) => { ok: boolean; message: string };
  buyProperty: (
    listingId: string,
    method: 'CASH' | 'MORTGAGE'
  ) => { ok: boolean; message: string };
  tickBankLoans: () => void;
  markActiveCaseEmbalmed: () => boolean;
  /** File a cremation permit from the Computer portal (vitals-only match + fee) */
  submitCremationPermit: (
    form: PermitFormDraft,
    filingFee: number
  ) => { ok: boolean; message: string };
  getActiveCase: () => DecedentCase | null;
  moveCaseTo: (caseId: string, location: CaseLocation) => void;
  /** @deprecated prefer moveCaseTo(caseId, location) */
  moveActiveCaseTo: (location: CaseLocation, caseId?: string) => void;
  takeCaseToStation: (caseId: string, station: StationId) => void;
  takeActiveCaseToStation: (station: StationId, caseId?: string) => void;
  completeEmbalming: (
    rank: Rank,
    tipMultiplier: number,
    caseId: string
  ) => void;
  completeCremation: (
    rank: Rank,
    boneAshGrams: number,
    caseId: string
  ) => void;
  completeUrnFilling: (
    bonusCash: number,
    caseId: string,
    pourQuality?: number
  ) => void;
  /** Mark cremulator ash ready so Emporium trips resume at SELECT_URN / POUR */
  markUrnAshReady: (caseId: string) => void;
  storeUrnInVault: (caseId: string) => void;
  buyShowroomItem: (itemId: string) => void;
  buyUrn: (urnId: string) => boolean;
  buyCasket: (casketId: string) => boolean;
  buyChapelDecor: (decorId: string) => boolean;
  buyFacilityUpgrade: (id: FacilityUpgradeId) => {
    ok: boolean;
    reason?: 'cash' | 'collection' | 'space' | 'maxed';
    message?: string;
  };
  offerUrnToCase: (caseId: string, urnId: string | null) => void;
  offerCasketToCase: (caseId: string, casketId: string | null) => void;
  ensureChapelLayout: (caseId: string) => void;
  setChapelTheme: (
    caseId: string,
    theme: Partial<ChapelThemeSelection>
  ) => void;
  setChapelServiceMusic: (caseId: string, musicTrackId: string | null) => void;
  moveChapelPiece: (
    caseId: string,
    pieceId: string,
    x: number,
    y: number
  ) => void;
  placeFloralSpray: (
    flower: 'LILIES' | 'ROSES' | 'WREATH',
    caseId: string
  ) => void;
  removeChapelFlower: (caseId: string, pieceId: string) => void;
  finalizeServiceAndNextCase: (
    chosenDisposition: 'BURIAL' | 'CREMATION',
    caseId: string
  ) => void;
  clearLegalAlert: () => void;
  clearServiceFeedback: () => void;
  damageCremulator: () => void;
  buyReplacementCremulator: () => boolean;
  coolerCapacity: () => number;
  vaultCapacity: () => number;
}

export const CREMULATOR_REPLACEMENT_COST = 1850;

/** Prefer the selected case when it is already at `location`, else any case there. */
export function caseAtLocation(
  cases: DecedentCase[],
  location: CaseLocation,
  activeCaseId: string | null
): DecedentCase | null {
  const selected = cases.find(
    (c) => c.id === activeCaseId && c.location === location
  );
  if (selected) return selected;
  return cases.find((c) => c.location === location) ?? null;
}

const FIRST_NAMES = [
  'Arthur',
  'Walter',
  'Eleanor',
  'Silas',
  'Harold',
  'Margaret',
  'Clara',
  'Victor',
  'Beatrice',
  'Raymond',
  'Dorothy',
  'Francis',
  'Irene',
  'Otto',
  'Lillian',
  'Gerald',
  'Esther',
  'Norman',
  'Agatha',
  'Edmund',
  'Pearl',
  'Theodore',
  'Mabel',
  'Curtis',
  'Sylvia',
] as const;

const LAST_NAMES = [
  'Pendelton',
  'Vex',
  'Vance',
  'Thorne',
  'Finch',
  'Ashcroft',
  'Blackwood',
  'Crowe',
  'Dunmore',
  'Ellsworth',
  'Fairchild',
  'Graves',
  'Holloway',
  'Ingram',
  'Lockwood',
  'Marlow',
  'North',
  'Oakley',
  'Pritchard',
  'Quill',
  'Ravenscroft',
  'Sterling',
  'Underwood',
  'Whitaker',
  'York',
] as const;

function randomDecedentName(): string {
  const first = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)];
  const last = LAST_NAMES[Math.floor(Math.random() * LAST_NAMES.length)];
  return `${first} ${last}`;
}

export function generateRandomCase(now = gameNow()): DecedentCase {
  const weights = [135, 165, 190, 245, 285];
  const conditions: Array<{
    cond: DecedentCase['tissueCondition'];
    factor: number;
  }> = [
    { cond: 'NORMAL', factor: 1.0 },
    { cond: 'DEHYDRATED', factor: 2.0 },
    { cond: 'EDEMATOUS', factor: 0.5 },
  ];
  const directives: DecedentCase['directive'][] = [
    'BURIAL_VIEWING',
    'CREMATION_DIRECT',
    'VIEWING_THEN_CREMATION',
    'CREMATION_THEN_VIEWING',
  ];
  const flowers: DecedentCase['preferredFlowers'][] = [
    'LILIES',
    'ROSES',
    'WREATH',
  ];
  const urnMats = URN_MATERIALS as PreferredUrnMaterial[];
  const casketMats = CASKET_MATERIALS as PreferredCasketMaterial[];

  const pickedCond = conditions[Math.floor(Math.random() * conditions.length)];
  const directive = directives[Math.floor(Math.random() * directives.length)];
  const payoutByDirective: Record<DecedentCase['directive'], number> = {
    CREMATION_DIRECT: 950,
    BURIAL_VIEWING: 1350,
    VIEWING_THEN_CREMATION: 1650,
    // Cremate → urn → chapel gathering: between burial viewing and dual-path
    CREMATION_THEN_VIEWING: 1550,
  };
  const vitals = generateDecedentVitals(now);
  const preferredFlowers =
    flowers[Math.floor(Math.random() * flowers.length)]!;
  return {
    id: Math.random().toString(36).substring(2, 8).toUpperCase(),
    name: randomDecedentName(),
    weightLbs: weights[Math.floor(Math.random() * weights.length)],
    tissueCondition: pickedCond.cond,
    dehydrationFactor: pickedCond.factor,
    directive,
    preferredFlowers,
    familyChapelPrefs: rollFamilyChapelPreferences(preferredFlowers),
    preferredUrnMaterial: urnMats[Math.floor(Math.random() * urnMats.length)],
    preferredCasketMaterial:
      casketMats[Math.floor(Math.random() * casketMats.length)],
    offeredUrnId: null,
    offeredCasketId: null,
    familyRequestedUrnId: null,
    familyUrnDueAt: directiveNeedsUrn(directive)
      ? rollFamilyUrnDueAt(now)
      : null,
    urnPourQuality: 0,
    urnAshReady: false,
    location: 'COOLER',
    isEmbalmed: false,
    isCremated: false,
    isUrnFilled: false,
    basePayout: payoutByDirective[directive],
    arrivedAt: now,
    tagExpiresAt: now + TAG_WINDOW_MS,
    isTagged: false,
    nameExpired: false,
    decayLevel: 0,
    leftCoolerAt: null,
    serviceDateMs: null,
    ...vitals,
    cremationPermitStatus: initialPermitStatus(directive),
    cremationPermitSubmittedAt: null,
    cremationPermitEvaluatesAt: null,
    cremationPermitRejectReason: null,
    unpermittedCremation: false,
  };
}

export function toInboxFile(c: DecedentCase): CaseInboxFile {
  return {
    id: c.id,
    decedentName: c.name,
    intakeTimestamp: c.arrivedAt,
    weightLbs: c.weightLbs,
    tissueCondition: c.tissueCondition,
    directive: c.directive,
    preferredFlowers: c.preferredFlowers,
    familyChapelPrefs: c.familyChapelPrefs,
    isRead: false,
    serviceDateMs: c.serviceDateMs,
    familyRequestedUrnId: c.familyRequestedUrnId,
    dateOfBirthMs: c.dateOfBirthMs,
    dateOfDeathMs: c.dateOfDeathMs,
    timeOfDeathHour: c.timeOfDeathHour,
    timeOfDeathMinute: c.timeOfDeathMinute,
    placeOfBirth: c.placeOfBirth,
    cremationPermitStatus: c.cremationPermitStatus,
    cremationPermitRejectReason: c.cremationPermitRejectReason,
  };
}

function syncInboxPermit(
  files: CaseInboxFile[],
  caseId: string,
  patch: Partial<CaseInboxFile>
): CaseInboxFile[] {
  return files.map((f) => (f.id === caseId ? { ...f, ...patch } : f));
}

function normalizeCase(c: DecedentCase): DecedentCase {
  const arrivedAt = c.arrivedAt ?? gameNow();
  const vitals =
    c.dateOfBirthMs != null &&
    c.dateOfDeathMs != null &&
    c.placeOfBirth != null &&
    c.timeOfDeathHour != null &&
    c.timeOfDeathMinute != null
      ? {
          dateOfBirthMs: c.dateOfBirthMs,
          dateOfDeathMs: c.dateOfDeathMs,
          timeOfDeathHour: c.timeOfDeathHour,
          timeOfDeathMinute: c.timeOfDeathMinute,
          placeOfBirth: c.placeOfBirth,
        }
      : generateDecedentVitals(arrivedAt);
  const permitStatus: CremationPermitStatus =
    c.cremationPermitStatus ?? initialPermitStatus(c.directive);
  const flowers = (c.preferredFlowers ?? 'LILIES') as FlowerKind;
  const prefs: FamilyChapelPreferences =
    c.familyChapelPrefs ?? rollFamilyChapelPreferences(flowers);
  return {
    ...c,
    preferredFlowers: flowers,
    familyChapelPrefs: {
      ...prefs,
      flowers: prefs.flowers ?? flowers,
    },
    preferredUrnMaterial: c.preferredUrnMaterial ?? URN_MATERIALS[0],
    preferredCasketMaterial: c.preferredCasketMaterial ?? CASKET_MATERIALS[0],
    offeredUrnId: c.offeredUrnId ?? null,
    offeredCasketId: c.offeredCasketId ?? null,
    familyRequestedUrnId: c.familyRequestedUrnId ?? null,
    familyUrnDueAt:
      c.familyUrnDueAt ??
      (directiveNeedsUrn(c.directive) && !c.familyRequestedUrnId
        ? rollFamilyUrnDueAt(arrivedAt)
        : null),
    urnPourQuality: c.urnPourQuality ?? 0,
    urnAshReady: c.urnAshReady ?? false,
    ...vitals,
    cremationPermitStatus: permitStatus,
    cremationPermitSubmittedAt: c.cremationPermitSubmittedAt ?? null,
    cremationPermitEvaluatesAt: c.cremationPermitEvaluatesAt ?? null,
    cremationPermitRejectReason: c.cremationPermitRejectReason ?? null,
    unpermittedCremation: c.unpermittedCremation ?? false,
  };
}

const flowerItemId: Record<'LILIES' | 'ROSES' | 'WREATH', string> = {
  LILIES: 'flower_lilies',
  ROSES: 'flower_roses',
  WREATH: 'flower_wreath',
};

function updateCaseById(
  cases: DecedentCase[],
  caseId: string,
  updater: (c: DecedentCase) => DecedentCase
): DecedentCase[] {
  return cases.map((c) => (c.id === caseId ? updater(c) : c));
}

function resolveActiveCase(state: GameState): DecedentCase | null {
  if (!state.activeCaseId) return null;
  return state.cases.find((c) => c.id === state.activeCaseId) ?? null;
}

function resolveCase(
  state: GameState,
  caseId?: string | null
): DecedentCase | null {
  if (caseId) return state.cases.find((c) => c.id === caseId) ?? null;
  return resolveActiveCase(state);
}

function relocateCase(
  c: DecedentCase,
  location: CaseLocation,
  now: number
): DecedentCase {
  return {
    ...c,
    location,
    leftCoolerAt:
      location === 'COOLER'
        ? null
        : c.location === 'COOLER'
          ? now
          : c.leftCoolerAt,
  };
}

function stationForLocation(location: CaseLocation): StationId | null {
  if (location === 'COOLER') return 'COOLER';
  if (location === 'CHAPEL') return 'SHOWROOM';
  if (location === 'URN_VAULT') return 'URN_VAULT';
  if (location === 'EMBALMING') return 'EMBALMING';
  if (location === 'CREMATION') return 'CREMATION';
  if (location === 'URN_FILLING') return 'URN_FILLING';
  return null;
}

/** Derive placedFlowers mirror from per-case chapel layout (no inventory change). */
function flowersFromLayout(
  state: GameState,
  caseId: string
): Array<'LILIES' | 'ROSES' | 'WREATH'> {
  const layout = state.chapelLayouts[caseId];
  return (layout?.pieces ?? [])
    .map((p) => p.kind)
    .filter(
      (k): k is 'LILIES' | 'ROSES' | 'WREATH' =>
        k === 'LILIES' || k === 'ROSES' || k === 'WREATH'
    );
}

/**
 * Random delay between 3–5 minutes for the next intake.
 * Higher `clientFlow` (property stat) shortens the wait.
 */
export function nextIntakeDelayMs(clientFlow = 1): number {
  const base =
    INTAKE_MIN_MS +
    Math.floor(Math.random() * (INTAKE_MAX_MS - INTAKE_MIN_MS + 1));
  const flow = Math.max(0.5, Number.isFinite(clientFlow) ? clientFlow : 1);
  return Math.max(20_000, Math.round(base / flow));
}

const defaultShowroomInventory: ShowroomItem[] = [
  {
    id: 'casket_oak',
    name: 'Half-Couch Oak Casket',
    category: 'CASKET',
    cost: 400,
    resaleValue: 1100,
    prestigeBonus: 10,
    ownedCount: 1,
  },
  {
    id: 'coffin_oct',
    name: 'Traditional Tapered Coffin',
    category: 'COFFIN',
    cost: 250,
    resaleValue: 700,
    prestigeBonus: 5,
    ownedCount: 2,
  },
  {
    id: 'keepsake_mini',
    name: 'Miniature Keepsake Urn Set',
    category: 'KEEPSAKE',
    cost: 65,
    resaleValue: 210,
    prestigeBonus: 6,
    ownedCount: 3,
  },
  {
    id: 'flower_lilies',
    name: 'Standing Peace Lily Spray',
    category: 'FLOWER',
    cost: 50,
    resaleValue: 160,
    prestigeBonus: 4,
    ownedCount: 2,
  },
  {
    id: 'flower_roses',
    name: 'Rose Casket Spray',
    category: 'FLOWER',
    cost: 55,
    resaleValue: 175,
    prestigeBonus: 4,
    ownedCount: 1,
  },
  {
    id: 'flower_wreath',
    name: 'Memorial Laurel Wreath',
    category: 'FLOWER',
    cost: 70,
    resaleValue: 200,
    prestigeBonus: 5,
    ownedCount: 1,
  },
  {
    id: 'decor_pews',
    name: 'Velvet Cushioned Chapel Bench',
    category: 'DECOR',
    cost: 600,
    resaleValue: 0,
    prestigeBonus: 20,
    ownedCount: 1,
  },
];

/** Default persisted gameplay fields for a brand-new / Reset Game save. */
export function freshPersistedGameFields() {
  return {
    hasStartedGame: false as const,
    cash: 2500,
    reputation: 100,
    ossilegiumCommuneGrams: 0,
    activeStation: 'OVERVIEW' as const,
    cases: [] as DecedentCase[],
    activeCaseId: null as string | null,
    inboxFiles: [] as CaseInboxFile[],
    showroomInventory: defaultShowroomInventory.map((i) => ({ ...i })),
    urnInventory: {
      urn_carrara_classic: 1,
      urn_walnut_pillar: 1,
    } as Record<string, number>,
    casketInventory: {
      casket_oak_half: 1,
      casket_pine_tapered: 1,
    } as Record<string, number>,
    chapelOwnedDecor: [] as string[],
    chapelLayouts: {} as Record<string, ChapelServiceLayout>,
    facilityLevels: { ...DEFAULT_FACILITY_LEVELS },
    shopRotation: createShopRotation(),
    placedFlowers: [] as ('LILIES' | 'ROSES' | 'WREATH')[],
    serviceRatingBonus: 0,
    cremulatorOwned: true,
    cremulatorDamaged: false,
    cremationBurnActive: false,
    cremationBurnProgress: 0,
    cremationHeatNormalized: 0,
    cremationDecayArrested: false,
    retort: { ...IDLE_RETORT },
    permitSubmissions: [] as PermitSubmissionRecord[],
    permitWrongStreak: 0,
    financeLedger: [] as FinanceLedgerEntry[],
    negativeCashSinceMs: null as number | null,
    bankWarningIssued: false,
    bankForeclosed: false,
    ownedProperty: ownedFromListing(STARTER_PROPERTY, 0),
    activeLoans: [] as ActiveBankLoan[],
    ownedFleetIds: [] as string[],
    fleetAssignment: { ...EMPTY_FLEET_ASSIGNMENT },
    intermentScore: 0,
    lastCase: null as LastCaseNote | null,
  };
}

/** Pause Zustand persist writes (Capacitor-safe wipe). */
export function pauseGamePersistWrites() {
  useGameStore.persist.setOptions({
    storage: createJSONStorage(() => ({
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    })),
  });
}

function normalizeLastCase(raw: unknown): LastCaseNote | null {
  if (!raw || typeof raw !== 'object') return null;
  const r = raw as Partial<LastCaseNote>;
  if (typeof r.name !== 'string' || typeof r.service !== 'string') return null;
  return {
    id: typeof r.id === 'string' ? r.id : '',
    name: r.name,
    service: r.service,
    at: typeof r.at === 'number' ? r.at : 0,
  };
}

/** Restore default localStorage persist after a wipe cycle. */
export function resumeGamePersistWrites() {
  useGameStore.persist.setOptions({
    storage: createJSONStorage(() => localStorage),
  });
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
  ...freshPersistedGameFields(),
  computerOpenApp: null,
  bankOpenTab: null,
  intakeToast: null,
  legalAlert: null,
  serviceFeedback: null,
  embalmingLeftAtMs: null,

  getActiveCase: () => resolveActiveCase(get()),

  startGame: () =>
    set((state) => {
      const now = gameNow();
      const cases = state.cases.map((c, index) => {
        if (index !== 0 || c.isTagged || c.nameExpired) return c;
        return {
          ...c,
          arrivedAt: now,
          tagExpiresAt: now + TAG_WINDOW_MS,
          nameExpired: false,
        };
      });
      const inboxFiles = state.inboxFiles.map((f, index) =>
        index === 0 ? { ...f, intakeTimestamp: now } : f
      );
      return {
        hasStartedGame: true,
        activeStation: 'OVERVIEW' as const,
        cases,
        inboxFiles,
      };
    }),

  hardResetGameState: (toast) =>
    set({
      ...freshPersistedGameFields(),
      computerOpenApp: null,
      bankOpenTab: null,
      intakeToast:
        toast === undefined
          ? '[DEV] Game reset — back at title.'
          : toast,
      legalAlert: null,
      serviceFeedback: null,
      embalmingLeftAtMs: null,
    }),

  setActiveStation: (station) => {
    const prev = get().activeStation;
    const leftEmbalming =
      prev === 'EMBALMING' && station !== 'EMBALMING'
        ? { embalmingLeftAtMs: Date.now() }
        : {};
    // Emporium lives on the Computer as a shop browser tab
    if (station === 'EMPORIUM') {
      set({ activeStation: 'COMPUTER', computerOpenApp: 'SHOP', ...leftEmbalming });
      return;
    }
    if (station === 'COMPUTER') {
      set({ activeStation: 'COMPUTER', computerOpenApp: null, ...leftEmbalming });
      return;
    }
    set({ activeStation: station, ...leftEmbalming });
  },

  setComputerOpenApp: (app) => set({ computerOpenApp: app }),
  setBankOpenTab: (tab) => set({ bankOpenTab: tab }),

  facilitySpaceUsed: () => totalFacilitySpaceUsed(get().facilityLevels),
  facilitySpaceTotal: () => get().ownedProperty?.spaceTotal ?? STARTER_PROPERTY.space,


  selectActiveCase: (caseId) => {
    const state = get();
    if (!state.cases.some((c) => c.id === caseId)) return;
    if (state.activeCaseId === caseId) return;
    // Chapel flowers live in per-case layouts (merch already consumed).
    // Do NOT refund on case switch — that double-refunded when sprays were removed later.
    set({
      activeCaseId: caseId,
      placedFlowers: flowersFromLayout(state, caseId),
      serviceRatingBonus: 0,
    });
  },

  focusCase: (caseId) => {
    const state = get();
    if (!state.cases.some((c) => c.id === caseId)) return;
    if (state.activeCaseId === caseId) return;
    set({ activeCaseId: caseId });
  },

  tagBodyInCooler: (caseId) =>
    set((state) => {
      const now = gameNow();
      const cases = state.cases.map((c) => {
        if (c.id !== caseId) return c;
        if (c.isTagged || now >= c.tagExpiresAt) return c;
        return { ...c, isTagged: true, nameExpired: false };
      });
      if (state.activeCaseId === caseId) return { cases };
      // Same as selectActiveCase: mirror layout flowers, never refund merch
      return {
        cases,
        activeCaseId: caseId,
        placedFlowers: flowersFromLayout(state, caseId),
        serviceRatingBonus: 0,
      };
    }),

  markFileRead: (fileId) =>
    set((state) => ({
      inboxFiles: state.inboxFiles.map((f) =>
        f.id === fileId ? { ...f, isRead: true } : f
      ),
    })),

  setServiceDate: (caseId, serviceDateMs) =>
    set((state) => ({
      cases: updateCaseById(state.cases, caseId, (c) => ({
        ...c,
        serviceDateMs,
      })),
      inboxFiles: state.inboxFiles.map((f) =>
        f.id === caseId ? { ...f, serviceDateMs, isRead: true } : f
      ),
    })),

  clearIntakeToast: () => set({ intakeToast: null }),

  coolerCapacity: () =>
    coolerBayCapacity(get().facilityLevels.cooler_bays || 0),

  vaultCapacity: () => vaultSlotCapacity(get().facilityLevels.vault || 0),

  receiveNewIntake: () => {
    const state = get();
    const coolerCount = state.cases.filter((c) => c.location === 'COOLER')
      .length;
    const cap = coolerBayCapacity(state.facilityLevels.cooler_bays || 0);
    if (coolerCount >= cap) return false;
    const next = generateRandomCase();
    playIntakeBell();
    set({
      cases: [...state.cases, next],
      inboxFiles: [toInboxFile(next), ...state.inboxFiles],
      intakeToast: 'New Remains Received in Cooler',
      activeCaseId: state.activeCaseId ?? next.id,
      lastCase: {
        id: next.id,
        name: next.name,
        service: directiveLabel(next.directive),
        at: next.arrivedAt,
      },
    });
    return true;
  },

  expireUntaggedNames: () =>
    set((state) => {
      const now = gameNow();
      let changed = false;
      const cases = state.cases.map((c) => {
        if (!c.isTagged && !c.nameExpired && now >= c.tagExpiresAt) {
          changed = true;
          return { ...c, nameExpired: true };
        }
        return c;
      });
      return changed ? { cases } : state;
    }),

  syncCremationDecayState: ({ active, progress, heatNormalized }) =>
    set((state) => {
      const p = Math.max(0, Math.min(1, progress));
      return {
        cremationBurnActive: active,
        cremationBurnProgress: Math.max(state.cremationBurnProgress, p),
        cremationHeatNormalized: Math.max(0, Math.min(1, heatNormalized)),
        cremationDecayArrested:
          state.cremationDecayArrested || p >= 0.15,
      };
    }),

  clearCremationDecayState: () =>
    set({
      cremationBurnActive: false,
      cremationBurnProgress: 0,
      cremationHeatNormalized: 0,
      cremationDecayArrested: false,
    }),

  patchRetort: (partial) =>
    set((state) => ({
      retort: { ...state.retort, ...partial },
    })),

  ensureRetortForCase: (caseId) =>
    set((state) => {
      const r = state.retort;
      // Resume the same chamber session
      if (r.caseId === caseId) {
        if (r.phase === 'IDLE' || r.phase === 'DONE') {
          return {
            retort: { ...IDLE_RETORT, caseId, phase: 'LOAD' },
            cremationBurnActive: false,
            cremationBurnProgress: 0,
            cremationHeatNormalized: 0,
            cremationDecayArrested: false,
          };
        }
        return state;
      }
      // Another case already occupies the retort — never wipe a live burn
      if (
        r.caseId != null &&
        r.phase !== 'IDLE' &&
        r.phase !== 'DONE'
      ) {
        return state;
      }
      return {
        retort: { ...IDLE_RETORT, caseId, phase: 'LOAD' },
        cremationBurnActive: false,
        cremationBurnProgress: 0,
        cremationHeatNormalized: 0,
        cremationDecayArrested: false,
      };
    }),

  resetRetort: () =>
    set({
      retort: { ...IDLE_RETORT },
      cremationBurnActive: false,
      cremationBurnProgress: 0,
      cremationHeatNormalized: 0,
      cremationDecayArrested: false,
    }),

  tickRetortDoor: () =>
    set((state) => {
      if (!state.retort.doorMoving) return state;
      return { retort: stepRetortDoor(state.retort) };
    }),

  tickRetortBurn: () =>
    set((state) => {
      const r = state.retort;
      if (
        r.phase === 'IDLE' ||
        r.phase === 'DONE' ||
        (!r.blowerOn &&
          !r.secondaryOn &&
          !r.primaryOn &&
          !r.purging &&
          r.phase !== 'BURN')
      ) {
        // Still cool temps slowly if something was warm
        if (
          r.phase === 'LOAD' &&
          !r.blowerOn &&
          !r.secondaryOn &&
          !r.primaryOn
        ) {
          return state;
        }
      }

      const cremationCase = state.cases.find(
        (c) => c.id === r.caseId && c.location === 'CREMATION'
      );
      // Bound remains left the chamber — shut the machine down
      if (!cremationCase && r.phase !== 'IDLE') {
        return {
          retort: { ...IDLE_RETORT },
          cremationBurnActive: false,
          cremationBurnProgress: 0,
          cremationHeatNormalized: 0,
          cremationDecayArrested: false,
        };
      }

      const targets = cremationCase
        ? getCremationTargets(cremationCase.weightLbs)
        : null;
      const speed = crematoryBurnSpeed(state.facilityLevels.crematory || 0);
      const progress =
        targets != null
          ? Math.min(1, r.elapsedSec / targets.targetDurationSec)
          : 0;
      const maxSafe = targets?.getMaxSafeTempF(progress) ?? 1600;
      let next = stepRetortBurn(r, maxSafe);
      // Apply efficiency upgrade as extra elapsed time on burn ticks
      if (
        speed > 1 &&
        next.phase === 'BURN' &&
        next.primaryOn &&
        next.elapsedSec > r.elapsedSec
      ) {
        const delta = next.elapsedSec - r.elapsedSec;
        next = {
          ...next,
          elapsedSec: r.elapsedSec + delta * speed,
        };
      }

      const heatNormalized = Math.min(
        1,
        Math.max(0, (next.primaryTemp - 200) / 1200)
      );
      const burnActive =
        next.phase === 'BURN' && (next.primaryOn || next.secondaryOn);

      return {
        retort: next,
        cremationBurnActive: burnActive,
        cremationBurnProgress: Math.max(
          state.cremationBurnProgress,
          progress
        ),
        cremationHeatNormalized: heatNormalized,
        cremationDecayArrested:
          state.cremationDecayArrested || progress >= 0.15,
      };
    }),

  tickDecay: () =>
    set((state) => {
      let changed = false;
      const cases = state.cases.map((c) => {
        const refrigerated = c.location === 'COOLER';
        const preserved = c.isEmbalmed || c.isCremated || c.isUrnFilled;
        if (refrigerated || preserved || c.location === 'URN_VAULT') {
          return c;
        }

        const inActiveRetort =
          c.location === 'CREMATION' && c.id === state.retort.caseId;

        if (
          inActiveRetort &&
          (state.cremationDecayArrested ||
            state.cremationBurnProgress >= 0.15)
        ) {
          return c;
        }

        let rate = DECAY_PER_SEC;
        if (inActiveRetort && state.cremationBurnActive) {
          rate =
            DECAY_PER_SEC *
            Math.max(0.08, 1 - state.cremationHeatNormalized * 0.92);
        }

        const nextDecay = Math.min(100, c.decayLevel + rate);
        if (nextDecay === c.decayLevel) return c;
        changed = true;
        return { ...c, decayLevel: nextDecay };
      });
      return changed ? { cases } : state;
    }),

  tickFamilyUrnChoices: () =>
    set((state) => {
      const now = gameNow();
      let toast: string | null = null;
      let any = false;
      const cases = state.cases.map((c) => {
        if (c.familyRequestedUrnId) return c;
        if (c.familyUrnDueAt == null || now < c.familyUrnDueAt) return c;
        if (!directiveNeedsUrn(c.directive)) return c;
        const urnId = pickFamilyUrnRequest(c, state.reputation);
        const urn = getUrnById(urnId);
        any = true;
        toast = urn
          ? `Family selected ${urn.name} for ${c.isTagged ? c.name : 'their loved one'}`
          : 'Family sent a vessel request';
        return {
          ...c,
          familyRequestedUrnId: urnId,
          familyUrnDueAt: null,
        };
      });
      if (!any) return state;
      const inboxFiles = state.inboxFiles.map((f) => {
        const match = cases.find((c) => c.id === f.id);
        if (!match || match.familyRequestedUrnId === f.familyRequestedUrnId) {
          return f;
        }
        return {
          ...f,
          familyRequestedUrnId: match.familyRequestedUrnId,
          isRead: false,
        };
      });
      return {
        cases,
        inboxFiles,
        intakeToast: toast ?? state.intakeToast,
      };
    }),

  tickPermitEvaluations: () =>
    set((state) => {
      const now = gameNow();
      let toast: string | null = null;
      let legalAlert: string | null = null;
      let wrongStreak = state.permitWrongStreak;
      let cash = state.cash;
      let reputation = state.reputation;
      let financeLedger = state.financeLedger;
      let any = false;

      const submissions = state.permitSubmissions.map((sub) => {
        if (sub.status !== 'PENDING' || now < sub.evaluatesAt) return sub;
        any = true;
        const approved =
          sub.caseId != null && sub.mismatchLabels.length === 0;
        if (approved) {
          wrongStreak = 0;
          toast = 'Cremation permit APPROVED.';
          return {
            ...sub,
            status: 'APPROVED' as const,
            evaluatedAt: now,
          };
        }
        wrongStreak += 1;
        toast =
          'Cremation permit REJECTED — vital records could not be verified.';
        if (wrongStreak >= PERMIT_ERROR_STREAK_LIMIT) {
          cash = cash - PERMIT_ERROR_STREAK_FINE;
          reputation = Math.max(0, reputation - PERMIT_ERROR_STREAK_REP_HIT);
          financeLedger = [
            {
              id: `fine-${now.toString(36)}`,
              at: now,
              amount: -PERMIT_ERROR_STREAK_FINE,
              label: `Vital Records incorrect-filing fine (${PERMIT_ERROR_STREAK_LIMIT}+)`,
              kind: 'FINE' as const,
            },
            ...financeLedger,
          ].slice(0, 80);
          legalAlert = `STATE VITAL RECORDS FINE: ${PERMIT_ERROR_STREAK_LIMIT}+ incorrect cremation permit filings. $${PERMIT_ERROR_STREAK_FINE} levied and reputation docked. Review Case Files carefully before resubmitting.`;
          wrongStreak = 0;
        }
        return {
          ...sub,
          status: 'REJECTED' as const,
          evaluatedAt: now,
        };
      });

      if (!any) return state;

      let inboxFiles = state.inboxFiles;
      const cases = state.cases.map((c) => {
        const due = submissions.find(
          (s) =>
            s.caseId === c.id &&
            s.evaluatedAt === now &&
            (s.status === 'APPROVED' || s.status === 'REJECTED')
        );
        if (!due) return c;
        if (due.status === 'APPROVED') {
          inboxFiles = syncInboxPermit(inboxFiles, c.id, {
            cremationPermitStatus: 'APPROVED',
            cremationPermitRejectReason: null,
            isRead: false,
          });
          return {
            ...c,
            cremationPermitStatus: 'APPROVED' as const,
            cremationPermitEvaluatesAt: null,
            cremationPermitRejectReason: null,
          };
        }
        inboxFiles = syncInboxPermit(inboxFiles, c.id, {
          cremationPermitStatus: 'REJECTED',
          cremationPermitRejectReason: PERMIT_REJECT_GENERIC,
          isRead: false,
        });
        return {
          ...c,
          cremationPermitStatus: 'REJECTED' as const,
          cremationPermitEvaluatesAt: null,
          cremationPermitRejectReason: PERMIT_REJECT_GENERIC,
        };
      });

      return {
        cases,
        inboxFiles,
        permitSubmissions: submissions,
        permitWrongStreak: wrongStreak,
        cash,
        reputation,
        financeLedger,
        intakeToast: toast ?? state.intakeToast,
        legalAlert: legalAlert ?? state.legalAlert,
      };
    }),

  submitCremationPermit: (form, filingFee) => {
    const state = get();
    const fee = Math.max(0, Math.round(filingFee));
    if (fee <= 0) {
      return { ok: false, message: 'Invalid filing fee.' };
    }
    if (state.cash < fee) {
      return {
        ok: false,
        message: `Insufficient funds. Filing fee is $${fee}.`,
      };
    }

    const matched = findExactPermitCaseMatch(form, state.cases);
    const now = gameNow();
    const evaluatesAt = rollPermitEvaluationDueAt(now);
    const exact = matched != null;
    const submission: PermitSubmissionRecord = {
      id: `vr441-${now.toString(36)}`,
      caseId: exact ? matched.id : null,
      decedentName: exact ? matched.name : form.legalName.trim() || 'UNKNOWN',
      submittedAt: now,
      evaluatesAt,
      evaluatedAt: null,
      status: 'PENDING',
      // Non-empty sentinel ⇒ evaluate as reject without leaking which fields
      mismatchLabels: exact ? [] : ['Vital records'],
      form: { ...form },
      filingFee: fee,
    };

    const ledgerEntry: FinanceLedgerEntry = {
      id: `fee-${now.toString(36)}`,
      at: now,
      amount: -fee,
      label: exact
        ? `VR-441 cremation permit filing fee`
        : `VR-441 cremation permit filing fee (unverified)`,
      kind: 'PERMIT_FEE',
    };

    let cases = state.cases;
    let inboxFiles = state.inboxFiles;
    if (exact) {
      cases = updateCaseById(cases, matched.id, (row) => ({
        ...row,
        cremationPermitStatus: 'PENDING',
        cremationPermitSubmittedAt: now,
        cremationPermitEvaluatesAt: evaluatesAt,
        cremationPermitRejectReason: null,
      }));
      inboxFiles = syncInboxPermit(inboxFiles, matched.id, {
        cremationPermitStatus: 'PENDING',
        cremationPermitRejectReason: null,
        isRead: false,
      });
    }

    set({
      cash: state.cash - fee,
      financeLedger: [ledgerEntry, ...state.financeLedger].slice(0, 80),
      permitSubmissions: [submission, ...state.permitSubmissions].slice(0, 40),
      cases,
      inboxFiles,
      intakeToast: exact
        ? `Permit filed (fee $${fee}) — pending state evaluation.`
        : `Permit filed (fee $${fee}) — pending state evaluation.`,
    });

    return {
      ok: true,
      message: `Submission received. Filing fee $${fee} charged. Vital Records will evaluate shortly.`,
    };
  },

  tickBankForeclosure: () =>
    set((state) => {
      if (!state.hasStartedGame || state.bankForeclosed) return state;
      const now = gameNow();

      if (state.cash >= 0) {
        if (state.negativeCashSinceMs == null && !state.bankWarningIssued) {
          return state;
        }
        return {
          negativeCashSinceMs: null,
          bankWarningIssued: false,
        };
      }

      let negativeCashSinceMs = state.negativeCashSinceMs;
      if (negativeCashSinceMs == null) {
        return { negativeCashSinceMs: now };
      }

      const elapsed = now - negativeCashSinceMs;
      if (elapsed >= BANK_FORECLOSURE_AFTER_MS) {
        return {
          bankForeclosed: true,
          intakeToast: 'BANK FORECLOSURE — the funeral home has been seized.',
          legalAlert: null,
        };
      }

      if (elapsed >= BANK_WARNING_AFTER_MS && !state.bankWarningIssued) {
        return {
          bankWarningIssued: true,
          intakeToast: BANK_WARNING_MESSAGE,
        };
      }

      return state;
    }),

  acknowledgeBankForeclosure: () => {
    pauseGamePersistWrites();
    try {
      resumeGamePersistWrites();
      useGameStore.persist.clearStorage();
    } catch {
      /* ignore */
    }
    try {
      localStorage.removeItem('ossuarian-first-urn-v1');
    } catch {
      /* ignore */
    }
    pauseGamePersistWrites();
    get().hardResetGameState(
      'Foreclosed — the funeral home was seized. Start a new practice when ready.'
    );
    window.setTimeout(() => {
      try {
        resumeGamePersistWrites();
        useGameStore.setState((s) => ({ intakeToast: s.intakeToast }));
      } catch {
        /* ignore */
      }
    }, 150);
  },

  moveCaseTo: (caseId, location) =>
    set((state) => {
      const target = resolveCase(state, caseId);
      if (!target) return state;
      if (location === 'URN_VAULT' && target.location !== 'URN_VAULT') {
        const vaultCount = state.cases.filter(
          (c) => c.location === 'URN_VAULT'
        ).length;
        const cap = vaultSlotCapacity(state.facilityLevels.vault || 0);
        if (vaultCount >= cap) {
          return {
            legalAlert: `VAULT FULL (${cap} niches). Expand the columbarium in Emporium Upgrades.`,
          };
        }
      }
      const r = state.retort;
      const retortBusy =
        r.caseId != null &&
        r.phase !== 'IDLE' &&
        r.phase !== 'DONE';
      if (
        location === 'CREMATION' &&
        retortBusy &&
        r.caseId !== caseId
      ) {
        return {
          intakeToast:
            'Retort occupied — finish the current cremation before loading another case.',
          activeStation: 'CREMATION',
          activeCaseId: r.caseId,
        };
      }
      const now = gameNow();
      const nextStation = stationForLocation(location);
      const leavingRetort =
        state.retort.caseId === caseId && location !== 'CREMATION';
      return {
        activeCaseId: caseId,
        cases: updateCaseById(state.cases, caseId, (c) =>
          relocateCase(c, location, now)
        ),
        activeStation: nextStation ?? state.activeStation,
        ...(leavingRetort
          ? {
              retort: { ...IDLE_RETORT },
              cremationBurnActive: false,
              cremationBurnProgress: 0,
              cremationHeatNormalized: 0,
              cremationDecayArrested: false,
            }
          : {}),
      };
    }),

  moveActiveCaseTo: (location, caseId) => {
    const id = caseId ?? get().activeCaseId;
    if (!id) return;
    get().moveCaseTo(id, location);
  },

  takeCaseToStation: (caseId, station) =>
    set((state) => {
      const target = resolveCase(state, caseId);
      if (!target) return { activeStation: station, activeCaseId: caseId };
      const locationMap: Partial<Record<StationId, CaseLocation>> = {
        EMBALMING: 'EMBALMING',
        CREMATION: 'CREMATION',
        URN_FILLING: 'URN_FILLING',
        SHOWROOM: 'CHAPEL',
        COOLER: 'COOLER',
        URN_VAULT: 'URN_VAULT',
      };
      const location = locationMap[station];
      if (!location) return { activeStation: station, activeCaseId: caseId };

      if (location === 'URN_VAULT' && target.location !== 'URN_VAULT') {
        const vaultCount = state.cases.filter(
          (c) => c.location === 'URN_VAULT'
        ).length;
        const cap = vaultSlotCapacity(state.facilityLevels.vault || 0);
        if (vaultCount >= cap) {
          return {
            legalAlert: `VAULT FULL (${cap} niches). Expand the columbarium in Emporium Upgrades.`,
            activeCaseId: caseId,
          };
        }
      }

      const r = state.retort;
      const retortBusy =
        r.caseId != null &&
        r.phase !== 'IDLE' &&
        r.phase !== 'DONE';
      // Keep the second body refrigerated; open the running chamber instead
      if (
        location === 'CREMATION' &&
        retortBusy &&
        r.caseId !== caseId
      ) {
        return {
          activeStation: 'CREMATION',
          activeCaseId: r.caseId,
          intakeToast:
            'Retort occupied — finish the current cremation before loading another case.',
        };
      }

      const now = gameNow();
      const leavingRetort =
        state.retort.caseId === caseId && location !== 'CREMATION';
      return {
        activeCaseId: caseId,
        activeStation: station,
        cases: updateCaseById(state.cases, caseId, (c) =>
          relocateCase(c, location, now)
        ),
        ...(leavingRetort
          ? {
              retort: { ...IDLE_RETORT },
              cremationBurnActive: false,
              cremationBurnProgress: 0,
              cremationHeatNormalized: 0,
              cremationDecayArrested: false,
            }
          : {}),
      };
    }),

  takeActiveCaseToStation: (station, caseId) => {
    const id = caseId ?? get().activeCaseId;
    if (!id) {
      set({ activeStation: station });
      return;
    }
    get().takeCaseToStation(id, station);
  },

  completeEmbalming: (rank, tipMultiplier, caseId) =>
    set((state) => {
      const active = resolveCase(state, caseId);
      if (!active || active.isEmbalmed) {
        return { activeStation: 'EMBALMING', activeCaseId: caseId };
      }
      // Heavy decay on the table tanks the saved embalm result
      let savedRank = rank;
      let tip = tipMultiplier;
      if (active.decayLevel >= 70) {
        savedRank = 'F';
        tip = Math.min(tip, 0.2);
      } else if (active.decayLevel >= 40) {
        savedRank =
          rank === 'S+' || rank === 'S' ? 'C' : rank === 'A' ? 'C' : 'F';
        tip = Math.min(tip, 0.5);
      } else if (active.decayLevel >= 15) {
        if (rank === 'S+') savedRank = 'S';
        else if (rank === 'S') savedRank = 'A';
        tip = tip * 0.9;
      }
      return {
        activeCaseId: caseId,
        cases: updateCaseById(state.cases, caseId, (c) => ({
          ...c,
          isEmbalmed: true,
          embalmRank: savedRank,
          embalmTipMultiplier: tip,
          decayLevel: c.decayLevel,
        })),
        cash: Math.round(state.cash + 350 * tip),
        reputation:
          state.reputation +
          (savedRank === 'S+'
            ? 25
            : savedRank === 'S'
              ? 15
              : savedRank === 'F'
                ? -5
                : 5) -
          Math.floor(active.decayLevel / 20),
        activeStation: 'EMBALMING',
      };
    }),

  completeCremation: (rank, boneAshGrams, caseId) => {
    const state = get();
    const active = resolveCase(state, caseId);
    if (!active) {
      set({ activeStation: 'OVERVIEW' });
      return;
    }
    if (active.isCremated) {
      set({ activeStation: 'URN_FILLING', activeCaseId: caseId });
      return;
    }
    if (active.directive === 'BURIAL_VIEWING') {
      // Case is destroyed — return any staged urn/casket to stock
      const inventory = { ...state.urnInventory };
      const casketInv = { ...state.casketInventory };
      if (active.offeredUrnId) {
        inventory[active.offeredUrnId] =
          (inventory[active.offeredUrnId] ?? 0) + 1;
      }
      if (active.offeredCasketId) {
        casketInv[active.offeredCasketId] =
          (casketInv[active.offeredCasketId] ?? 0) + 1;
      }
      set({
        cash: state.cash - 2500,
        reputation: Math.max(0, state.reputation - 40),
        legalAlert: `LAWSUIT FILED! ${active.name}'s contract specified Traditional Burial & Viewing Only. You were fined $2,500 for Wrongful Cremation!`,
        cases: state.cases.filter((c) => c.id !== active.id),
        inboxFiles: state.inboxFiles.filter((f) => f.id !== active.id),
        urnInventory: inventory,
        casketInventory: casketInv,
        activeCaseId:
          state.cases.find((c) => c.id !== active.id)?.id ?? null,
        placedFlowers: [],
        serviceRatingBonus: 0,
        activeStation: 'OVERVIEW',
        cremationBurnActive: false,
        cremationBurnProgress: 0,
        cremationHeatNormalized: 0,
        cremationDecayArrested: false,
        retort: { ...IDLE_RETORT },
      });
      return;
    }

    const needsPermit = directiveNeedsCremationPermit(active.directive);
    const unpermitted =
      needsPermit && active.cremationPermitStatus !== 'APPROVED';

    set({
      activeCaseId: caseId,
      cases: updateCaseById(state.cases, caseId, (c) => ({
        ...c,
        isCremated: true,
        cremationRank: rank,
        location: 'URN_FILLING',
        unpermittedCremation: unpermitted || c.unpermittedCremation,
      })),
      inboxFiles: unpermitted
        ? syncInboxPermit(state.inboxFiles, caseId, { isRead: false })
        : state.inboxFiles,
      cash: unpermitted
        ? state.cash - UNPERMITTED_CREMATION_FINE
        : state.cash,
      reputation: unpermitted
        ? Math.max(0, state.reputation - UNPERMITTED_CREMATION_REP_HIT)
        : state.reputation,
      legalAlert: unpermitted
        ? `STATE BOARD INSPECTION: ${active.name} was cremated without an approved cremation permit (status: ${active.cremationPermitStatus}). Fine $${UNPERMITTED_CREMATION_FINE.toLocaleString()} and reputation −${UNPERMITTED_CREMATION_REP_HIT}. File permits on the Computer before firing the retort.`
        : state.legalAlert,
      ossilegiumCommuneGrams:
        state.ossilegiumCommuneGrams + Math.round(boneAshGrams * 0.02),
      activeStation: 'URN_FILLING',
      cremationBurnActive: false,
      cremationBurnProgress: 0,
      cremationHeatNormalized: 0,
      cremationDecayArrested: false,
      retort: { ...IDLE_RETORT },
    });
  },

  markUrnAshReady: (caseId) =>
    set((state) => {
      const active = resolveCase(state, caseId);
      if (!active || active.isUrnFilled || active.urnAshReady) return state;
      return {
        cases: updateCaseById(state.cases, caseId, (c) => ({
          ...c,
          urnAshReady: true,
        })),
      };
    }),

  completeUrnFilling: (bonusCash, caseId, pourQuality = 50) =>
    set((state) => {
      const active = resolveCase(state, caseId);
      if (!active || active.isUrnFilled) {
        return { activeStation: 'URN_FILLING', activeCaseId: caseId };
      }
      const quality = Math.max(0, Math.min(100, Math.round(pourQuality)));
      return {
        activeCaseId: caseId,
        cases: updateCaseById(state.cases, caseId, (c) => ({
          ...c,
          isUrnFilled: true,
          urnAshReady: false,
          urnPourQuality: quality,
          location: 'URN_FILLING',
        })),
        cash: state.cash + bonusCash,
        activeStation: 'URN_FILLING',
      };
    }),

  storeUrnInVault: (caseId) =>
    set((state) => {
      const active = resolveCase(state, caseId);
      if (!active || !active.isUrnFilled) return state;
      const vaultCount = state.cases.filter((c) => c.location === 'URN_VAULT')
        .length;
      const cap = vaultSlotCapacity(state.facilityLevels.vault || 0);
      if (vaultCount >= cap) {
        return {
          legalAlert: `VAULT FULL (${cap} niches). Expand the columbarium in Emporium Upgrades.`,
        };
      }
      return {
        activeCaseId: caseId,
        cases: updateCaseById(state.cases, caseId, (c) => ({
          ...c,
          location: 'URN_VAULT',
        })),
        activeStation: 'URN_VAULT',
      };
    }),

  buyShowroomItem: (itemId) =>
    set((state) => {
      const item = state.showroomInventory.find((i) => i.id === itemId);
      if (!item || state.cash < item.cost) return state;
      return {
        cash: state.cash - item.cost,
        reputation: state.reputation + Math.min(8, item.prestigeBonus),
        showroomInventory: state.showroomInventory.map((i) =>
          i.id === itemId ? { ...i, ownedCount: i.ownedCount + 1 } : i
        ),
      };
    }),

  buyUrn: (urnId) => {
    const state = get();
    const urn = getUrnById(urnId);
    if (!urn || state.cash < urn.cost) return false;
    if (state.reputation < (urn.reputationRequired ?? 0)) return false;

    let shopRotation = state.shopRotation;
    if (isHourGatedUrn(urnId)) {
      const entry = RARE_SCHEDULE.find(
        (e) => e.kind === 'urn' && e.id === urnId
      );
      if (!entry) return false;
      const next = consumeRareStock(shopRotation, entry);
      if (!next) return false;
      shopRotation = next;
    }

    set({
      cash: state.cash - urn.cost,
      reputation: state.reputation + Math.min(10, urn.prestigeBonus),
      urnInventory: {
        ...state.urnInventory,
        [urnId]: (state.urnInventory[urnId] ?? 0) + 1,
      },
      shopRotation,
    });
    return true;
  },

  buyCasket: (casketId) => {
    const state = get();
    const casket = getCasketById(casketId);
    if (!casket || state.cash < casket.cost) return false;
    if (state.reputation < (casket.reputationRequired ?? 0)) return false;

    let shopRotation = state.shopRotation;
    if (isHourGatedCasket(casketId)) {
      const entry = RARE_SCHEDULE.find(
        (e) => e.kind === 'casket' && e.id === casketId
      );
      if (!entry) return false;
      const next = consumeRareStock(shopRotation, entry);
      if (!next) return false;
      shopRotation = next;
    }

    set({
      cash: state.cash - casket.cost,
      reputation: state.reputation + Math.min(10, casket.prestigeBonus),
      casketInventory: {
        ...state.casketInventory,
        [casketId]: (state.casketInventory[casketId] ?? 0) + 1,
      },
      shopRotation,
    });
    return true;
  },

  buyChapelDecor: (decorId) => {
    const state = get();
    const item = CHAPEL_DECOR_CATALOG.find((d) => d.id === decorId);
    if (!item) return false;
    if (state.chapelOwnedDecor.includes(decorId)) return false;
    if (state.cash < item.cost) return false;
    set({
      cash: state.cash - item.cost,
      reputation: state.reputation + Math.min(6, item.satisfactionBonus),
      chapelOwnedDecor: [...state.chapelOwnedDecor, decorId],
    });
    return true;
  },

  buyFacilityUpgrade: (id) => {
    const state = get();
    const level = state.facilityLevels[id] ?? 0;
    const tier = nextFacilityTier(id, level);
    if (!tier) return { ok: false, reason: 'maxed', message: 'Fully upgraded' };
    if (state.cash < tier.cost) {
      return { ok: false, reason: 'cash', message: 'Insufficient cash' };
    }
    const missing = missingCollectionReqs(
      tier.requires,
      state.urnInventory,
      state.casketInventory
    );
    if (missing.length > 0) {
      return {
        ok: false,
        reason: 'collection',
        message: 'Missing collection requirements',
      };
    }
    const used = totalFacilitySpaceUsed(state.facilityLevels);
    const total = state.ownedProperty?.spaceTotal ?? STARTER_PROPERTY.space;
    if (used + tier.space > total) {
      return {
        ok: false,
        reason: 'space',
        message:
          'Needs more facility space — open Lychgate Realty to relocate.',
      };
    }
    set({
      cash: state.cash - tier.cost,
      facilityLevels: {
        ...state.facilityLevels,
        [id]: level + 1,
      },
      reputation: state.reputation + 3 + level,
      intakeToast: `Upgraded ${id.replace('_', ' ')} (space ${used + tier.space}/${total})`,
    });
    return { ok: true };
  },

  takeBankLoan: (productId) => {
    const state = get();
    const product = loanProductById(productId);
    if (!product) return { ok: false, message: 'Unknown loan product' };
    if (state.activeLoans.some((l) => l.productId === productId && l.kind === 'PERSONAL')) {
      return { ok: false, message: 'You already hold this note' };
    }
    if (state.activeLoans.filter((l) => l.kind === 'PERSONAL').length >= 2) {
      return { ok: false, message: 'Personal loan limit (2) reached' };
    }
    const now = gameNow();
    const loan = makePersonalLoan(product, now);
    set({
      cash: state.cash + product.principal,
      activeLoans: [...state.activeLoans, loan],
      financeLedger: [
        {
          id: `led_loan_${now}`,
          at: now,
          label: `Loan advance — ${product.name}`,
          amount: product.principal,
          kind: 'OTHER' as const,
        },
        ...state.financeLedger,
      ].slice(0, 80),
      intakeToast: `Loan funded +$${product.principal.toLocaleString()}`,
    });
    return { ok: true, message: `Advanced $${product.principal.toLocaleString()}` };
  },

  payBankLoanInstallment: (loanId) => {
    const state = get();
    const loan = state.activeLoans.find((l) => l.id === loanId);
    if (!loan) return { ok: false, message: 'Loan not found' };
    const principalPay = Math.min(loan.principalRemaining, loan.paymentAmount);
    if (principalPay <= 0) return { ok: false, message: 'Loan already paid' };
    if (state.cash < principalPay) {
      return { ok: false, message: 'Insufficient cash for installment' };
    }
    const now = gameNow();
    const remaining = loan.principalRemaining - principalPay;
    let activeLoans = state.activeLoans;
    if (remaining <= 0) {
      activeLoans = state.activeLoans.filter((l) => l.id !== loanId);
    } else {
      activeLoans = state.activeLoans.map((l) =>
        l.id === loanId
          ? {
              ...l,
              principalRemaining: remaining,
              nextPaymentDueAt: now + l.paymentEveryMs,
              missedPayments: 0,
            }
          : l
      );
    }
    set({
      cash: state.cash - principalPay,
      activeLoans,
      financeLedger: [
        {
          id: `led_pay_${now}`,
          at: now,
          label: `Loan payment — ${loan.label}`,
          amount: -principalPay,
          kind: 'OTHER' as const,
        },
        ...state.financeLedger,
      ].slice(0, 80),
      intakeToast:
        remaining <= 0
          ? `Paid off: ${loan.label}`
          : `Payment $${principalPay} on ${loan.label}`,
    });
    get().tickBankForeclosure();
    return { ok: true, message: 'Payment posted' };
  },

  earlyPayoffBankLoan: (loanId) => {
    const state = get();
    const loan = state.activeLoans.find((l) => l.id === loanId);
    if (!loan) return { ok: false, message: 'Loan not found' };
    const due = earlyPayoffAmount(loan);
    if (state.cash < due) {
      return { ok: false, message: `Need $${due.toLocaleString()} to pay off early` };
    }
    const now = gameNow();
    set({
      cash: state.cash - due,
      activeLoans: state.activeLoans.filter((l) => l.id !== loanId),
      financeLedger: [
        {
          id: `led_early_${now}`,
          at: now,
          label: `Early payoff — ${loan.label}`,
          amount: -due,
          kind: 'OTHER' as const,
        },
        ...state.financeLedger,
      ].slice(0, 80),
      intakeToast: `Early payoff $${due.toLocaleString()} — ${loan.label}`,
    });
    get().tickBankForeclosure();
    return { ok: true, message: 'Loan closed' };
  },

  buyProperty: (listingId, method) => {
    const state = get();
    const listing = getPropertyById(listingId);
    if (!listing) return { ok: false, message: 'Listing not found' };
    if (state.ownedProperty.listingId === listing.id) {
      return { ok: false, message: 'Already at this property' };
    }
    const used = totalFacilitySpaceUsed(state.facilityLevels);
    if (used > listing.space) {
      return {
        ok: false,
        message: `Too small: need ${used} space, listing has ${listing.space}. Sell/downsize upgrades first (state choice: relocate to a larger pad).`,
      };
    }
    const now = gameNow();
    const saleProceeds = Math.round(state.ownedProperty.purchasedFor * 0.4);
    const mortgageDue = state.activeLoans
      .filter((l) => l.kind === 'MORTGAGE')
      .reduce((sum, l) => sum + l.principalRemaining, 0);
    // Net equity after settling the note — never forgive remaining principal.
    const equity = saleProceeds - mortgageDue;
    let cash = state.cash + equity;
    let activeLoans = state.activeLoans.filter((l) => l.kind !== 'MORTGAGE');
    if (method === 'CASH') {
      if (cash < listing.price) {
        return {
          ok: false,
          message: `Need $${listing.price.toLocaleString()} cash (have $${cash.toLocaleString()} after sale/mortgage settle)`,
        };
      }
      cash -= listing.price;
    } else {
      const down = Math.ceil(listing.price * 0.2);
      if (cash < down) {
        return {
          ok: false,
          message: `Need $${down.toLocaleString()} down payment (20%) after settling prior mortgage`,
        };
      }
      cash -= down;
      const financed = listing.price - down;
      activeLoans = [...activeLoans, makeMortgageLoan(listing, financed, now)];
    }
    const owned = ownedFromListing(listing, listing.price);
    const ledgerExtra: GameState['financeLedger'] = [];
    if (saleProceeds > 0) {
      ledgerExtra.push({
        id: `led_sale_${now}`,
        at: now,
        label: 'Prior property sale (40%)',
        amount: saleProceeds,
        kind: 'OTHER',
      });
    }
    if (mortgageDue > 0) {
      ledgerExtra.push({
        id: `led_mtg_settle_${now}`,
        at: now,
        label: 'Prior mortgage payoff on relocate',
        amount: -mortgageDue,
        kind: 'OTHER',
      });
    }
    set({
      cash,
      ownedProperty: owned,
      activeLoans,
      reputation: state.reputation + listing.repBonus,
      financeLedger: [
        {
          id: `led_prop_${now}`,
          at: now,
          label: `${method === 'CASH' ? 'Cash buy' : 'Mortgage'} — ${listing.label}`,
          amount:
            method === 'CASH'
              ? -listing.price
              : -Math.ceil(listing.price * 0.2),
          kind: 'OTHER' as const,
        },
        ...ledgerExtra,
        ...state.financeLedger,
      ].slice(0, 80),
      intakeToast: `Relocated to ${listing.city}, ${listing.stateCode} · space ${used}/${listing.space}`,
      computerOpenApp: 'REALTY',
    });
    return { ok: true, message: `Now operating: ${listing.label}` };
  },

  buyFleetVehicle: (id) => {
    const state = get();
    const vehicle = getFleetVehicle(id);
    if (!vehicle) return { ok: false, message: 'Vehicle not in the catalog' };
    if (state.ownedFleetIds.includes(vehicle.id)) {
      return { ok: false, message: `${vehicle.name} is already in the garage` };
    }
    if (state.cash < vehicle.price) {
      return {
        ok: false,
        message: `Need $${vehicle.price.toLocaleString()} for ${vehicle.name}`,
      };
    }
    const now = gameNow();
    set({
      cash: state.cash - vehicle.price,
      ownedFleetIds: [...state.ownedFleetIds, vehicle.id],
      financeLedger: [
        {
          id: `led_fleet_${now}`,
          at: now,
          label: `Fleet — ${vehicle.name}`,
          amount: -vehicle.price,
          kind: 'OTHER' as const,
        },
        ...state.financeLedger,
      ].slice(0, 80),
      intakeToast: `Garage: ${vehicle.name}`,
    });
    return { ok: true, message: `${vehicle.name} is in the garage` };
  },

  assignFleetVehicle: (fleetClass, id) => {
    const state = get();
    if (id) {
      const vehicle = getFleetVehicle(id);
      if (!vehicle || vehicle.fleetClass !== fleetClass) return;
      if (!state.ownedFleetIds.includes(id)) return;
    }
    const key =
      fleetClass === 'RECOVERY'
        ? 'recovery'
        : fleetClass === 'ESCORT'
          ? 'escort'
          : 'coach';
    set({
      fleetAssignment: {
        ...normalizeFleetAssignment(state.fleetAssignment),
        [key]: id,
      },
    });
  },

  tickBankLoans: () => {
    const state = get();
    if (!state.hasStartedGame || state.bankForeclosed) return;
    const now = gameNow();
    let cash = state.cash;
    let changed = false;
    const ledger = [...state.financeLedger];
    const activeLoans = state.activeLoans.map((loan) => {
      let next = { ...loan };
      while (now >= next.nextPaymentDueAt && next.principalRemaining > 0) {
        changed = true;
        const pay = Math.min(next.paymentAmount, next.principalRemaining);
        cash -= pay; // may overdraft → foreclosure timer
        next.principalRemaining = Math.max(0, next.principalRemaining - pay);
        if (cash < 0) {
          next.missedPayments += 1;
        } else {
          next.missedPayments = 0;
        }
        next.nextPaymentDueAt += next.paymentEveryMs;
        ledger.unshift({
          id: `led_auto_${next.id}_${next.nextPaymentDueAt}`,
          at: now,
          label: `Auto draft — ${next.label}`,
          amount: -pay,
          kind: 'OTHER' as const,
        });
        if (next.principalRemaining <= 0) break;
      }
      return next;
    }).filter((l) => l.principalRemaining > 0);
    if (!changed) return;
    set({
      cash,
      activeLoans,
      financeLedger: ledger.slice(0, 80),
      intakeToast:
        cash < state.cash
          ? cash < 0
            ? 'Loan draft overdrew your accounts — bank foreclosure clock applies.'
            : 'Loan installment drafted.'
          : state.intakeToast,
    });
    get().tickBankForeclosure();
  },

  markActiveCaseEmbalmed: () => {
    const state = get();
    const id = state.activeCaseId;
    if (!id) return false;
    const c = state.cases.find((x) => x.id === id);
    if (!c || c.isEmbalmed) return false;
    set({
      cases: state.cases.map((x) =>
        x.id === id
          ? { ...x, isEmbalmed: true, embalmRank: x.embalmRank ?? 'A' }
          : x
      ),
      intakeToast: `[DEV] Marked embalmed: ${c.name}`,
    });
    return true;
  },

  offerUrnToCase: (caseId, urnId) =>
    set((state) => {
      const active = resolveCase(state, caseId);
      if (!active) return state;
      const previousId = active.offeredUrnId;
      let inventory = { ...state.urnInventory };

      if (previousId) {
        inventory[previousId] = (inventory[previousId] ?? 0) + 1;
      }

      if (urnId) {
        const available = inventory[urnId] ?? 0;
        if (available <= 0) return state;
        inventory[urnId] = available - 1;
      }

      return {
        urnInventory: inventory,
        cases: updateCaseById(state.cases, caseId, (c) => ({
          ...c,
          offeredUrnId: urnId,
        })),
      };
    }),

  offerCasketToCase: (caseId, casketId) =>
    set((state) => {
      const active = resolveCase(state, caseId);
      if (!active) return state;
      const previousId = active.offeredCasketId;
      let inventory = { ...state.casketInventory };

      if (previousId) {
        inventory[previousId] = (inventory[previousId] ?? 0) + 1;
      }

      if (casketId) {
        const available = inventory[casketId] ?? 0;
        if (available <= 0) return state;
        inventory[casketId] = available - 1;
      }

      return {
        casketInventory: inventory,
        cases: updateCaseById(state.cases, caseId, (c) => ({
          ...c,
          offeredCasketId: casketId,
        })),
      };
    }),

  ensureChapelLayout: (caseId) =>
    set((state) => {
      if (state.chapelLayouts[caseId]) return state;
      const active = resolveCase(state, caseId);
      if (!active) return state;
      return {
        chapelLayouts: {
          ...state.chapelLayouts,
          [caseId]: defaultChapelLayout(caseId, caseUsesUrnStand(active)),
        },
      };
    }),

  setChapelTheme: (caseId, theme) =>
    set((state) => {
      const layout =
        state.chapelLayouts[caseId] ??
        defaultChapelLayout(caseId, false);
      const owned = new Set(state.chapelOwnedDecor);
      const nextTheme: ChapelThemeSelection = {
        ...layout.theme,
        ...theme,
      };
      // Only allow owned décor ids
      const gate = (id: string | null | undefined) =>
        id && owned.has(id) ? id : null;
      nextTheme.wallId = gate(nextTheme.wallId);
      nextTheme.floorId = gate(nextTheme.floorId);
      nextTheme.draperyId = gate(nextTheme.draperyId);
      nextTheme.lightingId = gate(nextTheme.lightingId);
      nextTheme.pewsId = gate(nextTheme.pewsId);
      nextTheme.urnPedestalId = gate(nextTheme.urnPedestalId);
      nextTheme.ornamentIds = (nextTheme.ornamentIds ?? []).filter((id) =>
        owned.has(id)
      );
      return {
        chapelLayouts: {
          ...state.chapelLayouts,
          [caseId]: { ...layout, theme: nextTheme },
        },
      };
    }),

  setChapelServiceMusic: (caseId, musicTrackId) =>
    set((state) => {
      const layout =
        state.chapelLayouts[caseId] ??
        defaultChapelLayout(caseId, false);
      return {
        chapelLayouts: {
          ...state.chapelLayouts,
          [caseId]: { ...layout, serviceMusicId: musicTrackId },
        },
      };
    }),

  moveChapelPiece: (caseId, pieceId, x, y) =>
    set((state) => {
      const layout = state.chapelLayouts[caseId];
      if (!layout) return state;
      const nx = Math.max(0.05, Math.min(0.95, x));
      const ny = Math.max(0.08, Math.min(0.92, y));
      return {
        chapelLayouts: {
          ...state.chapelLayouts,
          [caseId]: {
            ...layout,
            pieces: layout.pieces.map((p) =>
              p.id === pieceId ? { ...p, x: nx, y: ny } : p
            ),
          },
        },
      };
    }),

  placeFloralSpray: (flower, caseId) =>
    set((state) => {
      const active = resolveCase(state, caseId);
      if (!active) return state;
      const itemId = flowerItemId[flower];
      const item = state.showroomInventory.find((i) => i.id === itemId);
      if (!item || item.ownedCount <= 0) return state;

      const layout =
        state.chapelLayouts[caseId] ??
        defaultChapelLayout(caseId, caseUsesUrnStand(active));
      const stands = layout.pieces.filter((p) =>
        ['LILIES', 'ROSES', 'WREATH'].includes(p.kind)
      ).length;
      const maxStands = maxFlowerStands(state.chapelOwnedDecor);
      if (stands >= maxStands) return state;

      const piece: ChapelLayoutPiece = {
        id: `flower_${flower}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        kind: flower as FlowerKind,
        x: 0.2 + (stands % 3) * 0.25,
        y: 0.7 + Math.floor(stands / 3) * 0.08,
      };

      // Preference / arrangement payout comes only from chapel satisfaction score
      return {
        activeCaseId: caseId,
        placedFlowers: [...state.placedFlowers, flower],
        showroomInventory: state.showroomInventory.map((i) =>
          i.id === itemId ? { ...i, ownedCount: i.ownedCount - 1 } : i
        ),
        chapelLayouts: {
          ...state.chapelLayouts,
          [caseId]: {
            ...layout,
            pieces: [...layout.pieces, piece],
          },
        },
      };
    }),

  removeChapelFlower: (caseId, pieceId) =>
    set((state) => {
      const layout = state.chapelLayouts[caseId];
      if (!layout) return state;
      const piece = layout.pieces.find((p) => p.id === pieceId);
      if (!piece || !['LILIES', 'ROSES', 'WREATH'].includes(piece.kind)) {
        return state;
      }
      const flower = piece.kind as FlowerKind;
      const itemId = flowerItemId[flower];
      return {
        chapelLayouts: {
          ...state.chapelLayouts,
          [caseId]: {
            ...layout,
            pieces: layout.pieces.filter((p) => p.id !== pieceId),
          },
        },
        placedFlowers: (() => {
          const idx = state.placedFlowers.indexOf(flower);
          if (idx < 0) return state.placedFlowers;
          const next = [...state.placedFlowers];
          next.splice(idx, 1);
          return next;
        })(),
        showroomInventory: state.showroomInventory.map((i) =>
          i.id === itemId ? { ...i, ownedCount: i.ownedCount + 1 } : i
        ),
      };
    }),

  finalizeServiceAndNextCase: (chosenDisposition, caseId) =>
    set((state) => {
      const c = resolveCase(state, caseId);
      if (!c) return { activeStation: 'OVERVIEW' };

      let fine = 0;
      let alertMsg: string | null = null;

      if (chosenDisposition === 'CREMATION' && c.directive === 'BURIAL_VIEWING') {
        fine = 2500;
        alertMsg = `LAWSUIT FILED! Wrongful Cremation of burial-only case — fined $2,500!`;
      } else if (c.directive === 'BURIAL_VIEWING' && !c.isEmbalmed) {
        fine = 1200;
        alertMsg = `COMPLIANCE FINE ($1,200): Open-casket viewing held without embalming!`;
      } else if (
        c.directive === 'VIEWING_THEN_CREMATION' &&
        (!c.isEmbalmed || !c.isCremated)
      ) {
        fine = 1500;
        alertMsg = `BREACH OF CONTRACT ($1,500): Family requested both viewing prep and cremation!`;
      } else if (
        c.directive === 'CREMATION_DIRECT' &&
        chosenDisposition === 'BURIAL'
      ) {
        fine = 800;
        alertMsg = `CONTRACT MISMATCH ($800): Family paid for direct cremation, not burial.`;
      } else if (
        c.directive === 'CREMATION_DIRECT' &&
        chosenDisposition === 'CREMATION' &&
        !c.isCremated
      ) {
        fine = 1200;
        alertMsg = `COMPLIANCE FINE ($1,200): Direct cremation finalized without completing the retort burn!`;
      } else if (c.directive === 'CREMATION_THEN_VIEWING') {
        if (chosenDisposition === 'BURIAL') {
          fine = 900;
          alertMsg = `CONTRACT MISMATCH ($900): Family booked an Ossuary Memorial, not burial.`;
        } else if (!c.isCremated || !c.isUrnFilled) {
          fine = 1400;
          alertMsg = `BREACH ($1,400): Ossuary Memorial requires cremation and urned remains before chapel.`;
        } else if (!c.offeredUrnId) {
          fine = 600;
          alertMsg = `PRESENTATION FINE ($600): No urn on the pedestal for the memorial gathering.`;
        }
      }

      const offered = getUrnById(c.offeredUrnId);
      const offeredCasket = getCasketById(c.offeredCasketId);
      const failedService = fine > 0;
      const lateService =
        c.serviceDateMs != null && gameNow() > c.serviceDateMs;
      const lateFine = lateService ? 900 : 0;
      const serviceFailed = failedService || lateFine > 0;

      const layout = state.chapelLayouts[c.id];
      const theme = layout?.theme ?? {
        wallId: null,
        floorId: null,
        draperyId: null,
        lightingId: null,
        pewsId: null,
        urnPedestalId: null,
        ornamentIds: [],
      };
      const flowerKinds = (layout?.pieces ?? [])
        .map((p) => p.kind)
        .filter((k): k is FlowerKind =>
          k === 'LILIES' || k === 'ROSES' || k === 'WREATH'
        );
      const prefMatches = evaluateChapelPrefMatches({
        prefs: c.familyChapelPrefs,
        theme,
        flowersPlaced: flowerKinds,
        serviceMusicId: layout?.serviceMusicId ?? null,
      });
      const prefBonusPts = serviceFailed
        ? 0
        : chapelPrefMatchBonus(prefMatches);
      const chapelScore = scoreChapelArrangement({
        pieces: layout?.pieces ?? [],
        preferred: c.preferredFlowers,
        ownedDecorIds: state.chapelOwnedDecor,
        theme,
        decayLevel: c.decayLevel,
        urnPrestige: offered?.prestigeBonus ?? 0,
        familyPrefBonus: prefBonusPts,
      });
      const chapelRewards = satisfactionToRewards(chapelScore.total);

      // Chapel score is the single source of truth (preview matches payout)
      const flowerBonus = serviceFailed
        ? 0
        : Math.round((c.basePayout * chapelRewards.payoutBoostPct) / 100);

      const urnMatch =
        offered != null && offered.material === c.preferredUrnMaterial;
      const urnSale = !serviceFailed && offered ? offered.resaleValue : 0;
      const urnTasteBonus =
        !serviceFailed && urnMatch ? Math.round(urnSale * 0.2) : 0;

      const casketMatch =
        offeredCasket != null &&
        offeredCasket.material === c.preferredCasketMaterial;
      const casketSale =
        !serviceFailed &&
        chosenDisposition === 'BURIAL' &&
        offeredCasket
          ? offeredCasket.resaleValue
          : 0;
      const casketTasteBonus =
        !serviceFailed && casketMatch ? Math.round(casketSale * 0.2) : 0;

      const decayPenalty = Math.round(c.basePayout * (c.decayLevel / 100) * 0.8);
      if (lateService && !alertMsg) {
        alertMsg = `LATE SERVICE ($900): Viewing/service date missed — family satisfaction collapsed.`;
      }
      if (c.decayLevel >= 40 && !alertMsg) {
        alertMsg = `FAMILY OUTRAGE: Remains showed advanced decomposition (decay ${Math.round(c.decayLevel)}%).`;
      }

      const pourTip = serviceFailed
        ? 0
        : Math.round((c.urnPourQuality ?? 0) * 1.1);
      const tipCash = serviceFailed ? 0 : chapelRewards.tipCash + pourTip;
      const salesMult = Math.max(
        0.5,
        state.ownedProperty.salesMult ?? 1
      );

      const cortege = resolveCortege(
        state.ownedFleetIds,
        state.fleetAssignment
      );
      const fleetRep = serviceFailed ? 0 : (cortege.recovery?.repBonus ?? 0);
      const fleetCash = serviceFailed ? 0 : (cortege.escort?.moneyBonus ?? 0);
      const fleetInterment = serviceFailed
        ? 0
        : (cortege.coach?.interment ?? 0);
      const intermentTotal = state.intermentScore + fleetInterment;

      const netPayout = serviceFailed
        ? -(fine + lateFine)
        : Math.max(
            0,
            Math.round(
              (c.basePayout +
                flowerBonus +
                urnSale +
                urnTasteBonus +
                casketSale +
                casketTasteBonus +
                tipCash +
                (c.isUrnFilled ? 150 : 0) -
                decayPenalty) *
                salesMult
            ) + fleetCash
          );

      const remaining = state.cases.filter((x) => x.id !== c.id);
      const decayRepHit = Math.floor(c.decayLevel / 10);
      const urnRep =
        offered && !serviceFailed
          ? Math.min(12, offered.prestigeBonus + (urnMatch ? 4 : 0))
          : 0;
      const casketRep =
        offeredCasket && !serviceFailed && chosenDisposition === 'BURIAL'
          ? Math.min(
              12,
              offeredCasket.prestigeBonus + (casketMatch ? 4 : 0)
            )
          : 0;

      const inventory = { ...state.urnInventory };
      const casketInv = { ...state.casketInventory };
      if (serviceFailed && c.offeredUrnId) {
        inventory[c.offeredUrnId] = (inventory[c.offeredUrnId] ?? 0) + 1;
      }
      if (serviceFailed && c.offeredCasketId) {
        casketInv[c.offeredCasketId] =
          (casketInv[c.offeredCasketId] ?? 0) + 1;
      }
      // Burial without offering: if casket was staged but disposition is cremation, restore
      if (
        !serviceFailed &&
        chosenDisposition === 'CREMATION' &&
        c.offeredCasketId
      ) {
        casketInv[c.offeredCasketId] =
          (casketInv[c.offeredCasketId] ?? 0) + 1;
      }

      const { [c.id]: _removedLayout, ...restLayouts } = state.chapelLayouts;

      const honored = prefMatches
        .filter((m) => m.matched)
        .map((m) => `${m.label}: ${m.preferredName}`);
      const missed = prefMatches
        .filter((m) => !m.matched)
        .map((m) => `${m.label}: ${m.preferredName}`);

      return {
        cash: state.cash + netPayout,
        reputation: Math.max(
          0,
          serviceFailed
            ? state.reputation - 15 - decayRepHit
            : state.reputation +
                chapelRewards.reputationDelta +
                urnRep +
                casketRep +
                fleetRep -
                decayRepHit
        ),
        intermentScore: intermentTotal,
        lastCase: {
          id: c.id,
          name: c.name,
          service:
            chosenDisposition === 'BURIAL' ? 'Burial service' : 'Cremation service',
          at: gameNow(),
        },
        legalAlert: alertMsg,
        serviceFeedback: serviceFailed
          ? null
          : {
              decedentName: c.name,
              honored,
              missed,
              prefBonus: prefBonusPts,
              tipCash,
              payoutBoostPct: chapelRewards.payoutBoostPct,
              reputationDelta:
                chapelRewards.reputationDelta + urnRep + casketRep + fleetRep,
              fleetRecovery: cortege.recovery?.name ?? null,
              fleetEscort: cortege.escort?.name ?? null,
              fleetCoach: cortege.coach?.name ?? null,
              fleetRep,
              fleetCash,
              intermentThisService: fleetInterment,
              intermentTotal,
            },
        intakeToast: serviceFailed
          ? state.intakeToast
          : `Service complete — tip $${tipCash}${
              fleetInterment > 0 ? ` · Interment +${fleetInterment}` : ''
            }${fleetCash > 0 ? ` · cortege +$${fleetCash}` : ''}`,
        cases: remaining,
        inboxFiles: state.inboxFiles.filter((f) => f.id !== c.id),
        urnInventory: inventory,
        casketInventory: casketInv,
        chapelLayouts: restLayouts,
        activeCaseId: remaining[0]?.id ?? null,
        placedFlowers: [],
        serviceRatingBonus: 0,
        activeStation: 'OVERVIEW',
      };
    }),

  clearLegalAlert: () => set({ legalAlert: null }),
  clearServiceFeedback: () => set({ serviceFeedback: null }),

  damageCremulator: () =>
    set({
      cremulatorOwned: false,
      cremulatorDamaged: true,
      legalAlert:
        'CREMULATOR DESTROYED! Metal implants entered the drum. Purchase a replacement before processing more cremains.',
    }),

  buyReplacementCremulator: () => {
    const state = get();
    if (state.cremulatorOwned) return true;
    if (state.cash < CREMULATOR_REPLACEMENT_COST) return false;
    set({
      cash: state.cash - CREMULATOR_REPLACEMENT_COST,
      cremulatorOwned: true,
      cremulatorDamaged: false,
    });
    return true;
  },
}),
    {
      name: 'ossuarian-first-urn-v1',
      version: 5,
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as Record<string, unknown>;
        const rawCases = (p.cases as DecedentCase[] | undefined) ?? [];
        const cases = rawCases.map((c) => normalizeCase(c));
        const chapelLayouts = {
          ...((p.chapelLayouts as Record<string, ChapelServiceLayout>) ?? {}),
        };
        for (const key of Object.keys(chapelLayouts)) {
          const layout = chapelLayouts[key];
          if (!layout) continue;
          chapelLayouts[key] = {
            ...layout,
            theme: {
              ...layout.theme,
              urnPedestalId: layout.theme?.urnPedestalId ?? null,
            },
          };
        }
        const rawInbox = (p.inboxFiles as CaseInboxFile[] | undefined) ?? [];
        const inboxFiles = rawInbox.map((f) => {
          const match = cases.find((c) => c.id === f.id);
          return {
            ...f,
            familyRequestedUrnId:
              f.familyRequestedUrnId ?? match?.familyRequestedUrnId ?? null,
            dateOfBirthMs: f.dateOfBirthMs ?? match?.dateOfBirthMs ?? 0,
            dateOfDeathMs: f.dateOfDeathMs ?? match?.dateOfDeathMs ?? 0,
            timeOfDeathHour:
              f.timeOfDeathHour ?? match?.timeOfDeathHour ?? 0,
            timeOfDeathMinute:
              f.timeOfDeathMinute ?? match?.timeOfDeathMinute ?? 0,
            placeOfBirth: f.placeOfBirth ?? match?.placeOfBirth ?? '',
            cremationPermitStatus:
              f.cremationPermitStatus ??
              match?.cremationPermitStatus ??
              'NOT_REQUIRED',
            cremationPermitRejectReason:
              f.cremationPermitRejectReason ??
              match?.cremationPermitRejectReason ??
              null,
          };
        });
        const fleets = {
          ownedFleetIds: Array.isArray(p.ownedFleetIds) ? p.ownedFleetIds : [],
          fleetAssignment: normalizeFleetAssignment(p.fleetAssignment),
          intermentScore:
            typeof p.intermentScore === 'number' ? p.intermentScore : 0,
        };
        if (version >= 4) {
          return {
            ...p,
            cases,
            chapelLayouts,
            inboxFiles,
            permitSubmissions: p.permitSubmissions ?? [],
            permitWrongStreak: p.permitWrongStreak ?? 0,
            financeLedger: p.financeLedger ?? [],
            negativeCashSinceMs: p.negativeCashSinceMs ?? null,
            bankWarningIssued: p.bankWarningIssued ?? false,
            bankForeclosed: p.bankForeclosed ?? false,
            ownedProperty: p.ownedProperty ?? ownedFromListing(STARTER_PROPERTY, 0),
            activeLoans: p.activeLoans ?? [],
            ...fleets,
          } as never;
        }
        return {
          ...p,
          cases,
          chapelLayouts,
          inboxFiles,
          permitSubmissions: p.permitSubmissions ?? [],
          permitWrongStreak: p.permitWrongStreak ?? 0,
          financeLedger: p.financeLedger ?? [],
          negativeCashSinceMs: p.negativeCashSinceMs ?? null,
          bankWarningIssued: p.bankWarningIssued ?? false,
          bankForeclosed: p.bankForeclosed ?? false,
          ownedProperty: ownedFromListing(STARTER_PROPERTY, 0),
          activeLoans: [],
          ownedFleetIds: [],
          fleetAssignment: { ...EMPTY_FLEET_ASSIGNMENT },
          intermentScore: 0,
        } as never;
      },
      partialize: (state) => ({
        hasStartedGame: state.hasStartedGame,
        cash: state.cash,
        reputation: state.reputation,
        ossilegiumCommuneGrams: state.ossilegiumCommuneGrams,
        activeStation: state.activeStation,
        cases: state.cases,
        activeCaseId: state.activeCaseId,
        inboxFiles: state.inboxFiles,
        showroomInventory: state.showroomInventory,
        urnInventory: state.urnInventory,
        casketInventory: state.casketInventory,
        chapelOwnedDecor: state.chapelOwnedDecor,
        chapelLayouts: state.chapelLayouts,
        facilityLevels: state.facilityLevels,
        shopRotation: state.shopRotation,
        placedFlowers: state.placedFlowers,
        serviceRatingBonus: state.serviceRatingBonus,
        cremulatorOwned: state.cremulatorOwned,
        cremulatorDamaged: state.cremulatorDamaged,
        cremationBurnActive: state.cremationBurnActive,
        cremationBurnProgress: state.cremationBurnProgress,
        cremationHeatNormalized: state.cremationHeatNormalized,
        cremationDecayArrested: state.cremationDecayArrested,
        retort: state.retort,
        permitSubmissions: state.permitSubmissions,
        permitWrongStreak: state.permitWrongStreak,
        financeLedger: state.financeLedger,
        negativeCashSinceMs: state.negativeCashSinceMs,
        bankWarningIssued: state.bankWarningIssued,
        bankForeclosed: state.bankForeclosed,
        ownedProperty: state.ownedProperty,
        activeLoans: state.activeLoans,
        ownedFleetIds: state.ownedFleetIds,
        fleetAssignment: state.fleetAssignment,
        intermentScore: state.intermentScore,
        lastCase: state.lastCase,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<GameState>;
        const cases = (p.cases ?? current.cases).map((c) =>
          normalizeCase(c as DecedentCase)
        );
        const chapelLayouts = { ...(p.chapelLayouts ?? current.chapelLayouts) };
        for (const key of Object.keys(chapelLayouts)) {
          const layout = chapelLayouts[key];
          if (!layout?.theme) continue;
          chapelLayouts[key] = {
            ...layout,
            theme: {
              ...layout.theme,
              urnPedestalId: layout.theme.urnPedestalId ?? null,
            },
          };
        }
        const inboxFiles = (p.inboxFiles ?? current.inboxFiles).map((f) => {
          const match = cases.find((c) => c.id === f.id);
          return {
            ...f,
            familyRequestedUrnId:
              f.familyRequestedUrnId ?? match?.familyRequestedUrnId ?? null,
            dateOfBirthMs: f.dateOfBirthMs ?? match?.dateOfBirthMs ?? 0,
            dateOfDeathMs: f.dateOfDeathMs ?? match?.dateOfDeathMs ?? 0,
            timeOfDeathHour:
              f.timeOfDeathHour ?? match?.timeOfDeathHour ?? 0,
            timeOfDeathMinute:
              f.timeOfDeathMinute ?? match?.timeOfDeathMinute ?? 0,
            placeOfBirth: f.placeOfBirth ?? match?.placeOfBirth ?? '',
            cremationPermitStatus:
              f.cremationPermitStatus ??
              match?.cremationPermitStatus ??
              'NOT_REQUIRED',
            cremationPermitRejectReason:
              f.cremationPermitRejectReason ??
              match?.cremationPermitRejectReason ??
              null,
          };
        });
        // Legacy saves may still have EMPORIUM; shop now lives on Computer.
        const rawStation = (p.activeStation ??
          current.activeStation) as StationId | 'EMPORIUM';
        const fromEmporium = rawStation === 'EMPORIUM';
        const activeStation = fromEmporium
          ? ('COMPUTER' as const)
          : (rawStation as StationId);
        return {
          ...current,
          ...p,
          cases,
          inboxFiles,
          chapelLayouts,
          activeStation,
          computerOpenApp: fromEmporium
            ? 'SHOP'
            : current.computerOpenApp ?? null,
          urnInventory: p.urnInventory ?? current.urnInventory,
          casketInventory: p.casketInventory ?? current.casketInventory,
          chapelOwnedDecor: p.chapelOwnedDecor ?? current.chapelOwnedDecor,
          facilityLevels: {
            ...DEFAULT_FACILITY_LEVELS,
            ...(p.facilityLevels ?? {}),
          },
          shopRotation: p.shopRotation ?? current.shopRotation,
          showroomInventory: p.showroomInventory ?? current.showroomInventory,
          permitSubmissions: p.permitSubmissions ?? current.permitSubmissions,
          permitWrongStreak: p.permitWrongStreak ?? current.permitWrongStreak,
          financeLedger: p.financeLedger ?? current.financeLedger,
          negativeCashSinceMs:
            p.negativeCashSinceMs ?? current.negativeCashSinceMs ?? null,
          bankWarningIssued:
            p.bankWarningIssued ?? current.bankWarningIssued ?? false,
          bankForeclosed: p.bankForeclosed ?? current.bankForeclosed ?? false,
          ownedProperty:
            p.ownedProperty ??
            current.ownedProperty ??
            ownedFromListing(STARTER_PROPERTY, 0),
          activeLoans: p.activeLoans ?? current.activeLoans ?? [],
          ownedFleetIds: Array.isArray(p.ownedFleetIds)
            ? p.ownedFleetIds
            : current.ownedFleetIds ?? [],
          fleetAssignment: normalizeFleetAssignment(
            p.fleetAssignment ?? current.fleetAssignment
          ),
          intermentScore:
            typeof p.intermentScore === 'number'
              ? p.intermentScore
              : current.intermentScore ?? 0,
          lastCase: normalizeLastCase(p.lastCase) ?? current.lastCase ?? null,
          intakeToast: null,
          legalAlert: null,
          serviceFeedback: null,
          bankOpenTab: null,
        };
      },
    }
  )
);
