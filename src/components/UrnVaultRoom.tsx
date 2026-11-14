import React from 'react';
import { CaseTransferBar } from './CaseTransferBar';
import { displayCaseName } from '../types/game';
import { useGameStore } from '../store/useGameStore';

export const UrnVaultRoom: React.FC = () => {
  const {
    cases,
    selectActiveCase,
    activeCaseId,
    setActiveStation,
    moveCaseTo,
  } = useGameStore();
  const vault = cases.filter((c) => c.location === 'URN_VAULT');
  const selected = vault.find((c) => c.id === activeCaseId) ?? null;

  return (
    <div className="safe-screen fixed inset-0 z-40 bg-stone-950 text-stone-100 flex flex-col select-none">
      <div className="flex justify-between items-center border-b border-stone-700 pb-3 gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-amber-400">
            URN VAULT — SECURE STORAGE
          </h2>
          <p className="text-xs text-stone-400">
            Cremated remains sealed in urns await family pickup or chapel
            service. Select an urn, then Move to Chapel.
          </p>
          {selected && (
            <div className="mt-2">
              <CaseTransferBar currentCase={selected} showVault />
              <button
                type="button"
                onPointerDown={() => moveCaseTo(selected.id, 'CHAPEL')}
                className="mt-2 px-4 py-2 bg-violet-700 active:bg-violet-600 rounded text-xs font-bold"
              >
                Move Selected Urn to Chapel
              </button>
            </div>
          )}
        </div>
        <button
          type="button"
          onPointerDown={() => setActiveStation('OVERVIEW')}
          className="px-4 py-2 bg-stone-800 rounded text-sm font-semibold active:bg-stone-700"
        >
          Back
        </button>
      </div>

      {vault.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-stone-500 text-sm">
          Vault empty — store filled urns here after processing.
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mt-4 overflow-y-auto">
          {vault.map((urn) => (
            <button
              key={urn.id}
              type="button"
              onPointerDown={() => selectActiveCase(urn.id)}
              className={`rounded-xl border-2 p-4 text-left ${
                activeCaseId === urn.id
                  ? 'border-amber-400 bg-amber-950/40'
                  : 'border-stone-700 bg-stone-900'
              }`}
            >
              <div className="text-xs font-mono text-stone-500 mb-2">
                URN #{urn.id}
              </div>
              <div className="font-bold text-amber-200">
                {displayCaseName(urn)}
              </div>
              <div className="text-xs text-stone-400 mt-1">
                Cremation {urn.cremationRank ?? '—'}
                {urn.embalmRank ? ` · Prior embalm ${urn.embalmRank}` : ''}
              </div>
              <div className="mt-3 h-16 rounded-b-2xl border-2 border-stone-500 bg-gradient-to-b from-stone-600 to-stone-800 flex items-end justify-center pb-2 text-[10px] font-mono">
                SEALED
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
