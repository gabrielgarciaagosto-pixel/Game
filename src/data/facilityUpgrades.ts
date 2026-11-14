/**
 * Permanent tiered facility upgrades sold in the Funerary Emporium.
 *
 * Collection gates are OWNERSHIP-ONLY: required urns/caskets must be in the
 * player's collection (count ≥ 1). Buying an upgrade NEVER consumes them.
 */

export type FacilityUpgradeId =
  | 'cooler_bays'
  | 'cremulator'
  | 'crematory'
  | 'embalming'
  | 'vault';

export type CollectionReq =
  | { kind: 'urn'; id: string; label: string }
  | { kind: 'casket'; id: string; label: string };

export interface FacilityTier {
  tier: number;
  cost: number;
  label: string;
  effect: string;
  /** Must own these — not consumed on purchase */
  requires: CollectionReq[];
}

export interface FacilityUpgradeDef {
  id: FacilityUpgradeId;
  name: string;
  blurb: string;
  tiers: FacilityTier[];
}

export const FACILITY_UPGRADES: FacilityUpgradeDef[] = [
  {
    id: 'cooler_bays',
    name: 'Cooler Expansion',
    blurb: 'Add refrigeration bays beyond the starter six.',
    tiers: [
      {
        tier: 1,
        cost: 450,
        label: 'Bay +2',
        effect: '8 cooler bays',
        requires: [],
      },
      {
        tier: 2,
        cost: 900,
        label: 'Bay +4',
        effect: '10 cooler bays',
        requires: [],
      },
      {
        tier: 3,
        cost: 1600,
        label: 'Bay +6',
        effect: '12 cooler bays',
        requires: [],
      },
    ],
  },
  {
    id: 'cremulator',
    name: 'Cremulator Refit',
    blurb: 'Faster processing and tougher against implant strikes.',
    tiers: [
      {
        tier: 1,
        cost: 500,
        label: 'Hardened Drum',
        effect: '50% less damage chance',
        requires: [
          { kind: 'urn', id: 'urn_carrara_classic', label: 'Carrara Classic' },
        ],
      },
      {
        tier: 2,
        cost: 1100,
        label: 'Dual Mill',
        effect: '+25% fill speed, rare damage',
        requires: [
          { kind: 'urn', id: 'urn_bronze_laurel', label: 'Bronze Laurel' },
          { kind: 'urn', id: 'urn_carrara_classic', label: 'Carrara Classic' },
        ],
      },
      {
        tier: 3,
        cost: 2000,
        label: 'Industrial Mill',
        effect: '+50% fill speed, near-immune',
        requires: [
          { kind: 'urn', id: 'urn_gunmetal_tower', label: 'Gunmetal Tower' },
          { kind: 'urn', id: 'urn_rose_bronze_vase', label: 'Rose Bronze Vase' },
          {
            kind: 'urn',
            id: 'urn_porcelain_night',
            label: 'Porcelain Night',
          },
        ],
      },
    ],
  },
  {
    id: 'crematory',
    name: 'Retort Efficiency',
    blurb: 'Shorter burns on the Millennium retort.',
    tiers: [
      {
        tier: 1,
        cost: 550,
        label: 'Tuned Jets',
        effect: 'Burns ~12% faster',
        requires: [
          { kind: 'urn', id: 'urn_walnut_pillar', label: 'Walnut Pillar' },
        ],
      },
      {
        tier: 2,
        cost: 1200,
        label: 'Recirc Stack',
        effect: 'Burns ~22% faster',
        requires: [
          { kind: 'urn', id: 'urn_bronze_laurel', label: 'Bronze Laurel' },
          { kind: 'urn', id: 'urn_nero_marquina', label: 'Nero Marquina' },
        ],
      },
      {
        tier: 3,
        cost: 2200,
        label: 'Afterburner Kit',
        effect: 'Burns ~35% faster',
        requires: [
          { kind: 'urn', id: 'urn_amber_glass', label: 'Amber Glass' },
          { kind: 'urn', id: 'urn_slate_temple', label: 'Slate Temple' },
          {
            kind: 'urn',
            id: 'urn_verdigris_tear',
            label: 'Verdigris Tear',
          },
        ],
      },
    ],
  },
  {
    id: 'embalming',
    name: 'Embalming Bench',
    blurb: 'Better tools nudge grade outcomes upward.',
    tiers: [
      {
        tier: 1,
        cost: 400,
        label: 'Precision Needles',
        effect: '+8% grade weight',
        requires: [
          {
            kind: 'casket',
            id: 'casket_pine_tapered',
            label: 'Country Pine Tapered',
          },
        ],
      },
      {
        tier: 2,
        cost: 950,
        label: 'Arterial Pump Mk II',
        effect: '+16% grade weight',
        requires: [
          {
            kind: 'casket',
            id: 'casket_oak_half',
            label: 'Heritage Oak Half-Couch',
          },
          {
            kind: 'casket',
            id: 'casket_cherry_panel',
            label: 'Cherry Panel Couch',
          },
        ],
      },
      {
        tier: 3,
        cost: 1750,
        label: 'Full Prep Suite',
        effect: '+25% grade weight',
        requires: [
          {
            kind: 'casket',
            id: 'casket_mahogany_full',
            label: 'Mahogany Full-Couch',
          },
          {
            kind: 'casket',
            id: 'casket_bronze_octagon',
            label: 'Cast Bronze Octagon',
          },
          {
            kind: 'casket',
            id: 'casket_walnut_dome',
            label: 'Black Walnut Dome',
          },
        ],
      },
    ],
  },
  {
    id: 'vault',
    name: 'Urn Vault Galleries',
    blurb: 'More display niches for finished vessels.',
    tiers: [
      {
        tier: 1,
        cost: 350,
        label: 'Side Niche',
        effect: 'Vault slots 8',
        requires: [],
      },
      {
        tier: 2,
        cost: 800,
        label: 'Double Gallery',
        effect: 'Vault slots 12',
        requires: [
          { kind: 'urn', id: 'urn_celadon_vase', label: 'Celadon Vase' },
        ],
      },
      {
        tier: 3,
        cost: 1500,
        label: 'Grand Columbarium',
        effect: 'Vault slots 18',
        requires: [
          { kind: 'urn', id: 'urn_porcelain_lotus', label: 'Porcelain Lotus' },
          { kind: 'urn', id: 'urn_smoke_glass_tear', label: 'Smoke Glass Tear' },
        ],
      },
    ],
  },
];

export type FacilityUpgradeLevels = Record<FacilityUpgradeId, number>;

export const DEFAULT_FACILITY_LEVELS: FacilityUpgradeLevels = {
  cooler_bays: 0,
  cremulator: 0,
  crematory: 0,
  embalming: 0,
  vault: 0,
};

export function coolerBayCapacity(level: number): number {
  return 6 + level * 2;
}

export function vaultSlotCapacity(level: number): number {
  if (level <= 0) return 5;
  if (level === 1) return 8;
  if (level === 2) return 12;
  return 18;
}

export function crematoryBurnSpeed(level: number): number {
  if (level <= 0) return 1;
  if (level === 1) return 1.12;
  if (level === 2) return 1.22;
  return 1.35;
}

export function cremulatorSpeed(level: number): number {
  if (level <= 0) return 1;
  if (level === 1) return 1.1;
  if (level === 2) return 1.25;
  return 1.5;
}

export function cremulatorDamageChance(level: number): number {
  if (level <= 0) return 0.35;
  if (level === 1) return 0.18;
  if (level === 2) return 0.08;
  return 0.02;
}

export function embalmingGradeBoost(level: number): number {
  if (level <= 0) return 0;
  if (level === 1) return 0.08;
  if (level === 2) return 0.16;
  return 0.25;
}

export function nextFacilityTier(
  id: FacilityUpgradeId,
  currentLevel: number
): FacilityTier | null {
  const def = FACILITY_UPGRADES.find((u) => u.id === id);
  if (!def) return null;
  return def.tiers.find((t) => t.tier === currentLevel + 1) ?? null;
}

/** Ownership check — never consumes inventory. */
export function missingCollectionReqs(
  requires: CollectionReq[],
  urnInventory: Record<string, number>,
  casketInventory: Record<string, number>
): CollectionReq[] {
  return requires.filter((r) => {
    if (r.kind === 'urn') return (urnInventory[r.id] ?? 0) < 1;
    return (casketInventory[r.id] ?? 0) < 1;
  });
}
