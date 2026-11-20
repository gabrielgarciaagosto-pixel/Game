export interface Player {
  installId: string;
  playerName: string;
  firstSeen: number;
  lastSeen: number;
  sessionStartedAt: number;
  sessionMs: number;
  recentSessionMs: number[];
  versionName: string;
  versionCode: number;
  platform: string;
  cash: number;
  reputation: number;
  intermentScore: number;
  ossilegiumGrams: number;
  urnsCount: number;
  casesHandled: number;
  careerXp: number;
  rankTitle: string;
  homesKept: number;
  activeStation: string;
  ownedPropertyLabel: string;
  ownedPropertyCity: string;
}

export type GiftKind = 'remains' | 'money';
export type Screen = 'players' | 'detail' | 'gift' | 'news';
