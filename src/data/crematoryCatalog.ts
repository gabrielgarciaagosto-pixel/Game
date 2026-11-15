import type { Rank } from '../types/game';
import { crematoryBurnSpeed } from './facilityUpgrades';

/** House-owned cosmetics. The stock Millennium pieces start unlocked. */
export type RetortBrandId =
  | 'millennium'
  | 'parish_steel'
  | 'hearthline'
  | 'keene_brass';

export type RetortDoorId = 'zinc' | 'oxide' | 'chapel_black' | 'bone';

export type RetortButtonStyleId = 'millennium' | 'brass' | 'touch' | 'dial';

export interface CrematoryWardrobe {
  brands: RetortBrandId[];
  doors: RetortDoorId[];
  buttons: RetortButtonStyleId[];
}

/** Equipment and cosmetics on one chamber. The machine state stays separate. */
export interface RetortBay {
  speedTier: number;
  qualityTier: number;
  fuelTier: number;
  preheat: boolean;
  queueSlot: boolean;
  queueCaseId: string | null;
  brand: RetortBrandId;
  door: RetortDoorId;
  buttons: RetortButtonStyleId;
}

export const DEFAULT_WARDROBE: CrematoryWardrobe = {
  brands: ['millennium'],
  doors: ['zinc'],
  buttons: ['millennium'],
};

export function defaultRetortBay(): RetortBay {
  return {
    speedTier: 0,
    qualityTier: 0,
    fuelTier: 0,
    preheat: false,
    queueSlot: false,
    queueCaseId: null,
    brand: 'millennium',
    door: 'zinc',
    buttons: 'millennium',
  };
}

export const SPEED_TIERS = [
  {
    tier: 1,
    name: 'Burner jets',
    price: 700,
    flavor: 'A wider jet pack. The charge takes the heat sooner.',
  },
  {
    tier: 2,
    name: 'Insulation pack',
    price: 1400,
    flavor: 'The brick holds what the jets spent.',
  },
  {
    tier: 3,
    name: 'Controller',
    price: 2400,
    flavor: 'The set point stops hunting, so the clock does too.',
  },
  {
    tier: 4,
    name: 'Afterburner',
    price: 3800,
    flavor: 'A second throat on the stack. The middle of the burn shortens.',
  },
  {
    tier: 5,
    name: 'Closed loop',
    price: 5600,
    flavor: 'Heat that leaves the stack comes back in.',
  },
] as const;

export const QUALITY_TIERS = [
  {
    tier: 1,
    name: 'Processor',
    price: 900,
    flavor: 'A finer grind on the way out. Families notice the color of the ash.',
  },
  {
    tier: 2,
    name: 'Cooling',
    price: 1800,
    flavor: 'A slower cool-down. Less clinker, fewer poor trays.',
  },
  {
    tier: 3,
    name: 'Filtration',
    price: 3200,
    flavor: 'The stack scrubs the draft. The cremains come back cleaner.',
  },
] as const;

export const FUEL_TIERS = [
  {
    tier: 1,
    name: 'Metered gas',
    price: 600,
    flavor: 'The jets stop flooding the cold start.',
  },
  {
    tier: 2,
    name: 'Recuperator',
    price: 1200,
    flavor: 'Exhaust warms the intake. The invoice shrinks.',
  },
  {
    tier: 3,
    name: 'Lean fire',
    price: 2200,
    flavor: 'The same chamber, less gas per case.',
  },
] as const;

export const PREHEAT_PRICE = 1600;
export const QUEUE_PRICE = 2100;

export interface CosmeticOffer<T extends string> {
  id: T;
  name: string;
  price: number;
  flavor: string;
}

export const BRAND_OFFERS: CosmeticOffer<RetortBrandId>[] = [
  {
    id: 'parish_steel',
    name: 'Parish Plate',
    price: 450,
    flavor: 'Cheap steel and a stenciled name. It still holds a fire.',
  },
  {
    id: 'hearthline',
    name: 'Hearthline',
    price: 1400,
    flavor: 'Polished industrial plate. Cool silver, no extra brass.',
  },
  {
    id: 'keene_brass',
    name: 'Keene Brassworks',
    price: 2800,
    flavor: 'Premium brass on a black door. A plate the family can see.',
  },
];

export const DOOR_OFFERS: CosmeticOffer<RetortDoorId>[] = [
  {
    id: 'oxide',
    name: 'Oxide red',
    price: 220,
    flavor: 'A shop-red door panel. The refractory behind it does not change.',
  },
  {
    id: 'chapel_black',
    name: 'Chapel black',
    price: 380,
    flavor: 'Black panels, same hinges, same travel.',
  },
  {
    id: 'bone',
    name: 'Bone white',
    price: 520,
    flavor: 'A pale enamel. It shows the soot, which some houses want.',
  },
];

export const BUTTON_OFFERS: CosmeticOffer<RetortButtonStyleId>[] = [
  {
    id: 'brass',
    name: 'Brass toggles',
    price: 640,
    flavor: 'Heavy brass caps on the same start and stop.',
  },
  {
    id: 'touch',
    name: 'Glossy touch panel',
    price: 880,
    flavor: 'A glass face. The contacts underneath are the old ones.',
  },
  {
    id: 'dial',
    name: 'Vintage dial',
    price: 760,
    flavor: 'Cream faces and a black rim, like a radio from the back room.',
  },
];

/** Each speed tier leaves 85% of the previous burn time. */
export function speedTimeFraction(tier: number): number {
  return Math.pow(0.85, Math.max(0, Math.min(5, tier)));
}

/** Elapsed-time multiplier. House Retort Efficiency still applies. */
export function retortSpeedFactor(houseLevel: number, speedTier: number): number {
  return crematoryBurnSpeed(houseLevel) / speedTimeFraction(speedTier);
}

export function cremainsQualityScore(tier: number): number {
  return 42 + Math.max(0, Math.min(3, tier)) * 14;
}

const RANK_LIFT: Rank[] = ['F', 'C', 'B', 'A', 'S', 'S+'];

/** A quality tier nudges a poor result up one step. S and S+ stay put. */
export function liftPoorRank(rank: Rank, qualityTier: number): Rank {
  let next = rank;
  const steps = qualityTier >= 3 ? 3 : qualityTier >= 2 ? 2 : qualityTier >= 1 ? 1 : 0;
  for (let i = 0; i < steps; i++) {
    if (next === 'S' || next === 'S+' || next === 'A') break;
    const at = RANK_LIFT.indexOf(next);
    if (at < 0 || at >= RANK_LIFT.length - 1) break;
    next = RANK_LIFT[at + 1]!;
  }
  return next;
}

/**
 * Metered gas per firing. The first plan is the one a new house feels.
 * Later plans shrink the bill further; the payout also carries a fuel-plan
 * bonus so the dearer steps still return in a handful of cases.
 */
export function fuelCostFor(tier: number): number {
  const costs = [180, 60, 30, 12];
  const i = Math.max(0, Math.min(costs.length - 1, tier));
  return costs[i] ?? 180;
}

/** Dollars already taken off the balance for this firing. Never a later quote. */
export function fuelMemoDollars(
  charged: number | null | undefined,
  tier: number
): number {
  if (typeof charged === 'number' && Number.isFinite(charged) && charged >= 0) {
    return Math.round(charged);
  }
  return fuelCostFor(tier);
}

/** Extra cash at the service for fuel plans past the first. Tier 0 and 1 pay through the meter alone. */
export function fuelPlanBonus(tier: number): number {
  const bonus = [0, 0, 150, 410];
  const i = Math.max(0, Math.min(bonus.length - 1, tier));
  return bonus[i] ?? 0;
}

/** Cash a speed tier adds on a finished cremation. Each step returns its price in about 4–8 cases. */
export function speedCaseBonus(tier: number): number {
  const total = [0, 175, 455, 855, 1395, 2095];
  const i = Math.max(0, Math.min(total.length - 1, tier));
  return total[i] ?? 0;
}

/**
 * Cash on top of the cremains tip. Combined with score × 1.6, a quality
 * step returns its price in about 4–6 cases.
 */
export function qualityCaseBonus(tier: number): number {
  const extra = [0, 160, 450, 960];
  const i = Math.max(0, Math.min(extra.length - 1, tier));
  return extra[i] ?? 0;
}

export function preheatCaseBonus(owned: boolean): number {
  return owned ? 340 : 0;
}

export function queueCaseBonus(owned: boolean): number {
  return owned ? 400 : 0;
}

/** Second chamber, then the third. The stock single retort adds nothing. */
export function retortBayCaseBonus(count: number): number {
  if (count >= 3) return 1950;
  if (count >= 2) return 800;
  return 0;
}

export function purgeMsFor(baseMs: number, preheat: boolean): number {
  return preheat ? Math.round(baseMs * 0.55) : baseMs;
}

export function brandLabel(id: RetortBrandId): string {
  if (id === 'parish_steel') return 'Parish Plate';
  if (id === 'hearthline') return 'Hearthline';
  if (id === 'keene_brass') return 'Keene Brassworks';
  return 'Millennium';
}

export function doorLabel(id: RetortDoorId): string {
  if (id === 'oxide') return 'Oxide red';
  if (id === 'chapel_black') return 'Chapel black';
  if (id === 'bone') return 'Bone white';
  return 'Mill zinc';
}

export function buttonLabel(id: RetortButtonStyleId): string {
  if (id === 'brass') return 'Brass toggles';
  if (id === 'touch') return 'Glossy touch panel';
  if (id === 'dial') return 'Vintage dial';
  return 'Millennium pushbuttons';
}

/** Door face. Zinc is the stock gradient the chamber already uses. */
export function doorFace(id: RetortDoorId): string | null {
  if (id === 'oxide') {
    return 'linear-gradient(90deg, #4a1c14 0%, #9a3412 12%, #fdba74 22%, #7c2d12 48%, #fed7aa 54%, #431407 80%, #1c0a08 100%)';
  }
  if (id === 'chapel_black') {
    return 'linear-gradient(90deg, #0c0c0e 0%, #3f3f46 10%, #a1a1aa 20%, #18181b 46%, #d4d4d8 52%, #27272a 78%, #09090b 100%)';
  }
  if (id === 'bone') {
    return 'linear-gradient(90deg, #6b6256 0%, #e7e0d4 12%, #fffaf3 22%, #c4b8a8 48%, #f5f0e8 54%, #8a7e6e 78%, #3f3830 100%)';
  }
  return null;
}

export function panelChrome(id: RetortButtonStyleId): string | null {
  if (id === 'brass') {
    return 'bg-gradient-to-b from-[#e6c98a] via-[#b08948] to-[#6b4e16] border-2 border-[#3d2a0c] text-[#1a140c]';
  }
  if (id === 'touch') {
    return 'bg-gradient-to-b from-slate-800 via-slate-950 to-black border border-cyan-300/40 text-cyan-50 shadow-[inset_0_0_24px_rgba(34,211,238,0.15)]';
  }
  if (id === 'dial') {
    return 'bg-gradient-to-b from-[#5c4632] via-[#3a2a1c] to-[#1c120c] border-2 border-[#1a1008] text-[#f3e6d0]';
  }
  return null;
}

export function normalizeWardrobe(raw: unknown): CrematoryWardrobe {
  const w = (raw ?? {}) as Partial<CrematoryWardrobe>;
  const brands = Array.isArray(w.brands) ? w.brands.filter(Boolean) : [];
  const doors = Array.isArray(w.doors) ? w.doors.filter(Boolean) : [];
  const buttons = Array.isArray(w.buttons) ? w.buttons.filter(Boolean) : [];
  return {
    brands: Array.from(new Set(['millennium', ...(brands as RetortBrandId[])])),
    doors: Array.from(new Set(['zinc', ...(doors as RetortDoorId[])])),
    buttons: Array.from(
      new Set(['millennium', ...(buttons as RetortButtonStyleId[])])
    ),
  };
}

export function normalizeBay(raw: unknown): RetortBay {
  const b = (raw ?? {}) as Partial<RetortBay>;
  const base = defaultRetortBay();
  return {
    ...base,
    speedTier: clampTier(b.speedTier, 5),
    qualityTier: clampTier(b.qualityTier, 3),
    fuelTier: clampTier(b.fuelTier, 3),
    preheat: b.preheat === true,
    queueSlot: b.queueSlot === true,
    queueCaseId: typeof b.queueCaseId === 'string' ? b.queueCaseId : null,
    brand: (b.brand as RetortBrandId) || 'millennium',
    door: (b.door as RetortDoorId) || 'zinc',
    buttons: (b.buttons as RetortButtonStyleId) || 'millennium',
  };
}

function clampTier(n: unknown, max: number): number {
  const v = typeof n === 'number' ? n : 0;
  return Math.max(0, Math.min(max, Math.round(v)));
}
