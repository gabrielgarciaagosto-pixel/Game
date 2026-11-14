import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  CaseInboxFile,
  CaseLocation,
  DecedentCase,
  PreferredCasketMaterial,
  PreferredUrnMaterial,
  Rank,
  ShowroomItem,
  StationId,
} from '../types/game';
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
  type FacilityUpgradeId,
  type FacilityUpgradeLevels,
  vaultSlotCapacity,
} from '../data/facilityUpgrades';
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
  setActiveStation: (station: StationId) => void;
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
  buyFacilityUpgrade: (id: FacilityUpgradeId) => boolean;
  offerUrnToCase: (caseId: string, urnId: string | null) => void;
  offerCasketToCase: (caseId: string, casketId: string | null) => void;
  ensureChapelLayout: (caseId: string) => void;
  setChapelTheme: (
    caseId: string,
    theme: Partial<ChapelThemeSelection>
  ) => void;
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
  return {
    id: Math.random().toString(36).substring(2, 8).toUpperCase(),
    name: randomDecedentName(),
    weightLbs: weights[Math.floor(Math.random() * weights.length)],
    tissueCondition: pickedCond.cond,
    dehydrationFactor: pickedCond.factor,
    directive,
    preferredFlowers: flowers[Math.floor(Math.random() * flowers.length)],
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
  };
}

function toInboxFile(c: DecedentCase): CaseInboxFile {
  return {
    id: c.id,
    decedentName: c.name,
    intakeTimestamp: c.arrivedAt,
    weightLbs: c.weightLbs,
    tissueCondition: c.tissueCondition,
    directive: c.directive,
    preferredFlowers: c.preferredFlowers,
    isRead: false,
    serviceDateMs: c.serviceDateMs,
    familyRequestedUrnId: c.familyRequestedUrnId,
  };
}

function normalizeCase(c: DecedentCase): DecedentCase {
  return {
    ...c,
    preferredUrnMaterial: c.preferredUrnMaterial ?? URN_MATERIALS[0],
    preferredCasketMaterial: c.preferredCasketMaterial ?? CASKET_MATERIALS[0],
    offeredUrnId: c.offeredUrnId ?? null,
    offeredCasketId: c.offeredCasketId ?? null,
    familyRequestedUrnId: c.familyRequestedUrnId ?? null,
    familyUrnDueAt:
      c.familyUrnDueAt ??
      (directiveNeedsUrn(c.directive) && !c.familyRequestedUrnId
        ? rollFamilyUrnDueAt(c.arrivedAt ?? gameNow())
        : null),
    urnPourQuality: c.urnPourQuality ?? 0,
    urnAshReady: c.urnAshReady ?? false,
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

/** Random delay between 3–5 minutes for the next intake */
export function nextIntakeDelayMs(): number {
  return (
    INTAKE_MIN_MS +
    Math.floor(Math.random() * (INTAKE_MAX_MS - INTAKE_MIN_MS + 1))
  );
}

const seedCase = generateRandomCase();

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

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
  hasStartedGame: false,
  cash: 2500,
  reputation: 100,
  ossilegiumCommuneGrams: 0,
  activeStation: 'OVERVIEW',
  cases: [seedCase],
  activeCaseId: seedCase.id,
  inboxFiles: [toInboxFile(seedCase)],
  intakeToast: null,
  legalAlert: null,
  cremulatorOwned: true,
  cremulatorDamaged: false,
  cremationBurnActive: false,
  cremationBurnProgress: 0,
  cremationHeatNormalized: 0,
  cremationDecayArrested: false,
  retort: { ...IDLE_RETORT },
  placedFlowers: [],
  serviceRatingBonus: 0,
  casketInventory: {
    casket_oak_half: 1,
    casket_pine_tapered: 1,
  },
  chapelOwnedDecor: [],
  chapelLayouts: {},
  facilityLevels: { ...DEFAULT_FACILITY_LEVELS },
  shopRotation: createShopRotation(),
  showroomInventory: defaultShowroomInventory,
  urnInventory: {
    urn_carrara_classic: 1,
    urn_walnut_pillar: 1,
  },

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

  setActiveStation: (station) => set({ activeStation: station }),

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

    set({
      activeCaseId: caseId,
      cases: updateCaseById(state.cases, caseId, (c) => ({
        ...c,
        isCremated: true,
        cremationRank: rank,
        location: 'URN_FILLING',
      })),
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
    if (!tier) return false;
    if (state.cash < tier.cost) return false;
    // Ownership-only gate — never consumes collection items
    const missing = missingCollectionReqs(
      tier.requires,
      state.urnInventory,
      state.casketInventory
    );
    if (missing.length > 0) return false;
    set({
      cash: state.cash - tier.cost,
      facilityLevels: {
        ...state.facilityLevels,
        [id]: level + 1,
      },
      reputation: state.reputation + 3 + level,
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
      const chapelScore = scoreChapelArrangement({
        pieces: layout?.pieces ?? [],
        preferred: c.preferredFlowers,
        ownedDecorIds: state.chapelOwnedDecor,
        theme: layout?.theme ?? {
          wallId: null,
          floorId: null,
          draperyId: null,
          lightingId: null,
          pewsId: null,
          urnPedestalId: null,
          ornamentIds: [],
        },
        decayLevel: c.decayLevel,
        urnPrestige: offered?.prestigeBonus ?? 0,
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

      const netPayout = serviceFailed
        ? -(fine + lateFine)
        : Math.max(
            0,
            c.basePayout +
              flowerBonus +
              urnSale +
              urnTasteBonus +
              casketSale +
              casketTasteBonus +
              tipCash +
              (c.isUrnFilled ? 150 : 0) -
              decayPenalty
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

      return {
        cash: state.cash + netPayout,
        reputation: Math.max(
          0,
          serviceFailed
            ? state.reputation - 15 - decayRepHit
            : state.reputation +
                chapelRewards.reputationDelta +
                urnRep +
                casketRep -
                decayRepHit
        ),
        legalAlert: alertMsg,
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
      version: 2,
      migrate: (persisted, version) => {
        const p = (persisted ?? {}) as Record<string, unknown>;
        if (version >= 2) return p as never;
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
        const inboxFiles = rawInbox.map((f) => ({
          ...f,
          familyRequestedUrnId:
            f.familyRequestedUrnId ??
            cases.find((c) => c.id === f.id)?.familyRequestedUrnId ??
            null,
        }));
        return { ...p, cases, chapelLayouts, inboxFiles } as never;
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
        const inboxFiles = (p.inboxFiles ?? current.inboxFiles).map((f) => ({
          ...f,
          familyRequestedUrnId:
            f.familyRequestedUrnId ??
            cases.find((c) => c.id === f.id)?.familyRequestedUrnId ??
            null,
        }));
        return {
          ...current,
          ...p,
          cases,
          inboxFiles,
          chapelLayouts,
          urnInventory: p.urnInventory ?? current.urnInventory,
          casketInventory: p.casketInventory ?? current.casketInventory,
          chapelOwnedDecor: p.chapelOwnedDecor ?? current.chapelOwnedDecor,
          facilityLevels: {
            ...DEFAULT_FACILITY_LEVELS,
            ...(p.facilityLevels ?? {}),
          },
          shopRotation: p.shopRotation ?? current.shopRotation,
          showroomInventory: p.showroomInventory ?? current.showroomInventory,
          intakeToast: null,
          legalAlert: null,
        };
      },
    }
  )
);
