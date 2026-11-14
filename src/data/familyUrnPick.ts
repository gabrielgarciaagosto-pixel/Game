import { URN_CATALOG } from './urnCatalog';
import type { DecedentCase, DispositionDirective } from '../types/game';

/** Directives that eventually need an urn vessel. */
export function directiveNeedsUrn(d: DispositionDirective): boolean {
  return (
    d === 'CREMATION_DIRECT' ||
    d === 'CREMATION_THEN_VIEWING' ||
    d === 'VIEWING_THEN_CREMATION'
  );
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

/**
 * Family picks a catalog vessel after arrival.
 * Biased toward preferred material; memorial services lean prettier.
 */
export function pickFamilyUrnRequest(c: DecedentCase): string {
  const preferred = URN_CATALOG.filter(
    (u) => u.material === c.preferredUrnMaterial
  );
  const usePreferred = preferred.length > 0 && Math.random() < 0.72;
  let pool = usePreferred ? preferred : URN_CATALOG;

  if (c.directive === 'CREMATION_THEN_VIEWING') {
    const ranked = [...pool].sort((a, b) => b.prestigeBonus - a.prestigeBonus);
    pool = ranked.slice(0, Math.min(6, ranked.length));
  }

  return pool[Math.floor(Math.random() * pool.length)].id;
}
