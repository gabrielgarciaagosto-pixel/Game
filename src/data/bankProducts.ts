import { FAMILY_HOUR_MS } from './bankForeclosure';
import { US_JURISDICTIONS } from './usPlaces';

/** Personal / working-capital loan products at First National Mortuary Bank. */
export interface BankLoanProduct {
  id: string;
  name: string;
  principal: number;
  /** Family hours until maturity / full term */
  termFamilyHours: number;
  /** Nominal APR % for display */
  aprPct: number;
  /** Family hours between installment due dates */
  paymentEveryFamilyHours: number;
  /** Fixed installment amount */
  paymentAmount: number;
}

export const BANK_LOAN_PRODUCTS: readonly BankLoanProduct[] = [
  {
    id: 'loan_float_5k',
    name: 'Working Float — $5,000',
    principal: 5000,
    termFamilyHours: 48,
    aprPct: 9.5,
    paymentEveryFamilyHours: 8,
    paymentAmount: 920,
  },
  {
    id: 'loan_bridge_12k',
    name: 'Bridge Line — $12,000',
    principal: 12000,
    termFamilyHours: 72,
    aprPct: 11.25,
    paymentEveryFamilyHours: 12,
    paymentAmount: 2150,
  },
  {
    id: 'loan_expansion_25k',
    name: 'Expansion Note — $25,000',
    principal: 25000,
    termFamilyHours: 120,
    aprPct: 13.5,
    paymentEveryFamilyHours: 16,
    paymentAmount: 3900,
  },
] as const;

export type ActiveLoanKind = 'PERSONAL' | 'MORTGAGE';

export interface ActiveBankLoan {
  id: string;
  kind: ActiveLoanKind;
  productId: string | null;
  label: string;
  principalRemaining: number;
  paymentAmount: number;
  paymentEveryMs: number;
  nextPaymentDueAt: number;
  aprPct: number;
  missedPayments: number;
  /** Property listing id when mortgage */
  propertyId?: string;
}

export function loanProductById(id: string): BankLoanProduct | undefined {
  return BANK_LOAN_PRODUCTS.find((p) => p.id === id);
}

export function makePersonalLoan(
  product: BankLoanProduct,
  nowMs: number
): ActiveBankLoan {
  return {
    id: `loan_${product.id}_${nowMs}`,
    kind: 'PERSONAL',
    productId: product.id,
    label: product.name,
    principalRemaining: product.principal,
    paymentAmount: product.paymentAmount,
    paymentEveryMs: product.paymentEveryFamilyHours * FAMILY_HOUR_MS,
    nextPaymentDueAt: nowMs + product.paymentEveryFamilyHours * FAMILY_HOUR_MS,
    aprPct: product.aprPct,
    missedPayments: 0,
  };
}

export interface PropertyListing {
  id: string;
  city: string;
  stateCode: string;
  stateName: string;
  label: string;
  price: number;
  /** Total facility space units */
  space: number;
  /** Multiplier on intake / client arrival cadence (1 = baseline) */
  clientFlow: number;
  /** Multiplier on service sales / tips */
  salesMult: number;
  /** Flat reputation on purchase / relocate */
  repBonus: number;
  blurb: string;
}

/** Deterministic hash for stable listing stats from place codes. */
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function listingForCity(
  stateCode: string,
  stateName: string,
  city: string,
  indexInState: number
): PropertyListing {
  const key = `${city}|${stateCode}`;
  const h = hashStr(key);
  const tier = (h % 5) + 1; // 1..5
  const price = 18_000 + tier * 12_000 + (h % 7) * 1500 + indexInState * 400;
  const space = 16 + tier * 10 + (h % 5) * 2;
  const clientFlow = +(0.85 + tier * 0.08 + ((h >> 3) % 5) * 0.02).toFixed(2);
  const salesMult = +(0.9 + tier * 0.07 + ((h >> 5) % 4) * 0.03).toFixed(2);
  const repBonus = 2 + tier;
  const tones = [
    'Corner lot near the civic cemetery.',
    'Quiet wing with a separate arrangement parlor.',
    'Highway-adjacent — strong walk-in flow.',
    'Historic brick; tight but dignified.',
    'Campus-style pad with room to expand.',
  ];
  return {
    id: `prop_${stateCode}_${city.replace(/\W+/g, '_').toLowerCase()}`,
    city,
    stateCode,
    stateName,
    label: `${city} Funeral Home`,
    price,
    space,
    clientFlow,
    salesMult,
    repBonus,
    blurb: tones[h % tones.length]!,
  };
}

/** Full catalog: one listing per usPlaces city. */
export const PROPERTY_LISTINGS: readonly PropertyListing[] =
  US_JURISDICTIONS.flatMap((j) =>
    j.cities.map((city, i) => listingForCity(j.code, j.name, city, i))
  );

export const PROPERTY_STATE_CODES: readonly string[] = US_JURISDICTIONS.map(
  (j) => j.code
);

export function getPropertyById(id: string): PropertyListing | undefined {
  return PROPERTY_LISTINGS.find((p) => p.id === id);
}

export function filterPropertiesByState(
  stateCode: string | 'ALL'
): PropertyListing[] {
  if (!stateCode || stateCode === 'ALL') return [...PROPERTY_LISTINGS];
  return PROPERTY_LISTINGS.filter((p) => p.stateCode === stateCode);
}

/** Starter pad — modest space so upgrades push relocation. */
export const STARTER_PROPERTY_ID = 'prop_starter_ossuarian';

export const STARTER_PROPERTY: PropertyListing = {
  id: STARTER_PROPERTY_ID,
  city: 'Ossuarian',
  stateCode: 'OH',
  stateName: 'Ohio',
  label: 'Ossuarian Starter Chapel',
  price: 0,
  space: 12,
  clientFlow: 1,
  salesMult: 1,
  repBonus: 0,
  blurb: 'Your first licensed parlor. Compact floor plate — expand via Lychgate Realty.',
};

export interface OwnedProperty {
  listingId: string;
  city: string;
  stateCode: string;
  label: string;
  spaceTotal: number;
  clientFlow: number;
  salesMult: number;
  purchasedFor: number;
}

export function ownedFromListing(
  listing: PropertyListing,
  paid: number
): OwnedProperty {
  return {
    listingId: listing.id,
    city: listing.city,
    stateCode: listing.stateCode,
    label: listing.label,
    spaceTotal: listing.space,
    clientFlow: listing.clientFlow,
    salesMult: listing.salesMult,
    purchasedFor: paid,
  };
}

export function makeMortgageLoan(
  listing: PropertyListing,
  financed: number,
  nowMs: number
): ActiveBankLoan {
  const payment = Math.max(400, Math.round(financed / 10));
  return {
    id: `mort_${listing.id}_${nowMs}`,
    kind: 'MORTGAGE',
    productId: null,
    label: `Mortgage — ${listing.label}`,
    principalRemaining: financed,
    paymentAmount: payment,
    paymentEveryMs: 12 * FAMILY_HOUR_MS,
    nextPaymentDueAt: nowMs + 12 * FAMILY_HOUR_MS,
    aprPct: 8.75,
    missedPayments: 0,
    propertyId: listing.id,
  };
}

export function earlyPayoffAmount(loan: ActiveBankLoan): number {
  // Small interest crumb on early payoff
  return Math.ceil(loan.principalRemaining * 1.02);
}
