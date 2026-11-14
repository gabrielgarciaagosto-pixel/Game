import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CaseTransferBar } from './CaseTransferBar';
import { displayCaseName } from '../types/game';
import {
  caseAtLocation,
  CREMULATOR_REPLACEMENT_COST,
  useGameStore,
} from '../store/useGameStore';
import { hapticHammer } from '../utils/haptics';

type Phase =
  | 'CRUSH'
  | 'MAGNET'
  | 'HATCH'
  | 'PROCESSOR'
  | 'POUR'
  | 'DONE';

interface BoneChunk {
  id: number;
  x: number;
  y: number;
  size: number;
  crushed: boolean;
}

interface MetalFragment {
  id: number;
  kind: 'TITANIUM' | 'DENTAL_GOLD';
  x: number;
  y: number;
  collected: boolean;
}

export const UrnFillingMiniGame: React.FC = () => {
  const {
    cases,
    activeCaseId,
    completeUrnFilling,
    storeUrnInVault,
    moveCaseTo,
    setActiveStation,
    selectActiveCase,
    cremulatorOwned,
    cremulatorDamaged,
    damageCremulator,
    buyReplacementCremulator,
    cash,
  } = useGameStore();
  const currentCase = caseAtLocation(cases, 'URN_FILLING', activeCaseId);

  useEffect(() => {
    if (currentCase && currentCase.id !== activeCaseId) {
      selectActiveCase(currentCase.id);
    }
  }, [currentCase, activeCaseId, selectActiveCase]);

  const [phase, setPhase] = useState<Phase>('CRUSH');
  const [bones, setBones] = useState<BoneChunk[]>(() =>
    Array.from({ length: 10 }, (_, i) => ({
      id: i,
      x: 15 + ((i * 9) % 70),
      y: 20 + ((i * 13) % 55),
      size: 14 + (i % 4) * 4,
      crushed: false,
    }))
  );
  const [hammerPos, setHammerPos] = useState({ x: 50, y: 20 });
  const [hammerHeld, setHammerHeld] = useState(false);
  const [dustLevel, setDustLevel] = useState(0);
  const [extractorOn, setExtractorOn] = useState(false);
  const [loadingSorting, setLoadingSorting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [hatchFill, setHatchFill] = useState(0);
  const [hatchLoaded, setHatchLoaded] = useState(false);
  const [magnetCleared, setMagnetCleared] = useState(false);
  const [cremulatorProgress, setCremulatorProgress] = useState(0);
  const [fragments, setFragments] = useState<MetalFragment[]>(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      kind: i % 3 === 0 ? 'DENTAL_GOLD' : 'TITANIUM',
      x: 12 + ((i * 11) % 76),
      y: 18 + ((i * 17) % 58),
      collected: false,
    }))
  );
  const [magnetPos, setMagnetPos] = useState({ x: 50, y: 50 });
  const [urnFill, setUrnFill] = useState(0);
  const [isTilting, setIsTilting] = useState(false);
  const [tilt, setTilt] = useState(0);
  const [ashPouring, setAshPouring] = useState(false);

  const trayRef = useRef<HTMLDivElement>(null);
  const pourRef = useRef<HTMLDivElement>(null);
  const lastHammer = useRef(0);

  const crushProgress = useMemo(() => {
    if (bones.length === 0) return 100;
    return Math.round(
      (bones.filter((b) => b.crushed).length / bones.length) * 100
    );
  }, [bones]);

  const collectedBonus = useMemo(() => {
    return fragments
      .filter((f) => f.collected)
      .reduce((sum, f) => sum + (f.kind === 'DENTAL_GOLD' ? 85 : 35), 0);
  }, [fragments]);

  const allMetalsCleared = fragments.every((f) => f.collected);

  // Dust builds while crushing without extractor
  useEffect(() => {
    if (phase !== 'CRUSH' || extractorOn) {
      if (extractorOn) setDustLevel((d) => Math.max(0, d - 8));
      return;
    }
    const id = setInterval(() => {
      setDustLevel((d) => Math.min(92, d + 3));
    }, 400);
    return () => clearInterval(id);
  }, [phase, extractorOn]);

  const smashAt = (clientX: number, clientY: number) => {
    if (!trayRef.current || phase !== 'CRUSH') return;
    const rect = trayRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setHammerPos({ x, y });
    setBones((prev) =>
      prev.map((b) => {
        if (b.crushed) return b;
        const dist = Math.hypot(b.x - x, b.y - y);
        if (dist < 14) {
          if (Date.now() - lastHammer.current > 120) {
            lastHammer.current = Date.now();
            void hapticHammer();
          }
          if (!extractorOn) setDustLevel((d) => Math.min(95, d + 6));
          return {
            ...b,
            crushed: true,
            size: Math.max(6, b.size * 0.45),
            x: b.x + (Math.random() - 0.5) * 8,
            y: b.y + (Math.random() - 0.5) * 8,
          };
        }
        return b;
      })
    );
  };

  const moveMagnet = (clientX: number, clientY: number) => {
    if (!trayRef.current) return;
    const rect = trayRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setMagnetPos({ x, y });
    setFragments((prev) =>
      prev.map((f) => {
        if (f.collected) return f;
        const dx = f.x - x;
        const dy = f.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 12) return { ...f, collected: true };
        if (dist < 28) {
          return { ...f, x: f.x - dx * 0.15, y: f.y - dy * 0.15 };
        }
        return f;
      })
    );
  };

  const sweepToHatch = (clientX: number, clientY: number) => {
    if (!trayRef.current || hatchLoaded) return;
    const rect = trayRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    // Hatch is bottom-center zone
    if (y > 70 && x > 30 && x < 70) {
      setHatchFill((v) => {
        const next = Math.min(100, v + 4);
        if (next >= 100) {
          setHatchLoaded(true);
          setLoadingSorting(true);
        }
        return next;
      });
      setBones((prev) =>
        prev.map((b) => ({
          ...b,
          x: b.x + (50 - b.x) * 0.08,
          y: b.y + (85 - b.y) * 0.1,
        }))
      );
    }
  };

  const startExtractor = () => {
    setExtractorOn(true);
    setDustLevel((d) => Math.max(0, d - 40));
    if (hatchLoaded) setLoadingSorting(true);
  };

  const engageCremulator = () => {
    if (!hatchLoaded || !cremulatorOwned || processing) return;
    if (!magnetCleared && !allMetalsCleared) {
      damageCremulator();
      return;
    }
    setProcessing(true);
    setLoadingSorting(false);
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(100, ((now - start) / 2800) * 100);
      setCremulatorProgress(p);
      if (p < 100) requestAnimationFrame(tick);
      else setProcessing(false);
    };
    requestAnimationFrame(tick);
  };

  const handlePourMove = (e: React.PointerEvent) => {
    if (!isTilting || !pourRef.current) return;
    const rect = pourRef.current.getBoundingClientRect();
    const normY = 1 - (e.clientY - rect.top) / rect.height;
    const nextTilt = Math.max(0, Math.min(75, normY * 75));
    setTilt(nextTilt);
    if (nextTilt > 20) {
      setAshPouring(true);
      const rate = ((nextTilt - 20) / 55) * 2.2;
      setUrnFill((v) => Math.min(100, +(v + rate).toFixed(1)));
    } else {
      setAshPouring(false);
    }
  };

  const finish = () => {
    if (!currentCase) return;
    const pourBonus = urnFill >= 95 ? 120 : urnFill >= 70 ? 60 : 20;
    completeUrnFilling(collectedBonus + pourBonus, currentCase.id);
    setPhase('DONE');
  };

  if (!currentCase) {
    return (
      <div className="fixed inset-0 z-50 bg-zinc-950/95 text-zinc-100 flex flex-col items-center justify-center gap-4 p-6 pb-28">
        <p className="text-center text-sm max-w-sm">
          No cremains ready. Complete a cremation and transfer the tray here.
        </p>
        <button
          type="button"
          onPointerDown={() => setActiveStation('CREMATION')}
          className="px-4 py-2 bg-orange-700 rounded font-semibold"
        >
          Open Crematory
        </button>
      </div>
    );
  }

  if (phase === 'DONE' || currentCase.isUrnFilled) {
    return (
      <div className="fixed inset-0 z-50 bg-zinc-950/95 text-zinc-100 p-4 pb-28 flex flex-col select-none">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <h2 className="text-base font-bold text-amber-300">
            URN SEALED — {displayCaseName(currentCase)}
          </h2>
          <button
            type="button"
            onPointerDown={() => setActiveStation('OVERVIEW')}
            className="px-3 py-2 bg-zinc-800 rounded text-xs"
          >
            Menu
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onPointerDown={() => storeUrnInVault(currentCase.id)}
              className="px-5 py-3 bg-amber-500 text-zinc-950 font-bold rounded"
            >
              Store in Urn Vault
            </button>
            <button
              type="button"
              onPointerDown={() => moveCaseTo(currentCase.id, 'CHAPEL')}
              className="px-5 py-3 bg-violet-700 font-bold rounded"
            >
              Move to Chapel
            </button>
          </div>
          <CaseTransferBar currentCase={currentCase} showVault />
        </div>
      </div>
    );
  }

  if (!cremulatorOwned || cremulatorDamaged) {
    return (
      <div className="fixed inset-0 z-50 bg-zinc-950/95 text-zinc-100 p-4 pb-28 flex flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-lg font-bold text-red-400">Cremulator Offline</h2>
        <p className="text-sm text-zinc-400 max-w-sm">
          Metal implants wrecked the drum. Buy a replacement (
          ${CREMULATOR_REPLACEMENT_COST}) to continue processing.
        </p>
        <p className="font-mono text-emerald-400">Cash: ${cash}</p>
        <button
          type="button"
          disabled={cash < CREMULATOR_REPLACEMENT_COST}
          onPointerDown={() => buyReplacementCremulator()}
          className={`px-5 py-3 rounded font-bold ${
            cash >= CREMULATOR_REPLACEMENT_COST
              ? 'bg-amber-500 text-zinc-950'
              : 'bg-zinc-800 text-zinc-500'
          }`}
        >
          Buy Replacement Cremulator
        </button>
        <button
          type="button"
          onPointerDown={() => setActiveStation('OVERVIEW')}
          className="text-xs text-zinc-500 underline"
        >
          Main Menu
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 text-zinc-100 p-3 pb-28 flex flex-col select-none overflow-hidden">
      <div className="flex justify-between items-start border-b border-zinc-800 pb-2 gap-2 shrink-0">
        <div className="min-w-0">
          <h2 className="text-sm font-bold text-amber-300 truncate">
            URN PROCESSOR — {displayCaseName(currentCase)}
          </h2>
          <p className="text-[10px] text-zinc-500">
            Phase: {phase}
            {extractorOn ? ' · Extractor ON' : ''}
            {magnetCleared || allMetalsCleared ? ' · Metals clear' : ''}
          </p>
        </div>
        <button
          type="button"
          onPointerDown={() => setActiveStation('OVERVIEW')}
          className="px-2.5 py-1.5 bg-zinc-800 rounded text-[10px] shrink-0"
        >
          Menu
        </button>
      </div>

      {/* Processor control strip — visible once bones reach hatch/processing */}
      {(phase === 'CRUSH' ||
        phase === 'HATCH' ||
        phase === 'PROCESSOR' ||
        hatchLoaded) && (
        <div className="shrink-0 mt-2 rounded-lg border border-zinc-700 bg-zinc-900/90 p-2">
          <div className="text-[9px] uppercase tracking-wider text-zinc-500 mb-1.5 text-center">
            Processing Console
          </div>
          <div className="flex items-stretch gap-2">
            <button
              type="button"
              onPointerDown={startExtractor}
              className={`flex-1 py-2.5 rounded font-bold text-[11px] border-2 ${
                extractorOn
                  ? 'bg-emerald-800 border-emerald-400'
                  : 'bg-zinc-800 border-zinc-600 active:bg-zinc-700'
              }`}
            >
              Start Extractor
            </button>
            <div className="flex flex-col items-center justify-center px-1 min-w-[72px]">
              <div
                className={`w-4 h-4 rounded-full border border-zinc-600 mb-1 ${
                  loadingSorting
                    ? 'bg-amber-400 shadow-[0_0_10px_#fbbf24] animate-pulse'
                    : 'bg-zinc-800'
                }`}
              />
              <span className="text-[7px] uppercase text-zinc-400 text-center leading-tight">
                Loading and sorting
              </span>
            </div>
            <button
              type="button"
              disabled={!hatchLoaded || processing || cremulatorProgress >= 100}
              onPointerDown={engageCremulator}
              className={`flex-1 py-2.5 rounded font-bold text-[11px] border-2 disabled:opacity-40 ${
                processing
                  ? 'bg-red-900 border-red-400'
                  : 'bg-zinc-800 border-zinc-600 active:bg-zinc-700'
              }`}
            >
              Engage
            </button>
            <div className="flex flex-col items-center justify-center px-1 min-w-[64px]">
              <div
                className={`w-4 h-4 rounded-full border border-zinc-600 mb-1 ${
                  processing
                    ? 'bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse'
                    : 'bg-zinc-800'
                }`}
              />
              <span className="text-[7px] uppercase text-zinc-400 text-center">
                Processing
              </span>
            </div>
          </div>
          {hatchLoaded && !magnetCleared && !allMetalsCleared && (
            <p className="text-[9px] text-amber-400 mt-1.5 text-center">
              Warning: Engage without magnet sweep can destroy the cremulator.
            </p>
          )}
        </div>
      )}

      {phase === 'CRUSH' && (
        <div className="flex-1 min-h-0 flex flex-col gap-2 mt-2">
          <p className="text-[11px] text-zinc-400 shrink-0">
            Tap the rubber hammer on large bone fragments. Start Extractor to
            clear bone dust or the tray will blind you.
          </p>
          <div
            ref={trayRef}
            className="relative flex-1 rounded-xl border-2 border-zinc-700 bg-gradient-to-b from-stone-800 to-stone-950 overflow-hidden touch-none"
            onPointerDown={(e) => {
              setHammerHeld(true);
              (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
              smashAt(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (hammerHeld || e.buttons > 0) smashAt(e.clientX, e.clientY);
            }}
            onPointerUp={() => setHammerHeld(false)}
            onPointerCancel={() => setHammerHeld(false)}
          >
            {bones.map((b) => (
              <div
                key={b.id}
                className={`absolute rounded-sm pointer-events-none transition-all duration-150 ${
                  b.crushed ? 'bg-stone-500/80' : 'bg-stone-200'
                }`}
                style={{
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  width: b.size,
                  height: b.size * (b.crushed ? 0.6 : 1.4),
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}
            <div
              className="absolute pointer-events-none z-20"
              style={{
                left: `${hammerPos.x}%`,
                top: `${hammerPos.y}%`,
                transform: `translate(-50%, -80%) rotate(${hammerHeld ? -25 : -8}deg)`,
              }}
            >
              <div className="w-3 h-16 bg-zinc-700 rounded-sm mx-auto" />
              <div className="w-10 h-7 bg-zinc-900 border-2 border-zinc-500 rounded-md -mt-1" />
            </div>
            {dustLevel > 5 && (
              <div
                className="absolute inset-0 z-30 pointer-events-none bg-stone-400/40 backdrop-blur-[1px] transition-opacity"
                style={{ opacity: dustLevel / 100 }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold text-stone-900/80 bg-stone-200/50 px-2 py-1 rounded">
                    BONE DUST — Start Extractor!
                  </span>
                </div>
              </div>
            )}
            <div className="absolute top-2 left-2 text-[10px] font-mono text-amber-300 z-10">
              Crush {crushProgress}%
            </div>
          </div>
          <button
            type="button"
            disabled={crushProgress < 90}
            onPointerDown={() => crushProgress >= 90 && setPhase('MAGNET')}
            className={`w-full py-3 rounded font-bold text-sm ${
              crushProgress >= 90
                ? 'bg-emerald-600 active:bg-emerald-500'
                : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            {crushProgress >= 90
              ? 'Bones Crushed — Magnet Sweep →'
              : `Keep crushing (${crushProgress}%)`}
          </button>
        </div>
      )}

      {phase === 'MAGNET' && (
        <div className="flex-1 min-h-0 flex flex-col gap-2 mt-2">
          <p className="text-[11px] text-zinc-400">
            Drag the magnetic wand over the tray. Skip this and Engage later will
            wreck the cremulator.
          </p>
          <div
            ref={trayRef}
            className="relative flex-1 rounded-xl border-2 border-zinc-700 bg-gradient-to-b from-stone-800 to-stone-950 overflow-hidden touch-none"
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              moveMagnet(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (e.buttons > 0 || e.pressure > 0)
                moveMagnet(e.clientX, e.clientY);
            }}
          >
            {fragments.map((f) =>
              f.collected ? null : (
                <div
                  key={f.id}
                  className={`absolute w-5 h-5 rounded-sm pointer-events-none ${
                    f.kind === 'DENTAL_GOLD' ? 'bg-yellow-400' : 'bg-slate-300'
                  }`}
                  style={{
                    left: `${f.x}%`,
                    top: `${f.y}%`,
                    transform: 'translate(-50%, -50%)',
                  }}
                />
              )
            )}
            <div
              className="absolute w-10 h-10 rounded-full border-2 border-cyan-300 bg-cyan-500/30 pointer-events-none"
              style={{
                left: `${magnetPos.x}%`,
                top: `${magnetPos.y}%`,
                transform: 'translate(-50%, -50%)',
              }}
            />
          </div>
          <button
            type="button"
            onPointerDown={() => {
              if (allMetalsCleared) setMagnetCleared(true);
              setPhase('HATCH');
            }}
            className={`w-full py-3 rounded font-bold text-sm ${
              allMetalsCleared
                ? 'bg-emerald-600'
                : 'bg-amber-800 text-amber-100'
            }`}
          >
            {allMetalsCleared
              ? 'Metals Cleared — Sweep into Hatch →'
              : `Skip magnet (${fragments.filter((f) => !f.collected).length} left) — risky →`}
          </button>
        </div>
      )}

      {phase === 'HATCH' && (
        <div className="flex-1 min-h-0 flex flex-col gap-2 mt-2">
          <p className="text-[11px] text-zinc-400">
            Drag bone fragments into the hatch at the bottom. They drop into the
            cremulator hopper.
          </p>
          <div
            ref={trayRef}
            className="relative flex-1 rounded-xl border-2 border-zinc-700 bg-stone-950 overflow-hidden touch-none"
            onPointerDown={(e) => {
              (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
              sweepToHatch(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (e.buttons > 0) sweepToHatch(e.clientX, e.clientY);
            }}
          >
            {bones.map((b) => (
              <div
                key={b.id}
                className="absolute w-3 h-2 bg-stone-400 rounded-sm pointer-events-none transition-all"
                style={{
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  transform: 'translate(-50%, -50%)',
                  opacity: hatchLoaded ? 0.2 : 1,
                }}
              />
            ))}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-28 h-16 border-2 border-amber-600 bg-zinc-900 rounded-b-xl flex flex-col items-center justify-end pb-1 overflow-hidden">
              <div
                className="absolute bottom-0 left-0 right-0 bg-stone-500/80 transition-all"
                style={{ height: `${hatchFill}%` }}
              />
              <span className="relative z-10 text-[9px] font-mono text-amber-200">
                HATCH {Math.round(hatchFill)}%
              </span>
            </div>
            {hatchLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <span className="text-amber-200 font-bold text-sm animate-pulse">
                  Dropped into cremulator
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            disabled={!hatchLoaded}
            onPointerDown={() => hatchLoaded && setPhase('PROCESSOR')}
            className={`w-full py-3 rounded font-bold text-sm ${
              hatchLoaded
                ? 'bg-emerald-600'
                : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            {hatchLoaded
              ? 'Hatch Loaded — Open Processor →'
              : 'Sweep remains into hatch'}
          </button>
        </div>
      )}

      {phase === 'PROCESSOR' && (
        <div className="flex-1 min-h-0 flex flex-col justify-center gap-4 mt-2">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 text-center">
            <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">
              Cremulator Drum
            </div>
            <div className="text-4xl font-mono text-amber-300 mb-3">
              {Math.round(cremulatorProgress)}%
            </div>
            <div className="h-3 bg-zinc-800 rounded overflow-hidden mb-4">
              <div
                className={`h-full transition-all ${
                  processing ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                }`}
                style={{ width: `${cremulatorProgress}%` }}
              />
            </div>
            <p className="text-[11px] text-zinc-400">
              {!extractorOn && 'Start Extractor for Loading & Sorting light. '}
              {hatchLoaded
                ? 'Press Engage to pulverize.'
                : 'Load hatch first.'}
            </p>
          </div>
          {cremulatorProgress >= 100 && (
            <button
              type="button"
              onPointerDown={() => setPhase('POUR')}
              className="w-full py-3 bg-emerald-600 rounded font-bold"
            >
              Transfer Ash to Funnel →
            </button>
          )}
        </div>
      )}

      {phase === 'POUR' && (
        <div className="flex-1 min-h-0 flex flex-col gap-3 mt-2">
          <p className="text-[11px] text-zinc-400">
            Hold and drag upward on the funnel to pour ash into the urn.
          </p>
          <div
            ref={pourRef}
            className="relative flex-1 rounded-xl border-2 border-zinc-700 bg-zinc-900 flex items-end justify-center pb-8 touch-none overflow-hidden"
            onPointerDown={(e) => {
              setIsTilting(true);
              handlePourMove(e);
            }}
            onPointerMove={handlePourMove}
            onPointerUp={() => {
              setIsTilting(false);
              setAshPouring(false);
            }}
            onPointerLeave={() => {
              setIsTilting(false);
              setAshPouring(false);
            }}
          >
            <div
              className="absolute top-10 w-28 h-20 bg-zinc-600 transition-transform"
              style={{
                clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
                transform: `rotate(${tilt * 0.3}deg)`,
                transformOrigin: 'bottom center',
              }}
            />
            {ashPouring && (
              <div className="absolute top-28 left-1/2 -translate-x-1/2 w-2 h-16 bg-gradient-to-b from-stone-400 to-transparent animate-pulse opacity-80" />
            )}
            <div className="relative w-24 h-32 border-4 border-stone-400 rounded-b-2xl bg-stone-950 flex flex-col justify-end overflow-hidden">
              <div
                className="w-full bg-stone-500 transition-all"
                style={{ height: `${urnFill}%` }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-xs font-mono">
                {Math.round(urnFill)}%
              </span>
            </div>
            <div className="absolute top-3 left-3 text-sm font-mono text-amber-300">
              Funnel tilt: {Math.round(tilt)}°
            </div>
          </div>
          <button
            type="button"
            disabled={urnFill < 70}
            onPointerDown={() => urnFill >= 70 && finish()}
            className={`w-full py-3 rounded font-bold ${
              urnFill >= 70
                ? 'bg-amber-500 text-zinc-950'
                : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            Seal Urn & Collect Bonus (${collectedBonus}+)
          </button>
        </div>
      )}
    </div>
  );
};
