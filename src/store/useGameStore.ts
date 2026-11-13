import { create } from 'zustand';
import type {
  CaseInboxFile,
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

interface GameState {
  hasStartedGame: boolean;
  cash: number;
  reputation: number;
  ossilegiumCommuneGrams: number;
  activeStation: StationId;
  coolerCases: DecedentCase[];
  activeCaseId: string | null;
  inboxFiles: CaseInboxFile[];
  intakeToast: string | null;
  showroomInventory: ShowroomItem[];
  placedFlowers: Array<'LILIES' | 'ROSES' | 'WREATH'>;
  serviceRatingBonus: number;
  legalAlert: string | null;
  startGame: () => void;
  setActiveStation: (station: StationId) => void;
  selectActiveCase: (caseId: string) => void;
  tagBodyInCooler: (caseId: string) => void;
  markFileRead: (fileId: string) => void;
  clearIntakeToast: () => void;
  receiveNewIntake: () => boolean;
  expireUntaggedNames: () => void;
  getActiveCase: () => DecedentCase | null;
  completeEmbalming: (rank: Rank, tipMultiplier: number) => void;
  completeCremation: (rank: Rank, boneAshGrams: number) => void;
  completeUrnFilling: (bonusCash: number) => void;
  buyShowroomItem: (itemId: string) => void;
  placeFloralSpray: (flower: 'LILIES' | 'ROSES' | 'WREATH') => void;
  finalizeServiceAndNextCase: (chosenDisposition: 'BURIAL' | 'CREMATION') => void;
  clearLegalAlert: () => void;
}

export function generateRandomCase(now = Date.now()): DecedentCase {
  const names = [
    'Arthur Pendelton',
    'Walter Vex',
    'Eleanor Vance',
    'Silas Thorne',
    'Harold Finch',
  ];
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
    name: names[Math.floor(Math.random() * names.length)],
    weightLbs: weights[Math.floor(Math.random() * weights.length)],
    tissueCondition: pickedCond.cond,
    dehydrationFactor: pickedCond.factor,
    directive: directives[Math.floor(Math.random() * directives.length)],
    preferredFlowers: flowers[Math.floor(Math.random() * flowers.length)],
    isEmbalmed: false,
    isCremated: false,
    isUrnFilled: false,
    basePayout: 1200,
    arrivedAt: now,
    tagExpiresAt: now + TAG_WINDOW_MS,
    isTagged: false,
    nameExpired: false,
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
  };
}

const flowerItemId: Record<'LILIES' | 'ROSES' | 'WREATH', string> = {
  LILIES: 'flower_lilies',
  ROSES: 'flower_roses',
  WREATH: 'flower_wreath',
};

function updateActiveCase(
  state: GameState,
  updater: (c: DecedentCase) => DecedentCase
): Partial<GameState> | null {
  if (!state.activeCaseId) return null;
  const idx = state.coolerCases.findIndex((c) => c.id === state.activeCaseId);
  if (idx < 0) return null;
  const next = [...state.coolerCases];
  next[idx] = updater(next[idx]);
  return { coolerCases: next };
}

function resolveActiveCase(state: GameState): DecedentCase | null {
  if (!state.activeCaseId) return null;
  return state.coolerCases.find((c) => c.id === state.activeCaseId) ?? null;
}

/** Random delay between 3–5 minutes for the next intake */
export function nextIntakeDelayMs(): number {
  return (
    INTAKE_MIN_MS + Math.floor(Math.random() * (INTAKE_MAX_MS - INTAKE_MIN_MS + 1))
  );
}

const seedCase = generateRandomCase();

export const useGameStore = create<GameState>((set, get) => ({
  hasStartedGame: false,
  cash: 2500,
  reputation: 100,
  ossilegiumCommuneGrams: 0,
  activeStation: 'OVERVIEW',
  coolerCases: [seedCase],
  activeCaseId: seedCase.id,
  inboxFiles: [toInboxFile(seedCase)],
  intakeToast: null,
  legalAlert: null,
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

  startGame: () =>
    set((state) => {
      const now = Date.now();
      // Restart the seed body's 60s tag window only once gameplay begins,
      // so idle time on UrnStartScreen does not burn the toe-tag timer.
      const coolerCases = state.coolerCases.map((c, index) => {
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
        coolerCases,
        inboxFiles,
      };
    }),

  setActiveStation: (station) => set({ activeStation: station }),

  selectActiveCase: (caseId) => {
    const state = get();
    if (!state.coolerCases.some((c) => c.id === caseId)) return;
    if (state.activeCaseId === caseId) return;

    // Return any in-progress chapel sprays to inventory when switching bodies
    let inventory = state.showroomInventory;
    if (state.placedFlowers.length > 0) {
      inventory = state.showroomInventory.map((item) => {
        const flowerKey = (Object.keys(flowerItemId) as Array<
          keyof typeof flowerItemId
        >).find((k) => flowerItemId[k] === item.id);
        if (!flowerKey) return item;
        const returned = state.placedFlowers.filter((f) => f === flowerKey).length;
        return returned
          ? { ...item, ownedCount: item.ownedCount + returned }
          : item;
      });
    }

    set({
      activeCaseId: caseId,
      placedFlowers: [],
      serviceRatingBonus: 0,
      showroomInventory: inventory,
    });
  },

  tagBodyInCooler: (caseId) =>
    set((state) => {
      const now = Date.now();
      const coolerCases = state.coolerCases.map((c) => {
        if (c.id !== caseId) return c;
        if (c.isTagged || now >= c.tagExpiresAt) return c;
        return { ...c, isTagged: true, nameExpired: false };
      });
      // Tagging also selects that bay as the active case for station work
      if (state.activeCaseId === caseId) {
        return { coolerCases };
      }

      let inventory = state.showroomInventory;
      if (state.placedFlowers.length > 0) {
        inventory = state.showroomInventory.map((item) => {
          const flowerKey = (Object.keys(flowerItemId) as Array<
            keyof typeof flowerItemId
          >).find((k) => flowerItemId[k] === item.id);
          if (!flowerKey) return item;
          const returned = state.placedFlowers.filter(
            (f) => f === flowerKey
          ).length;
          return returned
            ? { ...item, ownedCount: item.ownedCount + returned }
            : item;
        });
      }

      return {
        coolerCases,
        activeCaseId: caseId,
        placedFlowers: [],
        serviceRatingBonus: 0,
        showroomInventory: inventory,
      };
    }),

  markFileRead: (fileId) =>
    set((state) => ({
      inboxFiles: state.inboxFiles.map((f) =>
        f.id === fileId ? { ...f, isRead: true } : f
      ),
    })),

  clearIntakeToast: () => set({ intakeToast: null }),

  receiveNewIntake: () => {
    const state = get();
    if (state.coolerCases.length >= MAX_COOLER_BAYS) return false;
    const next = generateRandomCase();
    playIntakeBell();
    set({
      coolerCases: [...state.coolerCases, next],
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
      const coolerCases = state.coolerCases.map((c) => {
        if (!c.isTagged && !c.nameExpired && now >= c.tagExpiresAt) {
          changed = true;
          return { ...c, nameExpired: true };
        }
        return c;
      });
      return changed ? { coolerCases } : state;
    }),

  getActiveCase: () => resolveActiveCase(get()),

  completeEmbalming: (rank, tipMultiplier) =>
    set((state) => {
      const active = resolveActiveCase(state);
      if (!active) return { activeStation: 'OVERVIEW' };
      if (active.isEmbalmed) return { activeStation: 'OVERVIEW' };
      const patched = updateActiveCase(state, (c) => ({
        ...c,
        isEmbalmed: true,
        embalmRank: rank,
      }));
      if (!patched) return { activeStation: 'OVERVIEW' };
      return {
        ...patched,
        cash: Math.round(state.cash + 350 * tipMultiplier),
        reputation:
          state.reputation +
          (rank === 'S+' ? 25 : rank === 'S' ? 15 : rank === 'F' ? -5 : 5),
        activeStation: 'OVERVIEW',
      };
    }),

  completeCremation: (rank, boneAshGrams) => {
    const state = get();
    const active = resolveActiveCase(state);
    if (!active) {
      set({ activeStation: 'OVERVIEW' });
      return;
    }
    if (active.isCremated) {
      set({ activeStation: 'URN_FILLING' });
      return;
    }
    if (active.directive === 'BURIAL_VIEWING') {
      set({
        cash: state.cash - 2500,
        reputation: Math.max(0, state.reputation - 40),
        legalAlert: `LAWSUIT FILED! ${active.name}'s contract specified Traditional Burial & Viewing Only. You were fined $2,500 for Wrongful Cremation!`,
        coolerCases: state.coolerCases.filter((c) => c.id !== active.id),
        inboxFiles: state.inboxFiles.filter((f) => f.id !== active.id),
        activeCaseId:
          state.coolerCases.find((c) => c.id !== active.id)?.id ?? null,
        placedFlowers: [],
        serviceRatingBonus: 0,
        activeStation: 'OVERVIEW',
      });
      return;
    }

    const patched = updateActiveCase(state, (c) => ({
      ...c,
      isCremated: true,
      cremationRank: rank,
    }));
    set({
      ...(patched ?? {}),
      ossilegiumCommuneGrams:
        state.ossilegiumCommuneGrams + Math.round(boneAshGrams * 0.02),
      activeStation: 'URN_FILLING',
    });
  },

  completeUrnFilling: (bonusCash) =>
    set((state) => {
      const active = resolveActiveCase(state);
      if (!active) return { activeStation: 'OVERVIEW' };
      if (active.isUrnFilled) return { activeStation: 'OVERVIEW' };
      const patched = updateActiveCase(state, (c) => ({
        ...c,
        isUrnFilled: true,
      }));
      if (!patched) return { activeStation: 'OVERVIEW' };
      return {
        ...patched,
        cash: state.cash + bonusCash,
        activeStation: 'OVERVIEW',
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

  placeFloralSpray: (flower) =>
    set((state) => {
      const active = resolveActiveCase(state);
      if (!active) return state;
      const itemId = flowerItemId[flower];
      const item = state.showroomInventory.find((i) => i.id === itemId);
      if (!item || item.ownedCount <= 0) return state;
      if (state.placedFlowers.includes(flower)) return state;

      const preferredMatch = flower === active.preferredFlowers ? 15 : 5;

      // Reputation is awarded only on finalize (via serviceRatingBonus),
      // so switching cooler cases cannot farm rep by re-placing sprays.
      return {
        placedFlowers: [...state.placedFlowers, flower],
        serviceRatingBonus: state.serviceRatingBonus + preferredMatch,
        showroomInventory: state.showroomInventory.map((i) =>
          i.id === itemId ? { ...i, ownedCount: i.ownedCount - 1 } : i
        ),
      };
    }),

  finalizeServiceAndNextCase: (chosenDisposition) =>
    set((state) => {
      const c = resolveActiveCase(state);
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
      const netPayout =
        fine > 0 ? -fine : c.basePayout + flowerBonus + (c.isUrnFilled ? 150 : 0);

      const remaining = state.coolerCases.filter((x) => x.id !== c.id);

      return {
        cash: state.cash + netPayout,
        reputation:
          fine > 0
            ? Math.max(0, state.reputation - 15)
            : state.reputation +
              Math.min(20, Math.floor(state.serviceRatingBonus / 5)),
        legalAlert: alertMsg,
        coolerCases: remaining,
        inboxFiles: state.inboxFiles.filter((f) => f.id !== c.id),
        activeCaseId: remaining[0]?.id ?? null,
        placedFlowers: [],
        serviceRatingBonus: 0,
        activeStation: 'OVERVIEW',
      };
    }),

  clearLegalAlert: () => set({ legalAlert: null }),
}));
