/**
 * Modern urn line. Shapes, lids, finishes, and accents are original drawings.
 * Photos in reference/urns/ are not imported.
 */
import type {
  UrnAccent,
  UrnBody,
  UrnCatalogEntry,
  UrnFinishId,
  UrnLid,
  UrnMaterial,
  UrnSilhouette,
} from './urnCatalog';

export type BeautifyStep = 'band' | 'finish' | 'engrave';

export type UrnRareTone = 'LIGHT' | 'DARK';
export type UrnRareRank = 'UNCOMMON' | 'RARE' | 'LEGENDARY';

type Palette = UrnCatalogEntry['palette'];

interface FinishSpec {
  label: string;
  material: UrnMaterial;
  palette: Palette;
  cost: number;
  prestige: number;
}

const FINISH: Record<UrnFinishId, FinishSpec> = {
  BRUSHED_BRASS: {
    label: 'Brushed brass',
    material: 'BRONZE',
    cost: 280,
    prestige: 8,
    palette: pal('#c4a46a', '#7a5a2e', '#f3e6c4', '#d4bc86', '#f5e6b8', '#5c4318'),
  },
  BRONZE: {
    label: 'Bronze',
    material: 'BRONZE',
    cost: 300,
    prestige: 9,
    palette: pal('#b06a3a', '#6b3a1e', '#e7b48a', '#8d4e28', '#e8c39a', '#3d2412'),
  },
  PEWTER: {
    label: 'Brushed pewter',
    material: 'STEEL',
    cost: 240,
    prestige: 7,
    palette: pal('#b7b8b4', '#6e726e', '#f4f4f2', '#9a9c98', '#e4e4e0', '#4a4e4c'),
  },
  SILVER: {
    label: 'Brushed silver',
    material: 'STEEL',
    cost: 320,
    prestige: 9,
    palette: pal('#d5d8de', '#8b93a0', '#ffffff', '#c0c6d0', '#f8fafc', '#5c6570'),
  },
  GOLD: {
    label: 'Brushed gold',
    material: 'BRONZE',
    cost: 460,
    prestige: 13,
    palette: pal('#e3c16a', '#8a6a22', '#fff4c8', '#f0d78a', '#fff7d6', '#6b5010'),
  },
  GUNMETAL: {
    label: 'Gunmetal',
    material: 'STEEL',
    cost: 260,
    prestige: 8,
    palette: pal('#5c656e', '#1e242b', '#b7c0c8', '#3a424a', '#d5dde4', '#12161a'),
  },
  MATTE_BLACK: {
    label: 'Matte black',
    material: 'STEEL',
    cost: 220,
    prestige: 7,
    palette: pal('#2a2a2a', '#0e0e0e', '#6a6a6a', '#1a1a1a', '#cfcfcf', '#000000'),
  },
  GLOSS_BLACK: {
    label: 'Gloss black',
    material: 'STEEL',
    cost: 340,
    prestige: 11,
    palette: pal('#1a1a1a', '#050505', '#a3a3a3', '#111111', '#e6c36a', '#000000'),
  },
  MATTE_WHITE: {
    label: 'Matte white',
    material: 'CERAMIC',
    cost: 200,
    prestige: 6,
    palette: pal('#f4f4f2', '#d4d4d0', '#ffffff', '#eceae6', '#c8c4bc', '#bdb8b0'),
  },
  MIDNIGHT_BLUE: {
    label: 'Midnight blue',
    material: 'STEEL',
    cost: 300,
    prestige: 10,
    palette: pal('#1c2c4a', '#0c1424', '#7f93b5', '#243656', '#d6deea', '#070b14'),
  },
  MARBLE_WHITE: {
    label: 'White marble',
    material: 'MARBLE',
    cost: 360,
    prestige: 11,
    palette: pal('#f7f6f3', '#d9d4cc', '#ffffff', '#efece7', '#b9a48a', '#cfc8be'),
  },
  MARBLE_BEIGE: {
    label: 'Beige marble',
    material: 'MARBLE',
    cost: 340,
    prestige: 10,
    palette: pal('#e7d3b0', '#c4a574', '#fff6e4', '#edd9b4', '#a8845a', '#b08968'),
  },
  MARBLE_BLACK_GOLD: {
    label: 'Black marble, gold vein',
    material: 'MARBLE',
    cost: 520,
    prestige: 14,
    palette: pal('#1a1612', '#0a0908', '#6b5a3e', '#221c16', '#d4b06a', '#2a241c'),
  },
  GRANITE: {
    label: 'Black granite',
    material: 'STONE',
    cost: 380,
    prestige: 11,
    palette: pal('#3a3d40', '#1c1e20', '#8d9296', '#2c2f32', '#c5c8cc', '#121416'),
  },
  MAPLE: {
    label: 'Maple',
    material: 'WOOD',
    cost: 210,
    prestige: 6,
    palette: pal('#e2b56a', '#a56b32', '#f8e2b8', '#c9843a', '#6b3e16', '#8a5a28'),
  },
  WALNUT: {
    label: 'Walnut',
    material: 'WOOD',
    cost: 250,
    prestige: 7,
    palette: pal('#6b3a22', '#3a1e12', '#c49a74', '#4a2818', '#e6c7a4', '#2a160e'),
  },
  CHERRY: {
    label: 'Cherry',
    material: 'WOOD',
    cost: 270,
    prestige: 8,
    palette: pal('#8d3b32', '#5a221c', '#e7a090', '#6e2e28', '#f0c2b4', '#3f1614'),
  },
  BAMBOO: {
    label: 'Bamboo',
    material: 'WOOD',
    cost: 180,
    prestige: 6,
    palette: pal('#d7c48a', '#a89058', '#f6efd4', '#cbb57a', '#6d7a48', '#8c7344'),
  },
  SABLE: {
    label: 'Sable wood',
    material: 'WOOD',
    cost: 290,
    prestige: 8,
    palette: pal('#3a2a22', '#1c1410', '#8a7264', '#2a1e18', '#d4b06a', '#120e0c'),
  },
  CERAMIC: {
    label: 'Ceramic',
    material: 'CERAMIC',
    cost: 200,
    prestige: 6,
    palette: pal('#f3efe8', '#d9d2c6', '#ffffff', '#e7e0d6', '#c4b8a8', '#b7ab9c'),
  },
  GLASS: {
    label: 'Glass',
    material: 'GLASS',
    cost: 330,
    prestige: 10,
    palette: pal('#f3e2c4', '#c9b48a', '#ffffff', '#e7d3a8', '#fffaf0', '#a89068'),
  },
  CORTEN: {
    label: 'Corten steel',
    material: 'STEEL',
    cost: 240,
    prestige: 8,
    palette: pal('#a85a32', '#6b3218', '#e0a070', '#8d4424', '#5c4030', '#4a2818'),
  },
  BIO: {
    label: 'Biodegradable',
    material: 'CERAMIC',
    cost: 140,
    prestige: 5,
    palette: pal('#f7f4ee', '#e4ddd2', '#ffffff', '#efeae2', '#cfc6b8', '#d9d2c6'),
  },
  GLAZE: {
    label: 'Gradient glaze',
    material: 'CERAMIC',
    cost: 230,
    prestige: 8,
    palette: pal('#e7fff6', '#7dcec4', '#ffffff', '#d6fff4', '#1f9d90', '#9fd4c8'),
  },
};

const BODY_MUL: Record<UrnBody, number> = {
  VASE: 1,
  CYLINDER: 0.9,
  CUBE: 0.86,
  CHEST: 1,
  ORB: 1.22,
  CAPSULE: 0.88,
  TEARDROP: 1.06,
};

const ACCENT_MUL: Record<UrnAccent, number> = {
  NONE: 1,
  BAND: 1.08,
  STRIPE: 1.1,
  ENGRAVED: 1.16,
  INLAY: 1.14,
};

const ACCENT_LABEL: Record<UrnAccent, string> = {
  NONE: 'Plain',
  BAND: 'Thin band',
  STRIPE: 'Paired stripes',
  ENGRAVED: 'Engraved lines',
  INLAY: 'Inlay',
};

const BODY_SILHOUETTE: Record<UrnBody, UrnSilhouette> = {
  VASE: 'VASE',
  CYLINDER: 'TOWER',
  CUBE: 'CUBE',
  CHEST: 'CUBE',
  ORB: 'CLASSIC',
  CAPSULE: 'KEEPSAKE',
  TEARDROP: 'TEAR',
};

export const URN_BODY_IDS: UrnBody[] = [
  'VASE',
  'CYLINDER',
  'CUBE',
  'CHEST',
  'ORB',
  'CAPSULE',
  'TEARDROP',
];

export const URN_LID_IDS: UrnLid[] = ['DISC', 'DOME', 'KNOB', 'FLUSH'];

export const URN_ACCENT_IDS: UrnAccent[] = [
  'BAND',
  'STRIPE',
  'ENGRAVED',
  'INLAY',
];

export const URN_FINISH_IDS = Object.keys(FINISH) as UrnFinishId[];

export const BEAUTIFY_COST: Record<BeautifyStep, number> = {
  band: 90,
  finish: 170,
  engrave: 130,
};

/** A different finish for a vessel that has no hand-named swap. */
const NEXT_FINISH: Record<UrnFinishId, UrnFinishId> = {
  BRUSHED_BRASS: 'GOLD',
  BRONZE: 'PEWTER',
  PEWTER: 'SILVER',
  SILVER: 'GOLD',
  GOLD: 'BRONZE',
  GUNMETAL: 'SILVER',
  MATTE_BLACK: 'GLOSS_BLACK',
  GLOSS_BLACK: 'GOLD',
  MATTE_WHITE: 'MARBLE_WHITE',
  MIDNIGHT_BLUE: 'SILVER',
  MARBLE_WHITE: 'MARBLE_BLACK_GOLD',
  MARBLE_BEIGE: 'MARBLE_WHITE',
  MARBLE_BLACK_GOLD: 'MARBLE_WHITE',
  GRANITE: 'MARBLE_BLACK_GOLD',
  MAPLE: 'WALNUT',
  WALNUT: 'CHERRY',
  CHERRY: 'WALNUT',
  BAMBOO: 'MAPLE',
  SABLE: 'CHERRY',
  CERAMIC: 'GLAZE',
  GLASS: 'SILVER',
  CORTEN: 'BRONZE',
  BIO: 'CERAMIC',
  GLAZE: 'MIDNIGHT_BLUE',
};

const RESALE_BONUS: Record<BeautifyStep, number> = {
  band: 200,
  finish: 380,
  engrave: 260,
};

interface ShopSpec {
  id: string;
  name: string;
  blurb: string;
  body: UrnBody;
  lid: UrnLid;
  accent: UrnAccent;
  finishId: UrnFinishId;
  setId: string;
  palette?: Partial<Palette>;
  material?: UrnMaterial;
  finishLabel?: string;
  decoration?: string;
  shop: 'always' | 'rare';
  rarity?: UrnRareRank;
  tone?: UrnRareTone;
  startHour?: number;
  stock?: number;
  hint?: string;
}

const SHOP: ShopSpec[] = [
  {
    id: 'urn_hearth_brass_column',
    name: 'Hearth Brass Column',
    blurb: 'A straight brushed-brass column with a flat disc lid.',
    body: 'CYLINDER',
    lid: 'DISC',
    accent: 'NONE',
    finishId: 'BRUSHED_BRASS',
    setId: 'columns',
    shop: 'always',
  },
  {
    id: 'urn_hollis_brass_vase',
    name: 'Hollis Brass Vase',
    blurb: 'A simple brass vase with a low dome lid.',
    body: 'VASE',
    lid: 'DOME',
    accent: 'NONE',
    finishId: 'BRUSHED_BRASS',
    setId: 'vases',
    shop: 'always',
  },
  {
    id: 'urn_atelier_gold_cube',
    name: 'Atelier Gold Cube',
    blurb: 'A brushed-gold cube with a flat lid.',
    body: 'CUBE',
    lid: 'DISC',
    accent: 'NONE',
    finishId: 'GOLD',
    setId: 'cubes',
    shop: 'always',
  },
  {
    id: 'urn_reed_mint_orb',
    name: 'Reed Mint Orb',
    blurb: 'A white-to-teal glazed sphere on a quiet foot.',
    body: 'ORB',
    lid: 'FLUSH',
    accent: 'NONE',
    finishId: 'GLAZE',
    setId: 'soft',
    shop: 'always',
  },
  {
    id: 'urn_hollis_walnut_chest',
    name: 'Hollis Walnut Chest',
    blurb: 'A walnut chest with a small knob on the lid.',
    body: 'CHEST',
    lid: 'KNOB',
    accent: 'NONE',
    finishId: 'WALNUT',
    setId: 'chests',
    shop: 'always',
  },
  {
    id: 'urn_ashwell_capsule',
    name: 'Ashwell Capsule',
    blurb: 'A matte-black capsule closed with a flush silver lid.',
    body: 'CAPSULE',
    lid: 'FLUSH',
    accent: 'NONE',
    finishId: 'MATTE_BLACK',
    setId: 'columns',
    palette: { lid: '#d5d8de', accent: '#eef2f6', base: '#4a5160' },
    shop: 'always',
  },
  {
    id: 'urn_parish_pewter_tear',
    name: 'Parish Pewter Tear',
    blurb: 'A pewter teardrop with a low dome.',
    body: 'TEARDROP',
    lid: 'DOME',
    accent: 'NONE',
    finishId: 'PEWTER',
    setId: 'soft',
    shop: 'always',
  },
  {
    id: 'urn_quiet_egg',
    name: 'Quiet Egg',
    blurb: 'A white ceramic egg with a flush seam.',
    body: 'CAPSULE',
    lid: 'FLUSH',
    accent: 'NONE',
    finishId: 'CERAMIC',
    setId: 'soft',
    shop: 'always',
  },
  {
    id: 'urn_parish_pewter_sleeve',
    name: 'Parish Pewter Sleeve',
    blurb: 'A pewter cylinder with one thin bright band.',
    body: 'CYLINDER',
    lid: 'FLUSH',
    accent: 'BAND',
    finishId: 'PEWTER',
    setId: 'columns',
    shop: 'always',
  },
  {
    id: 'urn_nightwell_blue_column',
    name: 'Nightwell Blue Column',
    blurb: 'Midnight-blue metal, closed with a dome.',
    body: 'CYLINDER',
    lid: 'DOME',
    accent: 'NONE',
    finishId: 'MIDNIGHT_BLUE',
    setId: 'columns',
    shop: 'always',
  },
  {
    id: 'urn_champagne_column',
    name: 'Champagne Column',
    blurb: 'A champagne glass column with an oak lid.',
    body: 'CYLINDER',
    lid: 'DOME',
    accent: 'NONE',
    finishId: 'GLASS',
    setId: 'columns',
    palette: { lid: '#c9843a', base: '#6b4423', accent: '#f3e2c4' },
    shop: 'always',
  },
  {
    id: 'urn_reed_green_capsule',
    name: 'Reed Green Capsule',
    blurb: 'A deep green capsule with a ribbed band.',
    body: 'CAPSULE',
    lid: 'DOME',
    accent: 'STRIPE',
    finishId: 'CERAMIC',
    setId: 'columns',
    decoration: 'Ribbed band',
    palette: pal('#2f6b4f', '#1a3d2c', '#8fbfa4', '#245c42', '#d7e6dc', '#143226'),
    shop: 'always',
  },
  {
    id: 'urn_vesper_silver_vase',
    name: 'Vesper Silver Vase',
    blurb: 'Brushed silver with a knob and two fine stripes.',
    body: 'VASE',
    lid: 'KNOB',
    accent: 'STRIPE',
    finishId: 'SILVER',
    setId: 'vases',
    shop: 'always',
  },
  {
    id: 'urn_marrow_line_vase',
    name: 'Marrow Line Vase',
    blurb: 'Bronze with three engraved lines and a small diamond.',
    body: 'VASE',
    lid: 'DOME',
    accent: 'ENGRAVED',
    finishId: 'BRONZE',
    setId: 'vases',
    shop: 'always',
  },
  {
    id: 'urn_quill_band_vase',
    name: 'Quill Band Vase',
    blurb: 'Silver body, gold lid, and one gold band.',
    body: 'VASE',
    lid: 'DISC',
    accent: 'BAND',
    finishId: 'SILVER',
    setId: 'vases',
    palette: { lid: '#e3c16a', accent: '#e6c36a' },
    decoration: 'Gold band',
    shop: 'always',
  },
  {
    id: 'urn_lumen_white_vase',
    name: 'Lumen White Vase',
    blurb: 'White marble with a quiet dome.',
    body: 'VASE',
    lid: 'DOME',
    accent: 'NONE',
    finishId: 'MARBLE_WHITE',
    setId: 'vases',
    shop: 'always',
  },
  {
    id: 'urn_marfil_quiet_vase',
    name: 'Marfil Quiet Vase',
    blurb: 'Warm beige marble, softly veined.',
    body: 'VASE',
    lid: 'DOME',
    accent: 'NONE',
    finishId: 'MARBLE_BEIGE',
    setId: 'vases',
    shop: 'always',
  },
  {
    id: 'urn_sunrise_maple_vase',
    name: 'Sunrise Maple Vase',
    blurb: 'Turned maple with a dark lid.',
    body: 'VASE',
    lid: 'DOME',
    accent: 'NONE',
    finishId: 'MAPLE',
    setId: 'vases',
    palette: { lid: '#3a2418' },
    shop: 'always',
  },
  {
    id: 'urn_garden_white_vessel',
    name: 'Garden White Vessel',
    blurb: 'A pale biodegradable vase with a flush lid.',
    body: 'VASE',
    lid: 'FLUSH',
    accent: 'NONE',
    finishId: 'BIO',
    setId: 'vases',
    shop: 'always',
  },
  {
    id: 'urn_garden_walnut_vessel',
    name: 'Garden Walnut Vessel',
    blurb: 'A walnut-toned biodegradable vase.',
    body: 'VASE',
    lid: 'FLUSH',
    accent: 'NONE',
    finishId: 'BIO',
    material: 'WOOD',
    finishLabel: 'Walnut biodegradable',
    setId: 'vases',
    palette: pal('#6b3a22', '#3a1e12', '#c49a74', '#4a2818', '#e6c7a4', '#2a160e'),
    shop: 'always',
  },
  {
    id: 'urn_reed_tide_vase',
    name: 'Reed Tide Vase',
    blurb: 'White glaze that cools to teal at the foot.',
    body: 'VASE',
    lid: 'DOME',
    accent: 'NONE',
    finishId: 'GLAZE',
    setId: 'vases',
    shop: 'always',
  },
  {
    id: 'urn_slate_gun_vase',
    name: 'Slate Gun Vase',
    blurb: 'A gunmetal vase with a plain dome.',
    body: 'VASE',
    lid: 'DOME',
    accent: 'NONE',
    finishId: 'GUNMETAL',
    setId: 'vases',
    shop: 'always',
  },
  {
    id: 'urn_atelier_silver_cube',
    name: 'Atelier Silver Cube',
    blurb: 'A brushed-silver cube with a flush lid.',
    body: 'CUBE',
    lid: 'FLUSH',
    accent: 'NONE',
    finishId: 'SILVER',
    setId: 'cubes',
    shop: 'always',
  },
  {
    id: 'urn_cinder_cube',
    name: 'Cinder Cube',
    blurb: 'A corten-steel cube, flush-lidded.',
    body: 'CUBE',
    lid: 'FLUSH',
    accent: 'NONE',
    finishId: 'CORTEN',
    setId: 'cubes',
    shop: 'always',
  },
  {
    id: 'urn_glacier_cube',
    name: 'Glacier Cube',
    blurb: 'A white marble cube with a flush lid.',
    body: 'CUBE',
    lid: 'FLUSH',
    accent: 'NONE',
    finishId: 'MARBLE_WHITE',
    setId: 'cubes',
    shop: 'always',
  },
  {
    id: 'urn_ink_bamboo_cube',
    name: 'Ink Bamboo Cube',
    blurb: 'Matte black with a narrow bamboo inlay.',
    body: 'CUBE',
    lid: 'DISC',
    accent: 'INLAY',
    finishId: 'MATTE_BLACK',
    setId: 'cubes',
    palette: { accent: '#d7c48a' },
    decoration: 'Bamboo inlay',
    shop: 'always',
  },
  {
    id: 'urn_sable_stripe_chest',
    name: 'Sable Stripe Chest',
    blurb: 'Sable wood with two gold stripes and a dome lid.',
    body: 'CHEST',
    lid: 'DOME',
    accent: 'STRIPE',
    finishId: 'SABLE',
    setId: 'chests',
    decoration: 'Gold stripes',
    shop: 'always',
  },
  {
    id: 'urn_keene_maple_chest',
    name: 'Keene Maple Chest',
    blurb: 'Pale maple with a walnut lid.',
    body: 'CHEST',
    lid: 'DISC',
    accent: 'NONE',
    finishId: 'MAPLE',
    setId: 'chests',
    palette: { lid: '#4a2818' },
    shop: 'always',
  },
  {
    id: 'urn_vesper_cherry_box',
    name: 'Vesper Cherry Box',
    blurb: 'Cherry wood with a small metal inlay.',
    body: 'CHEST',
    lid: 'FLUSH',
    accent: 'INLAY',
    finishId: 'CHERRY',
    setId: 'chests',
    palette: { accent: '#e6c36a' },
    shop: 'always',
  },
  {
    id: 'urn_reed_bamboo_box',
    name: 'Reed Bamboo Box',
    blurb: 'A bamboo box with a green inlay.',
    body: 'CHEST',
    lid: 'DISC',
    accent: 'INLAY',
    finishId: 'BAMBOO',
    setId: 'chests',
    shop: 'always',
  },
  {
    id: 'urn_parish_white_box',
    name: 'Parish White Box',
    blurb: 'A matte-white lacquer box with a flat lid.',
    body: 'CHEST',
    lid: 'DISC',
    accent: 'NONE',
    finishId: 'MATTE_WHITE',
    setId: 'chests',
    shop: 'always',
  },
  {
    id: 'urn_hearth_cocoon',
    name: 'Hearth Cocoon',
    blurb: 'A cream stone capsule, flush and quiet.',
    body: 'CAPSULE',
    lid: 'FLUSH',
    accent: 'NONE',
    finishId: 'MARBLE_BEIGE',
    finishLabel: 'Cream stone',
    setId: 'soft',
    shop: 'always',
  },
  {
    id: 'urn_keene_gold_column',
    name: 'Keene Gold Column',
    blurb: 'A brushed-gold column kept for the afternoon window.',
    body: 'CYLINDER',
    lid: 'DISC',
    accent: 'NONE',
    finishId: 'GOLD',
    setId: 'columns',
    shop: 'rare',
    rarity: 'RARE',
    tone: 'LIGHT',
    startHour: 13,
    stock: 1,
    hint: 'Brushed gold column — afternoon ~1:00 PM–3:00 PM.',
  },
  {
    id: 'urn_gilt_parish_orb',
    name: 'Gilt Parish Orb',
    blurb: 'A polished gold sphere on a low plinth.',
    body: 'ORB',
    lid: 'KNOB',
    accent: 'NONE',
    finishId: 'GOLD',
    setId: 'soft',
    shop: 'rare',
    rarity: 'LEGENDARY',
    tone: 'LIGHT',
    startHour: 16,
    stock: 1,
    hint: 'Gold sphere — afternoon ~4:00 PM–6:00 PM.',
  },
  {
    id: 'urn_nightwell_orb',
    name: 'Nightwell Orb',
    blurb: 'A deep blue sphere on a silver foot.',
    body: 'ORB',
    lid: 'DISC',
    accent: 'NONE',
    finishId: 'MIDNIGHT_BLUE',
    setId: 'soft',
    palette: {
      body: '#1a2140',
      bodyDeep: '#070814',
      highlight: '#9aa4d4',
      lid: '#cfd6ea',
      accent: '#e8ecff',
      base: '#c5ccd6',
    },
    finishLabel: 'Night glaze',
    shop: 'rare',
    rarity: 'RARE',
    tone: 'DARK',
    startHour: 22,
    stock: 1,
    hint: 'Dark sphere — late night ~10:00 PM–12:00 AM.',
  },
  {
    id: 'urn_lampblack_tear',
    name: 'Lampblack Tear',
    blurb: 'A gloss-black teardrop with a gold knob.',
    body: 'TEARDROP',
    lid: 'KNOB',
    accent: 'NONE',
    finishId: 'GLOSS_BLACK',
    setId: 'soft',
    palette: { lid: '#e3c16a', accent: '#f0d78a' },
    shop: 'rare',
    rarity: 'LEGENDARY',
    tone: 'DARK',
    startHour: 0,
    stock: 1,
    hint: 'Black teardrop — midnight ~12:00 AM–2:00 AM.',
  },
  {
    id: 'urn_inkvein_vase',
    name: 'Inkvein Vase',
    blurb: 'Black marble with a gold vein and a dome lid.',
    body: 'VASE',
    lid: 'DOME',
    accent: 'NONE',
    finishId: 'MARBLE_BLACK_GOLD',
    setId: 'vases',
    shop: 'rare',
    rarity: 'RARE',
    tone: 'DARK',
    startHour: 21,
    stock: 1,
    hint: 'Black marble, gold vein — evening ~9:00 PM–11:00 PM.',
  },
  {
    id: 'urn_onyx_band_vase',
    name: 'Onyx Band Vase',
    blurb: 'Gloss black with one gold band.',
    body: 'VASE',
    lid: 'DOME',
    accent: 'BAND',
    finishId: 'GLOSS_BLACK',
    setId: 'vases',
    decoration: 'Gold band',
    shop: 'rare',
    rarity: 'RARE',
    tone: 'DARK',
    startHour: 3,
    stock: 1,
    hint: 'Black vase, gold band — ~3:00 AM–5:00 AM.',
  },
  {
    id: 'urn_orca_cube',
    name: 'Orca Cube',
    blurb: 'A black granite cube with a flat lid.',
    body: 'CUBE',
    lid: 'DISC',
    accent: 'NONE',
    finishId: 'GRANITE',
    setId: 'cubes',
    shop: 'rare',
    rarity: 'UNCOMMON',
    tone: 'DARK',
    startHour: 23,
    stock: 2,
    hint: 'Black granite cube — ~11:00 PM–1:00 AM.',
  },
  {
    id: 'urn_white_vein_vase',
    name: 'White Vein Vase',
    blurb: 'Black marble cut by a white vein.',
    body: 'VASE',
    lid: 'DOME',
    accent: 'NONE',
    finishId: 'MARBLE_BLACK_GOLD',
    finishLabel: 'Black marble, white vein',
    setId: 'vases',
    palette: { accent: '#f5f5f4', highlight: '#d6d3d1' },
    shop: 'rare',
    rarity: 'UNCOMMON',
    tone: 'DARK',
    startHour: 4,
    stock: 1,
    hint: 'Black marble, white vein — ~4:00 AM–6:00 AM.',
  },
];

interface FinishSwap {
  id: string;
  name: string;
  finishId: UrnFinishId;
  palette?: Partial<Palette>;
  material?: UrnMaterial;
  finishLabel?: string;
}

const FINISH_SWAP: Record<string, FinishSwap> = {
  urn_hearth_brass_column: {
    id: 'urn_hearth_gold_column',
    name: 'Hearth Gold Column',
    finishId: 'GOLD',
  },
  urn_hollis_brass_vase: {
    id: 'urn_hollis_pewter_vase',
    name: 'Hollis Pewter Vase',
    finishId: 'PEWTER',
  },
  urn_atelier_silver_cube: {
    id: 'urn_atelier_gilt_cube',
    name: 'Atelier Gilt Cube',
    finishId: 'GOLD',
  },
  urn_hollis_walnut_chest: {
    id: 'urn_hollis_cherry_chest',
    name: 'Hollis Cherry Chest',
    finishId: 'CHERRY',
  },
  urn_lumen_white_vase: {
    id: 'urn_lumen_night_marble',
    name: 'Lumen Night Marble',
    finishId: 'MARBLE_BLACK_GOLD',
  },
  urn_quiet_egg: {
    id: 'urn_quiet_tide_egg',
    name: 'Quiet Tide Egg',
    finishId: 'GLAZE',
  },
};

function stepsFor(base: UrnCatalogEntry): BeautifyStep[] {
  const accent = base.modular?.accent ?? 'NONE';
  const steps: BeautifyStep[] = [];
  if (accent !== 'BAND') steps.push('band');
  steps.push('finish');
  if (accent !== 'ENGRAVED') steps.push('engrave');
  return steps;
}

function pal(
  body: string,
  bodyDeep: string,
  highlight: string,
  lid: string,
  accent: string,
  base: string
): Palette {
  return { body, bodyDeep, highlight, lid, accent, base };
}

function money(n: number): number {
  return Math.max(40, Math.round(n));
}

function shopEntry(spec: ShopSpec): UrnCatalogEntry {
  const finish = FINISH[spec.finishId];
  const rareMul =
    spec.rarity === 'LEGENDARY' ? 1.55 : spec.rarity === 'RARE' ? 1.25 : spec.rarity === 'UNCOMMON' ? 1.1 : 1;
  const cost = money(
    finish.cost * BODY_MUL[spec.body] * ACCENT_MUL[spec.accent] * rareMul
  );
  const prestige = Math.min(
    18,
    finish.prestige +
      (spec.accent === 'NONE' ? 0 : 1) +
      (spec.rarity === 'LEGENDARY' ? 3 : spec.rarity === 'RARE' ? 2 : 0)
  );
  const reputationRequired = spec.rarity === 'LEGENDARY' ? 110 : spec.rarity === 'RARE' ? 40 : 0;
  return {
    id: spec.id,
    name: spec.name,
    material: spec.material ?? finish.material,
    silhouette: BODY_SILHOUETTE[spec.body],
    finish: spec.finishLabel ?? finish.label,
    decoration: spec.decoration ?? ACCENT_LABEL[spec.accent],
    blurb: spec.blurb,
    cost,
    resaleValue: money(cost * 2.35),
    prestigeBonus: prestige,
    reputationRequired,
    palette: { ...finish.palette, ...spec.palette },
    modular: {
      body: spec.body,
      lid: spec.lid,
      accent: spec.accent,
      finishId: spec.finishId,
    },
    lineId: spec.id,
    setId: spec.setId,
  };
}

function workshopFrom(base: UrnCatalogEntry, step: BeautifyStep): UrnCatalogEntry {
  const modular = base.modular;
  if (!modular) throw new Error(base.id);
  const swap = FINISH_SWAP[base.id];
  let id = `${base.id}_banded`;
  let name = `${base.name}, Banded`;
  let finishId = modular.finishId;
  let accent: UrnAccent = 'BAND';
  let palette: Palette = {
    ...base.palette,
    accent: base.palette.body === '#e3c16a' ? '#f8fafc' : '#e6c36a',
  };
  let material = base.material;
  let finish = base.finish;
  let decoration = 'Thin band';
  if (step === 'engrave') {
    id = `${base.id}_engraved`;
    name = `${base.name}, Engraved`;
    accent = 'ENGRAVED';
    palette = { ...base.palette, accent: base.palette.highlight };
    decoration = 'Engraved lines';
  } else if (step === 'finish') {
    const finishKey = swap?.finishId ?? NEXT_FINISH[modular.finishId];
    const next = FINISH[finishKey];
    id = swap?.id ?? `${base.id}_refinished`;
    name = swap?.name ?? `${base.name}, ${next.label}`;
    finishId = finishKey;
    accent = modular.accent;
    palette = { ...next.palette, ...swap?.palette };
    material = swap?.material ?? next.material;
    finish = swap?.finishLabel ?? next.label;
    decoration = ACCENT_LABEL[accent];
  }
  return {
    ...base,
    id,
    name,
    material,
    finish,
    decoration,
    blurb:
      step === 'finish'
        ? `${name} is the refinished form of ${base.name}.`
        : step === 'band'
          ? `A thin band added to ${base.name}.`
          : `Engraved lines added to ${base.name}.`,
    cost: base.cost + BEAUTIFY_COST[step],
    resaleValue: base.resaleValue + RESALE_BONUS[step],
    prestigeBonus: Math.min(18, base.prestigeBonus + 2),
    palette,
    modular: { ...modular, finishId, accent },
    workshopOnly: true,
    lineId: base.lineId ?? base.id,
  };
}

const SHOP_ENTRIES = SHOP.map(shopEntry);

const RECIPES: Record<string, Partial<Record<BeautifyStep, string>>> = {};

const WORKSHOP_ENTRIES: UrnCatalogEntry[] = SHOP_ENTRIES.flatMap((base) =>
  stepsFor(base).map((step) => {
    const made = workshopFrom(base, step);
    RECIPES[base.id] = { ...RECIPES[base.id], [step]: made.id };
    return made;
  })
);

export const MODERN_URNS: UrnCatalogEntry[] = [...SHOP_ENTRIES, ...WORKSHOP_ENTRIES];

export const MODERN_ALWAYS_IDS: string[] = SHOP.filter((spec) => spec.shop === 'always').map(
  (spec) => spec.id
);

export const MODERN_URN_RARES: Array<{
  id: string;
  rarity: UrnRareRank;
  tone: UrnRareTone;
  startHour: number;
  stock: number;
  hint: string;
}> = SHOP.filter((spec) => spec.shop === 'rare').map((spec) => ({
  id: spec.id,
  rarity: spec.rarity ?? 'RARE',
  tone: spec.tone ?? 'LIGHT',
  startHour: spec.startHour ?? 0,
  stock: spec.stock ?? 1,
  hint: spec.hint ?? spec.name,
}));

const SET_META: Array<{ id: string; name: string; blurb: string }> = [
  {
    id: 'columns',
    name: 'Quiet Columns',
    blurb: 'Cylinders and upright capsules.',
  },
  {
    id: 'vases',
    name: 'Still Vases',
    blurb: 'Classic vases in metal, stone, wood, and glaze.',
  },
  {
    id: 'cubes',
    name: 'Cube Atelier',
    blurb: 'Square vessels in metal, stone, and inlay.',
  },
  {
    id: 'chests',
    name: 'Parish Chests',
    blurb: 'Boxes and chests in wood and lacquer.',
  },
  {
    id: 'soft',
    name: 'Soft Forms',
    blurb: 'Orbs, eggs, cocoons, and teardrops.',
  },
];

export interface UrnSet {
  id: string;
  name: string;
  blurb: string;
  memberIds: string[];
}

export const URN_SETS: UrnSet[] = SET_META.map((meta) => ({
  ...meta,
  memberIds: SHOP_ENTRIES.filter((entry) => entry.setId === meta.id).map(
    (entry) => entry.lineId ?? entry.id
  ),
}));

export function beautifyTarget(
  urnId: string,
  step: BeautifyStep
): { resultId: string; cost: number } | null {
  const resultId = RECIPES[urnId]?.[step];
  if (!resultId) return null;
  return { resultId, cost: BEAUTIFY_COST[step] };
}

export function urnSetProgress(
  set: UrnSet,
  inventory: Record<string, number>
): { owned: number; total: number } {
  const owned = set.memberIds.filter((lineId) =>
    MODERN_URNS.some(
      (urn) => (urn.lineId ?? urn.id) === lineId && (inventory[urn.id] ?? 0) > 0
    )
  ).length;
  return { owned, total: set.memberIds.length };
}
