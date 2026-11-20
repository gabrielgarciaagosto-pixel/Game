import type { Player } from './types';

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;
export const SAMPLE_HEADLINE =
  'The county fair will keep its lanterns lit an hour longer tonight.';

export function samplePlayers(now: number): Player[] {
  const players: Player[] = [];
  for (let n = 1; n <= 135; n += 1) {
    players.push(kyle(n, now));
  }
  players.push(person('mara00000000000001', 'Mara', now - 40 * DAY, now - 25_000, 'Chapel Usher', 'Greyharbor Chapel', 'Greyharbor', 'OVERVIEW', 960, 41));
  players.push(person('helen0000000000001', 'Helen', now - 12 * DAY, now - 55_000, 'Night Orderly', 'Lamp House', 'Millford', 'COOLER', 420, 18));
  return players;
}

function kyle(n: number, now: number): Player {
  const live =
    n === 135 ? now - 15_000 : n === 1 ? now - 40_000 : n === 2 ? now - 70_000 : 0;
  const lastSeen =
    live ||
    (n <= 8 ? now - n * HOUR : n <= 30 ? now - (2 + (n % 5)) * DAY : now - 21 * DAY);
  const fresh = now - lastSeen < 8 * DAY;
  return person(
    `kyle${String(n).padStart(16, '0')}`,
    'Kyle',
    now - (136 - n) * DAY,
    lastSeen,
    n === 135 ? 'Chapel Usher' : n % 2 === 0 ? 'Porter' : 'Cooler Clerk',
    n === 135 ? 'North Chapel' : 'Starter Chapel',
    n === 135 ? 'Greyharbor' : 'Millford',
    n === 135 ? 'OVERVIEW' : n === 1 ? 'COMPUTER' : 'COOLER',
    400 + n * 11,
    10 + (n % 40),
    fresh ? '0.9.82-demo' : '0.9.81-demo',
    fresh ? 100 : 99,
    n % 5 === 0 ? 'web' : 'android'
  );
}

function person(
  installId: string,
  playerName: string,
  firstSeen: number,
  lastSeen: number,
  rankTitle: string,
  ownedPropertyLabel: string,
  ownedPropertyCity: string,
  activeStation: string,
  cash: number,
  reputation: number,
  versionName = '0.9.82-demo',
  versionCode = 100,
  platform = 'android'
): Player {
  const sessionMs = 18 * 60 * 1000;
  return {
    installId,
    playerName,
    firstSeen,
    lastSeen,
    sessionStartedAt: lastSeen - sessionMs,
    sessionMs,
    recentSessionMs: [16 * 60 * 1000, 21 * 60 * 1000],
    versionName,
    versionCode,
    platform,
    cash,
    reputation,
    intermentScore: 40 + (cash % 80),
    ossilegiumGrams: 12 + (reputation % 30),
    urnsCount: 2 + (reputation % 5),
    casesHandled: 8 + (reputation % 12),
    careerXp: 900,
    rankTitle,
    homesKept: rankTitle === 'Chapel Usher' ? 2 : 1,
    activeStation,
    ownedPropertyLabel,
    ownedPropertyCity,
  };
}
