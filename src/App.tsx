import { useEffect, useState } from 'react';

declare global {
  interface Window {
    __ossuarianHardwareBack?: () => 'handled' | 'exit';
    __ossuarianCloseFiles?: () => void;
    __ossuarianCloseSettingsConfirm?: () => void;
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
import { TutorialLayer } from './components/TutorialLayer';
import { UrnStartScreen } from './components/UrnStartScreen';
import { UrnVaultRoom } from './components/UrnVaultRoom';
import { DevToolsOverlay, DEV_TOOLS } from './dev';
import { useIntakeSpawner } from './hooks/useIntakeSpawner';
import { useRetortEngine } from './hooks/useRetortEngine';
import { directiveLabel, displayCaseName, locationLabel } from './types/game';
import { useGameStore } from './store/useGameStore';

function App() {
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
      if (window.__ossuarianCloseSettingsConfirm) {
        window.__ossuarianCloseSettingsConfirm();
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
    legalAlert,
    intakeToast,
    clearLegalAlert,
    clearIntakeToast,
  } = useGameStore();

  const activeCase =
    cases.find((c) => c.id === activeCaseId) ?? cases[0] ?? null;

  // Wait for persist merge so returning players don't flash splash + theme
  if (!hydrated) {
    return (
      <div className="fixed inset-0 bg-slate-950" aria-busy="true" />
    );
  }

  return (
    <>
      <MenuThemeAudio />
      <TutorialLayer />
      <HouseSettings />
      <CrematoryAudio />
      <ServiceMusicAudio />
      <NotificationPing />
      {!titleGate && <BankForeclosureScreen />}
      {!titleGate && <ServiceFeedbackModal />}
      {titleGate || !hasStartedGame ? (
        <UrnStartScreen
          title="OSSUARIAN"
          subtitle="FIRST URN"
          canContinue={hasStartedGame}
          onStartComplete={hasStartedGame ? resumeGame : startGame}
        />
      ) : (
    <div className="relative flex flex-col w-full h-full overflow-hidden bg-slate-950 text-slate-100">
      {DEV_TOOLS ? <DevToolsOverlay /> : null}
      {activeStation === 'OVERVIEW' ? (
        <MainHubMenu />
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

      <CaseInboxWidget />
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
      {intakeToast && (
        <div
          className="fixed left-1/2 -translate-x-1/2 z-[10000] max-w-lg w-[calc(100%-2rem)]"
          style={{ top: 'calc(var(--safe-top) + 0.5rem)' }}
        >
          <div className="bg-cyan-900/95 border border-cyan-400 text-cyan-50 px-4 py-3 rounded-xl shadow-xl flex items-center justify-between gap-3">
            <span className="font-semibold text-sm">{intakeToast}</span>
            <button
              type="button"
              onPointerDown={clearIntakeToast}
              className="text-xs px-2 py-1 bg-cyan-700 rounded active:bg-cyan-600"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
