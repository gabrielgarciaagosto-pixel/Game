import React, { useEffect, useRef, useState } from 'react';
import { CaseTransferBar } from './CaseTransferBar';
import type { Rank } from '../types/game';
import { displayCaseName } from '../types/game';
import { caseAtLocation, useGameStore } from '../store/useGameStore';
import { hapticIronRake } from '../utils/haptics';
import { getCremationTargets } from '../utils/mortuaryMath';
import {
  PRIMARY_SP,
  SECONDARY_SP,
  STIR_DOOR_MIN,
  randomPurgeMs,
  retortProgress,
} from '../retort/retortTypes';

type BonePhase = 'INTACT' | 'CHARRING' | 'CALCINING' | 'FRAGMENTING' | 'ASH';

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

function buttonShell(
  color: 'green' | 'red' | 'silver',
  size: 'sm' | 'md'
) {
  const bg =
    color === 'green'
      ? 'bg-emerald-500 border-emerald-300 shadow-emerald-900/50'
      : color === 'red'
        ? 'bg-red-600 border-red-300 shadow-red-950/50'
        : 'bg-zinc-300 border-zinc-100 text-zinc-900 shadow-zinc-900/40';
  const dim = size === 'sm' ? 'w-10 h-10 text-[8px]' : 'w-14 h-14 text-[10px]';
  return `${dim} rounded-full border-4 ${bg} shadow-inner font-black leading-tight active:scale-95 disabled:opacity-35 disabled:active:scale-100`;
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
  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPress();
      }}
      className={buttonShell(color, size)}
    >
      {label}
    </button>
  );
}

/** Hold to jog the refractory door — releases stop travel mid-stroke */
function HoldButton({
  color,
  label,
  onHoldStart,
  onHoldEnd,
  disabled,
  size = 'md',
}: {
  color: 'green' | 'red' | 'silver';
  label: string;
  onHoldStart: () => void;
  onHoldEnd: () => void;
  disabled?: boolean;
  size?: 'sm' | 'md';
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.preventDefault();
        (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        onHoldStart();
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        onHoldEnd();
      }}
      onPointerCancel={onHoldEnd}
      onLostPointerCapture={onHoldEnd}
      className={buttonShell(color, size)}
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
    focusCase,
    retort,
    patchRetort,
    ensureRetortForCase,
    resetRetort,
  } = useGameStore();

  // Prefer the case already locked in the retort so a second intake can't wipe it
  const retortBoundCase =
    retort.caseId != null
      ? (cases.find(
          (c) => c.id === retort.caseId && c.location === 'CREMATION'
        ) ?? null)
      : null;
  const currentCase =
    retortBoundCase ?? caseAtLocation(cases, 'CREMATION', activeCaseId);

  useEffect(() => {
    if (currentCase && currentCase.id !== activeCaseId) {
      focusCase(currentCase.id);
    }
  }, [currentCase, activeCaseId, focusCase]);

  useEffect(() => {
    if (!currentCase) return;
    // Only bind a new session when the chamber is free
    if (
      retort.caseId == null ||
      retort.phase === 'IDLE' ||
      retort.phase === 'DONE' ||
      retort.caseId === currentCase.id
    ) {
      ensureRetortForCase(currentCase.id);
    }
  }, [currentCase, ensureRetortForCase, retort.caseId, retort.phase]);

  const targets = currentCase
    ? getCremationTargets(currentCase.weightLbs)
    : null;

  const [panelZoomed, setPanelZoomed] = useState(false);
  const [rakeHeld, setRakeHeld] = useState(false);
  const [rakePos, setRakePos] = useState({ x: 50, y: 40 });
  const [lastStirAt, setLastStirAt] = useState(0);
  const [boneNudge, setBoneNudge] = useState(0);

  const chamberRef = useRef<HTMLDivElement>(null);
  const lastHaptic = useRef(0);

  const {
    blowerOn,
    purging,
    heated,
    purgeEndsAt,
    secondaryOn,
    primaryOn,
    secondaryTemp,
    primaryTemp,
    doorOpen,
    doorMoving,
    elapsedSec,
    stirCount,
    earlyPrimaryStarts,
    thermalWarnings,
    phase,
    largeBonesLeft,
    mediumBonesLeft,
    fineAshLeft,
    activeTool,
  } = retort;

  const secondarySp = SECONDARY_SP;
  const primarySp = PRIMARY_SP;

  const progress =
    targets != null
      ? retortProgress(elapsedSec, targets.targetDurationSec)
      : 0;
  const bonePhase = bonePhaseFromProgress(progress);
  const canStartPrimary =
    secondaryOn && secondaryTemp >= 800 && !purging;

  const startBlower = () => {
    if (blowerOn) return;
    patchRetort({
      blowerOn: true,
      purging: true,
      heated: false,
      purgeEndsAt: Date.now() + randomPurgeMs(),
      phase: phase === 'IDLE' ? 'LOAD' : phase,
    });
  };

  const stopBlower = () => {
    patchRetort({
      blowerOn: false,
      purging: false,
      heated: false,
      purgeEndsAt: null,
      secondaryOn: false,
      primaryOn: false,
      audioMode: 'OFF',
    });
  };

  const startSecondary = () => {
    if (!heated) return;
    patchRetort({
      secondaryOn: true,
      phase:
        (phase === 'LOAD' || phase === 'IDLE') && doorOpen < 0.2
          ? 'BURN'
          : phase === 'IDLE'
            ? 'LOAD'
            : phase,
    });
  };

  const startPrimary = () => {
    if (!canStartPrimary) return;
    patchRetort({
      primaryOn: true,
      earlyPrimaryStarts:
        secondaryTemp < 850
          ? earlyPrimaryStarts + 1
          : earlyPrimaryStarts,
      phase: phase === 'LOAD' || phase === 'IDLE' ? 'BURN' : phase,
      audioMode: retort.audioMode === 'OFF' ? 'START' : retort.audioMode,
    });
    if (!activeTool) patchRetort({ activeTool: 'STIRRING_ROD' });
  };

  useEffect(() => {
    if (phase === 'BURN') {
      const tool = useGameStore.getState().retort.activeTool;
      if (
        tool === 'IRON_RAKE' ||
        tool === 'BRISTLE_BRUSH' ||
        tool === 'HAND_BRUSH' ||
        tool == null
      ) {
        patchRetort({ activeTool: 'STIRRING_ROD' });
      }
    }
  }, [phase, patchRetort]);

  const canStir =
    doorOpen > STIR_DOOR_MIN &&
    primaryOn &&
    phase === 'BURN' &&
    activeTool === 'STIRRING_ROD';

  const handleRodMove = (clientX: number, clientY: number) => {
    if (!chamberRef.current || !rakeHeld || !canStir) return;
    const rect = chamberRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    const prev = rakePos;
    setRakePos({ x, y });
    const dist = Math.hypot(x - prev.x, y - prev.y);
    if (dist > 8 && Date.now() - lastStirAt > 400) {
      patchRetort({
        stirCount: stirCount + 1,
        primaryTemp: Math.max(850, primaryTemp - 55 - doorOpen * 40),
      });
      setLastStirAt(Date.now());
      setBoneNudge((n) => n + 1);
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
      const next = Math.max(0, largeBonesLeft - 20);
      if (next < largeBonesLeft) void hapticIronRake();
      patchRetort({ largeBonesLeft: next });
    } else if (activeTool === 'BRISTLE_BRUSH' && largeBonesLeft === 0) {
      patchRetort({ mediumBonesLeft: Math.max(0, mediumBonesLeft - 22) });
    } else if (activeTool === 'HAND_BRUSH' && mediumBonesLeft === 0) {
      patchRetort({ fineAshLeft: Math.max(0, fineAshLeft - 25) });
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
    resetRetort();
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
      <div className="safe-screen fixed inset-0 z-50 bg-stone-950/95 text-stone-100 flex flex-col select-none">
        <div className="flex justify-between border-b border-stone-800 pb-3 gap-2">
          <h2 className="text-base font-bold text-orange-400">
            CREMATION COMPLETE — {displayCaseName(currentCase)}
          </h2>
          <button
            type="button"
            onPointerDown={() => setActiveStation('OVERVIEW')}
            className="px-3 py-2 bg-stone-800 rounded text-xs shrink-0"
          >
            Back
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
            patchRetort({
              secondaryOn: false,
              primaryOn: false,
              audioMode: 'OFF',
            });
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
          onPress={() =>
            patchRetort({ primaryOn: false, audioMode: 'OFF' })
          }
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
      <div className={`flex justify-center ${zoomed ? 'gap-4 mb-1' : 'gap-1 mb-1'}`}>
        <HoldButton
          color="silver"
          label="UP"
          onHoldStart={() => patchRetort({ doorMoving: 'UP' })}
          onHoldEnd={() => patchRetort({ doorMoving: null })}
          size={zoomed ? 'md' : 'sm'}
        />
        <HoldButton
          color="silver"
          label="DOWN"
          onHoldStart={() => patchRetort({ doorMoving: 'DOWN' })}
          onHoldEnd={() => patchRetort({ doorMoving: null })}
          size={zoomed ? 'md' : 'sm'}
        />
      </div>
      {zoomed && (
        <p className="text-[8px] text-center text-zinc-700 mb-2">
          Hold to jog · Door {Math.round(doorOpen * 100)}%
          {doorOpen > 0 ? ' · heat venting' : ''}
          <br />
          Stirring needs door &gt;16% open
        </p>
      )}

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
            patchRetort({
              primaryOn: false,
              secondaryOn: false,
              doorMoving: 'UP',
              phase: 'SWEEP',
              audioMode: 'OFF',
              activeTool: 'IRON_RAKE',
              largeBonesLeft: 100,
              mediumBonesLeft: 100,
              fineAshLeft: 100,
            });
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
    <div className="safe-screen fixed inset-0 z-50 bg-[#1a2e1a] text-stone-100 flex flex-col select-none overflow-hidden">
      <div className="shrink-0 px-1 pb-2 border-b border-stone-800/80">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-orange-300 tracking-wide truncate">
              MILLENNIUM — {displayCaseName(currentCase)}
            </h2>
            <p className="text-[10px] text-stone-400">
              {Math.round(progress * 100)}% · {bonePhase} · Door{' '}
              {Math.round(doorOpen * 100)}% · Stirs {stirCount}/
              {targets.requiredStirs}
              {progress >= 0.15 && (primaryOn || secondaryOn)
                ? ' · Decay arrested'
                : ''}
            </p>
            <CaseTransferBar currentCase={currentCase} />
          </div>
          <button
            type="button"
            onPointerDown={() => setActiveStation('OVERVIEW')}
            className="px-2.5 py-1.5 bg-stone-800 rounded text-[10px] shrink-0"
          >
            Back
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
                if (
                  activeTool === 'STIRRING_ROD' &&
                  doorOpen > STIR_DOOR_MIN &&
                  primaryOn &&
                  phase === 'BURN'
                ) {
                  setRakeHeld(true);
                  (e.currentTarget as HTMLElement).setPointerCapture?.(
                    e.pointerId
                  );
                  handleRodMove(e.clientX, e.clientY);
                }
              }}
              onPointerMove={(e) => {
                if (rakeHeld) handleRodMove(e.clientX, e.clientY);
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

              {activeTool === 'STIRRING_ROD' &&
                doorOpen > STIR_DOOR_MIN &&
                phase === 'BURN' && (
                  <div
                    className="absolute z-40 pointer-events-none"
                    style={{
                      left: `${rakePos.x}%`,
                      top: `${rakePos.y}%`,
                      transform: 'translate(-10%, -50%) rotate(-18deg)',
                    }}
                  >
                    <div className="flex items-center">
                      <div className="w-32 h-1 bg-gradient-to-r from-amber-700 via-zinc-400 to-zinc-600 rounded-full shadow-lg" />
                      <div className="w-3 h-3 rounded-full border border-zinc-300 bg-zinc-500 -ml-1" />
                    </div>
                    {rakeHeld && (
                      <div className="text-[9px] text-amber-300 mt-1 font-bold">
                        STIRRING
                      </div>
                    )}
                  </div>
                )}

              {activeTool === 'STIRRING_ROD' &&
                phase === 'BURN' &&
                doorOpen <= STIR_DOOR_MIN && (
                  <div className="absolute bottom-3 left-2 right-2 z-40 text-center text-[10px] text-amber-200/90 bg-black/55 rounded px-2 py-1.5 pointer-events-none">
                    Open door past 16% to insert stirring rod
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
                    patchRetort({
                      primaryOn: false,
                      secondaryOn: false,
                      doorMoving: 'UP',
                      phase: 'SWEEP',
                      audioMode: 'OFF',
                      activeTool: 'IRON_RAKE',
                      largeBonesLeft: 100,
                      mediumBonesLeft: 100,
                      fineAshLeft: 100,
                    });
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
              phase === 'SWEEP'
                ? ([
                    { id: 'IRON_RAKE' as const, name: 'Iron Rake' },
                    { id: 'BRISTLE_BRUSH' as const, name: 'Bristle' },
                    { id: 'HAND_BRUSH' as const, name: 'Hand Brush' },
                  ] as const)
                : ([{ id: 'STIRRING_ROD' as const, name: 'Stirring Rod' }] as const)
            ).map((tool) => (
              <button
                key={tool.id}
                type="button"
                onPointerDown={() =>
                  patchRetort({
                    activeTool: activeTool === tool.id ? null : tool.id,
                  })
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
