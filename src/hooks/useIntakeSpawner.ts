import { useEffect, useRef } from 'react';
import { nextIntakeDelayMs, useGameStore } from '../store/useGameStore';
import { intakeNewsFactor } from '../news/newsWire';
import { gameNow } from '../utils/gameNow';

/**
 * Background cooler intake: random 3–5 minute interval between arrivals.
 * Also ticks decay for cases left outside refrigeration.
 */
export function useIntakeSpawner() {
  const hasStartedGame = useGameStore((s) => s.hasStartedGame);
  const receiveNewIntake = useGameStore((s) => s.receiveNewIntake);
  const expireUntaggedNames = useGameStore((s) => s.expireUntaggedNames);
  const tickDecay = useGameStore((s) => s.tickDecay);
  const tickFamilyUrnChoices = useGameStore((s) => s.tickFamilyUrnChoices);
  const tickPermitEvaluations = useGameStore((s) => s.tickPermitEvaluations);
  const tickBankForeclosure = useGameStore((s) => s.tickBankForeclosure);
  const tickBankLoans = useGameStore((s) => s.tickBankLoans);
  const tickNews = useGameStore((s) => s.tickNews);
  const clientFlow = useGameStore((s) => s.ownedProperty.clientFlow);
  const clientFlowRef = useRef(clientFlow);
  clientFlowRef.current = clientFlow;

  useEffect(() => {
    if (!hasStartedGame) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const scheduleNext = () => {
      const flow =
        clientFlowRef.current *
        intakeNewsFactor(useGameStore.getState().newsWire, gameNow());
      const delay = nextIntakeDelayMs(flow);
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        receiveNewIntake();
        expireUntaggedNames();
        scheduleNext();
      }, delay);
    };

    scheduleNext();
    tickNews();
    const expireTick = setInterval(() => {
      expireUntaggedNames();
      tickDecay();
      tickFamilyUrnChoices();
      tickPermitEvaluations();
      tickBankLoans();
      tickBankForeclosure();
      tickNews();
    }, 1000);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
      clearInterval(expireTick);
    };
  }, [
    hasStartedGame,
    receiveNewIntake,
    expireUntaggedNames,
    tickDecay,
    tickFamilyUrnChoices,
    tickPermitEvaluations,
    tickBankLoans,
    tickBankForeclosure,
    tickNews,
  ]);
}
