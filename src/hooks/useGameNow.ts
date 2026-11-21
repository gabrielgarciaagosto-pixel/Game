import { useEffect, useState } from 'react';
import { gameNow, subscribeClock } from '../utils/gameNow';

/** Wall clock plus any dev offset. Ticks once a second while enabled. */
export function useGameNow(enabled = true): number {
  const [now, setNow] = useState(() => gameNow());
  useEffect(() => {
    if (!enabled) return;
    const pull = () => setNow(gameNow());
    const id = window.setInterval(pull, 1000);
    const unsub = subscribeClock(pull);
    return () => {
      window.clearInterval(id);
      unsub();
    };
  }, [enabled]);
  return now;
}
