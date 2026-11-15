import { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { BURN_TICK_MS, type RetortMachine } from '../retort/retortTypes';

function anyDoor(machines: RetortMachine[]): boolean {
  return machines.some((m) => m.doorMoving != null);
}

function anyLive(machines: RetortMachine[]): boolean {
  return machines.some(
    (m) =>
      m.phase !== 'IDLE' &&
      m.phase !== 'DONE' &&
      (m.phase === 'BURN' ||
        m.phase === 'LOAD' ||
        m.phase === 'SWEEP' ||
        m.blowerOn ||
        m.primaryOn ||
        m.secondaryOn ||
        m.purging ||
        m.doorMoving)
  );
}

/**
 * Keeps every owned retort simulating, including chambers that are not on screen.
 */
export function useRetortEngine() {
  const hasStartedGame = useGameStore((s) => s.hasStartedGame);
  const titleGate = useGameStore((s) => s.titleGate);
  const simulating = hasStartedGame && !titleGate;
  const doorMoving = useGameStore((s) =>
    anyDoor(s.retortMachines?.length ? s.retortMachines : [s.retort])
  );
  const machineLive = useGameStore((s) =>
    anyLive(s.retortMachines?.length ? s.retortMachines : [s.retort])
  );
  const tickRetortDoor = useGameStore((s) => s.tickRetortDoor);
  const tickRetortBurn = useGameStore((s) => s.tickRetortBurn);

  useEffect(() => {
    if (!simulating || !doorMoving) return;
    const id = window.setInterval(() => tickRetortDoor(), 40);
    return () => window.clearInterval(id);
  }, [simulating, doorMoving, tickRetortDoor]);

  useEffect(() => {
    if (!simulating || !machineLive) return;
    const id = window.setInterval(() => tickRetortBurn(), BURN_TICK_MS);
    return () => window.clearInterval(id);
  }, [simulating, machineLive, tickRetortBurn]);
}
