import { useEffect, useRef } from 'react';
import { coolerBayCapacity } from '../data/facilityUpgrades';
import {
  BANK_FORECLOSURE_AFTER_MS,
  BANK_WARNING_AFTER_MS,
} from '../data/bankForeclosure';
import { isChapelGathering } from '../data/pacing';
import { alignBays, alignMachines, retortCount } from '../retort/retortRoster';
import { steadyBurnRate } from '../retort/tickRetort';
import { retortSpeedFactor } from '../data/crematoryCatalog';
import { useGameStore, DECAY_PER_SEC } from '../store/useGameStore';
import { displayCaseName } from '../types/game';
import { formatTimeOf } from '../utils/clock12';
import { gameNow } from '../utils/gameNow';
import {
  decayAlertGameAt,
  retortFinishGameAt,
  serviceHeadsUpGameAt,
  toWall,
} from '../utils/houseAlarmPlan';
import { syncHouseAlarms, type HouseAlarmPlan } from '../utils/houseNotifications';
import { getCremationTargets } from '../utils/mortuaryMath';

/**
 * Parlor tick.
 * Wall time keeps running while the house is closed: the retort, decay,
 * the toe tag, permits, family choices, loans, and foreclosure all catch up
 * from the stamps in the save. Phone notices are replaced on each change,
 * on background, and on reopen.
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
  const tickRetortBurn = useGameStore((s) => s.tickRetortBurn);
  const tickRetortDoor = useGameStore((s) => s.tickRetortDoor);
  const alarmKey = useRef('');

  useEffect(() => {
    if (!hasStartedGame || titleGate) return;
    let cancelled = false;
    let running = false;

    const pushAlarms = () => {
      const state = useGameStore.getState();
      const now = gameNow();
      const wall = Date.now();
      const intakeAt =
        state.nextIntakeAt != null && state.nextIntakeAt > now
          ? toWall(state.nextIntakeAt, now, wall)
          : null;
      const count = retortCount(state.facilityLevels);
      const aligned = alignMachines(
        state.retortMachines,
        state.retort,
        state.activeRetortIndex ?? 0,
        count
      );
      const bays = alignBays(state.retortBays, count);
      const house = state.facilityLevels.crematory || 0;
      const coolerCap = coolerBayCapacity(state.facilityLevels.cooler_bays || 0);
      const coolerFull =
        state.cases.filter((row) => row.location === 'COOLER').length >= coolerCap;
      const families = state.cases
        .filter((row) => {
          const due = row.familyUrnDueAt;
          return typeof due === 'number' && due > now;
        })
        .slice(0, 12)
        .map((row) => ({
          name: row.isTagged ? row.name : 'A family',
          at: toWall(row.familyUrnDueAt as number, now, wall),
        }));
      const loans = state.activeLoans
        .filter((loan) => loan.principalRemaining > 0 && loan.nextPaymentDueAt > now)
        .slice(0, 8)
        .map((loan) => ({ at: toWall(loan.nextPaymentDueAt, now, wall) }));
      const services = state.cases
        .filter(
          (row) =>
            isChapelGathering(row.directive) &&
            typeof row.serviceDateMs === 'number' &&
            row.serviceDateMs > now
        )
        .slice(0, 8)
        .map((row) => {
          const fireAt = serviceHeadsUpGameAt(row.serviceDateMs as number, now);
          return {
            name: displayCaseName(row),
            whenLabel: formatTimeOf(new Date(row.serviceDateMs as number)),
            at: fireAt == null ? 0 : toWall(fireAt, now, wall),
          };
        })
        .filter((row) => row.at > 0);
      const retorts = aligned.machines
        .map((machine, index) => {
          const held = state.cases.find((row) => row.id === machine.caseId);
          if (!held || machine.phase !== 'BURN' || !machine.primaryOn) return null;
          const target = getCremationTargets(held.weightLbs).targetDurationSec;
          const speed = Math.max(
            1,
            retortSpeedFactor(house, bays[index]?.speedTier ?? 0)
          );
          const finish = retortFinishGameAt(
            machine.elapsedSec,
            target,
            steadyBurnRate(machine) * speed,
            now
          );
          if (finish == null) return null;
          return {
            name: displayCaseName(held),
            at: toWall(finish, now, wall),
          };
        })
        .filter((row): row is { name: string; at: number } => row != null)
        .slice(0, 4);
      const permits = state.permitSubmissions
        .filter((sub) => sub.status === 'PENDING' && sub.evaluatesAt > now)
        .slice(0, 8)
        .map((sub) => ({
          name: sub.decedentName,
          at: toWall(sub.evaluatesAt, now, wall),
        }));
      const decay = state.cases
        .filter((row) => {
          if (row.location === 'COOLER' || row.location === 'URN_VAULT') return false;
          if (row.isEmbalmed || row.isCremated || row.isUrnFilled) return false;
          if (row.decayLevel >= 70) return false;
          return true;
        })
        .slice(0, 8)
        .map((row) => {
          const holder = aligned.machines.find(
            (machine) =>
              machine.caseId === row.id &&
              machine.phase !== 'IDLE' &&
              machine.phase !== 'DONE'
          );
          const target = getCremationTargets(row.weightLbs).targetDurationSec;
          const progress = holder
            ? Math.min(1, holder.elapsedSec / target)
            : 0;
          if (holder && progress >= 0.15) return null;
          let rate = DECAY_PER_SEC;
          if (
            holder &&
            holder.phase === 'BURN' &&
            (holder.primaryOn || holder.secondaryOn)
          ) {
            const heat = Math.min(
              1,
              Math.max(0, (holder.primaryTemp - 200) / 1200)
            );
            rate = DECAY_PER_SEC * Math.max(0.08, 1 - heat * 0.92);
          }
          const atGame = decayAlertGameAt(row.decayLevel, rate, now);
          if (atGame == null) return null;
          return {
            name: displayCaseName(row),
            at: toWall(atGame, now, wall),
          };
        })
        .filter((row): row is { name: string; at: number } => row != null);
      const tags = state.cases
        .filter(
          (row) =>
            !row.isTagged &&
            !row.nameExpired &&
            typeof row.tagExpiresAt === 'number' &&
            row.tagExpiresAt > now
        )
        .slice(0, 8)
        .map((row) => ({
          name: row.name,
          at: toWall(row.tagExpiresAt as number, now, wall),
        }));
      const debtStart = state.negativeCashSinceMs;
      const bankWarningAt =
        state.cash < 0 && debtStart != null && !state.bankWarningIssued
          ? toWall(debtStart + BANK_WARNING_AFTER_MS, now, wall)
          : null;
      const foreclosureAt =
        state.cash < 0 && debtStart != null && !state.bankForeclosed
          ? toWall(debtStart + BANK_FORECLOSURE_AFTER_MS, now, wall)
          : null;
      const plan: HouseAlarmPlan = {
        enabled: state.notificationsEnabled,
        intakeAt,
        intakeRival: coolerFull,
        families,
        loans,
        services,
        retorts,
        permits,
        decay,
        tags,
        bankWarningAt:
          bankWarningAt != null && bankWarningAt > wall + 2000 ? bankWarningAt : null,
        foreclosureAt:
          foreclosureAt != null && foreclosureAt > wall + 2000
            ? foreclosureAt
            : null,
      };
      const key = [
        plan.enabled ? '1' : '0',
        coolerFull ? 'full' : 'open',
        intakeAt == null ? '' : String(Math.round(intakeAt / 60000)),
        families.map((row) => Math.round(row.at / 60000)).join(','),
        loans.map((row) => Math.round(row.at / 60000)).join(','),
        services.map((row) => Math.round(row.at / 60000)).join(','),
        retorts.map((row) => Math.round(row.at / 60000)).join(','),
        permits.map((row) => Math.round(row.at / 60000)).join(','),
        decay.map((row) => Math.round(row.at / 60000)).join(','),
        tags.map((row) => Math.round(row.at / 60000)).join(','),
        bankWarningAt == null ? '' : String(Math.round(bankWarningAt / 60000)),
        foreclosureAt == null ? '' : String(Math.round(foreclosureAt / 60000)),
      ].join('|');
      if (key === alarmKey.current) return;
      alarmKey.current = key;
      void syncHouseAlarms(plan);
    };

    // One system per turn. Running the whole clock inside the effect, and
    // again every second, held the WebView UI thread through intake, tag
    // expiry, decay, permits, the bank, and the news wire at once.
    const runChain = () => {
      if (cancelled || running) return;
      running = true;
      const steps: Array<() => void> = [
        () => tickRetortBurn(),
        () => tickRetortDoor(),
        () => tickIntake({ catchUpLimit: 64 }),
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
        steps[index]?.();
        index += 1;
        if (index < steps.length) {
          window.setTimeout(step, 0);
          return;
        }
        running = false;
        pushAlarms();
        useGameStore.getState().sealAbsenceMail();
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
      alarmKey.current = '';
      runChain();
    };

    const onNotices = () => {
      alarmKey.current = '';
      pushAlarms();
    };
    runChain();
    const id = window.setInterval(runChain, 1000);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('ossuarian-notices-on', onNotices);
    return () => {
      cancelled = true;
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('ossuarian-notices-on', onNotices);
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
    tickRetortBurn,
    tickRetortDoor,
  ]);
}
