import { useGameStore } from '../store/useGameStore';

const SEEN_KEY = 'ossuarian-gift-seen';
const MONEY_CAP = 1_000_000;

/** True when the gift landed. A full cooler returns false so the gift can wait. */
export function applyGift(kind: 'remains' | 'money', amount: number): boolean {
  if (kind === 'remains') {
    return useGameStore.getState().receiveNewIntake({
      toast: 'The Head Mortician has sent you a remains',
    });
  }
  const dollars = Math.round(amount);
  if (!Number.isFinite(dollars) || dollars < 1 || dollars > MONEY_CAP) return false;
  useGameStore.setState((state) => ({
    cash: state.cash + dollars,
    intakeToast: `The Head Mortician has given you $${dollars}`,
  }));
  return true;
}

export function giftAlreadySeen(id: string): boolean {
  return readSeen().includes(id);
}

export function markGiftSeen(id: string): void {
  const seen = readSeen().filter((item) => item !== id);
  seen.push(id);
  try {
    localStorage.setItem(SEEN_KEY, JSON.stringify(seen.slice(-200)));
  } catch {
    /* the receipt on the server is the other guard */
  }
}

function readSeen(): string[] {
  try {
    const raw = localStorage.getItem(SEEN_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}
