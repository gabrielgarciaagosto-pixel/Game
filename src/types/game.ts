export type Rank = 'S+' | 'S' | 'A' | 'B' | 'C' | 'F';

export type TissueCondition = 'NORMAL' | 'DEHYDRATED' | 'EDEMATOUS';

export type DispositionDirective =
  | 'BURIAL_VIEWING'
  | 'CREMATION_DIRECT'
  | 'VIEWING_THEN_CREMATION';

export type SweepTool = 'IRON_RAKE' | 'BRISTLE_BRUSH' | 'HAND_BRUSH';

export type StationId =
  | 'OVERVIEW'
  | 'COOLER'
  | 'EMBALMING'
  | 'CREMATION'
  | 'URN_FILLING'
  | 'SHOWROOM';

export interface DecedentCase {
  id: string;
  name: string;
  weightLbs: number;
  tissueCondition: TissueCondition;
  dehydrationFactor: number; // 0.5 (Edematous), 1.0 (Normal), 2.0 (Dehydrated)
  directive: DispositionDirective;
  preferredFlowers: 'LILIES' | 'ROSES' | 'WREATH';
  isEmbalmed: boolean;
  embalmRank?: Rank;
  isCremated: boolean;
  cremationRank?: Rank;
  isUrnFilled: boolean;
  basePayout: number;
  /** Cooler toe-tag window */
  arrivedAt: number;
  tagExpiresAt: number;
  isTagged: boolean;
  nameExpired: boolean;
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
