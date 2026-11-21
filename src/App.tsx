import { lazy, Suspense, useEffect, useLayoutEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

declare global {
  interface Window {
    __ossuarianHardwareBack?: () => 'handled' | 'exit';
    __ossuarianCloseFiles?: () => void;
    __ossuarianClosePhone?: () => void;
    __ossuarianCloseCalendar?: () => void;
    __ossuarianCloseSettingsConfirm?: () => void;
    __ossuarianCloseNotifyAsk?: () => void;
    __ossuarianCloseUpdate?: () => void;
  }
}
import { BankDebtHud } from './components/BankDebtHud';
import { BankForeclosureScreen } from './components/BankForeclosureScreen';
import { CaseInboxWidget } from './components/CaseInboxWidget';
import { ComputerRoom } from './components/ComputerRoom';
import { CoolerRoom } from './components/CoolerRoom';
import { CremationMiniGame } from './components/CremationMiniGame';
import { CrematoryAudio } from './components/CrematoryAudio';
import { EmbalmingMiniGame } from './components/EmbalmingMiniGame';
import { MainHubMenu } from './components/MainHubMenu';
import { RankFanfare } from './components/RankFanfare';
import { MenuThemeAudio } from './components/MenuThemeAudio';
import { NotificationPing } from './components/NotificationPing';
import { ServiceFeedbackModal } from './components/ServiceFeedbackModal';
import { ServiceMusicAudio } from './components/ServiceMusicAudio';
import { ShowroomAndChapelModal } from './components/ShowroomAndChapelModal';
import { UrnFillingMiniGame } from './components/UrnFillingMiniGame';
import { HouseSettings } from './components/HouseSettings';
import { NotificationAsk } from './components/NotificationAsk';
import { LegendarySpiritModal } from './components/LegendarySpiritModal';
import { TutorialLayer } from './components/TutorialLayer';
import { UpdateNotice } from './components/UpdateNotice';
import { UrnStartScreen } from './components/UrnStartScreen';
import { FirstLaunchAgreement } from './components/FirstLaunchAgreement';
import { readFictionChoice } from './presence/fictionGate';
import { UrnVaultRoom } from './components/UrnVaultRoom';
import { useIntakeSpawner } from './hooks/useIntakeSpawner';
import { useRetortEngine } from './hooks/useRetortEngine';
import { directiveLabel, displayCaseName, locationLabel } from './types/game';
import { useGameStore } from './store/useGameStore';

const DevToolsOverlay =
  import.meta.env.VITE_PUBLIC_DEMO === '1'
    ? null
    : lazy(() =>
        import('./dev/DevToolsOverlay').then((mod) => ({
          default: mod.DevToolsOverlay,
        }))
      );

function PlayApp() {
  const [hydrated, setHydrated] = useState(() =>
    useGameStore.persist.hasHydrated()
  );

  useEffect(() => {
    const unsub = useGameStore.persist.onFinishHydration(() => {
      setHydrated(true);
    });
    setHydrated(useGameStore.persist.hasHydrated());
    return unsub;
  }, []);

  useEffect(() => {
    window.__ossuarianHardwareBack = () => {
      const state = useGameStore.getState();
      if (window.__ossuarianCloseUpdate) {
        window.__ossuarianCloseUpdate();
        return 'handled';
      }
      if (window.__ossuarianCloseSettingsConfirm) {
        window.__ossuarianCloseSettingsConfirm();
        return 'handled';
      }
      if (window.__ossuarianCloseNotifyAsk) {
        window.__ossuarianCloseNotifyAsk();
        return 'handled';
      }
      if (state.settingsOpen) {
        state.setSettingsOpen(false);
        return 'handled';
      }
      if (state.titleGate || !state.hasStartedGame) return 'exit';
      if (state.tutorial === 'offer') {
        state.skipTutorial();
        return 'handled';
      }
      if (state.bankForeclosed) {
        state.acknowledgeBankForeclosure();
        return 'handled';
      }
      if (state.serviceFeedback) {
        state.clearServiceFeedback();
        return 'handled';
      }
      if (state.legalAlert) {
        state.clearLegalAlert();
        return 'handled';
      }
      if (state.rankFanfare) {
        state.dismissRankFanfare();
        return 'handled';
      }
      if (window.__ossuarianCloseCalendar) {
        window.__ossuarianCloseCalendar();
        return 'handled';
      }
      if (window.__ossuarianClosePhone) {
        window.__ossuarianClosePhone();
        return 'handled';
      }
      if (window.__ossuarianCloseFiles) {
        window.__ossuarianCloseFiles();
        return 'handled';
      }
      if (state.activeStation === 'COMPUTER') {
        if (state.computerOpenApp) {
          state.setComputerOpenApp(null);
          return 'handled';
        }
        state.setActiveStation('OVERVIEW');
        return 'handled';
      }
      if (state.activeStation !== 'OVERVIEW') {
        state.setActiveStation('OVERVIEW');
        return 'handled';
      }
      return 'exit';
    };
    return () => {
      delete window.__ossuarianHardwareBack;
    };
  }, []);

  useIntakeSpawner();
  useRetortEngine();

  const {
    hasStartedGame,
    titleGate,
    startGame,
    resumeGame,
    cash,
    reputation,
    intermentScore,
    ossilegiumCommuneGrams,
    cases,
    activeCaseId,
    activeStation,
    computerOpenApp,
    legalAlert,
    intakeToast,
    clearLegalAlert,
    clearIntakeToast,
  } = useGameStore(
    useShallow((s) => ({
      hasStartedGame: s.hasStartedGame,
      titleGate: s.titleGate,
      startGame: s.startGame,
      resumeGame: s.resumeGame,
      cash: s.cash,
      reputation: s.reputation,
      intermentScore: s.intermentScore,
      ossilegiumCommuneGrams: s.ossilegiumCommuneGrams,
      cases: s.cases,
      activeCaseId: s.activeCaseId,
      activeStation: s.activeStation,
      computerOpenApp: s.computerOpenApp,
      legalAlert: s.legalAlert,
      intakeToast: s.intakeToast,
      clearLegalAlert: s.clearLegalAlert,
      clearIntakeToast: s.clearIntakeToast,
    }))
  );

  const activeCase =
    cases.find((c) => c.id === activeCaseId) ?? cases[0] ?? null;

  useEffect(() => {
    if (!intakeToast) return;
    const id = window.setTimeout(() => {
      useGameStore.getState().clearIntakeToast();
    }, 8000);
    return () => window.clearTimeout(id);
  }, [intakeToast]);

  useEffect(() => {
    if (!hydrated) return;
    let stop = () => {};
    let cancelled = false;
    void import('./presence/playerPresence').then((mod) => {
      if (cancelled) return;
      stop = mod.startPlayerPresence();
    });
    return () => {
      cancelled = true;
      stop();
    };
  }, [hydrated]);

  const onTitle = titleGate || !hasStartedGame;
  const onHub = hasStartedGame && !titleGate && activeStation === 'OVERVIEW';
  const fullStation =
    hasStartedGame &&
    !titleGate &&
    activeStation !== 'OVERVIEW' &&
    activeStation !== 'COMPUTER';
  const coveredDesk =
    activeStation === 'COMPUTER' &&
    (computerOpenApp === 'MAIL' ||
      computerOpenApp === 'PHONE' ||
      computerOpenApp === 'SHOP');
  const showHubFabs = hasStartedGame && !titleGate && !fullStation && !coveredDesk;

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (fullStation) root.dataset.stationFab = 'hide';
    else delete root.dataset.stationFab;
    if (fullStation || coveredDesk) root.dataset.coverFab = '1';
    else delete root.dataset.coverFab;
    return () => {
      delete root.dataset.stationFab;
      delete root.dataset.coverFab;
    };
  }, [fullStation, coveredDesk]);
  const [hubToastTop, setHubToastTop] = useState<number | null>(null);
  useLayoutEffect(() => {
    if (!intakeToast || !onHub) {
      setHubToastTop((prev) => (prev == null ? prev : null));
      return;
    }
    const measure = () => {
      const head = document.querySelector('[data-hub-head]');
      const stats = document.querySelector('[data-hub-stats]');
      const rank = document.querySelector('[data-rank-display]');
      const anchor = head ?? stats ?? rank;
      if (!anchor) return;
      const next = Math.ceil(anchor.getBoundingClientRect().bottom + 8);
      setHubToastTop((prev) => (prev === next ? prev : next));
    };
    measure();
    const head = document.querySelector('[data-hub-head]');
    const observer = head ? new ResizeObserver(measure) : null;
    if (head && observer) observer.observe(head);
    window.addEventListener('resize', measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', measure);
    };
  }, [intakeToast, onHub]);

  // Wait for persist merge so returning players don't flash splash + theme
  if (!hydrated) {
    return (
      <div className="fixed inset-0 bg-slate-950" aria-busy="true" />
    );
  }

  return (
    <>
      <UpdateNotice />
      <MenuThemeAudio />
      <TutorialLayer />
      <HouseSettings />
      <NotificationAsk />
      <CrematoryAudio />
      <ServiceMusicAudio />
      <NotificationPing />
      {!titleGate && <BankForeclosureScreen />}
      {!titleGate && <ServiceFeedbackModal />}
      {!titleGate && <LegendarySpiritModal />}
      {titleGate || !hasStartedGame ? (
        <UrnStartScreen
          title="OSSUARIAN"
          subtitle="FIRST URN"
          canContinue={hasStartedGame}
          onStartComplete={hasStartedGame ? resumeGame : startGame}
        />
      ) : (
    <div className="relative flex flex-col w-full h-full overflow-hidden bg-slate-950 text-slate-100">
      {DevToolsOverlay ? (
        <Suspense fallback={null}>
          <DevToolsOverlay />
        </Suspense>
      ) : null}
      {activeStation === 'OVERVIEW' ? (
        <MainHubMenu />
      ) : fullStation ? (
        <main className="relative flex-1 min-h-0" />
      ) : (
        <>
          <header
            className="shrink-0 z-40 px-3 py-2 border-b border-amber-900/40 bg-gradient-to-b from-slate-900 to-slate-950"
            style={{ paddingTop: 'calc(var(--safe-top) + 0.25rem)' }}
          >
            <div className="mx-auto max-w-lg grid grid-cols-2 gap-2">
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  Cash
                </div>
                <div
                  className={`font-mono text-lg ${
                    cash < 0 ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  ${cash.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  Reputation
                </div>
                <div className="font-mono text-amber-300 text-lg">
                  {reputation}
                </div>
                <div className="font-mono text-[11px] text-amber-100/80">
                  Interment {intermentScore}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  Active Case
                </div>
                <div className="font-semibold text-sm truncate">
                  {activeCase
                    ? `${displayCaseName(activeCase)} · ${activeCase.weightLbs} lbs`
                    : 'None selected'}
                </div>
                <div className="font-mono text-xs text-sky-300 truncate">
                  {activeCase ? directiveLabel(activeCase.directive) : '—'}
                  {activeCase?.location ? ` · ${locationLabel(activeCase.location)}` : ''}
                </div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-wider text-slate-500">
                  Ossilegium Commune
                </div>
                <div className="font-mono text-violet-300 text-lg">
                  {ossilegiumCommuneGrams} g
                </div>
              </div>
            </div>
          </header>
          <main className="relative flex-1 min-h-0" />
        </>
      )}

      {activeStation === 'COOLER' && <CoolerRoom />}
      {activeStation === 'EMBALMING' && <EmbalmingMiniGame />}
      {activeStation === 'CREMATION' && <CremationMiniGame />}
      {activeStation === 'URN_FILLING' && <UrnFillingMiniGame />}
      {activeStation === 'SHOWROOM' && <ShowroomAndChapelModal />}
      {activeStation === 'URN_VAULT' && <UrnVaultRoom />}
      {activeStation === 'COMPUTER' && <ComputerRoom />}

      {showHubFabs ? <CaseInboxWidget /> : null}
      {hasStartedGame ? <BankDebtHud /> : null}
      {hasStartedGame ? <RankFanfare /> : null}

      {legalAlert && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-red-950 border border-red-700 rounded-xl p-6 shadow-xl">
            <h3 className="text-xl font-bold text-red-300 mb-3">Legal Notice</h3>
            <p className="text-sm text-red-100 mb-6">{legalAlert}</p>
            <button
              type="button"
              onClick={clearLegalAlert}
              onPointerDown={clearLegalAlert}
              className="w-full py-3 bg-red-600 active:bg-red-500 rounded font-bold"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
      )}

      {/* Toast above title + hub so Reset Game feedback is visible on splash */}
      {intakeToast && (!onHub || hubToastTop != null) && (
        <div
          data-intake-toast
          className="toast-rise pointer-events-none fixed z-[10000]"
          style={
            onHub
              ? { top: hubToastTop ?? 0, left: '0.75rem', right: '0.75rem' }
              : onTitle
                ? {
                    top: 'calc(var(--safe-top) + 0.45rem)',
                    left: '0.75rem',
                    right: '0.75rem',
                  }
                : {
                    bottom: 'calc(var(--files-clearance) + 0.35rem)',
                    left: '0.75rem',
                    right: '0.75rem',
                  }
          }
        >
          <div className="pointer-events-none flex items-center justify-between gap-2 rounded-lg border border-cyan-400 bg-cyan-950 px-2.5 py-1.5 text-cyan-50 shadow-xl">
            <span className="line-clamp-2 text-[11px] font-semibold leading-snug">{intakeToast}</span>
            <button
              type="button"
              onPointerDown={clearIntakeToast}
              onClick={clearIntakeToast}
              className="pointer-events-auto inline-flex min-h-11 shrink-0 items-center rounded bg-cyan-700 px-3 text-[12px] font-bold active:bg-cyan-600"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  const [fiction, setFiction] = useState(readFictionChoice);
  if (fiction !== 'agreed') {
    return (
      <FirstLaunchAgreement
        refused={fiction === 'refused'}
        onAgreed={() => setFiction('agreed')}
      />
    );
  }
  return <PlayApp />;
}
