import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { hapticGlug } from '../utils/haptics';
import {
  calculateEmbalmingTargets,
  calculatePourPhysics,
  evaluateEmbalmingRank,
} from '../utils/mortuaryMath';

type FluidType = 'WATER' | 'FORMALDEHYDE' | 'SOFTENER';

export const EmbalmingMiniGame: React.FC = () => {
  const { currentCase, completeEmbalming, setActiveStation } = useGameStore();
  const targets = calculateEmbalmingTargets(
    currentCase.weightLbs,
    currentCase.dehydrationFactor
  );

  const [selectedFluid, setSelectedFluid] = useState<FluidType>('FORMALDEHYDE');
  const [poured, setPoured] = useState({
    waterOz: 0,
    formaldehydeOz: 0,
    softenerOz: 0,
  });

  const [isPouring, setIsPouring] = useState(false);
  const [proximity, setProximity] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastGlugHaptic = useRef(0);

  useEffect(() => {
    if (!isPouring) return;
    let lastTime = performance.now();
    const interval = setInterval(() => {
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const { currentFlowOzPerSec, isGlugging } = calculatePourPhysics(
        proximity,
        now / 1000,
        selectedFluid === 'WATER' ? 95 : 32
      );

      if (isGlugging && now - lastGlugHaptic.current > 220) {
        lastGlugHaptic.current = now;
        void hapticGlug();
      }

      const addedOz = currentFlowOzPerSec * dt;

      setPoured((prev) => {
        if (selectedFluid === 'WATER')
          return { ...prev, waterOz: +(prev.waterOz + addedOz).toFixed(1) };
        if (selectedFluid === 'FORMALDEHYDE')
          return {
            ...prev,
            formaldehydeOz: +(prev.formaldehydeOz + addedOz).toFixed(1),
          };
        return { ...prev, softenerOz: +(prev.softenerOz + addedOz).toFixed(1) };
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPouring, proximity, selectedFluid]);

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isPouring || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const normX = (e.clientX - rect.left) / rect.width;
    setProximity(Math.max(0.05, Math.min(1, normX)));
  };

  const physics = calculatePourPhysics(proximity, performance.now() / 1000);
  const evaluation = evaluateEmbalmingRank(poured, targets);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 text-slate-100 p-4 md:p-6 flex flex-col justify-between select-none">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3 gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-emerald-400">
            EMBALMING FLUID MIXER — {currentCase.name}
          </h2>
          <p className="text-sm text-slate-400">
            Weight:{' '}
            <span className="text-white font-semibold">
              {currentCase.weightLbs} lbs
            </span>{' '}
            | Condition:{' '}
            <span className="text-amber-300 font-semibold">
              {currentCase.tissueCondition}
            </span>{' '}
            (Factor ×{currentCase.dehydrationFactor})
          </p>
        </div>
        <button
          type="button"
          onPointerDown={() => setActiveStation('OVERVIEW')}
          className="px-4 py-2 bg-slate-800 rounded text-sm active:bg-slate-700"
        >
          Back to Mortuary
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-4 my-3">
        <div className="bg-slate-900 p-3 rounded border border-slate-800">
          <div className="text-xs text-rose-400 uppercase font-bold">
            20-Index Formaldehyde
          </div>
          <div className="text-xl md:text-2xl font-mono">
            {poured.formaldehydeOz} / {targets.formaldehydeOz} oz
          </div>
        </div>
        <div className="bg-slate-900 p-3 rounded border border-slate-800">
          <div className="text-xs text-violet-400 uppercase font-bold">
            Softener / Humectant
          </div>
          <div className="text-xl md:text-2xl font-mono">
            {poured.softenerOz} / {targets.softenerOz} oz
          </div>
        </div>
        <div className="bg-slate-900 p-3 rounded border border-slate-800">
          <div className="text-xs text-sky-400 uppercase font-bold">
            Water Dilution
          </div>
          <div className="text-xl md:text-2xl font-mono">
            {poured.waterOz} / {targets.waterOz} oz
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        onPointerDown={(e) => {
          setIsPouring(true);
          handlePointerMove(e);
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={() => setIsPouring(false)}
        onPointerLeave={() => setIsPouring(false)}
        className="relative flex-1 bg-slate-900 rounded-xl border-2 border-dashed border-slate-700 flex items-center justify-between px-6 md:px-12 overflow-hidden touch-none"
      >
        <div className="z-10 pointer-events-none max-w-[60%]">
          <p className="text-xs md:text-sm uppercase tracking-wider text-slate-400">
            TAP, HOLD & DRAG RIGHT TOWARD EMBALMING MACHINE TO TIP BOTTLE FASTER
          </p>
          <p className="text-base md:text-lg font-mono text-emerald-300 mt-1">
            Bottle Tilt: {isPouring ? `${physics.tiltDegrees}°` : '0°'} | Flow
            Rate:{' '}
            {isPouring ? `${physics.currentFlowOzPerSec} oz/s` : '0 oz/s'}{' '}
            {physics.isGlugging && isPouring && (
              <span className="text-amber-400 font-bold animate-pulse">
                [GLUGGING!]
              </span>
            )}
          </p>
        </div>

        <div className="w-28 h-36 md:w-36 md:h-44 border-4 border-slate-400 rounded-b-lg relative bg-slate-950 flex flex-col justify-end overflow-hidden">
          <div
            style={{
              height: `${Math.min(
                100,
                ((poured.waterOz + poured.formaldehydeOz + poured.softenerOz) /
                  targets.totalVolumeOz) *
                  100
              )}%`,
            }}
            className="w-full bg-gradient-to-t from-rose-600/80 via-violet-500/70 to-sky-400/70 transition-all"
          />
          <span className="absolute inset-0 flex items-center justify-center text-xs font-mono text-white drop-shadow">
            TANK
          </span>
        </div>
      </div>

      <div className="flex flex-wrap justify-between items-center mt-4 gap-3">
        <div className="flex gap-2 flex-wrap">
          {(['FORMALDEHYDE', 'SOFTENER', 'WATER'] as FluidType[]).map(
            (fluid) => (
              <button
                key={fluid}
                type="button"
                onPointerDown={() => setSelectedFluid(fluid)}
                className={`px-4 py-2 rounded font-semibold text-sm ${
                  selectedFluid === fluid
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                Select {fluid}
              </button>
            )
          )}
        </div>

        <button
          type="button"
          onPointerDown={() =>
            completeEmbalming(evaluation.rank, evaluation.tipMultiplier)
          }
          className="px-6 py-2 bg-amber-500 active:bg-amber-400 text-slate-950 font-bold rounded"
        >
          Inject Mixture (Projected Rank: {evaluation.rank} | Error:{' '}
          {evaluation.errorPercent}%)
        </button>
      </div>
    </div>
  );
};
