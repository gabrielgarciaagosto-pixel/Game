import { useEffect } from 'react';
import { nextIntakeDelayMs, useGameStore } from '../store/useGameStore';

/**
 * Background cooler intake: random 3–5 minute interval between arrivals.
 */
export function useIntakeSpawner() {
  const receiveNewIntake = useGameStore((s) => s.receiveNewIntake);
  const expireUntaggedNames = useGameStore((s) => s.expireUntaggedNames);

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const scheduleNext = () => {
      const delay = nextIntakeDelayMs();
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        receiveNewIntake();
        expireUntaggedNames();
        scheduleNext();
      }, delay);
    };

    scheduleNext();
    const expireTick = setInterval(() => expireUntaggedNames(), 1000);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      clearInterval(expireTick);
    };
  }, [receiveNewIntake, expireUntaggedNames]);
}
