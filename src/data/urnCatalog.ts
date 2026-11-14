export type UrnMaterial =
  | 'MARBLE'
  | 'BRONZE'
  | 'WOOD'
  | 'CERAMIC'
  | 'GLASS'
  | 'STEEL'
  | 'STONE'
  | 'PORCELAIN';

export type UrnSilhouette =
  | 'CLASSIC'
  | 'TOWER'
  | 'TEAR'
  | 'CUBE'
  | 'VASE'
  | 'KEEPSAKE'
  | 'ART_DECO'
  | 'TEMPLE';

export interface UrnCatalogEntry {
  id: string;
  name: string;
  material: UrnMaterial;
  silhouette: UrnSilhouette;
  finish: string;
  decoration: string;
  blurb: string;
  cost: number;
  resaleValue: number;
  prestigeBonus: number;
  /** Palette for the vessel renderer */
  palette: {
    body: string;
    bodyDeep: string;
    highlight: string;
    lid: string;
    accent: string;
    base: string;
  };
}

export const URN_CATALOG: UrnCatalogEntry[] = [
  {
    id: 'urn_carrara_classic',
    name: 'Carrara Classic',
    material: 'MARBLE',
    silhouette: 'CLASSIC',
    finish: 'Polished white marble',
    decoration: 'Grey veining, brass finial',
    blurb: 'A restrained Italian marble vessel with soft grey rivers.',
    cost: 320,
    resaleValue: 780,
    prestigeBonus: 10,
    palette: {
      body: '#f5f5f4',
      bodyDeep: '#d6d3d1',
      highlight: '#ffffff',
      lid: '#e7e5e4',
      accent: '#b45309',
      base: '#a8a29e',
    },
  },
  {
    id: 'urn_nero_marquina',
    name: 'Nero Marquina Obelisk',
    material: 'MARBLE',
    silhouette: 'TOWER',
    finish: 'Black marble, honed',
    decoration: 'White calcite veins, silver band',
    blurb: 'Tall black marble for families who want solemn verticality.',
    cost: 410,
    resaleValue: 940,
    prestigeBonus: 12,
    palette: {
      body: '#1c1917',
      bodyDeep: '#0c0a09',
      highlight: '#a8a29e',
      lid: '#292524',
      accent: '#e7e5e4',
      base: '#44403c',
    },
  },
  {
    id: 'urn_bronze_laurel',
    name: 'Bronze Laurel',
    material: 'BRONZE',
    silhouette: 'CLASSIC',
    finish: 'Cast bronze, warm patina',
    decoration: 'Raised laurel wreath',
    blurb: 'Heavy cast bronze with a wreath relief that catches chapel light.',
    cost: 480,
    resaleValue: 1100,
    prestigeBonus: 14,
    palette: {
      body: '#b45309',
      bodyDeep: '#78350f',
      highlight: '#fcd34d',
      lid: '#92400e',
      accent: '#fbbf24',
      base: '#451a03',
    },
  },
  {
    id: 'urn_verdigris_tear',
    name: 'Verdigris Tear',
    material: 'BRONZE',
    silhouette: 'TEAR',
    finish: 'Aged copper-bronze',
    decoration: 'Green patina streaks',
    blurb: 'A teardrop form left to weather into quiet green.',
    cost: 390,
    resaleValue: 860,
    prestigeBonus: 11,
    palette: {
      body: '#3f6212',
      bodyDeep: '#365314',
      highlight: '#a3e635',
      lid: '#4d7c0f',
      accent: '#d9f99d',
      base: '#1a2e05',
    },
  },
  {
    id: 'urn_walnut_pillar',
    name: 'Walnut Pillar',
    material: 'WOOD',
    silhouette: 'TOWER',
    finish: 'Oil-rubbed walnut',
    decoration: 'Brass inlay ring',
    blurb: 'Solid walnut turned as a chapel pillar, warm and quiet.',
    cost: 260,
    resaleValue: 620,
    prestigeBonus: 8,
    palette: {
      body: '#7c2d12',
      bodyDeep: '#451a03',
      highlight: '#d6a57a',
      lid: '#9a3412',
      accent: '#fbbf24',
      base: '#3f1d0b',
    },
  },
  {
    id: 'urn_cherry_keepsake',
    name: 'Cherry Keepsake Pair',
    material: 'WOOD',
    silhouette: 'KEEPSAKE',
    finish: 'Cherry varnish',
    decoration: 'Twin small vessels',
    blurb: 'Matching miniature cherry urns for shared keepsakes.',
    cost: 180,
    resaleValue: 420,
    prestigeBonus: 7,
    palette: {
      body: '#9f1239',
      bodyDeep: '#4c0519',
      highlight: '#fb7185',
      lid: '#be123c',
      accent: '#fecdd3',
      base: '#881337',
    },
  },
  {
    id: 'urn_celadon_vase',
    name: 'Celadon Temple Vase',
    material: 'CERAMIC',
    silhouette: 'VASE',
    finish: 'Celadon glaze',
    decoration: 'Crackled glaze field',
    blurb: 'Soft jade ceramic with a temple-vase silhouette.',
    cost: 240,
    resaleValue: 560,
    prestigeBonus: 9,
    palette: {
      body: '#86efac',
      bodyDeep: '#166534',
      highlight: '#dcfce7',
      lid: '#4ade80',
      accent: '#f0fdf4',
      base: '#14532d',
    },
  },
  {
    id: 'urn_cobalt_art_deco',
    name: 'Cobalt Deco',
    material: 'CERAMIC',
    silhouette: 'ART_DECO',
    finish: 'Gloss cobalt',
    decoration: 'Gold geometric bands',
    blurb: 'Jazz-age geometry in deep blue and leaf gold.',
    cost: 350,
    resaleValue: 820,
    prestigeBonus: 12,
    palette: {
      body: '#1e3a8a',
      bodyDeep: '#172554',
      highlight: '#93c5fd',
      lid: '#1d4ed8',
      accent: '#fbbf24',
      base: '#0f172a',
    },
  },
  {
    id: 'urn_amber_glass',
    name: 'Amber Lantern',
    material: 'GLASS',
    silhouette: 'CUBE',
    finish: 'Hand-blown amber glass',
    decoration: 'Internal bubbles, frosted lid',
    blurb: 'A lantern cube of amber glass that glows under bier lights.',
    cost: 290,
    resaleValue: 700,
    prestigeBonus: 10,
    palette: {
      body: '#f59e0b',
      bodyDeep: '#92400e',
      highlight: '#fde68a',
      lid: '#d97706',
      accent: '#fffbeb',
      base: '#78350f',
    },
  },
  {
    id: 'urn_smoke_glass_tear',
    name: 'Smoke Glass Tear',
    material: 'GLASS',
    silhouette: 'TEAR',
    finish: 'Smoked crystal',
    decoration: 'Polished facet belt',
    blurb: 'Faceted smoke crystal cut like a quiet tear.',
    cost: 360,
    resaleValue: 880,
    prestigeBonus: 13,
    palette: {
      body: '#64748b',
      bodyDeep: '#0f172a',
      highlight: '#e2e8f0',
      lid: '#475569',
      accent: '#f8fafc',
      base: '#1e293b',
    },
  },
  {
    id: 'urn_brushed_steel',
    name: 'Brushed Steel Cube',
    material: 'STEEL',
    silhouette: 'CUBE',
    finish: 'Brushed stainless',
    decoration: 'Beveled edges, black plaque',
    blurb: 'Modern stainless geometry for direct-cremation families.',
    cost: 220,
    resaleValue: 510,
    prestigeBonus: 7,
    palette: {
      body: '#cbd5e1',
      bodyDeep: '#475569',
      highlight: '#f8fafc',
      lid: '#94a3b8',
      accent: '#0f172a',
      base: '#334155',
    },
  },
  {
    id: 'urn_gunmetal_tower',
    name: 'Gunmetal Tower',
    material: 'STEEL',
    silhouette: 'TOWER',
    finish: 'Gunmetal anodize',
    decoration: 'Vertical flutes',
    blurb: 'Fluted gunmetal rising like a quiet monument.',
    cost: 310,
    resaleValue: 740,
    prestigeBonus: 9,
    palette: {
      body: '#334155',
      bodyDeep: '#020617',
      highlight: '#94a3b8',
      lid: '#1e293b',
      accent: '#e2e8f0',
      base: '#0f172a',
    },
  },
  {
    id: 'urn_slate_temple',
    name: 'Slate Temple',
    material: 'STONE',
    silhouette: 'TEMPLE',
    finish: 'Quarried slate',
    decoration: 'Pediment lid, carved steps',
    blurb: 'A miniature temple cut from blue-grey slate.',
    cost: 370,
    resaleValue: 860,
    prestigeBonus: 12,
    palette: {
      body: '#64748b',
      bodyDeep: '#334155',
      highlight: '#cbd5e1',
      lid: '#475569',
      accent: '#f1f5f9',
      base: '#1e293b',
    },
  },
  {
    id: 'urn_sandstone_vase',
    name: 'Desert Sandstone',
    material: 'STONE',
    silhouette: 'VASE',
    finish: 'Sand-washed stone',
    decoration: 'Incised spiral band',
    blurb: 'Warm sandstone with a spiral carved for the journey.',
    cost: 250,
    resaleValue: 590,
    prestigeBonus: 8,
    palette: {
      body: '#d6a57a',
      bodyDeep: '#92400e',
      highlight: '#fde68a',
      lid: '#b45309',
      accent: '#fff7ed',
      base: '#78350f',
    },
  },
  {
    id: 'urn_porcelain_lotus',
    name: 'Porcelain Lotus',
    material: 'PORCELAIN',
    silhouette: 'CLASSIC',
    finish: 'Bone china',
    decoration: 'Hand-painted lotus',
    blurb: 'Bone-white porcelain with a single blue lotus bloom.',
    cost: 340,
    resaleValue: 800,
    prestigeBonus: 11,
    palette: {
      body: '#fafafa',
      bodyDeep: '#e5e5e5',
      highlight: '#ffffff',
      lid: '#f5f5f5',
      accent: '#1d4ed8',
      base: '#a3a3a3',
    },
  },
  {
    id: 'urn_porcelain_night',
    name: 'Midnight Porcelain',
    material: 'PORCELAIN',
    silhouette: 'ART_DECO',
    finish: 'Black glaze',
    decoration: 'Platinum pinstripes',
    blurb: 'Midnight porcelain with platinum Deco lines.',
    cost: 420,
    resaleValue: 980,
    prestigeBonus: 14,
    palette: {
      body: '#171717',
      bodyDeep: '#0a0a0a',
      highlight: '#a3a3a3',
      lid: '#262626',
      accent: '#e5e5e5',
      base: '#404040',
    },
  },
  {
    id: 'urn_oak_cube',
    name: 'White Oak Cube',
    material: 'WOOD',
    silhouette: 'CUBE',
    finish: 'White oak, matte',
    decoration: 'Dovetail corners',
    blurb: 'Honest joinery in pale oak — simple and sturdy.',
    cost: 190,
    resaleValue: 450,
    prestigeBonus: 6,
    palette: {
      body: '#e7d3a8',
      bodyDeep: '#a16207',
      highlight: '#fef3c7',
      lid: '#ca8a04',
      accent: '#78350f',
      base: '#854d0e',
    },
  },
  {
    id: 'urn_rose_bronze_vase',
    name: 'Rose-Bronze Vase',
    material: 'BRONZE',
    silhouette: 'VASE',
    finish: 'Rose bronze polish',
    decoration: 'Engraved vine collar',
    blurb: 'Warm rose bronze with a vine collar for floral services.',
    cost: 450,
    resaleValue: 1050,
    prestigeBonus: 13,
    palette: {
      body: '#be123c',
      bodyDeep: '#7f1d1d',
      highlight: '#fda4af',
      lid: '#9f1239',
      accent: '#fecdd3',
      base: '#4c0519',
    },
  },
];

export function getUrnById(id: string | null | undefined): UrnCatalogEntry | null {
  if (!id) return null;
  return URN_CATALOG.find((u) => u.id === id) ?? null;
}

export const URN_MATERIALS: UrnMaterial[] = [
  'MARBLE',
  'BRONZE',
  'WOOD',
  'CERAMIC',
  'GLASS',
  'STEEL',
  'STONE',
  'PORCELAIN',
];
