import { CremationMiniGame } from './components/CremationMiniGame';
import { EmbalmingMiniGame } from './components/EmbalmingMiniGame';
import { IsometricMortuary } from './components/IsometricMortuary';
import { ShowroomAndChapelModal } from './components/ShowroomAndChapelModal';
import { UrnFillingMiniGame } from './components/UrnFillingMiniGame';
import { useGameStore } from './store/useGameStore';

function App() {
  const {
    cash,
    reputation,
    ossilegiumCommuneGrams,
    currentCase,
    activeStation,
    legalAlert,
    clearLegalAlert,
    setActiveStation,
  } = useGameStore();

  return (
    <div className="relative flex flex-col w-full h-full overflow-hidden bg-slate-950 text-slate-100">
      {/* Top HUD */}
      <header className="shrink-0 z-40 px-3 py-2 border-b border-slate-800 bg-slate-950/95">
        <div className="mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-2">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">
              Cash
            </div>
            <div className="font-mono text-emerald-400 text-lg">
              ${cash.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">
              Reputation
            </div>
            <div className="font-mono text-amber-300 text-lg">{reputation}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500">
              Decedent / Directive
            </div>
            <div className="font-semibold text-sm truncate">
              {currentCase.name} · {currentCase.weightLbs} lbs
            </div>
            <div className="font-mono text-xs text-sky-300 truncate">
              {currentCase.directive}
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

      <main className="relative flex-1 min-h-0">
        <IsometricMortuary />
      </main>

      {/* Touch-friendly station launcher */}
      <nav className="shrink-0 z-40 px-3 py-2 border-t border-slate-800 bg-slate-950/95">
        <div className="mx-auto max-w-6xl grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveStation('EMBALMING')}
            onPointerDown={() => setActiveStation('EMBALMING')}
            className="py-2 rounded bg-sky-700 active:bg-sky-600 text-sm font-semibold border border-sky-500/40"
          >
            Embalming
          </button>
          <button
            type="button"
            onClick={() => setActiveStation('CREMATION')}
            onPointerDown={() => setActiveStation('CREMATION')}
            className="py-2 rounded bg-orange-700 active:bg-orange-600 text-sm font-semibold border border-orange-500/40"
          >
            Retort
          </button>
          <button
            type="button"
            onClick={() => setActiveStation('SHOWROOM')}
            onPointerDown={() => setActiveStation('SHOWROOM')}
            className="py-2 rounded bg-violet-700 active:bg-violet-600 text-sm font-semibold border border-violet-500/40"
          >
            Chapel
          </button>
        </div>
      </nav>

      {activeStation === 'EMBALMING' && <EmbalmingMiniGame />}
      {activeStation === 'CREMATION' && <CremationMiniGame />}
      {activeStation === 'URN_FILLING' && <UrnFillingMiniGame />}
      {activeStation === 'SHOWROOM' && <ShowroomAndChapelModal />}

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
  );
}

export default App;
