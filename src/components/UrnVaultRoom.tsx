import React from 'react';
import { CaseTransferBar } from './CaseTransferBar';
import { displayCaseName } from '../types/game';
import { useGameStore } from '../store/useGameStore';
import { URN_CATALOG } from '../data/urnCatalog';
import { UrnVessel } from './urns/UrnVessel';

export const UrnVaultRoom: React.FC = () => {
  const {
    cases,
    selectActiveCase,
    activeCaseId,
    setActiveStation,
    moveCaseTo,
    urnInventory,
    vaultCapacity,
  } = useGameStore();
  const vault = cases.filter((c) => c.location === 'URN_VAULT');
  const selected = vault.find((c) => c.id === activeCaseId) ?? null;
  const collection = URN_CATALOG.filter((u) => (urnInventory[u.id] ?? 0) > 0);
  const niches = vaultCapacity();

  return (
    <div className="safe-screen fixed inset-0 z-40 bg-stone-950 text-stone-100 flex flex-col select-none overflow-hidden">
      <div className="shrink-0 flex justify-between items-start border-b border-stone-700 pb-3 gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-amber-400">
            URN VAULT — {vault.length}/{niches} NICHES
          </h2>
          <p className="text-[10px] text-stone-400 leading-snug">
            Sealed cremains await family pickup. Expand niches in Emporium
            Upgrades. Purchased vessels display below as a private collection.
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
          className="px-3 py-2 bg-stone-800 rounded text-xs font-semibold shrink-0"
        >
          Back
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto space-y-4 py-3">
        <section>
          <h3 className="text-[10px] font-black tracking-[0.2em] text-stone-400 mb-2 px-1">
            SEALED CASES
          </h3>
          {vault.length === 0 ? (
            <div className="text-stone-600 text-sm px-1">
              No sealed cremains stored yet.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {vault.map((urn) => (
                <button
                  key={urn.id}
                  type="button"
                  onPointerDown={() => selectActiveCase(urn.id)}
                  className={`rounded-xl border-2 p-3 text-left ${
                    activeCaseId === urn.id
                      ? 'border-amber-400 bg-amber-950/40'
                      : 'border-stone-700 bg-stone-900'
                  }`}
                >
                  <div className="text-[10px] font-mono text-stone-500 mb-1">
                    CASE #{urn.id}
                  </div>
                  <div className="font-bold text-amber-200 text-sm">
                    {displayCaseName(urn)}
                  </div>
                  <div className="text-[10px] text-stone-400 mt-1">
                    Cremation {urn.cremationRank ?? '—'}
                  </div>
                  <div className="mt-2 h-12 rounded-b-2xl border border-stone-600 bg-gradient-to-b from-stone-600 to-stone-800 flex items-end justify-center pb-1 text-[9px] font-mono">
                    SEALED
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between px-1 mb-2">
            <h3 className="text-[10px] font-black tracking-[0.2em] text-amber-300">
              YOUR COLLECTION
            </h3>
            <button
              type="button"
              onPointerDown={() => setActiveStation('EMPORIUM')}
              className="text-[10px] px-2 py-1 rounded bg-amber-800/70"
            >
              Emporium →
            </button>
          </div>
          {collection.length === 0 ? (
            <p className="text-stone-600 text-sm px-1">
              Buy vessels at the Funerary Emporium to build a collection.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2.5">
              {collection.map((urn) => (
                <div
                  key={urn.id}
                  className="rounded-2xl border border-amber-900/40 bg-gradient-to-b from-stone-900 to-black p-2 flex flex-col items-center"
                >
                  <UrnVessel urn={urn} size="sm" />
                  <div className="text-center mt-1">
                    <div className="text-[12px] font-bold text-amber-100 leading-tight">
                      {urn.name}
                    </div>
                    <div className="text-[9px] text-stone-400">
                      {urn.material} · Own {urnInventory[urn.id] ?? 0}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};
