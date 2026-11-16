import React, { useState } from 'react';
import { useTapAction } from '../hooks/useTapAction';
import { CaseTransferBar } from './CaseTransferBar';
import { displayCaseName, friendlyToken } from '../types/game';
import { useGameStore } from '../store/useGameStore';
import { URN_CATALOG, getUrnById } from '../data/urnCatalog';
import { UrnVessel } from './urns/UrnVessel';
import {
  URN_SETS,
  beautifyTarget,
  urnSetProgress,
  type BeautifyStep,
} from '../data/urnVariety';

function BeautifyButton({
  label,
  detail,
  can,
  onPress,
}: {
  label: string;
  detail: string;
  can: boolean;
  onPress: () => void;
}) {
  const tap = useTapAction(() => {
    if (can) onPress();
  });
  return (
    <button
      type="button"
      disabled={!can}
      {...tap}
      className={`w-full rounded-lg px-2 py-1.5 text-left ${
        can ? 'bg-amber-700/80 active:bg-amber-600' : 'bg-stone-800 text-stone-500'
      }`}
    >
      <div className="text-[11px] font-bold">
        {label}
      </div>
      <div className="text-[9px] opacity-80 truncate">{detail}</div>
    </button>
  );
}

const BENCH: Array<{ step: BeautifyStep; label: string }> = [
  { step: 'band', label: 'Add band' },
  { step: 'finish', label: 'Change finish' },
  { step: 'engrave', label: 'Engrave' },
];

export const UrnVaultRoom: React.FC = () => {
  const {
    cases,
    selectActiveCase,
    activeCaseId,
    setActiveStation,
    moveCaseTo,
    urnInventory,
    vaultCapacity,
    cash,
    beautifyUrn,
  } = useGameStore();
  const vault = cases.filter((c) => c.location === 'URN_VAULT');
  const selected = vault.find((c) => c.id === activeCaseId) ?? null;
  const collection = URN_CATALOG.filter((u) => (urnInventory[u.id] ?? 0) > 0);
  const craftable = collection.filter((u) =>
    BENCH.some(({ step }) => beautifyTarget(u.id, step))
  );
  const [benchId, setBenchId] = useState<string | null>(null);
  const bench = craftable.find((u) => u.id === benchId) ?? craftable[0] ?? null;
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
          <h3 className="text-[10px] font-black tracking-[0.2em] text-amber-300 mb-2 px-1">
            BEAUTIFY
          </h3>
          {!bench ? (
            <p className="text-stone-600 text-sm px-1">
              Buy a modern vessel in the Emporium — a cylinder, cube, orb, or vase — then add a band, change the finish, or engrave it here.
            </p>
          ) : (
            <div className="rounded-2xl border border-amber-900/50 bg-stone-900/80 p-2">
              {craftable.length > 1 && (
                <div className="flex gap-1 overflow-x-auto pb-2">
                  {craftable.map((urn) => (
                    <button
                      key={urn.id}
                      type="button"
                      onPointerDown={() => setBenchId(urn.id)}
                      className={`shrink-0 px-2 py-1 rounded text-[10px] font-semibold ${
                        bench.id === urn.id
                          ? 'bg-amber-500 text-stone-950'
                          : 'bg-stone-800 text-stone-300'
                      }`}
                    >
                      {urn.name}
                    </button>
                  ))}
                </div>
              )}
              <div className="flex gap-2 items-center">
                <UrnVessel urn={bench} size="sm" showPlaque={false} />
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="text-[12px] font-bold text-amber-100 leading-tight">
                    {bench.name}
                  </div>
                  <div className="text-[9px] text-stone-400">
                    {bench.modular ? friendlyToken(bench.modular.body) : friendlyToken(bench.material)}
                    {' · '}
                    {bench.finish}
                  </div>
                  {BENCH.map(({ step, label }) => {
                    const recipe = beautifyTarget(bench.id, step);
                    if (!recipe) return null;
                    const result = getUrnById(recipe.resultId);
                    const can = cash >= recipe.cost;
                    return (
                      <BeautifyButton
                        key={step}
                        label={`${label} · $${recipe.cost}`}
                        detail={result?.name ?? ''}
                        can={can}
                        onPress={() => beautifyUrn(bench.id, step)}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </section>

        <section>
          <h3 className="text-[10px] font-black tracking-[0.2em] text-amber-300 mb-2 px-1">
            SETS
          </h3>
          <div className="space-y-2">
            {URN_SETS.map((set) => {
              const progress = urnSetProgress(set, urnInventory);
              const pct = progress.total === 0 ? 0 : (progress.owned / progress.total) * 100;
              return (
                <div key={set.id} className="rounded-xl border border-stone-800 bg-stone-900/70 px-2 py-1.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="text-[12px] font-bold text-amber-100">{set.name}</div>
                    <div className="text-[10px] font-mono text-stone-400">
                      {progress.owned}/{progress.total}
                    </div>
                  </div>
                  <p className="text-[9px] text-stone-500">{set.blurb}</p>
                  <div className="mt-1 h-1.5 rounded-full bg-stone-800 overflow-hidden">
                    <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>

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
                    Retort {urn.cremationRank ?? '—'}
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
                      {urn.modular
                        ? `${friendlyToken(urn.modular.body)} · ${urn.finish}`
                        : friendlyToken(urn.material)}
                      {' · '}Own {urnInventory[urn.id] ?? 0}
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
