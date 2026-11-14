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
    takeCaseToStation,
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
    <div className="safe-screen fixed inset-0 z-40 bg-slate-950 text-slate-100 flex flex-col select-none overflow-hidden">
      <div className="shrink-0 flex justify-between items-start border-b border-cyan-900/60 pb-2 gap-2 px-1">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-cyan-400">
            COOLER — 38°F BAYS
          </h2>
          <p className="text-[10px] text-slate-400 leading-snug">
            Tap name within 60s to toe-tag. Use Prep / Cremate / Chapel to move
            remains.
          </p>
        </div>
        <button
          type="button"
          onPointerDown={() => setActiveStation('OVERVIEW')}
          className="px-3 py-1.5 bg-slate-800 rounded text-xs font-semibold shrink-0"
        >
          Back
        </button>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-2 gap-2.5 content-start py-3 overflow-y-auto">
        {Array.from({ length: 6 }).map((_, index) => {
          const body = coolerCases[index];
          if (!body) {
            return (
              <div
                key={index}
                className="min-h-[8.5rem] rounded-xl bg-gradient-to-b from-slate-900/30 to-cyan-950/20 border border-dashed border-cyan-900/50 flex items-center justify-center text-[10px] text-cyan-900 font-mono shadow-[inset_0_0_24px_rgba(34,211,238,0.05)]"
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
              className={`min-h-[8.5rem] rounded-xl p-3 flex flex-col justify-between relative border-2 transition-all ${
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
                      takeCaseToStation(body.id, 'EMBALMING');
                    }}
                    className="flex-1 text-[10px] py-1.5 bg-emerald-700 rounded font-bold"
                  >
                    Prep
                  </button>
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      takeCaseToStation(body.id, 'CREMATION');
                    }}
                    className="flex-1 text-[10px] py-1.5 bg-orange-700 rounded font-bold"
                  >
                    Cremate
                  </button>
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      takeCaseToStation(body.id, 'SHOWROOM');
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
