import { useEffect } from 'react';
import { nextIntakeDelayMs, useGameStore } from '../store/useGameStore';

/**
 * Background cooler intake: random 3–5 minute interval between arrivals.
 * Also ticks decay for cases left outside refrigeration.
 */
export function useIntakeSpawner() {
  const hasStartedGame = useGameStore((s) => s.hasStartedGame);
  const receiveNewIntake = useGameStore((s) => s.receiveNewIntake);
  const expireUntaggedNames = useGameStore((s) => s.expireUntaggedNames);
  const tickDecay = useGameStore((s) => s.tickDecay);

  useEffect(() => {
    if (!hasStartedGame) return;

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
    const expireTick = setInterval(() => {
      expireUntaggedNames();
      tickDecay();
    }, 1000);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      clearInterval(expireTick);
    };
  }, [hasStartedGame, receiveNewIntake, expireUntaggedNames, tickDecay]);
}
