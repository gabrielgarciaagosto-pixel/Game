import React, { useEffect, useState } from 'react';
import { displayCaseName, decayLabel } from '../types/game';
import { useGameStore } from '../store/useGameStore';

export const CoolerRoom: React.FC = () => {
  const {
    cases,
    tagBodyInCooler,
    selectActiveCase,
    activeCaseId,
    setActiveStation,
    takeActiveCaseToStation,
    expireUntaggedNames,
  } = useGameStore();

  const coolerCases = cases.filter((c) => c.location === 'COOLER');
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
      expireUntaggedNames();
    }, 250);
    return () => clearInterval(interval);
  }, [expireUntaggedNames]);

  return (
    <div className="fixed inset-0 z-40 bg-slate-950 text-slate-100 p-4 md:p-6 pb-24 flex flex-col justify-between select-none">
      <div className="flex justify-between items-center border-b border-cyan-900/60 pb-3 gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-cyan-400">
            MORTUARY COOLER — REFRIGERATION BAYS (38°F)
          </h2>
          <p className="text-xs text-slate-400">
            Tap the hovering name within 60 seconds of arrival to attach a
            permanent Toe-Tag! Remains leave the cooler when taken to prep or
            cremation.
          </p>
        </div>
        <button
          type="button"
          onPointerDown={() => setActiveStation('OVERVIEW')}
          className="px-4 py-2 bg-slate-800 rounded text-sm font-semibold active:bg-slate-700"
        >
          ← Main Menu
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5 my-auto py-4">
        {Array.from({ length: 6 }).map((_, index) => {
          const body = coolerCases[index];
          if (!body) {
            return (
              <div
                key={index}
                className="h-44 md:h-48 rounded-xl bg-slate-900/40 border border-dashed border-slate-800 flex items-center justify-center text-xs text-slate-600 font-mono"
              >
                BAY #{index + 1} — EMPTY
              </div>
            );
          }

          const secondsLeft = Math.max(
            0,
            Math.ceil((body.tagExpiresAt - now) / 1000)
          );
          const canStillTag = !body.isTagged && secondsLeft > 0;
          const isSelected = activeCaseId === body.id;

          return (
            <div
              key={body.id}
              onPointerDown={() => selectActiveCase(body.id)}
              className={`h-44 md:h-48 rounded-xl p-4 flex flex-col justify-between relative border-2 transition-all ${
                isSelected
                  ? 'bg-cyan-950/60 border-amber-400'
                  : 'bg-slate-900 border-cyan-800/50'
              }`}
            >
              {canStillTag && (
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    tagBodyInCooler(body.id);
                    selectActiveCase(body.id);
                  }}
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 bg-amber-400 text-slate-950 px-3 py-1.5 rounded-full font-extrabold text-xs shadow-xl animate-bounce whitespace-nowrap border-2 border-white"
                >
                  TAP TO TAG: &quot;{body.name}&quot; ({secondsLeft}s)
                </button>
              )}

              <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                <span>BAY #{index + 1}</span>
                {body.isTagged ? (
                  <span className="text-emerald-400 font-bold">✓ TAGGED</span>
                ) : secondsLeft === 0 ? (
                  <span className="text-red-400 font-bold">UNTAGGED</span>
                ) : (
                  <span className="text-amber-300">AWAITING TAG</span>
                )}
              </div>

              <div className="my-auto text-center">
                <div className="text-base font-bold text-white">
                  {displayCaseName(body)}
                </div>
                <div className="text-xs text-cyan-300 font-mono mt-1">
                  Measured Weight: {body.weightLbs} lbs | {body.tissueCondition}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex justify-between gap-1">
                <span>
                  {body.isEmbalmed
                    ? `Embalmed ${body.embalmRank ?? '✓'}`
                    : 'Unembalmed'}
                </span>
                <span>
                  {body.isCremated
                    ? `Cremated ${body.cremationRank ?? '✓'}`
                    : body.decayLevel > 5
                      ? decayLabel(body.decayLevel)
                      : 'Intact'}
                </span>
              </div>

              {isSelected && (
                <div className="flex gap-1 mt-1">
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      selectActiveCase(body.id);
                      takeActiveCaseToStation('EMBALMING');
                    }}
                    className="flex-1 text-[10px] py-1.5 bg-emerald-700 rounded font-bold"
                  >
                    Prep
                  </button>
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      selectActiveCase(body.id);
                      takeActiveCaseToStation('CREMATION');
                    }}
                    className="flex-1 text-[10px] py-1.5 bg-orange-700 rounded font-bold"
                  >
                    Cremate
                  </button>
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      selectActiveCase(body.id);
                      takeActiveCaseToStation('SHOWROOM');
                    }}
                    className="flex-1 text-[10px] py-1.5 bg-violet-700 rounded font-bold"
                  >
                    Chapel
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
