import { create } from 'zustand';
import type {
  CaseInboxFile,
  CaseLocation,
  DecedentCase,
  Rank,
  ShowroomItem,
  StationId,
} from '../types/game';
import { playIntakeBell } from '../utils/soundEffects';

const MAX_COOLER_BAYS = 6;
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
  startGame: () => void;
  setActiveStation: (station: StationId) => void;
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
  completeUrnFilling: (bonusCash: number, caseId: string) => void;
  storeUrnInVault: (caseId: string) => void;
  buyShowroomItem: (itemId: string) => void;
  placeFloralSpray: (
    flower: 'LILIES' | 'ROSES' | 'WREATH',
    caseId: string
  ) => void;
  finalizeServiceAndNextCase: (
    chosenDisposition: 'BURIAL' | 'CREMATION',
    caseId: string
  ) => void;
  clearLegalAlert: () => void;
  damageCremulator: () => void;
  buyReplacementCremulator: () => boolean;
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

export function generateRandomCase(now = Date.now()): DecedentCase {
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
  ];
  const flowers: DecedentCase['preferredFlowers'][] = [
    'LILIES',
    'ROSES',
    'WREATH',
  ];

  const pickedCond = conditions[Math.floor(Math.random() * conditions.length)];
  return {
    id: Math.random().toString(36).substring(2, 8).toUpperCase(),
    name: randomDecedentName(),
    weightLbs: weights[Math.floor(Math.random() * weights.length)],
    tissueCondition: pickedCond.cond,
    dehydrationFactor: pickedCond.factor,
    directive: directives[Math.floor(Math.random() * directives.length)],
    preferredFlowers: flowers[Math.floor(Math.random() * flowers.length)],
    location: 'COOLER',
    isEmbalmed: false,
    isCremated: false,
    isUrnFilled: false,
    basePayout: 1200,
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

function returnPlacedFlowers(state: GameState): ShowroomItem[] {
  if (state.placedFlowers.length === 0) return state.showroomInventory;
  return state.showroomInventory.map((item) => {
    const flowerKey = (
      Object.keys(flowerItemId) as Array<keyof typeof flowerItemId>
    ).find((k) => flowerItemId[k] === item.id);
    if (!flowerKey) return item;
    const returned = state.placedFlowers.filter((f) => f === flowerKey).length;
    return returned
      ? { ...item, ownedCount: item.ownedCount + returned }
      : item;
  });
}

/** Random delay between 3–5 minutes for the next intake */
export function nextIntakeDelayMs(): number {
  return (
    INTAKE_MIN_MS +
    Math.floor(Math.random() * (INTAKE_MAX_MS - INTAKE_MIN_MS + 1))
  );
}

const seedCase = generateRandomCase();

export const useGameStore = create<GameState>((set, get) => ({
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
  placedFlowers: [],
  serviceRatingBonus: 0,
  showroomInventory: [
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
      id: 'urn_marble',
      name: 'Carrara Marble Urn',
      category: 'URN',
      cost: 120,
      resaleValue: 380,
      prestigeBonus: 8,
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
  ],

  getActiveCase: () => resolveActiveCase(get()),

  startGame: () =>
    set((state) => {
      const now = Date.now();
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
    set({
      activeCaseId: caseId,
      placedFlowers: [],
      serviceRatingBonus: 0,
      showroomInventory: returnPlacedFlowers(state),
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
      const now = Date.now();
      const cases = state.cases.map((c) => {
        if (c.id !== caseId) return c;
        if (c.isTagged || now >= c.tagExpiresAt) return c;
        return { ...c, isTagged: true, nameExpired: false };
      });
      if (state.activeCaseId === caseId) return { cases };
      return {
        cases,
        activeCaseId: caseId,
        placedFlowers: [],
        serviceRatingBonus: 0,
        showroomInventory: returnPlacedFlowers(state),
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

  receiveNewIntake: () => {
    const state = get();
    const coolerCount = state.cases.filter((c) => c.location === 'COOLER')
      .length;
    if (coolerCount >= MAX_COOLER_BAYS) return false;
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
      const now = Date.now();
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

  tickDecay: () =>
    set((state) => {
      let changed = false;
      const cases = state.cases.map((c) => {
        const refrigerated = c.location === 'COOLER';
        const preserved = c.isEmbalmed || c.isCremated || c.isUrnFilled;
        if (refrigerated || preserved || c.location === 'URN_VAULT') {
          return c;
        }

        if (
          c.location === 'CREMATION' &&
          (state.cremationDecayArrested ||
            state.cremationBurnProgress >= 0.15)
        ) {
          return c;
        }

        let rate = DECAY_PER_SEC;
        if (c.location === 'CREMATION' && state.cremationBurnActive) {
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

  moveCaseTo: (caseId, location) =>
    set((state) => {
      const target = resolveCase(state, caseId);
      if (!target) return state;
      const now = Date.now();
      const nextStation = stationForLocation(location);
      return {
        activeCaseId: caseId,
        cases: updateCaseById(state.cases, caseId, (c) =>
          relocateCase(c, location, now)
        ),
        activeStation: nextStation ?? state.activeStation,
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
      const now = Date.now();
      return {
        activeCaseId: caseId,
        activeStation: station,
        cases: updateCaseById(state.cases, caseId, (c) =>
          relocateCase(c, location, now)
        ),
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
      set({
        cash: state.cash - 2500,
        reputation: Math.max(0, state.reputation - 40),
        legalAlert: `LAWSUIT FILED! ${active.name}'s contract specified Traditional Burial & Viewing Only. You were fined $2,500 for Wrongful Cremation!`,
        cases: state.cases.filter((c) => c.id !== active.id),
        inboxFiles: state.inboxFiles.filter((f) => f.id !== active.id),
        activeCaseId:
          state.cases.find((c) => c.id !== active.id)?.id ?? null,
        placedFlowers: [],
        serviceRatingBonus: 0,
        activeStation: 'OVERVIEW',
        cremationBurnActive: false,
        cremationBurnProgress: 0,
        cremationHeatNormalized: 0,
        cremationDecayArrested: false,
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
    });
  },

  completeUrnFilling: (bonusCash, caseId) =>
    set((state) => {
      const active = resolveCase(state, caseId);
      if (!active || active.isUrnFilled) {
        return { activeStation: 'URN_FILLING', activeCaseId: caseId };
      }
      return {
        activeCaseId: caseId,
        cases: updateCaseById(state.cases, caseId, (c) => ({
          ...c,
          isUrnFilled: true,
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
        reputation: state.reputation + item.prestigeBonus,
        showroomInventory: state.showroomInventory.map((i) =>
          i.id === itemId ? { ...i, ownedCount: i.ownedCount + 1 } : i
        ),
      };
    }),

  placeFloralSpray: (flower, caseId) =>
    set((state) => {
      const active = resolveCase(state, caseId);
      if (!active) return state;
      const itemId = flowerItemId[flower];
      const item = state.showroomInventory.find((i) => i.id === itemId);
      if (!item || item.ownedCount <= 0) return state;
      if (state.placedFlowers.includes(flower)) return state;

      const preferredMatch = flower === active.preferredFlowers ? 15 : 5;
      return {
        activeCaseId: caseId,
        placedFlowers: [...state.placedFlowers, flower],
        serviceRatingBonus: state.serviceRatingBonus + preferredMatch,
        showroomInventory: state.showroomInventory.map((i) =>
          i.id === itemId ? { ...i, ownedCount: i.ownedCount - 1 } : i
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
      }

      const flowerBonus = Math.round(
        c.basePayout * (state.serviceRatingBonus / 100)
      );
      const decayPenalty = Math.round(c.basePayout * (c.decayLevel / 100) * 0.8);
      const lateService =
        c.serviceDateMs != null && Date.now() > c.serviceDateMs;
      const lateFine = lateService ? 900 : 0;
      if (lateService && !alertMsg) {
        alertMsg = `LATE SERVICE ($900): Viewing/service date missed — family satisfaction collapsed.`;
      }
      if (c.decayLevel >= 40 && !alertMsg) {
        alertMsg = `FAMILY OUTRAGE: Remains showed advanced decomposition (decay ${Math.round(c.decayLevel)}%).`;
      }

      const netPayout =
        fine > 0 || lateFine > 0
          ? -(fine + lateFine)
          : Math.max(
              0,
              c.basePayout +
                flowerBonus +
                (c.isUrnFilled ? 150 : 0) -
                decayPenalty
            );

      const remaining = state.cases.filter((x) => x.id !== c.id);
      const decayRepHit = Math.floor(c.decayLevel / 10);

      return {
        cash: state.cash + netPayout,
        reputation: Math.max(
          0,
          fine > 0 || lateFine > 0
            ? state.reputation - 15 - decayRepHit
            : state.reputation +
                Math.min(20, Math.floor(state.serviceRatingBonus / 5)) -
                decayRepHit
        ),
        legalAlert: alertMsg,
        cases: remaining,
        inboxFiles: state.inboxFiles.filter((f) => f.id !== c.id),
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
}));
