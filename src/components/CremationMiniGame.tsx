import React, { useEffect, useRef, useState } from 'react';
import { CaseTransferBar } from './CaseTransferBar';
import type { Rank, SweepTool } from '../types/game';
import { displayCaseName } from '../types/game';
import { caseAtLocation, useGameStore } from '../store/useGameStore';
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
  compact,
}: {
  label: string;
  pv: number;
  sp: number;
  compact?: boolean;
}) {
  return (
    <div className="bg-zinc-950 border border-zinc-600 rounded p-2 font-mono">
      <div className="text-[9px] uppercase tracking-wider text-zinc-500 mb-1">
        {label}
      </div>
      <div className="flex items-end gap-2">
        <div>
          <div className="text-[8px] text-sky-400">PV</div>
          <div
            className={`${compact ? 'text-xl' : 'text-3xl'} text-sky-300 leading-none tabular-nums`}
          >
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
  size = 'md',
}: {
  color: 'green' | 'red' | 'silver';
  label: string;
  onPress: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}) {
  const bg =
    color === 'green'
      ? 'bg-emerald-500 border-emerald-300 shadow-emerald-900/50'
      : color === 'red'
        ? 'bg-red-600 border-red-300 shadow-red-950/50'
        : 'bg-zinc-300 border-zinc-100 text-zinc-900 shadow-zinc-900/40';
  const dim = size === 'sm' ? 'w-10 h-10 text-[8px]' : 'w-14 h-14 text-[10px]';
  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPress();
      }}
      className={`${dim} rounded-full border-4 ${bg} shadow-inner font-black leading-tight active:scale-95 disabled:opacity-35 disabled:active:scale-100`}
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
  color: 'white' | 'amber' | 'green' | 'red';
  label: string;
}) {
  const lit =
    color === 'amber'
      ? 'bg-amber-400 shadow-[0_0_12px_#fbbf24]'
      : color === 'green'
        ? 'bg-emerald-400 shadow-[0_0_12px_#34d399]'
        : color === 'red'
          ? 'bg-red-500 shadow-[0_0_12px_#ef4444]'
          : 'bg-zinc-100 shadow-[0_0_10px_#f4f4f5]';
  return (
    <div className="flex flex-col items-center gap-1 min-w-0">
      <div
        className={`w-4 h-4 rounded-full border border-zinc-700 transition-all ${
          on ? lit : 'bg-zinc-800'
        } ${on && (color === 'amber' || color === 'red') ? 'animate-pulse' : ''}`}
      />
      <span className="text-[8px] uppercase tracking-wide text-zinc-500 text-center leading-tight">
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
    takeCaseToStation,
    selectActiveCase,
  } = useGameStore();

  const currentCase = caseAtLocation(cases, 'CREMATION', activeCaseId);

  useEffect(() => {
    if (currentCase && currentCase.id !== activeCaseId) {
      selectActiveCase(currentCase.id);
    }
  }, [currentCase, activeCaseId, selectActiveCase]);

  const targets = currentCase
    ? getCremationTargets(currentCase.weightLbs)
    : null;

  const [panelZoomed, setPanelZoomed] = useState(false);

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

  const [doorOpen, setDoorOpen] = useState(0);
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
  const [boneNudge, setBoneNudge] = useState(0);

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
  const canStartPrimary =
    secondaryOn && secondaryTemp >= 800 && !purging;

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

  useEffect(() => {
    if (!currentCase || !targets) return;
    const id = setInterval(() => {
      setSecondaryTemp((t) => {
        if (secondaryOn) {
          return Math.min(secondarySp + 40, t + 18 + Math.random() * 10);
        }
        if (blowerOn && heated) return Math.min(820, t + 6);
        if (blowerOn) return Math.min(200, t + 2);
        return Math.max(72, t - 4);
      });

      setPrimaryTemp((t) => {
        if (primaryOn) {
          const slow =
            secondaryTemp < 850 || earlyPrimaryStarts > 0 ? 0.55 : 1;
          return Math.min(primarySp + 60, t + (14 + Math.random() * 12) * slow);
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
    if (!heated) return;
    setSecondaryOn(true);
    if (phase === 'LOAD' && doorOpen < 0.2) setPhase('BURN');
  };

  const startPrimary = () => {
    if (!canStartPrimary) return;
    if (secondaryTemp < 850) setEarlyPrimaryStarts((n) => n + 1);
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
      setBoneNudge((n) => n + 1);
      setPrimaryTemp((t) => Math.max(900, t - 90));
      if (Date.now() - lastHaptic.current > 180) {
        lastHaptic.current = Date.now();
        void hapticIronRake();
      }
    }
  };

  const handleSweepStroke = () => {
    if (!activeTool) return;
    setBoneNudge((n) => n + 1);
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
    completeCremation(rank, currentCase.weightLbs * 15, currentCase.id);
    setPhase('DONE');
  };

  if (!currentCase || !targets) {
    return (
      <div className="fixed inset-0 z-50 bg-stone-950/95 text-stone-100 flex flex-col items-center justify-center gap-4 p-6 pb-28">
        <p className="text-center max-w-sm text-sm">
          No case loaded in the crematory. Move remains here from the Cooler
          (Cremate).
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

  if (currentCase.isCremated || phase === 'DONE') {
    return (
      <div className="fixed inset-0 z-50 bg-stone-950/95 text-stone-100 p-4 pb-28 flex flex-col select-none">
        <div className="flex justify-between border-b border-stone-800 pb-3 gap-2">
          <h2 className="text-base font-bold text-orange-400">
            CREMATION COMPLETE — {displayCaseName(currentCase)}
          </h2>
          <button
            type="button"
            onPointerDown={() => setActiveStation('OVERVIEW')}
            className="px-3 py-2 bg-stone-800 rounded text-xs shrink-0"
          >
            Menu
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <p className="text-3xl font-black text-amber-300">
            Rank {currentCase.cremationRank ?? '—'}
          </p>
          <button
            type="button"
            onPointerDown={() =>
              takeCaseToStation(currentCase.id, 'URN_FILLING')
            }
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

  const controlPanel = (zoomed: boolean) => (
    <div
      className={`bg-gradient-to-b from-zinc-300 via-zinc-400 to-zinc-500 border-2 border-zinc-600 shadow-xl text-zinc-900 overflow-y-auto ${
        zoomed ? 'flex-1 p-4 rounded-xl' : 'w-[30%] max-w-[120px] p-1.5 rounded-lg'
      }`}
      onPointerDown={(e) => {
        if (!zoomed) {
          e.stopPropagation();
          setPanelZoomed(true);
        }
      }}
    >
      {zoomed && (
        <button
          type="button"
          onPointerDown={(e) => {
            e.stopPropagation();
            setPanelZoomed(false);
          }}
          className="mb-3 w-full py-2 bg-zinc-800 text-zinc-100 rounded font-bold text-xs"
        >
          ← Back to Retort View
        </button>
      )}
      {!zoomed && (
        <div className="text-[7px] font-black text-center text-zinc-700 mb-1 leading-tight">
          TAP TO OPERATE
        </div>
      )}

      <div
        className={`text-center font-black tracking-[0.15em] text-zinc-700 ${zoomed ? 'text-[11px] mb-2' : 'text-[7px] mb-1'}`}
      >
        BLOWER
      </div>
      <div className={`flex justify-center ${zoomed ? 'gap-4 mb-2' : 'gap-1 mb-1'}`}>
        <PushButton
          color="green"
          label="START"
          onPress={startBlower}
          size={zoomed ? 'md' : 'sm'}
        />
        <PushButton
          color="red"
          label="STOP"
          onPress={stopBlower}
          size={zoomed ? 'md' : 'sm'}
        />
      </div>
      <div className={`flex justify-center ${zoomed ? 'gap-5 mb-3' : 'gap-1 mb-1'}`}>
        <StatusLamp on={blowerOn && !purging} color="white" label="Ready" />
        <StatusLamp
          on={purging}
          color="amber"
          label={purging ? `Purging ${purgeSecLeft}s` : 'Purging'}
        />
        <StatusLamp on={heated && !purging} color="green" label="Heated" />
      </div>

      {zoomed && <div className="h-px bg-zinc-600/50 my-2" />}

      <div
        className={`text-center font-black tracking-wider text-zinc-700 ${zoomed ? 'text-[9px] mb-1' : 'text-[6px] mb-0.5 leading-tight'}`}
      >
        {zoomed ? 'SECONDARY CHAMBER' : 'SEC'}
      </div>
      <div className={`flex justify-center ${zoomed ? 'gap-3 mb-1' : 'gap-1 mb-1'}`}>
        <PushButton
          color="green"
          label="START"
          onPress={startSecondary}
          disabled={!heated}
          size={zoomed ? 'md' : 'sm'}
        />
        <PushButton
          color="red"
          label="STOP"
          onPress={() => {
            setSecondaryOn(false);
            setPrimaryOn(false);
          }}
          size={zoomed ? 'md' : 'sm'}
        />
      </div>
      {zoomed && (
        <>
          <HoneywellReadout
            label="Afterburner"
            pv={secondaryTemp}
            sp={secondarySp}
          />
          <p className="text-[8px] text-center text-zinc-700 mt-1 mb-2">
            Reach ~800°F before primary. Ideal ≥850°F.
          </p>
        </>
      )}
      {!zoomed && (
        <div className="text-[8px] font-mono text-center text-sky-800 tabular-nums mb-1">
          {Math.round(secondaryTemp)}°
        </div>
      )}

      {zoomed && <div className="h-px bg-zinc-600/50 my-2" />}

      <div
        className={`text-center font-black tracking-wider text-zinc-700 ${zoomed ? 'text-[9px] mb-1' : 'text-[6px] mb-0.5'}`}
      >
        {zoomed ? 'PRIMARY CHAMBER' : 'PRI'}
      </div>
      <div className={`flex justify-center ${zoomed ? 'gap-3 mb-1' : 'gap-1 mb-1'}`}>
        <PushButton
          color="green"
          label="START"
          onPress={startPrimary}
          disabled={!canStartPrimary}
          size={zoomed ? 'md' : 'sm'}
        />
        <PushButton
          color="red"
          label="STOP"
          onPress={() => setPrimaryOn(false)}
          size={zoomed ? 'md' : 'sm'}
        />
      </div>
      {zoomed && (
        <>
          <HoneywellReadout
            label="Main Chamber"
            pv={primaryTemp}
            sp={primarySp}
          />
          <p className="text-[8px] text-center text-zinc-700 mt-1 mb-2">
            Stirs {stirCount}/{targets.requiredStirs} · Runaways{' '}
            {thermalWarnings}
            {secondaryTemp < 850 && secondaryOn && (
              <span className="block text-amber-800 font-bold">
                Below 850°F — quality risk
              </span>
            )}
          </p>
        </>
      )}
      {!zoomed && (
        <div className="text-[8px] font-mono text-center text-orange-800 tabular-nums mb-1">
          {Math.round(primaryTemp)}°
        </div>
      )}

      {zoomed && <div className="h-px bg-zinc-600/50 my-2" />}

      <div
        className={`text-center font-black tracking-[0.15em] text-zinc-700 ${zoomed ? 'text-[11px] mb-2' : 'text-[7px] mb-1'}`}
      >
        DOOR
      </div>
      <div className={`flex justify-center ${zoomed ? 'gap-4 mb-3' : 'gap-1 mb-1'}`}>
        <PushButton
          color="silver"
          label="UP"
          onPress={() => setDoorMoving('UP')}
          size={zoomed ? 'md' : 'sm'}
        />
        <PushButton
          color="silver"
          label="DOWN"
          onPress={() => setDoorMoving('DOWN')}
          size={zoomed ? 'md' : 'sm'}
        />
      </div>

      {zoomed && (
        <div className="text-[7px] text-center text-zinc-700 leading-tight border-t border-zinc-600/40 pt-2">
          CREMATORY MANUFACTURING AND SERVICE, INC.
          <br />
          TULSA, OKLAHOMA · MILLENNIUM
        </div>
      )}

      {zoomed && progress >= 1 && phase === 'BURN' && (
        <button
          type="button"
          onPointerDown={() => {
            setPrimaryOn(false);
            setSecondaryOn(false);
            setDoorMoving('UP');
            setPhase('SWEEP');
            setActiveTool('IRON_RAKE');
            setPanelZoomed(false);
          }}
          className="mt-3 w-full py-2.5 bg-emerald-700 text-white font-bold rounded text-xs"
        >
          Cool & Begin 3-Tool Sweep →
        </button>
      )}

      {zoomed && phase === 'SWEEP' && fineAshLeft === 0 && (
        <button
          type="button"
          onPointerDown={finishRetortProcess}
          className="mt-3 w-full py-2.5 bg-amber-500 text-zinc-950 font-bold rounded text-xs"
        >
          Transfer Tray to Urn Processor →
        </button>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#1a2e1a] text-stone-100 flex flex-col select-none overflow-hidden pb-24">
      <div className="shrink-0 px-3 pt-3 pb-2 border-b border-stone-800/80">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-orange-300 tracking-wide truncate">
              MILLENNIUM — {displayCaseName(currentCase)}
            </h2>
            <p className="text-[10px] text-stone-400">
              {Math.round(progress * 100)}% · {bonePhase} · Stirs {stirCount}/
              {targets.requiredStirs}
            </p>
            <CaseTransferBar currentCase={currentCase} />
          </div>
          <button
            type="button"
            onPointerDown={() => takeCaseToStation(currentCase.id, 'COOLER')}
            className="px-2.5 py-1.5 bg-stone-800 rounded text-[10px] shrink-0"
          >
            Abort
          </button>
        </div>
      </div>

      {panelZoomed ? (
        <div className="flex-1 min-h-0 p-3 flex flex-col animate-[fadeIn_0.25s_ease]">
          {controlPanel(true)}
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex flex-col gap-2 p-2">
          <div className="flex-1 min-h-0 flex gap-2">
            {controlPanel(false)}

            <div
              ref={chamberRef}
              className="relative flex-1 min-w-0 rounded-lg border-4 border-zinc-700 bg-gradient-to-b from-zinc-900 via-stone-950 to-black overflow-hidden touch-none"
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
              {/* Door — does not cover the left control strip */}
              <div
                className="absolute inset-x-0 top-0 z-30 bg-gradient-to-b from-zinc-500 via-zinc-600 to-zinc-800 border-b-4 border-zinc-900 shadow-2xl"
                style={{
                  height: `${Math.max(0, (1 - doorOpen) * 100)}%`,
                  transition: doorMoving ? 'none' : 'height 0.05s linear',
                }}
              >
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-mono text-zinc-300 tracking-widest whitespace-nowrap">
                  DOOR {Math.round(doorOpen * 100)}%
                </div>
              </div>

              {(primaryOn || secondaryOn) && (
                <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute bottom-0 w-7 rounded-t-full opacity-80 animate-pulse"
                      style={{
                        left: `${10 + i * 14}%`,
                        height: `${28 + (i % 3) * 16 + (primaryOn ? 18 : 0)}%`,
                        background:
                          'linear-gradient(to top, #ea580c, #fbbf24, transparent)',
                        animationDelay: `${i * 0.12}s`,
                      }}
                    />
                  ))}
                </div>
              )}

              <div
                className="absolute inset-0 z-20 flex items-end justify-center pb-8 pointer-events-none transition-transform duration-200"
                style={{
                  transform: `translateX(${(boneNudge % 3) - 1}px) translateY(${(boneNudge % 2)}px)`,
                }}
              >
                {bonePhase === 'INTACT' && (
                  <div className="w-36 h-14 bg-stone-300/80 rounded-sm shadow-inner" />
                )}
                {bonePhase === 'CHARRING' && (
                  <div className="w-36 h-12 bg-stone-800 rounded-sm border border-orange-700/50" />
                )}
                {bonePhase === 'CALCINING' && (
                  <div className="flex gap-1.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-3 h-12 bg-stone-200/70 rounded-sm"
                        style={{
                          transform: `rotate(${-20 + i * 10 + boneNudge}deg)`,
                        }}
                      />
                    ))}
                  </div>
                )}
                {bonePhase === 'FRAGMENTING' && (
                  <div className="flex flex-wrap gap-1 w-40 justify-center">
                    {Array.from({ length: 12 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-3 bg-stone-300/80 rounded-sm"
                        style={{
                          transform: `translateY(${(boneNudge + i) % 4}px)`,
                        }}
                      />
                    ))}
                  </div>
                )}
                {bonePhase === 'ASH' && (
                  <div className="w-40 h-7 bg-stone-500/70 rounded-full blur-[1px]" />
                )}
              </div>

              {activeTool === 'IRON_RAKE' &&
                doorOpen > 0.3 &&
                phase !== 'SWEEP' && (
                  <div
                    className="absolute z-40 pointer-events-none"
                    style={{
                      left: `${rakePos.x}%`,
                      top: `${rakePos.y}%`,
                      transform: 'translate(-10%, -50%) rotate(-12deg)',
                    }}
                  >
                    <div className="flex items-center">
                      <div className="w-28 h-1.5 bg-gradient-to-r from-zinc-400 to-zinc-600 rounded-full shadow-lg" />
                      <div className="w-7 h-3.5 border-2 border-zinc-400 rounded-sm bg-zinc-700 -ml-1" />
                    </div>
                    {rakeHeld && (
                      <div className="text-[9px] text-amber-300 mt-1 font-bold">
                        STIRRING
                      </div>
                    )}
                  </div>
                )}

              {phase === 'SWEEP' && (
                <div className="absolute inset-0 z-25 flex items-center justify-center bg-black/45 px-3">
                  <p className="text-center text-amber-200 font-bold text-xs">
                    Tap chamber to sweep
                    <br />
                    <span className="text-[10px] font-normal text-stone-300">
                      L {largeBonesLeft}% · M {mediumBonesLeft}% · F{' '}
                      {fineAshLeft}%
                    </span>
                  </p>
                </div>
              )}

              {!panelZoomed && progress >= 1 && phase === 'BURN' && (
                <button
                  type="button"
                  onPointerDown={() => {
                    setPrimaryOn(false);
                    setSecondaryOn(false);
                    setDoorMoving('UP');
                    setPhase('SWEEP');
                    setActiveTool('IRON_RAKE');
                  }}
                  className="absolute bottom-2 left-2 right-2 z-50 py-2 bg-emerald-700/95 text-white font-bold rounded text-[11px]"
                >
                  Begin Sweep →
                </button>
              )}

              {!panelZoomed && phase === 'SWEEP' && fineAshLeft === 0 && (
                <button
                  type="button"
                  onPointerDown={finishRetortProcess}
                  className="absolute bottom-2 left-2 right-2 z-50 py-2 bg-amber-500 text-stone-950 font-bold rounded text-[11px]"
                >
                  To Urn Processor →
                </button>
              )}
            </div>
          </div>

          <div className="shrink-0 flex gap-1.5 bg-stone-900/90 border border-stone-700 rounded-lg p-1.5">
            {(
              [
                { id: 'IRON_RAKE' as const, name: 'Iron Rake' },
                { id: 'BRISTLE_BRUSH' as const, name: 'Bristle' },
                { id: 'HAND_BRUSH' as const, name: 'Hand Brush' },
              ] as const
            ).map((tool) => (
              <button
                key={tool.id}
                type="button"
                onPointerDown={() =>
                  setActiveTool((t) => (t === tool.id ? null : tool.id))
                }
                className={`flex-1 py-2 px-1 rounded border text-center text-[10px] font-bold ${
                  activeTool === tool.id
                    ? 'border-amber-400 bg-amber-950/50'
                    : 'border-stone-600 bg-stone-800'
                }`}
              >
                {tool.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
