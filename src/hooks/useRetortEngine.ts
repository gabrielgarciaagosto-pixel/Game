import { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { BURN_TICK_MS } from '../retort/retortTypes';

/**
 * Keeps the Millennium retort simulating even when the player leaves the room.
 */
export function useRetortEngine() {
  const hasStartedGame = useGameStore((s) => s.hasStartedGame);
  const phase = useGameStore((s) => s.retort.phase);
  const doorMoving = useGameStore((s) => s.retort.doorMoving);
  const blowerOn = useGameStore((s) => s.retort.blowerOn);
  const primaryOn = useGameStore((s) => s.retort.primaryOn);
  const secondaryOn = useGameStore((s) => s.retort.secondaryOn);
  const purging = useGameStore((s) => s.retort.purging);
  const tickRetortDoor = useGameStore((s) => s.tickRetortDoor);
  const tickRetortBurn = useGameStore((s) => s.tickRetortBurn);

  const machineLive =
    hasStartedGame &&
    phase !== 'IDLE' &&
    phase !== 'DONE' &&
    (phase === 'BURN' ||
      phase === 'LOAD' ||
      phase === 'SWEEP' ||
      blowerOn ||
      primaryOn ||
      secondaryOn ||
      purging ||
      doorMoving);

  useEffect(() => {
    if (!doorMoving) return;
    const id = window.setInterval(() => tickRetortDoor(), 40);
    return () => window.clearInterval(id);
  }, [doorMoving, tickRetortDoor]);

  useEffect(() => {
    if (!machineLive) return;
    const id = window.setInterval(() => tickRetortBurn(), BURN_TICK_MS);
    return () => window.clearInterval(id);
  }, [machineLive, tickRetortBurn]);
}
