import React, { useEffect, useRef, useState } from 'react';
import { CaseTransferBar } from './CaseTransferBar';
import { displayCaseName, decayLabel } from '../types/game';
import { caseAtLocation, useGameStore } from '../store/useGameStore';
import { hapticGlug } from '../utils/haptics';
import {
  calculateEmbalmingTargets,
  calculatePourPhysics,
  evaluateEmbalmingRank,
} from '../utils/mortuaryMath';

type FluidType = 'WATER' | 'FORMALDEHYDE' | 'SOFTENER';

function maxFlowForFluid(fluid: FluidType): number {
  return fluid === 'WATER' ? 95 : 32;
}

function updateProximityFromEvent(
  e: React.PointerEvent,
  container: HTMLDivElement | null,
  setProximity: (v: number) => void
) {
  if (!container) return;
  const rect = container.getBoundingClientRect();
  const normX = (e.clientX - rect.left) / rect.width;
  setProximity(Math.max(0.05, Math.min(1, normX)));
}

export const EmbalmingMiniGame: React.FC = () => {
  const {
    cases,
    activeCaseId,
    completeEmbalming,
    setActiveStation,
    takeCaseToStation,
    focusCase,
  } = useGameStore();
  const currentCase = caseAtLocation(cases, 'EMBALMING', activeCaseId);

  useEffect(() => {
    if (currentCase && currentCase.id !== activeCaseId) {
      focusCase(currentCase.id);
    }
  }, [currentCase, activeCaseId, focusCase]);

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
  const proximityRef = useRef(0);
  const selectedFluidRef = useRef<FluidType>(selectedFluid);

  useEffect(() => {
    proximityRef.current = proximity;
  }, [proximity]);

  useEffect(() => {
    selectedFluidRef.current = selectedFluid;
  }, [selectedFluid]);

  useEffect(() => {
    if (!isPouring) return;
    let lastTime = performance.now();
    const interval = setInterval(() => {
      const now = performance.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      const fluid = selectedFluidRef.current;
      const { currentFlowOzPerSec, isGlugging } = calculatePourPhysics(
        proximityRef.current,
        now / 1000,
        maxFlowForFluid(fluid)
      );

      if (isGlugging && now - lastGlugHaptic.current > 220) {
        lastGlugHaptic.current = now;
        void hapticGlug();
      }

      const addedOz = currentFlowOzPerSec * dt;
      if (addedOz <= 0) return;

      setPoured((prev) => {
        if (fluid === 'WATER')
          return { ...prev, waterOz: prev.waterOz + addedOz };
        if (fluid === 'FORMALDEHYDE')
          return { ...prev, formaldehydeOz: prev.formaldehydeOz + addedOz };
        return { ...prev, softenerOz: prev.softenerOz + addedOz };
      });
    }, 50);

    return () => clearInterval(interval);
  }, [isPouring]);

  if (!currentCase) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/95 text-slate-100 flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-center max-w-md">
          No body on the prep table. Move remains here from the Cooler (Prep) or
          with Move to Cooler / transfer buttons — hub tiles only open rooms.
        </p>
        <button
          type="button"
          onPointerDown={() => setActiveStation('COOLER')}
          className="px-4 py-2 bg-cyan-700 rounded font-semibold"
        >
          Open Cooler
        </button>
      </div>
    );
  }

  if (currentCase.isEmbalmed) {
    return (
      <div className="safe-screen fixed inset-0 z-50 bg-slate-950/95 text-slate-100 flex flex-col select-none">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-emerald-400">
            EMBALMING COMPLETE — {displayCaseName(currentCase)}
          </h2>
          <button
            type="button"
            onPointerDown={() => setActiveStation('OVERVIEW')}
            className="px-4 py-2 bg-slate-800 rounded text-sm"
          >
            Back
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-2xl font-black text-amber-300">
            Rank {currentCase.embalmRank ?? '—'}
          </p>
          <p className="text-sm text-slate-400 max-w-md">
            Embalming result is saved on this case. Return them to refrigeration
            or move to the chapel for viewing.
          </p>
          <CaseTransferBar currentCase={currentCase} />
        </div>
      </div>
    );
  }

  const targets = calculateEmbalmingTargets(
    currentCase.weightLbs,
    currentCase.dehydrationFactor
  );

  const displayedPoured = {
    waterOz: +poured.waterOz.toFixed(1),
    formaldehydeOz: +poured.formaldehydeOz.toFixed(1),
    softenerOz: +poured.softenerOz.toFixed(1),
  };

  const physics = calculatePourPhysics(
    proximity,
    performance.now() / 1000,
    maxFlowForFluid(selectedFluid)
  );
  const embalmLvl = useGameStore.getState().facilityLevels.embalming || 0;
  const embalmBoost =
    embalmLvl <= 0 ? 0 : embalmLvl === 1 ? 0.08 : embalmLvl === 2 ? 0.16 : 0.25;
  const rawEval = evaluateEmbalmingRank(displayedPoured, targets);
  const boostedError = Math.max(0, rawEval.errorPercent * (1 - embalmBoost));
  const evaluationFinal =
    embalmBoost <= 0
      ? rawEval
      : boostedError <= 1.5
        ? {
            ...rawEval,
            rank: 'S+' as const,
            errorPercent: +boostedError.toFixed(2),
            tipMultiplier: 1.5,
          }
        : boostedError <= 4
          ? {
              ...rawEval,
              rank: 'S' as const,
              errorPercent: +boostedError.toFixed(2),
              tipMultiplier: 1.25,
            }
          : boostedError <= 8
            ? {
                ...rawEval,
                rank: 'A' as const,
                errorPercent: +boostedError.toFixed(2),
                tipMultiplier: 1.0,
              }
            : boostedError <= 15
              ? {
                  ...rawEval,
                  rank: 'B' as const,
                  errorPercent: +boostedError.toFixed(2),
                  tipMultiplier: 0.85,
                }
              : boostedError <= 30
                ? {
                    ...rawEval,
                    rank: 'C' as const,
                    errorPercent: +boostedError.toFixed(2),
                    tipMultiplier: 0.6,
                  }
                : {
                    ...rawEval,
                    rank: 'F' as const,
                    errorPercent: +boostedError.toFixed(2),
                    tipMultiplier: 0.2,
                  };
  const label = displayCaseName(currentCase);

  return (
    <div className="safe-screen fixed inset-0 z-50 bg-slate-950/95 text-slate-100 flex flex-col justify-between select-none">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3 gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-emerald-400">
            EMBALMING FLUID MIXER — {label}
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
            {currentCase.decayLevel > 5 && (
              <>
                {' '}
                |{' '}
                <span className="text-red-400 font-semibold">
                  {decayLabel(currentCase.decayLevel)} (
                  {Math.round(currentCase.decayLevel)}%)
                </span>
              </>
            )}
          </p>
          <CaseTransferBar currentCase={currentCase} />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onPointerDown={() =>
              currentCase && takeCaseToStation(currentCase.id, 'COOLER')
            }
            className="px-3 py-2 bg-cyan-800 rounded text-sm active:bg-cyan-700"
          >
            Return Cooler
          </button>
          <button
            type="button"
            onPointerDown={() => setActiveStation('OVERVIEW')}
            className="px-4 py-2 bg-slate-800 rounded text-sm active:bg-slate-700"
          >
            Back
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 md:gap-4 my-3">
        <div className="bg-slate-900 p-3 rounded border border-slate-800">
          <div className="text-xs text-rose-400 uppercase font-bold">
            20-Index Formaldehyde
          </div>
          <div className="text-xl md:text-2xl font-mono">
            {displayedPoured.formaldehydeOz} / {targets.formaldehydeOz} oz
          </div>
        </div>
        <div className="bg-slate-900 p-3 rounded border border-slate-800">
          <div className="text-xs text-violet-400 uppercase font-bold">
            Softener / Humectant
          </div>
          <div className="text-xl md:text-2xl font-mono">
            {displayedPoured.softenerOz} / {targets.softenerOz} oz
          </div>
        </div>
        <div className="bg-slate-900 p-3 rounded border border-slate-800">
          <div className="text-xs text-sky-400 uppercase font-bold">
            Water Dilution
          </div>
          <div className="text-xl md:text-2xl font-mono">
            {displayedPoured.waterOz} / {targets.waterOz} oz
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        onPointerDown={(e) => {
          (e.currentTarget as HTMLDivElement).setPointerCapture?.(e.pointerId);
          setIsPouring(true);
          updateProximityFromEvent(e, containerRef.current, setProximity);
        }}
        onPointerMove={(e) => {
          if (!isPouring && e.buttons === 0) return;
          updateProximityFromEvent(e, containerRef.current, setProximity);
        }}
        onPointerUp={() => setIsPouring(false)}
        onPointerCancel={() => setIsPouring(false)}
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
                ((displayedPoured.waterOz +
                  displayedPoured.formaldehydeOz +
                  displayedPoured.softenerOz) /
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
            completeEmbalming(
              evaluationFinal.rank,
              evaluationFinal.tipMultiplier,
              currentCase.id
            )
          }
          className="px-6 py-2 bg-amber-500 active:bg-amber-400 text-slate-950 font-bold rounded"
        >
          Inject Mixture (Projected Rank: {evaluationFinal.rank} | Error:{' '}
          {evaluationFinal.errorPercent}%
          {embalmBoost > 0 ? ` · bench +${Math.round(embalmBoost * 100)}%` : ''})
        </button>
      </div>
    </div>
  );
};
