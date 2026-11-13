import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import type { SweepTool } from '../types/game';
import { displayCaseName } from '../types/game';
import { hapticIronRake } from '../utils/haptics';
import { getCremationTargets } from '../utils/mortuaryMath';

export const CremationMiniGame: React.FC = () => {
  const { coolerCases, activeCaseId, completeCremation, setActiveStation } =
    useGameStore();
  const currentCase =
    coolerCases.find((c) => c.id === activeCaseId) ?? coolerCases[0] ?? null;

  const [phase, setPhase] = useState<'BURNING' | 'SWEEPING'>('BURNING');
  const [tempF, setTempF] = useState(1100);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [stirCount, setStirCount] = useState(0);
  const [thermalWarnings, setThermalWarnings] = useState(0);
  const [activeTool, setActiveTool] = useState<SweepTool>('IRON_RAKE');
  const [largeBonesLeft, setLargeBonesLeft] = useState(100);
  const [mediumBonesLeft, setMediumBonesLeft] = useState(100);
  const [fineAshLeft, setFineAshLeft] = useState(100);

  const targets = currentCase
    ? getCremationTargets(currentCase.weightLbs)
    : null;
  const progress =
    targets != null
      ? Math.min(1, elapsedSec / targets.targetDurationSec)
      : 0;
  const maxSafeTemp = targets?.getMaxSafeTempF(progress) ?? 1600;

  useEffect(() => {
    if (!targets || phase !== 'BURNING') return;
    const timer = setInterval(() => {
      setElapsedSec((prev) => {
        const burnRate = tempF / 1400;
        return prev + burnRate * 3;
      });

      if (tempF > maxSafeTemp) {
        setThermalWarnings((w) => w + 1);
      }
    }, 300);

    return () => clearInterval(timer);
  }, [phase, tempF, maxSafeTemp, targets]);

  const handleStir = () => {
    setStirCount((s) => s + 1);
    setTempF((t) => Math.max(1000, t - 120));
  };

  const handleSweepPull = () => {
    if (activeTool === 'IRON_RAKE') {
      setLargeBonesLeft((v) => {
        const next = Math.max(0, v - 25);
        if (next < v) void hapticIronRake();
        return next;
      });
    } else if (activeTool === 'BRISTLE_BRUSH' && largeBonesLeft === 0) {
      setMediumBonesLeft((v) => Math.max(0, v - 25));
    } else if (activeTool === 'HAND_BRUSH' && mediumBonesLeft === 0) {
      setFineAshLeft((v) => Math.max(0, v - 25));
    }
  };

  if (!currentCase || !targets) {
    return (
      <div className="fixed inset-0 z-50 bg-stone-950/95 text-stone-100 flex flex-col items-center justify-center gap-4 p-6">
        <p>No body selected. Choose a cooler bay first.</p>
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

  const finishRetortProcess = () => {
    const stirDiff = Math.abs(stirCount - targets.requiredStirs);
    const rank =
      thermalWarnings === 0 && stirDiff === 0
        ? 'S+'
        : thermalWarnings <= 2 && stirDiff <= 1
          ? 'A'
          : 'C';
    completeCremation(rank, currentCase.weightLbs * 15);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/95 text-stone-100 p-4 md:p-6 flex flex-col justify-between select-none">
      <div className="flex justify-between items-center border-b border-stone-800 pb-3 gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-orange-400">
            RETORT CHAMBER — {displayCaseName(currentCase)} (
            {currentCase.weightLbs} lbs)
          </h2>
          <p className="text-xs text-stone-400">
            Directive:{' '}
            <span className="text-amber-300 font-mono">
              {currentCase.directive}
            </span>{' '}
            | Hint: Heavy cases (&gt;200 lbs) require stepped intervals (1,200°F
            → 1,400°F → 1,600°F) | Required stirs: {targets.requiredStirs}
          </p>
        </div>
        <button
          type="button"
          onPointerDown={() => setActiveStation('OVERVIEW')}
          className="px-4 py-2 bg-stone-800 rounded text-sm active:bg-stone-700"
        >
          Abort
        </button>
      </div>

      {phase === 'BURNING' ? (
        <div className="flex-1 flex flex-col justify-around my-4 gap-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-stone-900 p-4 rounded border border-stone-800">
              <div className="text-xs text-stone-400">CHAMBER TEMPERATURE</div>
              <div
                className={`text-3xl font-mono ${
                  tempF > maxSafeTemp
                    ? 'text-red-500 animate-bounce'
                    : 'text-orange-400'
                }`}
              >
                {tempF}°F
              </div>
              <div className="text-xs text-stone-500 mt-1">
                Safe Ceiling at current stage: {maxSafeTemp}°F
              </div>
            </div>

            <div className="bg-stone-900 p-4 rounded border border-stone-800">
              <div className="text-xs text-stone-400">CALCINATION PROGRESS</div>
              <div className="text-3xl font-mono text-amber-300">
                {Math.round(progress * 100)}%
              </div>
              <div className="text-xs text-stone-500 mt-1">
                Stirs: {stirCount}/{targets.requiredStirs} | Thermal Runaways:{' '}
                {thermalWarnings}
              </div>
            </div>

            <div className="bg-stone-900 p-4 rounded border border-stone-800 flex flex-col justify-between gap-2">
              <span className="text-xs text-stone-400">RETORT RAKE STIRRING</span>
              <button
                type="button"
                onPointerDown={handleStir}
                className="py-2 bg-amber-700 active:bg-amber-600 rounded font-bold text-sm"
              >
                Open Sight-Door & Stir Mass (-120°F)
              </button>
            </div>
          </div>

          <div className="bg-stone-900 p-4 rounded border border-stone-800">
            <label className="text-sm font-semibold block mb-2">
              Adjust Burner Valve (1,000°F – 1,600°F):
            </label>
            <input
              type="range"
              min={1000}
              max={1600}
              step={50}
              value={tempF}
              onChange={(e) => setTempF(Number(e.target.value))}
              className="w-full accent-orange-500"
            />
          </div>

          {progress >= 1 && (
            <button
              type="button"
              onPointerDown={() => setPhase('SWEEPING')}
              className="w-full py-3 bg-emerald-600 active:bg-emerald-500 font-bold rounded text-lg"
            >
              Cool Chamber & Begin 3-Tool Retort Sweep →
            </button>
          )}
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-between my-4 gap-3">
          <div className="flex gap-2 md:gap-3 flex-wrap">
            <button
              type="button"
              onPointerDown={() => setActiveTool('IRON_RAKE')}
              className={`flex-1 min-w-[140px] py-2 rounded font-bold ${
                activeTool === 'IRON_RAKE' ? 'bg-orange-600' : 'bg-stone-800'
              }`}
            >
              1. Iron Rake (Large Bones: {largeBonesLeft}%)
            </button>
            <button
              type="button"
              onPointerDown={() => setActiveTool('BRISTLE_BRUSH')}
              className={`flex-1 min-w-[140px] py-2 rounded font-bold ${
                activeTool === 'BRISTLE_BRUSH' ? 'bg-orange-600' : 'bg-stone-800'
              }`}
            >
              2. Iron Bristle Brush (Medium: {mediumBonesLeft}%)
            </button>
            <button
              type="button"
              onPointerDown={() => setActiveTool('HAND_BRUSH')}
              className={`flex-1 min-w-[140px] py-2 rounded font-bold ${
                activeTool === 'HAND_BRUSH' ? 'bg-orange-600' : 'bg-stone-800'
              }`}
            >
              3. Hand Brush (Fine Ash: {fineAshLeft}%)
            </button>
          </div>

          <div
            onPointerDown={handleSweepPull}
            className="flex-1 my-2 bg-stone-900 border-2 border-stone-700 rounded-xl flex flex-col items-center justify-center active:bg-stone-800 touch-none"
          >
            <p className="text-base md:text-lg font-bold text-amber-300 text-center px-4">
              TAP / SWIPE TO PULL REMAINS FROM BACK OF RETORT TOWARD HOPPER
            </p>
            <p className="text-xs text-stone-400 mt-1 text-center px-4">
              Clear Large Bone pieces first, then Medium, then Fine Ash into the
              cooling tray & Ossilegium Commune.
            </p>
          </div>

          {fineAshLeft === 0 && (
            <button
              type="button"
              onPointerDown={finishRetortProcess}
              className="w-full py-3 bg-amber-500 text-stone-950 font-bold rounded text-lg active:bg-amber-400"
            >
              Transfer Tray to Urn Processor →
            </button>
          )}
        </div>
      )}
    </div>
  );
};
