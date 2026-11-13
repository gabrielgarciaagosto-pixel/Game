import { create } from 'zustand';
import type { DecedentCase, Rank, ShowroomItem } from '../types/game';

interface GameState {
  cash: number;
  reputation: number;
  ossilegiumCommuneGrams: number;
  activeStation:
    | 'OVERVIEW'
    | 'EMBALMING'
    | 'CREMATION'
    | 'URN_FILLING'
    | 'SHOWROOM';
  currentCase: DecedentCase;
  showroomInventory: ShowroomItem[];
  placedFlowers: Array<'LILIES' | 'ROSES' | 'WREATH'>;
  serviceRatingBonus: number;
  legalAlert: string | null;
  setActiveStation: (station: GameState['activeStation']) => void;
  completeEmbalming: (rank: Rank, tipMultiplier: number) => void;
  completeCremation: (rank: Rank, boneAshGrams: number) => void;
  completeUrnFilling: (bonusCash: number) => void;
  buyShowroomItem: (itemId: string) => void;
  placeFloralSpray: (flower: 'LILIES' | 'ROSES' | 'WREATH') => void;
  finalizeServiceAndNextCase: (chosenDisposition: 'BURIAL' | 'CREMATION') => void;
  clearLegalAlert: () => void;
}

const generateRandomCase = (): DecedentCase => {
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
  };
};

const flowerItemId: Record<'LILIES' | 'ROSES' | 'WREATH', string> = {
  LILIES: 'flower_lilies',
  ROSES: 'flower_roses',
  WREATH: 'flower_wreath',
};

export const useGameStore = create<GameState>((set, get) => ({
  cash: 2500,
  reputation: 100,
  ossilegiumCommuneGrams: 0,
  activeStation: 'OVERVIEW',
  currentCase: generateRandomCase(),
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

  setActiveStation: (station) => set({ activeStation: station }),

  completeEmbalming: (rank, tipMultiplier) =>
    set((state) => ({
      currentCase: { ...state.currentCase, isEmbalmed: true, embalmRank: rank },
      cash: Math.round(state.cash + 350 * tipMultiplier),
      reputation:
        state.reputation +
        (rank === 'S+' ? 25 : rank === 'S' ? 15 : rank === 'F' ? -5 : 5),
      activeStation: 'OVERVIEW',
    })),

  completeCremation: (rank, boneAshGrams) => {
    const { currentCase } = get();
    // Check if cremating a Burial-Only decedent -> LAWSUIT!
    if (currentCase.directive === 'BURIAL_VIEWING') {
      set((state) => ({
        cash: state.cash - 2500,
        reputation: Math.max(0, state.reputation - 40),
        legalAlert: `LAWSUIT FILED! ${currentCase.name}'s contract specified Traditional Burial & Viewing Only. You were fined $2,500 for Wrongful Cremation!`,
        currentCase: generateRandomCase(),
        placedFlowers: [],
        serviceRatingBonus: 0,
        activeStation: 'OVERVIEW',
      }));
      return;
    }

    set((state) => ({
      currentCase: {
        ...state.currentCase,
        isCremated: true,
        cremationRank: rank,
      },
      ossilegiumCommuneGrams:
        state.ossilegiumCommuneGrams + Math.round(boneAshGrams * 0.02),
      activeStation: 'URN_FILLING',
    }));
  },

  completeUrnFilling: (bonusCash) =>
    set((state) => ({
      currentCase: { ...state.currentCase, isUrnFilled: true },
      cash: state.cash + bonusCash,
      activeStation: 'OVERVIEW',
    })),

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
      const itemId = flowerItemId[flower];
      const item = state.showroomInventory.find((i) => i.id === itemId);
      if (!item || item.ownedCount <= 0) return state;
      if (state.placedFlowers.includes(flower)) return state;

      const preferredMatch =
        flower === state.currentCase.preferredFlowers ? 15 : 5;

      return {
        placedFlowers: [...state.placedFlowers, flower],
        serviceRatingBonus: state.serviceRatingBonus + preferredMatch,
        reputation: state.reputation + (preferredMatch === 15 ? 8 : 2),
        showroomInventory: state.showroomInventory.map((i) =>
          i.id === itemId ? { ...i, ownedCount: i.ownedCount - 1 } : i
        ),
      };
    }),

  finalizeServiceAndNextCase: (chosenDisposition) =>
    set((state) => {
      const c = state.currentCase;
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
      }

      const flowerBonus = Math.round(c.basePayout * (state.serviceRatingBonus / 100));
      const netPayout =
        fine > 0 ? -fine : c.basePayout + flowerBonus + (c.isUrnFilled ? 150 : 0);

      return {
        cash: state.cash + netPayout,
        reputation:
          fine > 0
            ? Math.max(0, state.reputation - 15)
            : state.reputation + Math.min(20, Math.floor(state.serviceRatingBonus / 5)),
        legalAlert: alertMsg,
        currentCase: generateRandomCase(),
        placedFlowers: [],
        serviceRatingBonus: 0,
        activeStation: 'OVERVIEW',
      };
    }),

  clearLegalAlert: () => set({ legalAlert: null }),
}));
