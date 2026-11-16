import { useEffect, useRef } from 'react';
import { nextIntakeDelayMs, useGameStore } from '../store/useGameStore';
import { intakeNewsFactor } from '../news/newsWire';
import { gameNow } from '../utils/gameNow';
import { DEV_TOOLS } from '../dev/flags';
import {
  readIntakeDevOptions,
  useIntakeDevOptions,
} from '../dev/intakeOptions';

/**
 * Background cooler intake. Normal wait is 3–5 minutes.
 * SCI stretches that to 5–10. Pause Case Intake stops arrivals until off.
 * Also ticks decay for cases left outside refrigeration.
 */
export function useIntakeSpawner() {
  const hasStartedGame = useGameStore((s) => s.hasStartedGame);
  const titleGate = useGameStore((s) => s.titleGate);
  const receiveNewIntake = useGameStore((s) => s.receiveNewIntake);
  const expireUntaggedNames = useGameStore((s) => s.expireUntaggedNames);
  const tickDecay = useGameStore((s) => s.tickDecay);
  const tickFamilyUrnChoices = useGameStore((s) => s.tickFamilyUrnChoices);
  const tickPermitEvaluations = useGameStore((s) => s.tickPermitEvaluations);
  const tickBankForeclosure = useGameStore((s) => s.tickBankForeclosure);
  const tickBankLoans = useGameStore((s) => s.tickBankLoans);
  const tickNews = useGameStore((s) => s.tickNews);
  const clientFlow = useGameStore((s) => s.ownedProperty.clientFlow);
  const intakeDev = useIntakeDevOptions();
  const clientFlowRef = useRef(clientFlow);
  clientFlowRef.current = clientFlow;

  useEffect(() => {
    if (!hasStartedGame || titleGate) return;

    let timeoutId: ReturnType<typeof setTimeout>;
    let cancelled = false;

    const devIntake = () =>
      DEV_TOOLS ? readIntakeDevOptions() : { sci: false, pause: false };

    const scheduleNext = () => {
      if (devIntake().pause) return;
      const flow =
        clientFlowRef.current *
        intakeNewsFactor(useGameStore.getState().newsWire, gameNow());
      const delay = nextIntakeDelayMs(flow, devIntake().sci);
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        if (devIntake().pause) return;
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
    titleGate,
    receiveNewIntake,
    expireUntaggedNames,
    tickDecay,
    tickFamilyUrnChoices,
    tickPermitEvaluations,
    tickBankLoans,
    tickBankForeclosure,
    tickNews,
    intakeDev.pause,
    intakeDev.sci,
  ]);
}
