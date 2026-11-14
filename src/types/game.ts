export type Rank = 'S+' | 'S' | 'A' | 'B' | 'C' | 'F';

export type TissueCondition = 'NORMAL' | 'DEHYDRATED' | 'EDEMATOUS';

export type DispositionDirective =
  | 'BURIAL_VIEWING'
  | 'CREMATION_DIRECT'
  | 'VIEWING_THEN_CREMATION';

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
  | 'URN_VAULT';

export interface DecedentCase {
  id: string;
  name: string;
  weightLbs: number;
  tissueCondition: TissueCondition;
  dehydrationFactor: number;
  directive: DispositionDirective;
  preferredFlowers: 'LILIES' | 'ROSES' | 'WREATH';
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
