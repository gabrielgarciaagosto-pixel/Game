/**
 * Permanent chapel décor / facility look upgrades sold in the Emporium.
 * Owned ids unlock themes & stand capacity for every future service.
 */

export type ChapelDecorKind =
  | 'WALL'
  | 'FLOOR'
  | 'DRAPERY'
  | 'LIGHTING'
  | 'PEWS'
  | 'STANDS'
  | 'ORNAMENT';

export type FlowerKind = 'LILIES' | 'ROSES' | 'WREATH';

export interface ChapelDecorItem {
  id: string;
  name: string;
  kind: ChapelDecorKind;
  tier: 1 | 2 | 3;
  cost: number;
  /** Flat family satisfaction points added every service while owned */
  satisfactionBonus: number;
  blurb: string;
  /** Extra flower stands unlocked when owned (STANDS kind) */
  standSlots?: number;
  /** CSS tokens applied when this piece is selected for a service */
  style?: {
    wall?: string;
    floor?: string;
    drapery?: string;
    lighting?: string;
    pews?: string;
  };
}

/** Free baseline — always owned, never sold. */
export const BASIC_CHAPEL_ID = 'chapel_basic';

export const CHAPEL_DECOR_CATALOG: ChapelDecorItem[] = [
  {
    id: 'wall_linen_wash',
    name: 'Linen Wash Walls',
    kind: 'WALL',
    tier: 1,
    cost: 280,
    satisfactionBonus: 3,
    blurb: 'Soft limestone wash — calm and clean.',
    style: { wall: 'from-[#3a342c] via-[#2a241c] to-[#1a1612]' },
  },
  {
    id: 'wall_midnight_velvet',
    name: 'Midnight Velvet Panels',
    kind: 'WALL',
    tier: 2,
    cost: 620,
    satisfactionBonus: 6,
    blurb: 'Deep violet velvet panels with brass rails.',
    style: { wall: 'from-[#2a1838] via-[#1a1024] to-[#0c0814]' },
  },
  {
    id: 'wall_marble_apse',
    name: 'Carrara Apse Panels',
    kind: 'WALL',
    tier: 3,
    cost: 1400,
    satisfactionBonus: 10,
    blurb: 'Cool marble apse — cathedral composure.',
    style: { wall: 'from-[#4a4e56] via-[#2c3038] to-[#14161a]' },
  },
  {
    id: 'floor_oak_plank',
    name: 'Oak Plank Nave',
    kind: 'FLOOR',
    tier: 1,
    cost: 320,
    satisfactionBonus: 3,
    blurb: 'Warm oak underfoot for a traditional nave.',
    style: { floor: '#3d2a18' },
  },
  {
    id: 'floor_slate_checker',
    name: 'Slate Checker Aisle',
    kind: 'FLOOR',
    tier: 2,
    cost: 700,
    satisfactionBonus: 6,
    blurb: 'Muted slate checker that frames the bier.',
    style: { floor: '#1e2430' },
  },
  {
    id: 'floor_terrazzo_gold',
    name: 'Gold-Vein Terrazzo',
    kind: 'FLOOR',
    tier: 3,
    cost: 1550,
    satisfactionBonus: 10,
    blurb: 'Polished terrazzo with thin gold veins.',
    style: { floor: '#2a2218' },
  },
  {
    id: 'drape_simple_linen',
    name: 'Linen Side Drapes',
    kind: 'DRAPERY',
    tier: 1,
    cost: 220,
    satisfactionBonus: 2,
    blurb: 'Unbleached linen hangs — honest and soft.',
    style: { drapery: 'rgba(210,190,160,0.55)' },
  },
  {
    id: 'drape_burgundy_swag',
    name: 'Burgundy Swag',
    kind: 'DRAPERY',
    tier: 2,
    cost: 580,
    satisfactionBonus: 5,
    blurb: 'Heavy burgundy swags with cord ties.',
    style: { drapery: 'rgba(120,30,50,0.7)' },
  },
  {
    id: 'drape_ivory_cascade',
    name: 'Ivory Cascade',
    kind: 'DRAPERY',
    tier: 3,
    cost: 1200,
    satisfactionBonus: 9,
    blurb: 'Floor-length ivory cascade for formal services.',
    style: { drapery: 'rgba(235,225,210,0.75)' },
  },
  {
    id: 'light_warm_cans',
    name: 'Warm Can Lights',
    kind: 'LIGHTING',
    tier: 1,
    cost: 260,
    satisfactionBonus: 3,
    blurb: 'Soft warm cans over the nave.',
    style: { lighting: 'rgba(255,200,120,0.18)' },
  },
  {
    id: 'light_candle_chandeliers',
    name: 'Candle Chandeliers',
    kind: 'LIGHTING',
    tier: 2,
    cost: 740,
    satisfactionBonus: 7,
    blurb: 'Electric candle chandeliers — intimate glow.',
    style: { lighting: 'rgba(255,170,80,0.28)' },
  },
  {
    id: 'light_apse_spot',
    name: 'Apse Spotlight Rig',
    kind: 'LIGHTING',
    tier: 3,
    cost: 1600,
    satisfactionBonus: 11,
    blurb: 'Focused apse spots that honor the bier.',
    style: { lighting: 'rgba(255,230,180,0.35)' },
  },
  {
    id: 'pews_pine_bench',
    name: 'Pine Family Benches',
    kind: 'PEWS',
    tier: 1,
    cost: 300,
    satisfactionBonus: 2,
    blurb: 'Simple pine benches for guests.',
    style: { pews: '#4a3218' },
  },
  {
    id: 'pews_velvet_cushion',
    name: 'Velvet Cushioned Pews',
    kind: 'PEWS',
    tier: 2,
    cost: 850,
    satisfactionBonus: 6,
    blurb: 'Cushioned pews guests linger on.',
    style: { pews: '#3a1830' },
  },
  {
    id: 'pews_carved_oak',
    name: 'Carved Oak Choir',
    kind: 'PEWS',
    tier: 3,
    cost: 1800,
    satisfactionBonus: 10,
    blurb: 'Carved oak choir stalls — old-world gravitas.',
    style: { pews: '#2a1808' },
  },
  {
    id: 'stands_extra_pair',
    name: 'Extra Flower Stand Pair',
    kind: 'STANDS',
    tier: 1,
    cost: 180,
    satisfactionBonus: 2,
    standSlots: 2,
    blurb: '+2 stand capacity for denser arrangements.',
  },
  {
    id: 'stands_bronze_rail',
    name: 'Bronze Stand Rail',
    kind: 'STANDS',
    tier: 2,
    cost: 480,
    satisfactionBonus: 4,
    standSlots: 3,
    blurb: '+3 stands on a bronze rail system.',
  },
  {
    id: 'stands_gallery_tier',
    name: 'Gallery Tier Stands',
    kind: 'STANDS',
    tier: 3,
    cost: 980,
    satisfactionBonus: 7,
    standSlots: 4,
    blurb: '+4 gallery-tier stands for large families.',
  },
  {
    id: 'ornament_brass_cross',
    name: 'Brass Altar Cross',
    kind: 'ORNAMENT',
    tier: 1,
    cost: 200,
    satisfactionBonus: 3,
    blurb: 'A quiet brass cross behind the bier.',
  },
  {
    id: 'ornament_memorial_book',
    name: 'Memorial Guest Lectern',
    kind: 'ORNAMENT',
    tier: 2,
    cost: 520,
    satisfactionBonus: 5,
    blurb: 'Guest book lectern families notice.',
  },
  {
    id: 'ornament_stained_rose',
    name: 'Rose Window Light Box',
    kind: 'ORNAMENT',
    tier: 3,
    cost: 1350,
    satisfactionBonus: 9,
    blurb: 'Fake rose-window glow — surprisingly moving.',
  },
];

export function getChapelDecorById(id: string): ChapelDecorItem | undefined {
  return CHAPEL_DECOR_CATALOG.find((d) => d.id === id);
}

/** Base stands everyone gets free, plus owned STANDS upgrades. */
export function maxFlowerStands(ownedDecorIds: string[]): number {
  let slots = 3;
  for (const id of ownedDecorIds) {
    const item = getChapelDecorById(id);
    if (item?.standSlots) slots += item.standSlots;
  }
  return Math.min(12, slots);
}

export function ownedDecorBonus(ownedDecorIds: string[]): number {
  return ownedDecorIds.reduce((sum, id) => {
    const item = getChapelDecorById(id);
    return sum + (item?.satisfactionBonus ?? 0);
  }, 0);
}

export interface ChapelThemeSelection {
  wallId: string | null;
  floorId: string | null;
  draperyId: string | null;
  lightingId: string | null;
  pewsId: string | null;
  ornamentIds: string[];
}

export const DEFAULT_CHAPEL_THEME: ChapelThemeSelection = {
  wallId: null,
  floorId: null,
  draperyId: null,
  lightingId: null,
  pewsId: null,
  ornamentIds: [],
};

export interface ChapelLayoutPiece {
  id: string;
  kind: 'COFFIN' | 'URN' | FlowerKind;
  /** Normalized 0–1 within the chapel floor */
  x: number;
  y: number;
}

export interface ChapelServiceLayout {
  caseId: string;
  theme: ChapelThemeSelection;
  pieces: ChapelLayoutPiece[];
}

/** Default bier + empty flower slots for a fresh service. */
export function defaultChapelLayout(
  caseId: string,
  isCremationDisplay: boolean
): ChapelServiceLayout {
  return {
    caseId,
    theme: { ...DEFAULT_CHAPEL_THEME, ornamentIds: [] },
    pieces: [
      {
        id: 'focal',
        kind: isCremationDisplay ? 'URN' : 'COFFIN',
        x: 0.5,
        y: 0.42,
      },
    ],
  };
}
