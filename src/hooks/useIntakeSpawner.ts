import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';

/**
 * Foreground parlor tick.
 * Intake is a real-day schedule (4–8 hours, five a day). SCI slows that band.
 * Pause writes no arrival. Decay, the toe-tag, urn choice, and permits
 * only move on this tick, so a closed app does not spend them.
 */
export function useIntakeSpawner() {
  const hasStartedGame = useGameStore((s) => s.hasStartedGame);
  const titleGate = useGameStore((s) => s.titleGate);
  const tickIntake = useGameStore((s) => s.tickIntake);
  const expireUntaggedNames = useGameStore((s) => s.expireUntaggedNames);
  const tickDecay = useGameStore((s) => s.tickDecay);
  const tickFamilyUrnChoices = useGameStore((s) => s.tickFamilyUrnChoices);
  const tickPermitEvaluations = useGameStore((s) => s.tickPermitEvaluations);
  const tickBankForeclosure = useGameStore((s) => s.tickBankForeclosure);
  const tickBankLoans = useGameStore((s) => s.tickBankLoans);
  const tickNews = useGameStore((s) => s.tickNews);
  const catchUp = useRef(2);

  useEffect(() => {
    if (!hasStartedGame || titleGate) return;
    catchUp.current = 2;
    const tick = () => {
      tickIntake({ catchUpLimit: catchUp.current });
      catchUp.current = 1;
      expireUntaggedNames();
      tickDecay();
      tickFamilyUrnChoices();
      tickPermitEvaluations();
      tickBankLoans();
      tickBankForeclosure();
      tickNews();
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [
    hasStartedGame,
    titleGate,
    tickIntake,
    expireUntaggedNames,
    tickDecay,
    tickFamilyUrnChoices,
    tickPermitEvaluations,
    tickBankLoans,
    tickBankForeclosure,
    tickNews,
  ]);
}
