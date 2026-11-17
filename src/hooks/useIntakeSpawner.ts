import { useEffect, useRef } from 'react';
import { coolerBayCapacity } from '../data/facilityUpgrades';
import { DAILY_INTAKE_CAP } from '../data/pacing';
import { useGameStore } from '../store/useGameStore';
import { gameNow } from '../utils/gameNow';
import { syncHouseAlarms } from '../utils/houseNotifications';

/**
 * Parlor tick.
 * Intake, family choices, permits, news, and the bank move on the real clock,
 * including time spent with the app in the background.
 * The toe tag, decay, and the retort stay foreground races.
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
  const alarmKey = useRef('');

  useEffect(() => {
    if (!hasStartedGame || titleGate) return;
    catchUp.current = 2;
    let cancelled = false;
    let running = false;

    const pushAlarms = () => {
      const state = useGameStore.getState();
      const now = gameNow();
      const wall = Date.now();
      const intakeAt =
        state.nextIntakeAt != null && state.nextIntakeAt > now
          ? wall + (state.nextIntakeAt - now)
          : null;
      const coolerCap = coolerBayCapacity(state.facilityLevels.cooler_bays || 0);
      const coolerFull =
        state.cases.filter((row) => row.location === 'COOLER').length >= coolerCap;
      const families = state.cases
        .filter(
          (row) =>
            typeof row.familyUrnRemainingMs === 'number' &&
            row.familyUrnRemainingMs > 0
        )
        .slice(0, 12)
        .map((row) => ({
          name: row.name,
          at: wall + (row.familyUrnRemainingMs ?? 0),
        }));
      const loans = state.activeLoans
        .filter((loan) => loan.principalRemaining > 0 && loan.nextPaymentDueAt > now)
        .slice(0, 8)
        .map((loan) => ({ at: wall + (loan.nextPaymentDueAt - now) }));
      const key = [
        state.notificationsEnabled ? '1' : '0',
        coolerFull ? 'full' : 'open',
        intakeAt == null ? '' : String(Math.round(intakeAt / 60000)),
        families.map((family) => Math.round(family.at / 60000)).join(','),
        loans.map((loan) => Math.round(loan.at / 60000)).join(','),
      ].join('|');
      if (key === alarmKey.current) return;
      alarmKey.current = key;
      void syncHouseAlarms({
        enabled: state.notificationsEnabled,
        intakeAt,
        intakeRival: coolerFull,
        families,
        loans,
      });
    };

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
        pushAlarms();
      };
      window.setTimeout(step, 0);
    };

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') {
        useGameStore.getState().noteParlorHidden();
        alarmKey.current = '';
        pushAlarms();
        return;
      }
      useGameStore.getState().noteParlorShown();
      catchUp.current = DAILY_INTAKE_CAP;
      alarmKey.current = '';
      runChain();
    };

    runChain();
    const id = window.setInterval(runChain, 1000);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
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
