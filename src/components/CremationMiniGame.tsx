import React, { useEffect, useRef, useState } from 'react';
import { CaseTransferBar } from './CaseTransferBar';
import type { Rank, SweepTool } from '../types/game';
import { displayCaseName } from '../types/game';
import { useGameStore } from '../store/useGameStore';
import { hapticIronRake } from '../utils/haptics';
import { getCremationTargets } from '../utils/mortuaryMath';

type BonePhase = 'INTACT' | 'CHARRING' | 'CALCINING' | 'FRAGMENTING' | 'ASH';

/** Playable purge: 8–18s stands in for real-world 1–3 minutes */
function randomPurgeMs(): number {
  return 8000 + Math.floor(Math.random() * 10001);
}

function bonePhaseFromProgress(p: number): BonePhase {
  if (p < 0.15) return 'INTACT';
  if (p < 0.35) return 'CHARRING';
  if (p < 0.6) return 'CALCINING';
  if (p < 0.85) return 'FRAGMENTING';
  return 'ASH';
}

function HoneywellReadout({
  label,
  pv,
  sp,
}: {
  label: string;
  pv: number;
  sp: number;
}) {
  return (
    <div className="bg-zinc-950 border border-zinc-600 rounded p-2 font-mono">
      <div className="text-[9px] uppercase tracking-wider text-zinc-500 mb-1">
        {label}
      </div>
      <div className="flex items-end gap-2">
        <div>
          <div className="text-[8px] text-sky-400">PV</div>
          <div className="text-2xl md:text-3xl text-sky-300 leading-none tabular-nums">
            {Math.round(pv)}
          </div>
        </div>
        <div className="pb-0.5">
          <div className="text-[8px] text-amber-400">SP</div>
          <div className="text-sm text-amber-300 tabular-nums">
            {Math.round(sp)}
          </div>
        </div>
      </div>
      <div className="text-[8px] text-zinc-600 mt-1">Honeywell · Millennium</div>
    </div>
  );
}

function PushButton({
  color,
  label,
  onPress,
  disabled,
}: {
  color: 'green' | 'red' | 'silver';
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  const bg =
    color === 'green'
      ? 'bg-emerald-500 border-emerald-300 shadow-emerald-900/50'
      : color === 'red'
        ? 'bg-red-600 border-red-300 shadow-red-950/50'
        : 'bg-zinc-300 border-zinc-100 text-zinc-900 shadow-zinc-900/40';
  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={onPress}
      className={`w-12 h-12 md:w-14 md:h-14 rounded-full border-4 ${bg} shadow-inner font-black text-[9px] md:text-[10px] leading-tight active:scale-95 disabled:opacity-35 disabled:active:scale-100`}
    >
      {label}
    </button>
  );
}

function StatusLamp({
  on,
  color,
  label,
}: {
  on: boolean;
  color: 'white' | 'amber' | 'green';
  label: string;
}) {
  const lit =
    color === 'amber'
      ? 'bg-amber-400 shadow-[0_0_12px_#fbbf24]'
      : color === 'green'
        ? 'bg-emerald-400 shadow-[0_0_12px_#34d399]'
        : 'bg-zinc-100 shadow-[0_0_10px_#f4f4f5]';
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`w-4 h-4 rounded-full border border-zinc-700 transition-all ${
          on ? lit : 'bg-zinc-800'
        } ${on && color === 'amber' ? 'animate-pulse' : ''}`}
      />
      <span className="text-[8px] uppercase tracking-wide text-zinc-400">
        {label}
      </span>
    </div>
  );
}

export const CremationMiniGame: React.FC = () => {
  const {
    cases,
    activeCaseId,
    completeCremation,
    setActiveStation,
    takeActiveCaseToStation,
  } = useGameStore();

  const currentCase =
    cases.find((c) => c.id === activeCaseId) ??
    cases.find((c) => c.location === 'CREMATION') ??
    null;

  const targets = currentCase
    ? getCremationTargets(currentCase.weightLbs)
    : null;

  // —— Millennium panel state ——
  const [blowerOn, setBlowerOn] = useState(false);
  const [purging, setPurging] = useState(false);
  const [heated, setHeated] = useState(false);
  const [purgeEndsAt, setPurgeEndsAt] = useState<number | null>(null);

  const [secondaryOn, setSecondaryOn] = useState(false);
  const [primaryOn, setPrimaryOn] = useState(false);
  const [secondaryTemp, setSecondaryTemp] = useState(72);
  const [primaryTemp, setPrimaryTemp] = useState(72);
  const secondarySp = 1700;
  const primarySp = 1600;

  const [doorOpen, setDoorOpen] = useState(0); // 0 closed … 1 fully up
  const [doorMoving, setDoorMoving] = useState<'UP' | 'DOWN' | null>(null);

  const [elapsedSec, setElapsedSec] = useState(0);
  const [stirCount, setStirCount] = useState(0);
  const [earlyPrimaryStarts, setEarlyPrimaryStarts] = useState(0);
  const [thermalWarnings, setThermalWarnings] = useState(0);
  const [phase, setPhase] = useState<'LOAD' | 'BURN' | 'SWEEP' | 'DONE'>('LOAD');

  const [activeTool, setActiveTool] = useState<SweepTool | null>(null);
  const [rakeHeld, setRakeHeld] = useState(false);
  const [rakePos, setRakePos] = useState({ x: 50, y: 40 });
  const [lastStirAt, setLastStirAt] = useState(0);

  const [largeBonesLeft, setLargeBonesLeft] = useState(100);
  const [mediumBonesLeft, setMediumBonesLeft] = useState(100);
  const [fineAshLeft, setFineAshLeft] = useState(100);

  const chamberRef = useRef<HTMLDivElement>(null);
  const lastHaptic = useRef(0);

  const progress =
    targets != null
      ? Math.min(1, elapsedSec / targets.targetDurationSec)
      : 0;
  const bonePhase = bonePhaseFromProgress(progress);
  const maxSafeTemp = targets?.getMaxSafeTempF(progress) ?? 1600;
  const canStartSecondary = heated && secondaryTemp >= 780;
  const canStartPrimary =
    secondaryOn && secondaryTemp >= 800 && !purging;

  // Purge countdown
  useEffect(() => {
    if (!purging || purgeEndsAt == null) return;
    const id = setInterval(() => {
      if (Date.now() >= purgeEndsAt) {
        setPurging(false);
        setHeated(true);
        setPurgeEndsAt(null);
      }
    }, 200);
    return () => clearInterval(id);
  }, [purging, purgeEndsAt]);

  // Door motion
  useEffect(() => {
    if (!doorMoving) return;
    const id = setInterval(() => {
      setDoorOpen((v) => {
        if (doorMoving === 'UP') {
          const next = Math.min(1, v + 0.04);
          if (next >= 1) setDoorMoving(null);
          return next;
        }
        const next = Math.max(0, v - 0.04);
        if (next <= 0) setDoorMoving(null);
        return next;
      });
    }, 40);
    return () => clearInterval(id);
  }, [doorMoving]);

  // Temperature & burn loop
  useEffect(() => {
    if (!currentCase || !targets) return;
    const id = setInterval(() => {
      setSecondaryTemp((t) => {
        if (secondaryOn) {
          const rise = 18 + Math.random() * 10;
          return Math.min(secondarySp + 40, t + rise);
        }
        if (blowerOn && heated) return Math.min(820, t + 6);
        if (blowerOn) return Math.min(200, t + 2);
        return Math.max(72, t - 4);
      });

      setPrimaryTemp((t) => {
        if (primaryOn) {
          // Below 850°F ignition quality penalty → slower climb
          const slow =
            secondaryTemp < 850 || earlyPrimaryStarts > 0 ? 0.55 : 1;
          const rise = (14 + Math.random() * 12) * slow;
          return Math.min(primarySp + 60, t + rise);
        }
        if (secondaryOn) return Math.min(400, Math.max(t, t + 1));
        return Math.max(72, t - 5);
      });

      if (phase === 'BURN' && primaryOn && doorOpen < 0.15) {
        const burnRate =
          (primaryTemp / 1400) *
          (secondaryTemp >= 850 ? 1 : 0.65) *
          (earlyPrimaryStarts > 0 ? 0.85 : 1);
        setElapsedSec((prev) => prev + burnRate * 2.8);

        if (primaryTemp > maxSafeTemp) {
          setThermalWarnings((w) => w + 1);
        }
      }
    }, 280);
    return () => clearInterval(id);
  }, [
    currentCase,
    targets,
    secondaryOn,
    primaryOn,
    blowerOn,
    heated,
    phase,
    doorOpen,
    primaryTemp,
    secondaryTemp,
    earlyPrimaryStarts,
    maxSafeTemp,
    secondarySp,
    primarySp,
  ]);

  const startBlower = () => {
    if (blowerOn) return;
    setBlowerOn(true);
    setPurging(true);
    setHeated(false);
    setPurgeEndsAt(Date.now() + randomPurgeMs());
  };

  const stopBlower = () => {
    setBlowerOn(false);
    setPurging(false);
    setHeated(false);
    setPurgeEndsAt(null);
    setSecondaryOn(false);
    setPrimaryOn(false);
  };

  const startSecondary = () => {
    if (!canStartSecondary && !heated) return;
    if (!heated) return;
    setSecondaryOn(true);
    if (phase === 'LOAD' && doorOpen < 0.2) setPhase('BURN');
  };

  const startPrimary = () => {
    if (!canStartPrimary) return;
    if (secondaryTemp < 850) {
      setEarlyPrimaryStarts((n) => n + 1);
    }
    setPrimaryOn(true);
    if (phase === 'LOAD') setPhase('BURN');
  };

  const handleRakeMove = (clientX: number, clientY: number) => {
    if (!chamberRef.current || !rakeHeld || activeTool !== 'IRON_RAKE') return;
    if (doorOpen < 0.35 || !primaryOn) return;
    const rect = chamberRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    const prev = rakePos;
    setRakePos({ x, y });
    const dist = Math.hypot(x - prev.x, y - prev.y);
    if (dist > 8 && Date.now() - lastStirAt > 400) {
      setStirCount((s) => s + 1);
      setLastStirAt(Date.now());
      setPrimaryTemp((t) => Math.max(900, t - 90));
      if (Date.now() - lastHaptic.current > 180) {
        lastHaptic.current = Date.now();
        void hapticIronRake();
      }
    }
  };

  const handleSweepStroke = () => {
    if (!activeTool) return;
    if (activeTool === 'IRON_RAKE') {
      setLargeBonesLeft((v) => {
        const next = Math.max(0, v - 20);
        if (next < v) void hapticIronRake();
        return next;
      });
    } else if (activeTool === 'BRISTLE_BRUSH' && largeBonesLeft === 0) {
      setMediumBonesLeft((v) => Math.max(0, v - 22));
    } else if (activeTool === 'HAND_BRUSH' && mediumBonesLeft === 0) {
      setFineAshLeft((v) => Math.max(0, v - 25));
    }
  };

  const finishRetortProcess = () => {
    if (!currentCase || !targets) return;
    const stirDiff = Math.abs(stirCount - targets.requiredStirs);
    let rank: Rank =
      thermalWarnings === 0 && stirDiff === 0 && earlyPrimaryStarts === 0
        ? 'S+'
        : thermalWarnings <= 1 && stirDiff <= 1 && earlyPrimaryStarts === 0
          ? 'S'
          : thermalWarnings <= 3 && stirDiff <= 2
            ? 'A'
            : earlyPrimaryStarts > 0 || thermalWarnings > 5
              ? 'C'
              : 'B';
    if (earlyPrimaryStarts > 1) {
      rank = rank === 'S+' || rank === 'S' ? 'B' : rank === 'A' ? 'C' : 'F';
    }
    completeCremation(rank, currentCase.weightLbs * 15);
    setPhase('DONE');
  };

  if (!currentCase || !targets) {
    return (
      <div className="fixed inset-0 z-50 bg-stone-950/95 text-stone-100 flex flex-col items-center justify-center gap-4 p-6">
        <p>No case in the crematory. Take remains from the Cooler.</p>
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

  if (currentCase.isCremated || phase === 'DONE') {
    return (
      <div className="fixed inset-0 z-50 bg-stone-950/95 text-stone-100 p-4 md:p-6 pb-24 flex flex-col select-none">
        <div className="flex justify-between border-b border-stone-800 pb-3">
          <h2 className="text-lg font-bold text-orange-400">
            CREMATION COMPLETE — {displayCaseName(currentCase)}
          </h2>
          <button
            type="button"
            onPointerDown={() => setActiveStation('OVERVIEW')}
            className="px-4 py-2 bg-stone-800 rounded text-sm"
          >
            Main Menu
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-3xl font-black text-amber-300">
            Rank {currentCase.cremationRank ?? '—'}
          </p>
          <p className="text-sm text-stone-400">
            Result saved on this case. Process ash into an urn next.
          </p>
          <button
            type="button"
            onPointerDown={() => takeActiveCaseToStation('URN_FILLING')}
            className="px-6 py-3 bg-amber-500 text-stone-950 font-bold rounded"
          >
            Open Urn Processor →
          </button>
          <CaseTransferBar currentCase={currentCase} />
        </div>
      </div>
    );
  }

  const purgeSecLeft =
    purging && purgeEndsAt
      ? Math.max(0, Math.ceil((purgeEndsAt - Date.now()) / 1000))
      : 0;

  return (
    <div className="fixed inset-0 z-50 bg-[#1a2e1a] text-stone-100 p-2 md:p-4 pb-24 flex flex-col select-none overflow-hidden">
      <div className="flex justify-between items-start gap-2 mb-2 shrink-0">
        <div>
          <h2 className="text-sm md:text-lg font-bold text-orange-300 tracking-wide">
            MILLENNIUM RETORT — {displayCaseName(currentCase)} (
            {currentCase.weightLbs} lbs)
          </h2>
          <p className="text-[10px] text-stone-400">
            Required stirs: {targets.requiredStirs} · Progress{' '}
            {Math.round(progress * 100)}% · Bone state: {bonePhase}
            {earlyPrimaryStarts > 0 && (
              <span className="text-amber-400">
                {' '}
                · Early primary ignition (−quality)
              </span>
            )}
          </p>
          <CaseTransferBar currentCase={currentCase} />
        </div>
        <button
          type="button"
          onPointerDown={() => takeActiveCaseToStation('COOLER')}
          className="px-3 py-2 bg-stone-800 rounded text-xs"
        >
          Abort → Cooler
        </button>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-2 md:gap-3">
        {/* Chamber + tools */}
        <div className="flex flex-col min-h-0 gap-2">
          <div
            ref={chamberRef}
            className="relative flex-1 min-h-[220px] rounded-lg border-4 border-zinc-700 bg-gradient-to-b from-zinc-900 via-stone-950 to-black overflow-hidden touch-none"
            onPointerDown={(e) => {
              if (phase === 'SWEEP') {
                handleSweepStroke();
                return;
              }
              if (activeTool === 'IRON_RAKE' && doorOpen > 0.35) {
                setRakeHeld(true);
                (e.currentTarget as HTMLElement).setPointerCapture?.(
                  e.pointerId
                );
                handleRakeMove(e.clientX, e.clientY);
              }
            }}
            onPointerMove={(e) => {
              if (rakeHeld) handleRakeMove(e.clientX, e.clientY);
            }}
            onPointerUp={() => setRakeHeld(false)}
            onPointerCancel={() => setRakeHeld(false)}
          >
            {/* Vertical refractory door */}
            <div
              className="absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-zinc-500 via-zinc-600 to-zinc-800 border-b-4 border-zinc-900 shadow-2xl transition-none"
              style={{
                height: `${Math.max(0, (1 - doorOpen) * 100)}%`,
              }}
            >
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono text-zinc-300 tracking-widest">
                REFRACTORY DOOR {Math.round(doorOpen * 100)}%
              </div>
            </div>

            {/* Flames */}
            {(primaryOn || secondaryOn) && doorOpen < 0.9 && (
              <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute bottom-0 w-8 md:w-12 rounded-t-full opacity-80 animate-pulse"
                    style={{
                      left: `${8 + i * 13}%`,
                      height: `${30 + (i % 3) * 18 + (primaryOn ? 20 : 0)}%`,
                      background:
                        'linear-gradient(to top, #ea580c, #fbbf24, transparent)',
                      animationDelay: `${i * 0.12}s`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Remains / bones */}
            <div className="absolute inset-0 z-20 flex items-end justify-center pb-6 pointer-events-none">
              {bonePhase === 'INTACT' && (
                <div className="w-40 h-16 md:w-56 md:h-20 bg-stone-300/80 rounded-sm shadow-inner" />
              )}
              {bonePhase === 'CHARRING' && (
                <div className="w-40 h-14 md:w-52 md:h-16 bg-stone-800 rounded-sm border border-orange-700/50" />
              )}
              {bonePhase === 'CALCINING' && (
                <div className="flex gap-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-3 h-10 md:w-4 md:h-14 bg-stone-200/70 rounded-sm rotate-12"
                      style={{ transform: `rotate(${-20 + i * 10}deg)` }}
                    />
                  ))}
                </div>
              )}
              {bonePhase === 'FRAGMENTING' && (
                <div className="flex flex-wrap gap-1 w-48 justify-center">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <div
                      key={i}
                      className="w-2 h-3 bg-stone-300/80 rounded-sm"
                    />
                  ))}
                </div>
              )}
              {bonePhase === 'ASH' && (
                <div className="w-44 h-8 bg-stone-500/70 rounded-full blur-[1px]" />
              )}
            </div>

            {/* Iron rake overlay */}
            {activeTool === 'IRON_RAKE' && doorOpen > 0.3 && phase !== 'SWEEP' && (
              <div
                className="absolute z-40 pointer-events-none"
                style={{
                  left: `${rakePos.x}%`,
                  top: `${rakePos.y}%`,
                  transform: 'translate(-10%, -50%) rotate(-12deg)',
                }}
              >
                <div className="flex items-center">
                  <div className="w-36 md:w-48 h-1.5 bg-gradient-to-r from-zinc-400 to-zinc-600 rounded-full shadow-lg" />
                  <div className="w-8 h-4 border-2 border-zinc-400 rounded-sm bg-zinc-700 -ml-1" />
                </div>
                {rakeHeld && (
                  <div className="text-[9px] text-amber-300 mt-1 font-bold">
                    STIRRING
                  </div>
                )}
              </div>
            )}

            {phase === 'SWEEP' && (
              <div className="absolute inset-0 z-25 flex items-center justify-center bg-black/40">
                <p className="text-center text-amber-200 font-bold px-4 text-sm md:text-base">
                  Tap chamber to sweep with selected tool
                  <br />
                  <span className="text-xs font-normal text-stone-300">
                    Large {largeBonesLeft}% · Med {mediumBonesLeft}% · Fine{' '}
                    {fineAshLeft}%
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* Wall tool rack */}
          <div className="shrink-0 flex items-stretch gap-2 bg-stone-900/80 border border-stone-700 rounded-lg p-2">
            <span className="text-[9px] uppercase tracking-widest text-stone-500 writing-mode-vertical self-center px-1">
              Tool Rack
            </span>
            {(
              [
                {
                  id: 'IRON_RAKE' as const,
                  name: 'Iron Rake',
                  hint: 'Hold & drag to stir',
                },
                {
                  id: 'BRISTLE_BRUSH' as const,
                  name: 'Bristle Brush',
                  hint: 'Medium fragments',
                },
                {
                  id: 'HAND_BRUSH' as const,
                  name: 'Hand Brush',
                  hint: 'Fine ash',
                },
              ] as const
            ).map((tool) => (
              <button
                key={tool.id}
                type="button"
                onPointerDown={() =>
                  setActiveTool((t) => (t === tool.id ? null : tool.id))
                }
                className={`flex-1 py-2 px-2 rounded border-2 text-left ${
                  activeTool === tool.id
                    ? 'border-amber-400 bg-amber-950/50'
                    : 'border-stone-600 bg-stone-800'
                }`}
              >
                <div className="text-xs font-bold">{tool.name}</div>
                <div className="text-[9px] text-stone-400">{tool.hint}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Control panel — vertical Millennium plate */}
        <div className="shrink-0 lg:overflow-y-auto rounded-lg bg-gradient-to-b from-zinc-300 via-zinc-400 to-zinc-500 border-2 border-zinc-600 shadow-xl p-3 text-zinc-900 max-h-[42vh] lg:max-h-none">
          <div className="text-center text-[10px] font-black tracking-[0.2em] text-zinc-700 mb-2">
            BLOWER
          </div>
          <div className="flex justify-center gap-4 mb-2">
            <PushButton color="green" label="START" onPress={startBlower} />
            <PushButton color="red" label="STOP" onPress={stopBlower} />
          </div>
          <div className="flex justify-center gap-5 mb-3">
            <StatusLamp on={blowerOn && !purging} color="white" label="Ready" />
            <StatusLamp
              on={purging}
              color="amber"
              label={purging ? `Purging ${purgeSecLeft}s` : 'Purging'}
            />
            <StatusLamp on={heated && !purging} color="green" label="Heated" />
          </div>

          <div className="h-px bg-zinc-600/50 my-2" />

          <div className="text-center text-[9px] font-black tracking-wider text-zinc-700 mb-1">
            SECONDARY CHAMBER TEMPERATURE CONTROLLER
          </div>
          <div className="flex justify-center gap-3 mb-1">
            <PushButton
              color="green"
              label="START"
              onPress={startSecondary}
              disabled={!heated}
            />
            <PushButton
              color="red"
              label="STOP"
              onPress={() => {
                setSecondaryOn(false);
                setPrimaryOn(false);
              }}
            />
          </div>
          <HoneywellReadout
            label="Afterburner"
            pv={secondaryTemp}
            sp={secondarySp}
          />
          <p className="text-[8px] text-center text-zinc-700 mt-1 mb-2">
            Reach ~800°F before primary. Ideal ignition ≥850°F.
          </p>

          <div className="h-px bg-zinc-600/50 my-2" />

          <div className="text-center text-[9px] font-black tracking-wider text-zinc-700 mb-1">
            PRIMARY CHAMBER TEMPERATURE CONTROLLER
          </div>
          <div className="flex justify-center gap-3 mb-1">
            <PushButton
              color="green"
              label="START"
              onPress={startPrimary}
              disabled={!canStartPrimary}
            />
            <PushButton
              color="red"
              label="STOP"
              onPress={() => setPrimaryOn(false)}
            />
          </div>
          <HoneywellReadout
            label="Main Chamber"
            pv={primaryTemp}
            sp={primarySp}
          />
          <p className="text-[8px] text-center text-zinc-700 mt-1 mb-2">
            Stirs {stirCount}/{targets.requiredStirs} · Runaways {thermalWarnings}
            {secondaryTemp < 850 && secondaryOn && (
              <span className="block text-amber-800 font-bold">
                Secondary below 850°F — slow burn / quality risk
              </span>
            )}
          </p>

          <div className="h-px bg-zinc-600/50 my-2" />

          <div className="text-center text-[10px] font-black tracking-[0.2em] text-zinc-700 mb-2">
            DOOR
          </div>
          <div className="flex justify-center gap-4 mb-3">
            <PushButton
              color="silver"
              label="UP"
              onPress={() => setDoorMoving('UP')}
            />
            <PushButton
              color="silver"
              label="DOWN"
              onPress={() => setDoorMoving('DOWN')}
            />
          </div>

          <div className="text-[7px] text-center text-zinc-700 leading-tight border-t border-zinc-600/40 pt-2">
            CREMATORY MANUFACTURING AND SERVICE, INC.
            <br />
            TULSA, OKLAHOMA · MILLENNIUM
          </div>

          {progress >= 1 && phase === 'BURN' && (
            <button
              type="button"
              onPointerDown={() => {
                setPrimaryOn(false);
                setSecondaryOn(false);
                setDoorMoving('UP');
                setPhase('SWEEP');
                setActiveTool('IRON_RAKE');
              }}
              className="mt-3 w-full py-2 bg-emerald-700 text-white font-bold rounded text-xs"
            >
              Cool & Begin 3-Tool Sweep →
            </button>
          )}

          {phase === 'SWEEP' && fineAshLeft === 0 && (
            <button
              type="button"
              onPointerDown={finishRetortProcess}
              className="mt-3 w-full py-2 bg-amber-500 text-zinc-950 font-bold rounded text-xs"
            >
              Transfer Tray to Urn Processor →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
