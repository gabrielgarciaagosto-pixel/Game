export type Rank = 'S+' | 'S' | 'A' | 'B' | 'C' | 'F';

export type TissueCondition = 'NORMAL' | 'DEHYDRATED' | 'EDEMATOUS';

export type DispositionDirective =
  | 'BURIAL_VIEWING'
  | 'CREMATION_DIRECT'
  | 'VIEWING_THEN_CREMATION'
  /** Cremate + urn, then chapel gathering around the urned remains */
  | 'CREMATION_THEN_VIEWING';

/** Human labels for inbox / HUD (directives stay stable ids). */
export function directiveLabel(d: DispositionDirective): string {
  switch (d) {
    case 'BURIAL_VIEWING':
      return 'Burial Viewing';
    case 'CREMATION_DIRECT':
      return 'Direct Cremation';
    case 'VIEWING_THEN_CREMATION':
      return 'Viewing, Then Cremation';
    case 'CREMATION_THEN_VIEWING':
      return 'Ossuary Memorial';
    default:
      return d;
  }
}

export function directiveBlurb(d: DispositionDirective): string {
  switch (d) {
    case 'BURIAL_VIEWING':
      return 'Open-casket chapel service; embalming required.';
    case 'CREMATION_DIRECT':
      return 'Retort and processing only — no chapel gathering.';
    case 'VIEWING_THEN_CREMATION':
      return 'Casket viewing first, then cremation.';
    case 'CREMATION_THEN_VIEWING':
      return 'Cremate and urn the remains, then chapel memorial around the vessel.';
    default:
      return '';
  }
}

export type SweepTool =
  | 'STIRRING_ROD'
  | 'IRON_RAKE'
  | 'BRISTLE_BRUSH'
  | 'HAND_BRUSH';

export type CaseLocation =
  | 'COOLER'
  | 'EMBALMING'
  | 'CREMATION'
  | 'URN_FILLING'
  | 'CHAPEL'
  | 'URN_VAULT';

export type StationId =
  | 'OVERVIEW'
  | 'COOLER'
  | 'EMBALMING'
  | 'CREMATION'
  | 'URN_FILLING'
  | 'SHOWROOM'
  | 'URN_VAULT'
  | 'EMPORIUM';

export type PreferredUrnMaterial =
  | 'MARBLE'
  | 'BRONZE'
  | 'WOOD'
  | 'CERAMIC'
  | 'GLASS'
  | 'STEEL'
  | 'STONE'
  | 'PORCELAIN';

export type PreferredCasketMaterial =
  | 'OAK'
  | 'CHERRY'
  | 'WALNUT'
  | 'PINE'
  | 'MAHOGANY'
  | 'STEEL'
  | 'BRONZE'
  | 'COPPER';

export interface DecedentCase {
  id: string;
  name: string;
  weightLbs: number;
  tissueCondition: TissueCondition;
  dehydrationFactor: number;
  directive: DispositionDirective;
  preferredFlowers: 'LILIES' | 'ROSES' | 'WREATH';
  /** Family taste when selecting a vessel for cremains */
  preferredUrnMaterial: PreferredUrnMaterial;
  /** Family taste when selecting a casket for burial viewing */
  preferredCasketMaterial: PreferredCasketMaterial;
  /** Catalog urn offered/sold to this family at chapel / urnization */
  offeredUrnId: string | null;
  /** Catalog casket offered/sold for burial services */
  offeredCasketId: string | null;
  /**
   * Urn the family requested after arrival (null until notified / non-cremation).
   * Distinct from offeredUrnId (what the player actually staged).
   */
  familyRequestedUrnId: string | null;
  /** Wall-clock when the family request should fire */
  familyUrnDueAt: number | null;
  /** 0–100 ash-pour quality from the urnization mini-game */
  urnPourQuality: number;
  /**
   * Cremulator finished — ash ready for vessel select / pour.
   * Survives Emporium trips so the processor does not reset to crush.
   */
  urnAshReady: boolean;
  location: CaseLocation;
  isEmbalmed: boolean;
  embalmRank?: Rank;
  embalmTipMultiplier?: number;
  isCremated: boolean;
  cremationRank?: Rank;
  isUrnFilled: boolean;
  basePayout: number;
  arrivedAt: number;
  tagExpiresAt: number;
  isTagged: boolean;
  nameExpired: boolean;
  /** 0 = pristine, 100 = fully decomposed */
  decayLevel: number;
  leftCoolerAt: number | null;
  serviceDateMs: number | null;
}

export interface CaseInboxFile {
  id: string;
  decedentName: string;
  intakeTimestamp: number;
  weightLbs: number;
  tissueCondition: TissueCondition;
  directive: DispositionDirective;
  preferredFlowers: 'LILIES' | 'ROSES' | 'WREATH';
  isRead: boolean;
  serviceDateMs: number | null;
  /** Mirrors case.familyRequestedUrnId for the case file UI */
  familyRequestedUrnId: string | null;
}

export interface ShowroomItem {
  id: string;
  name: string;
  category: 'CASKET' | 'COFFIN' | 'URN' | 'KEEPSAKE' | 'FLOWER' | 'DECOR';
  cost: number;
  resaleValue: number;
  prestigeBonus: number;
  ownedCount: number;
}

export function displayCaseName(c: DecedentCase): string {
  return c.isTagged ? c.name : 'UNIDENTIFIED REMAINS';
}

export function decayLabel(level: number): string {
  if (level < 15) return 'Stable';
  if (level < 40) return 'Early Decomposition';
  if (level < 70) return 'Advanced Decomposition';
  return 'Critical Putrefaction';
}
