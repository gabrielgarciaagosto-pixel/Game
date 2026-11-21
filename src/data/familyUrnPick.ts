import { URN_CATALOG, type UrnCatalogEntry } from './urnCatalog';
import { CASKET_CATALOG, type CasketCatalogEntry } from './casketCatalog';
import type { DecedentCase, DispositionDirective } from '../types/game';

/** Directives that eventually need an urn vessel. */
export function directiveNeedsUrn(d: DispositionDirective): boolean {
  return (
    d === 'CREMATION_DIRECT' ||
    d === 'CREMATION_THEN_VIEWING' ||
    d === 'VIEWING_THEN_CREMATION'
  );
}

/** Viewing on a bier. Direct cremation and an ossuary memorial do not. */
export function directiveNeedsCasket(d: DispositionDirective): boolean {
  return d === 'BURIAL_VIEWING' || d === 'VIEWING_THEN_CREMATION';
}

/** Chapel / presentation uses the urn stand instead of a casket bier. */
export function caseUsesUrnStand(c: DecedentCase): boolean {
  if (c.directive === 'CREMATION_THEN_VIEWING') return true;
  if (c.directive === 'CREMATION_DIRECT') return true;
  if (
    c.directive === 'BURIAL_VIEWING' ||
    c.directive === 'VIEWING_THEN_CREMATION'
  ) {
    return false;
  }
  return c.isUrnFilled;
}

type Stocked = { id: string; material: string; prestigeBonus: number };

function pickOwned<T extends Stocked>(
  owned: T[],
  preferredMaterial: string,
  leanPretty: boolean
): T | null {
  if (owned.length === 0) return null;
  const preferred = owned.filter((item) => item.material === preferredMaterial);
  const usePreferred = preferred.length > 0 && Math.random() < 0.72;
  let pool = usePreferred ? preferred : owned;
  if (leanPretty && pool.length > 1) {
    const ranked = [...pool].sort((a, b) => b.prestigeBonus - a.prestigeBonus);
    pool = ranked.slice(0, Math.min(6, ranked.length));
  }
  return pool[Math.floor(Math.random() * pool.length)] ?? null;
}

function ownedFrom<T extends { id: string }>(
  catalog: T[],
  inventory: Record<string, number>
): T[] {
  return catalog.filter((item) => (inventory[item.id] ?? 0) > 0);
}

/**
 * Shelf counts plus a vessel already staged on the case.
 * Staging removed that unit from inventory; it is still the house's.
 */
export function stockIncludingStaged(
  inventory: Record<string, number>,
  stagedId: string | null
): Record<string, number> {
  if (!stagedId) return inventory;
  return { ...inventory, [stagedId]: (inventory[stagedId] ?? 0) + 1 };
}

export type FamilyReservation =
  | { ok: false }
  | { ok: true; inventory: Record<string, number>; offeredId: string };

/**
 * Hold exactly one unit for the family's choice.
 * A vessel already staged is that unit: picking it again does not
 * take a second one. Picking a different stocked vessel swaps them.
 */
export function reserveFamilyChoice(
  inventory: Record<string, number>,
  stagedId: string | null,
  pickedId: string | null
): FamilyReservation {
  if (!pickedId) return { ok: false };
  const visible = stockIncludingStaged(inventory, stagedId);
  if ((visible[pickedId] ?? 0) < 1) return { ok: false };
  if (stagedId === pickedId) {
    return { ok: true, inventory, offeredId: pickedId };
  }
  const next = { ...inventory };
  if (stagedId) next[stagedId] = (next[stagedId] ?? 0) + 1;
  next[pickedId] = (next[pickedId] ?? 0) - 1;
  return { ok: true, inventory: next, offeredId: pickedId };
}

/**
 * Family urn, drawn only from units the house currently holds.
 * Null when the shelf has no urn. Never falls through to the Emporium catalog.
 */
export function pickOwnedUrn(
  c: DecedentCase,
  inventory: Record<string, number>
): string | null {
  const owned = ownedFrom<UrnCatalogEntry>(URN_CATALOG, inventory);
  return (
    pickOwned(
      owned,
      c.preferredUrnMaterial,
      c.directive === 'CREMATION_THEN_VIEWING'
    )?.id ?? null
  );
}

/**
 * Family casket, drawn only from units the house currently holds.
 * Null when the shelf has no casket.
 */
export function pickOwnedCasket(
  c: DecedentCase,
  inventory: Record<string, number>
): string | null {
  const owned = ownedFrom<CasketCatalogEntry>(CASKET_CATALOG, inventory);
  return (
    pickOwned(owned, c.preferredCasketMaterial, c.directive === 'BURIAL_VIEWING')
      ?.id ?? null
  );
}
