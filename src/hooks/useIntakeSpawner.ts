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
    let cancelled = false;
    let running = false;

    // One system per turn. Running the whole clock inside the effect, and
    // again every second, held the WebView UI thread through intake, tag
    // expiry, decay, permits, the bank, and the news wire at once.
    const runChain = () => {
      if (cancelled || running) return;
      running = true;
      const limit = catchUp.current;
      const steps: Array<() => void> = [
        () => tickIntake({ catchUpLimit: limit }),
        () => {
          catchUp.current = 1;
        },
        () => expireUntaggedNames(),
        () => tickDecay(),
        () => tickFamilyUrnChoices(),
        () => tickPermitEvaluations(),
        () => tickBankLoans(),
        () => tickBankForeclosure(),
        () => tickNews(),
      ];
      let index = 0;
      const step = () => {
        if (cancelled) {
          running = false;
          return;
        }
        steps[index]();
        index += 1;
        if (index < steps.length) {
          window.setTimeout(step, 0);
          return;
        }
        running = false;
      };
      window.setTimeout(step, 0);
    };

    runChain();
    const id = window.setInterval(runChain, 1000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
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
