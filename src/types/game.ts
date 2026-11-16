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

/** Case-file and HUD wording. Location ids stay in the save. */
export function locationLabel(location: CaseLocation): string {
  switch (location) {
    case 'COOLER':
      return 'In cooler';
    case 'EMBALMING':
      return 'At embalming';
    case 'CREMATION':
      return 'Cremating';
    case 'URN_FILLING':
      return 'Urn ready';
    case 'CHAPEL':
      return 'In the chapel';
    case 'URN_VAULT':
      return 'In the vault';
  }
}

export function caseStatusLabel(c: {
  location: CaseLocation;
  embalmRank?: Rank | null;
  cremationRank?: Rank | null;
}): string {
  const parts = [locationLabel(c.location)];
  if (c.embalmRank) parts.push(`Prep ${c.embalmRank}`);
  if (c.cremationRank) parts.push(`Retort ${c.cremationRank}`);
  return parts.join(' · ');
}

/** Title-case a stored token such as OAK or LILIES. Prose is left as written. */
export function friendlyToken(value: string): string {
  if (!/^[A-Z0-9]+(?:_[A-Z0-9]+)*$/.test(value)) return value;
  return value
    .toLowerCase()
    .split('_')
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(' ');
}

export type StationId =
  | 'OVERVIEW'
  | 'COOLER'
  | 'EMBALMING'
  | 'CREMATION'
  | 'URN_FILLING'
  | 'SHOWROOM'
  | 'URN_VAULT'
  | 'EMPORIUM'
  | 'COMPUTER';

export function stationLabel(station: StationId | string): string {
  switch (station) {
    case 'OVERVIEW':
      return 'Hub';
    case 'COOLER':
      return 'Cooler';
    case 'EMBALMING':
      return 'Embalming';
    case 'CREMATION':
      return 'Crematory';
    case 'URN_FILLING':
      return 'Urn processing';
    case 'SHOWROOM':
      return 'Chapel';
    case 'URN_VAULT':
      return 'Urn vault';
    case 'EMPORIUM':
      return 'Shop';
    case 'COMPUTER':
      return 'Computer';
    default:
      return 'In house';
  }
}

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
  /**
   * Family chapel dressing wishes (walls/floor/drapery/lighting/pews/music).
   * Matching is bonus-only — missing prefs never penalize.
   */
  familyChapelPrefs: {
    wallId: string | null;
    floorId: string | null;
    draperyId: string | null;
    lightingId: string | null;
    pewsId: string | null;
    musicTrackId: string | null;
    flowers: 'LILIES' | 'ROSES' | 'WREATH';
  };
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
  /** Legacy stamp. The wait that runs is familyUrnRemainingMs. */
  familyUrnDueAt: number | null;
  /**
   * Foreground milliseconds until the family names a vessel.
   * Null once they have chosen, or when no urn is required.
   * A closed app does not spend this.
   */
  familyUrnRemainingMs: number | null;
  /** How the family speaks of them in the thank-you. "Mom", "Dad", and so on. */
  familyRelation?: string;
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
  /** 0–100 cremains score from the retort quality line. Feeds the service tip. */
  cremainsQuality?: number;
  /** Chamber that finished this cremation. Used to pay the upgrade bonuses. */
  retortSpeedTier?: number;
  retortQualityTier?: number;
  retortFuelTier?: number;
  /** Dollars taken for retort fuel when the chamber was fired. */
  fuelChargedCost?: number | null;
  retortPreheat?: boolean;
  retortQueue?: boolean;
  isUrnFilled: boolean;
  basePayout: number;
  arrivedAt: number;
  /** Absolute mirror of the toe-tag clock. The race itself is tagRemainingMs. */
  tagExpiresAt: number;
  /**
   * Milliseconds left to tag. Counts down only while the parlor is open.
   * A closed app does not spend it.
   */
  tagRemainingMs: number;
  isTagged: boolean;
  nameExpired: boolean;
  /** 0 = pristine, 100 = fully decomposed */
  decayLevel: number;
  leftCoolerAt: number | null;
  serviceDateMs: number | null;
  /** Vital records — every decedent */
  dateOfBirthMs: number;
  dateOfDeathMs: number;
  timeOfDeathHour: number;
  timeOfDeathMinute: number;
  placeOfBirth: string;
  /**
   * State cremation permit. Burial-only = NOT_REQUIRED.
   * Cremation paths start at NONE until filed on the Computer.
   */
  cremationPermitStatus:
    | 'NOT_REQUIRED'
    | 'NONE'
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED';
  cremationPermitSubmittedAt: number | null;
  cremationPermitEvaluatesAt: number | null;
  cremationPermitRejectReason: string | null;
  /** True if this case was cremated without an approved permit */
  unpermittedCremation: boolean;
  /**
   * Set when the county wire sends this person to the parlor.
   * A careful service pays well above the card. A sloppy one pays less.
   */
  headlineCase?: {
    headlineId: string;
    stageName: string;
  } | null;
}

export interface CaseInboxFile {
  id: string;
  decedentName: string;
  intakeTimestamp: number;
  weightLbs: number;
  tissueCondition: TissueCondition;
  directive: DispositionDirective;
  preferredFlowers: 'LILIES' | 'ROSES' | 'WREATH';
  familyChapelPrefs?: DecedentCase['familyChapelPrefs'];
  isRead: boolean;
  serviceDateMs: number | null;
  /** Mirrors case.familyRequestedUrnId for the case file UI */
  familyRequestedUrnId: string | null;
  dateOfBirthMs: number;
  dateOfDeathMs: number;
  timeOfDeathHour: number;
  timeOfDeathMinute: number;
  placeOfBirth: string;
  cremationPermitStatus:
    | 'NOT_REQUIRED'
    | 'NONE'
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED';
  cremationPermitRejectReason: string | null;
  /** County-wire note. Null on an ordinary file. */
  headlineNote?: string | null;
}

/** A case file that has left the active inbox because the case was closed. */
export interface ArchivedCaseFile {
  id: string;
  closedAt: number;
  decedentName: string;
  weightLbs: number;
  tissueCondition: TissueCondition;
  directive: DispositionDirective;
  preferredFlowers: 'LILIES' | 'ROSES' | 'WREATH';
  dateOfBirthMs: number;
  dateOfDeathMs: number;
  timeOfDeathHour: number;
  timeOfDeathMinute: number;
  placeOfBirth: string;
  cremationPermitStatus: CaseInboxFile['cremationPermitStatus'];
  /** Plain outcome, such as Cremation service or Wrongful cremation. */
  outcome: string;
  /** Net cash posted when the case closed. Negative when the house was fined. */
  payout: number;
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
