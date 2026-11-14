export type CasketMaterial =
  | 'OAK'
  | 'CHERRY'
  | 'WALNUT'
  | 'PINE'
  | 'MAHOGANY'
  | 'STEEL'
  | 'BRONZE'
  | 'COPPER';

export type CasketSilhouette =
  | 'HALF_COUCH'
  | 'FULL_COUCH'
  | 'TAPERED'
  | 'OCTAGON'
  | 'DOME'
  | 'PANEL';

export interface CasketCatalogEntry {
  id: string;
  name: string;
  material: CasketMaterial;
  silhouette: CasketSilhouette;
  finish: string;
  hardware: string;
  blurb: string;
  cost: number;
  resaleValue: number;
  prestigeBonus: number;
  /** Emporium lock — must have at least this reputation to buy */
  reputationRequired: number;
  palette: {
    body: string;
    bodyDeep: string;
    highlight: string;
    lining: string;
    hardware: string;
    trim: string;
  };
}

export const CASKET_MATERIALS: CasketMaterial[] = [
  'OAK',
  'CHERRY',
  'WALNUT',
  'PINE',
  'MAHOGANY',
  'STEEL',
  'BRONZE',
  'COPPER',
];

export const CASKET_CATALOG: CasketCatalogEntry[] = [
  {
    id: 'casket_oak_half',
    name: 'Heritage Oak Half-Couch',
    material: 'OAK',
    silhouette: 'HALF_COUCH',
    finish: 'Honey oak, satin',
    hardware: 'Brushed brass swing-bar',
    blurb: 'The workhorse oak half-couch — warm grain, familiar to every family.',
    cost: 420,
    resaleValue: 980,
    prestigeBonus: 8,
    reputationRequired: 0,
    palette: {
      body: '#b45309',
      bodyDeep: '#78350f',
      highlight: '#fbbf24',
      lining: '#f5e6d3',
      hardware: '#d4a017',
      trim: '#92400e',
    },
  },
  {
    id: 'casket_cherry_panel',
    name: 'Cherry Panel Couch',
    material: 'CHERRY',
    silhouette: 'PANEL',
    finish: 'Deep cherry, hand-rubbed',
    hardware: 'Antique copper corners',
    blurb: 'Panel sides catch chapel light; a favorite for evening viewings.',
    cost: 560,
    resaleValue: 1280,
    prestigeBonus: 11,
    reputationRequired: 70,
    palette: {
      body: '#9f1239',
      bodyDeep: '#4c0519',
      highlight: '#fb7185',
      lining: '#ffe4e6',
      hardware: '#b45309',
      trim: '#881337',
    },
  },
  {
    id: 'casket_walnut_dome',
    name: 'Black Walnut Dome',
    material: 'WALNUT',
    silhouette: 'DOME',
    finish: 'Oil-rubbed walnut',
    hardware: 'Dark bronze bars',
    blurb: 'A solemn dome lid over rich walnut — quiet luxury.',
    cost: 720,
    resaleValue: 1650,
    prestigeBonus: 14,
    reputationRequired: 100,
    palette: {
      body: '#44403c',
      bodyDeep: '#1c1917',
      highlight: '#a8a29e',
      lining: '#e7e5e4',
      hardware: '#57534e',
      trim: '#292524',
    },
  },
  {
    id: 'casket_pine_tapered',
    name: 'Country Pine Tapered',
    material: 'PINE',
    silhouette: 'TAPERED',
    finish: 'Natural pine, clear coat',
    hardware: 'Simple iron handles',
    blurb: 'Honest tapered pine for families who want no fuss.',
    cost: 280,
    resaleValue: 620,
    prestigeBonus: 5,
    reputationRequired: 0,
    palette: {
      body: '#d6b56d',
      bodyDeep: '#a16207',
      highlight: '#fef3c7',
      lining: '#fff7ed',
      hardware: '#57534e',
      trim: '#92400e',
    },
  },
  {
    id: 'casket_mahogany_full',
    name: 'Mahogany Full-Couch',
    material: 'MAHOGANY',
    silhouette: 'FULL_COUCH',
    finish: 'Polished mahogany',
    hardware: 'Gold-tone continuous bar',
    blurb: 'Full-couch mahogany for formal open-casket ceremonies.',
    cost: 980,
    resaleValue: 2200,
    prestigeBonus: 18,
    reputationRequired: 100,
    palette: {
      body: '#7f1d1d',
      bodyDeep: '#450a0a',
      highlight: '#f87171',
      lining: '#fce7f3',
      hardware: '#eab308',
      trim: '#991b1b',
    },
  },
  {
    id: 'casket_steel_silver',
    name: 'Silver Steel Half-Couch',
    material: 'STEEL',
    silhouette: 'HALF_COUCH',
    finish: 'Brushed stainless',
    hardware: 'Chrome swing-bar',
    blurb: 'Cool brushed steel — modern and easy to seal.',
    cost: 640,
    resaleValue: 1400,
    prestigeBonus: 12,
    reputationRequired: 0,
    palette: {
      body: '#94a3b8',
      bodyDeep: '#334155',
      highlight: '#e2e8f0',
      lining: '#f1f5f9',
      hardware: '#cbd5e1',
      trim: '#64748b',
    },
  },
  {
    id: 'casket_bronze_octagon',
    name: 'Cast Bronze Octagon',
    material: 'BRONZE',
    silhouette: 'OCTAGON',
    finish: 'Cast bronze, soft patina',
    hardware: 'Matching bronze corners',
    blurb: 'Octagonal bronze shell — rare, heavy, unmistakable.',
    cost: 1450,
    resaleValue: 3200,
    prestigeBonus: 22,
    reputationRequired: 160,
    palette: {
      body: '#b45309',
      bodyDeep: '#78350f',
      highlight: '#fcd34d',
      lining: '#fef3c7',
      hardware: '#92400e',
      trim: '#a16207',
    },
  },
  {
    id: 'casket_copper_panel',
    name: 'Hammered Copper Panel',
    material: 'COPPER',
    silhouette: 'PANEL',
    finish: 'Hammered copper',
    hardware: 'Copper rivet trim',
    blurb: 'Warm hammered copper panels that age beautifully in photographs.',
    cost: 1100,
    resaleValue: 2500,
    prestigeBonus: 19,
    reputationRequired: 130,
    palette: {
      body: '#c2410c',
      bodyDeep: '#7c2d12',
      highlight: '#fdba74',
      lining: '#ffedd5',
      hardware: '#9a3412',
      trim: '#ea580c',
    },
  },
  {
    id: 'casket_oak_octagon',
    name: 'Octagon Oak Traditional',
    material: 'OAK',
    silhouette: 'OCTAGON',
    finish: 'Dark stained oak',
    hardware: 'Pewter bars',
    blurb: 'Traditional octagon oak for families who like classic silhouettes.',
    cost: 510,
    resaleValue: 1150,
    prestigeBonus: 10,
    reputationRequired: 0,
    palette: {
      body: '#92400e',
      bodyDeep: '#451a03',
      highlight: '#d97706',
      lining: '#fef3c7',
      hardware: '#78716c',
      trim: '#78350f',
    },
  },
  {
    id: 'casket_steel_gunmetal',
    name: 'Gunmetal Full-Couch',
    material: 'STEEL',
    silhouette: 'FULL_COUCH',
    finish: 'Gunmetal enamel',
    hardware: 'Black nickel hardware',
    blurb: 'Matte gunmetal steel — contemporary and discreet.',
    cost: 780,
    resaleValue: 1700,
    prestigeBonus: 15,
    reputationRequired: 100,
    palette: {
      body: '#3f3f46',
      bodyDeep: '#18181b',
      highlight: '#a1a1aa',
      lining: '#e4e4e7',
      hardware: '#27272a',
      trim: '#52525b',
    },
  },
];

export function getCasketById(id: string | null | undefined) {
  if (!id) return undefined;
  return CASKET_CATALOG.find((c) => c.id === id);
}
