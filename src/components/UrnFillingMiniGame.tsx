import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CaseTransferBar } from './CaseTransferBar';
import { displayCaseName } from '../types/game';
import {
  caseAtLocation,
  CREMULATOR_REPLACEMENT_COST,
  useGameStore,
} from '../store/useGameStore';
import { hapticHammer } from '../utils/haptics';
import { getUrnById, URN_CATALOG } from '../data/urnCatalog';
import { UrnVessel } from './urns/UrnVessel';
import { startAshPourSfx, stopAshPourSfx } from '../utils/soundEffects';

type Phase =
  | 'CRUSH'
  | 'MAGNET'
  | 'HATCH'
  | 'PROCESSOR'
  | 'SELECT_URN'
  | 'POUR'
  | 'DONE';

const FILL_LINE = 92;
const SPILL_TILT = 62;

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
    markUrnAshReady,
    storeUrnInVault,
    moveCaseTo,
    setActiveStation,
    focusCase,
    offerUrnToCase,
    cremulatorOwned,
    cremulatorDamaged,
    damageCremulator,
    buyReplacementCremulator,
    cash,
    urnInventory,
  } = useGameStore();
  const currentCase = caseAtLocation(cases, 'URN_FILLING', activeCaseId);

  useEffect(() => {
    if (currentCase && currentCase.id !== activeCaseId) {
      focusCase(currentCase.id);
    }
  }, [currentCase, activeCaseId, focusCase]);

  const resumePhase = (): Phase => {
    try {
      const forced = sessionStorage.getItem('ofu-demo-urn-phase') as Phase | null;
      if (forced) {
        sessionStorage.removeItem('ofu-demo-urn-phase');
        return forced;
      }
    } catch {
      /* ignore */
    }
    const c = useGameStore.getState().cases.find(
      (x) =>
        x.id ===
        (useGameStore.getState().activeCaseId ??
          useGameStore
            .getState()
            .cases.find((y) => y.location === 'URN_FILLING')?.id)
    );
    if (c?.isUrnFilled) return 'DONE';
    if (c?.urnAshReady) {
      return c.offeredUrnId ? 'POUR' : 'SELECT_URN';
    }
    return 'CRUSH';
  };

  const [phase, setPhase] = useState<Phase>(resumePhase);
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
  const [spillGrams, setSpillGrams] = useState(0);
  const [particles, setParticles] = useState<
    Array<{ id: number; x: number; y: number; life: number }>
  >([]);
  const particleId = useRef(0);
  const tiltingRef = useRef(false);
  const urnFillRef = useRef(0);

  const trayRef = useRef<HTMLDivElement>(null);
  const pourRef = useRef<HTMLDivElement>(null);
  const lastHammer = useRef(0);

  const familyUrn = getUrnById(currentCase?.familyRequestedUrnId ?? null);
  const offeredUrn = getUrnById(currentCase?.offeredUrnId ?? null);
  // Staged vessel (offeredUrnId) already left inventory — still counts as available
  const familyOwned =
    familyUrn != null &&
    ((urnInventory[familyUrn.id] ?? 0) > 0 ||
      currentCase?.offeredUrnId === familyUrn.id);
  const ownedUrns = useMemo(
    () =>
      URN_CATALOG.filter(
        (u) =>
          (urnInventory[u.id] ?? 0) > 0 ||
          currentCase?.offeredUrnId === u.id
      ),
    [urnInventory, currentCase?.offeredUrnId]
  );

  const goSelectUrn = () => {
    if (currentCase) markUrnAshReady(currentCase.id);
    setPhase('SELECT_URN');
  };

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

  // Dust builds while crushing without extractor; extractor clears continuously
  useEffect(() => {
    if (extractorOn) {
      const clearId = setInterval(() => {
        setDustLevel((d) => Math.max(0, d - 10));
      }, 250);
      return () => clearInterval(clearId);
    }
    if (phase !== 'CRUSH') return;
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

  const dumpHatchForMagnetRecovery = () => {
    setHatchLoaded(false);
    setHatchFill(0);
    setLoadingSorting(false);
    setProcessing(false);
    setCremulatorProgress(0);
    setMagnetCleared(false);
    setPhase('MAGNET');
    // Spill hopper contents back onto the tray for another magnet pass
    setBones((prev) =>
      prev.map((b, i) => ({
        ...b,
        x: 18 + ((i * 9) % 64),
        y: 22 + ((i * 11) % 48),
      }))
    );
    setFragments((prev) =>
      prev.map((f, i) =>
        f.collected
          ? f
          : {
              ...f,
              x: 14 + ((i * 10) % 70),
              y: 16 + ((i * 15) % 55),
            }
      )
    );
  };

  const engageCremulator = () => {
    if (!hatchLoaded || !cremulatorOwned || processing) return;
    const levels = useGameStore.getState().facilityLevels;
    const dmgChance = (() => {
      const lvl = levels.cremulator || 0;
      if (lvl <= 0) return 0.35;
      if (lvl === 1) return 0.18;
      if (lvl === 2) return 0.08;
      return 0.02;
    })();
    const speed = (() => {
      const lvl = levels.cremulator || 0;
      if (lvl <= 0) return 1;
      if (lvl === 1) return 1.1;
      if (lvl === 2) return 1.25;
      return 1.5;
    })();
    if (!magnetCleared && !allMetalsCleared) {
      if (Math.random() < dmgChance) {
        damageCremulator();
      } else {
        useGameStore.setState({
          legalAlert:
            'Close call — implants rattled the drum, but the upgraded mill held.',
        });
      }
      dumpHatchForMagnetRecovery();
      return;
    }
    setProcessing(true);
    setLoadingSorting(false);
    const start = performance.now();
    const duration = 2800 / speed;
    const tick = (now: number) => {
      const p = Math.min(100, ((now - start) / duration) * 100);
      setCremulatorProgress(p);
      if (p < 100) requestAnimationFrame(tick);
      else setProcessing(false);
    };
    requestAnimationFrame(tick);
  };

  const applyPourAt = (clientY: number) => {
    if (!tiltingRef.current || !pourRef.current) return;
    const rect = pourRef.current.getBoundingClientRect();
    const normY = 1 - (clientY - rect.top) / rect.height;
    const nextTilt = Math.max(0, Math.min(78, normY * 78));
    setTilt(nextTilt);
    if (nextTilt > 18) {
      setAshPouring(true);
      startAshPourSfx(0.12 + (nextTilt / 78) * 0.18);
      const rate = ((nextTilt - 18) / 60) * 1.85;
      const spilling =
        nextTilt >= SPILL_TILT && urnFillRef.current >= FILL_LINE - 4;
      if (spilling) {
        setSpillGrams((s) => Math.min(40, +(s + rate * 0.35).toFixed(1)));
        const next = Math.min(100, +(urnFillRef.current + rate * 0.25).toFixed(1));
        urnFillRef.current = next;
        setUrnFill(next);
      } else {
        const next = Math.min(100, +(urnFillRef.current + rate).toFixed(1));
        urnFillRef.current = next;
        setUrnFill(next);
      }
      if (Math.random() < 0.55) {
        const id = ++particleId.current;
        const x = 42 + Math.random() * 16 + (spilling ? 18 : 0);
        setParticles((prev) => [
          ...prev.slice(-28),
          { id, x, y: 28 + Math.random() * 8, life: 1 },
        ]);
      }
    } else {
      setAshPouring(false);
      stopAshPourSfx();
    }
  };

  const endPour = () => {
    if (!tiltingRef.current) return;
    tiltingRef.current = false;
    setIsTilting(false);
    setAshPouring(false);
    stopAshPourSfx();
  };

  useEffect(() => {
    if (particles.length === 0) return;
    const id = window.setInterval(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({ ...p, y: p.y + 3.5, life: p.life - 0.08 }))
          .filter((p) => p.life > 0 && p.y < 92)
      );
    }, 40);
    return () => clearInterval(id);
  }, [particles.length > 0]);

  useEffect(() => {
    return () => stopAshPourSfx();
  }, []);

  // Sole move/up path — avoids double-fill from element + window listeners
  useEffect(() => {
    const onWinMove = (e: PointerEvent) => applyPourAt(e.clientY);
    const onWinUp = () => endPour();
    window.addEventListener('pointermove', onWinMove);
    window.addEventListener('pointerup', onWinUp);
    window.addEventListener('pointercancel', onWinUp);
    return () => {
      window.removeEventListener('pointermove', onWinMove);
      window.removeEventListener('pointerup', onWinUp);
      window.removeEventListener('pointercancel', onWinUp);
    };
  }, []);

  // Resume ash-ready cases after Emporium / station hops
  useEffect(() => {
    if (!currentCase || currentCase.isUrnFilled) return;
    if (!currentCase.urnAshReady) return;
    setPhase((p) => {
      if (p === 'POUR' || p === 'SELECT_URN' || p === 'DONE') return p;
      return currentCase.offeredUrnId ? 'POUR' : 'SELECT_URN';
    });
  }, [currentCase?.id, currentCase?.urnAshReady, currentCase?.offeredUrnId, currentCase?.isUrnFilled]);

  const pourQuality = useMemo(() => {
    const fillScore =
      urnFill >= FILL_LINE - 6 && urnFill <= FILL_LINE + 4
        ? 100
        : urnFill >= 70
          ? Math.max(40, 100 - Math.abs(urnFill - FILL_LINE) * 3.2)
          : Math.max(0, urnFill);
    const spillPenalty = Math.min(55, spillGrams * 2.2);
    return Math.max(0, Math.min(100, Math.round(fillScore - spillPenalty)));
  }, [urnFill, spillGrams]);

  const finish = () => {
    if (!currentCase || !currentCase.offeredUrnId) return;
    stopAshPourSfx();
    const pourBonus =
      pourQuality >= 90 ? 140 : pourQuality >= 70 ? 90 : pourQuality >= 50 ? 50 : 20;
    completeUrnFilling(
      collectedBonus + pourBonus,
      currentCase.id,
      pourQuality
    );
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
    const memorial = currentCase.directive === 'CREMATION_THEN_VIEWING';
    const direct = currentCase.directive === 'CREMATION_DIRECT';
    const sealed = getUrnById(currentCase.offeredUrnId);
    return (
      <div className="safe-screen fixed inset-0 z-50 bg-zinc-950/95 text-zinc-100 flex flex-col select-none">
        <div className="flex justify-between items-center border-b border-zinc-800 pb-3">
          <h2 className="text-base font-bold text-amber-300">
            URN SEALED — {displayCaseName(currentCase)}
          </h2>
          <button
            type="button"
            onPointerDown={() => setActiveStation('OVERVIEW')}
            className="px-3 py-2 bg-zinc-800 rounded text-xs"
          >
            Back
          </button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
          {sealed && (
            <UrnVessel urn={sealed} size="md" showPlaque className="mx-auto" />
          )}
          <p className="text-xs text-zinc-400 max-w-sm">
            Pour quality {currentCase.urnPourQuality || pourQuality}/100
            {memorial
              ? ' — stage the vessel on the chapel pedestal for the Ossuary Memorial.'
              : direct
                ? ' — ready for family pickup or vault storage.'
                : ' — vault, chapel, or continue the case.'}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {memorial ? (
              <button
                type="button"
                onPointerDown={() => moveCaseTo(currentCase.id, 'CHAPEL')}
                className="px-5 py-3 bg-violet-600 font-bold rounded"
              >
                Chapel — Ossuary Memorial
              </button>
            ) : null}
            <button
              type="button"
              onPointerDown={() => storeUrnInVault(currentCase.id)}
              className="px-5 py-3 bg-amber-500 text-zinc-950 font-bold rounded"
            >
              {direct ? 'Family Pickup / Vault' : 'Store in Urn Vault'}
            </button>
            {!memorial && (
              <button
                type="button"
                onPointerDown={() => moveCaseTo(currentCase.id, 'CHAPEL')}
                className="px-5 py-3 bg-violet-800 font-bold rounded"
              >
                Move to Chapel
              </button>
            )}
          </div>
          <CaseTransferBar currentCase={currentCase} showVault />
        </div>
      </div>
    );
  }

  if (!cremulatorOwned || cremulatorDamaged) {
    return (
      <div className="safe-screen fixed inset-0 z-50 bg-zinc-950/95 text-zinc-100 flex flex-col items-center justify-center gap-4 text-center">
        <h2 className="text-lg font-bold text-red-400">Cremulator Offline</h2>
        <p className="text-sm text-zinc-400 max-w-sm">
          Metal implants wrecked the drum. Buy a replacement (
          ${CREMULATOR_REPLACEMENT_COST}) to continue processing.
        </p>
        <p className="font-mono text-emerald-400">Cash: ${cash}</p>
        <p className="text-xs text-amber-200/90 max-w-sm">
          After purchase you must finish the magnet sweep before Engaging again
          — the hopper has been dumped back onto the tray.
        </p>
        <button
          type="button"
          disabled={cash < CREMULATOR_REPLACEMENT_COST}
          onPointerDown={() => {
            if (buyReplacementCremulator()) {
              dumpHatchForMagnetRecovery();
            }
          }}
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
          Back
        </button>
      </div>
    );
  }

  return (
    <div className="safe-screen fixed inset-0 z-50 bg-zinc-950/95 text-zinc-100 flex flex-col select-none overflow-hidden">
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
          Back
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
              onPointerDown={goSelectUrn}
              className="w-full py-3 bg-emerald-600 rounded font-bold"
            >
              Choose Vessel & Pour →
            </button>
          )}
        </div>
      )}

      {phase === 'SELECT_URN' && (
        <div className="flex-1 min-h-0 flex flex-col gap-3 mt-2 overflow-y-auto pb-3">
          <p className="text-[11px] text-zinc-400">
            Ash is ready. Stage the vessel before pouring — family requests must
            be in your collection.
          </p>
          {familyUrn ? (
            <div className="rounded-xl border border-amber-700/60 bg-amber-950/30 p-3">
              <div className="text-[10px] uppercase tracking-wider text-amber-400/90 mb-1">
                Family request
              </div>
              <div className="flex items-center gap-3">
                <UrnVessel
                  urn={familyUrn}
                  size="sm"
                  showPlaque={false}
                  className="shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-amber-100 text-sm truncate">
                    {familyUrn.name}
                  </div>
                  <div className="text-[10px] text-zinc-400">
                    {familyUrn.material} · prestige {familyUrn.prestigeBonus}
                  </div>
                  {familyOwned ? (
                    <button
                      type="button"
                      onPointerDown={() => {
                        if (currentCase.offeredUrnId !== familyUrn.id) {
                          offerUrnToCase(currentCase.id, familyUrn.id);
                        }
                        setPhase('POUR');
                      }}
                      className="mt-2 px-3 py-1.5 rounded bg-emerald-600 text-xs font-bold"
                    >
                      Use family&apos;s urn
                    </button>
                  ) : (
                    <button
                      type="button"
                      onPointerDown={() => {
                        markUrnAshReady(currentCase.id);
                        setActiveStation('EMPORIUM');
                      }}
                      className="mt-2 px-3 py-1.5 rounded bg-amber-500 text-zinc-950 text-xs font-bold"
                    >
                      Buy in Emporium (${familyUrn.cost})
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-zinc-500 italic">
              No family selection yet — pick any vessel from your collection.
            </p>
          )}

          <div className="text-[10px] uppercase tracking-wider text-zinc-500">
            Your collection
          </div>
          {ownedUrns.length === 0 ? (
            <button
              type="button"
              onPointerDown={() => {
                markUrnAshReady(currentCase.id);
                setActiveStation('EMPORIUM');
              }}
              className="py-3 rounded bg-amber-600 text-zinc-950 font-bold text-sm"
            >
              No urns owned — open Emporium
            </button>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {ownedUrns.map((urn) => {
                const preferred =
                  urn.material === currentCase.preferredUrnMaterial;
                const staged = currentCase.offeredUrnId === urn.id;
                return (
                  <button
                    key={urn.id}
                    type="button"
                    onPointerDown={() => {
                      if (currentCase.offeredUrnId !== urn.id) {
                        offerUrnToCase(currentCase.id, urn.id);
                      }
                      setPhase('POUR');
                    }}
                    className={`rounded-xl border p-1.5 text-center ${
                      staged
                        ? 'border-amber-400 bg-amber-950/40'
                        : preferred
                          ? 'border-emerald-500/70 bg-zinc-900'
                          : 'border-zinc-700 bg-zinc-900'
                    }`}
                  >
                    <UrnVessel
                      urn={urn}
                      size="sm"
                      showPlaque={false}
                      className="mx-auto h-14"
                    />
                    <div className="text-[9px] font-bold leading-tight mt-0.5 truncate">
                      {urn.name}
                      {preferred ? ' ★' : ''}
                      {staged ? ' · staged' : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {phase === 'POUR' && offeredUrn && (
        <div className="flex-1 min-h-0 flex flex-col gap-2 mt-2">
          <p className="text-[11px] text-zinc-400">
            Drag up to tilt the funnel. Fill to the line — spill costs quality.
          </p>
          <div
            ref={pourRef}
            className="relative flex-1 rounded-xl border-2 border-zinc-700 bg-gradient-to-b from-zinc-900 to-zinc-950 flex items-end justify-center pb-6 touch-none overflow-hidden"
            onPointerDown={(e) => {
              e.preventDefault();
              tiltingRef.current = true;
              setIsTilting(true);
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {
                /* window pointermove/up still drive the pour */
              }
              applyPourAt(e.clientY);
            }}
          >
            {/* Funnel */}
            <div
              className="absolute top-8 left-1/2 -translate-x-1/2 w-32 h-24 bg-zinc-600/95 border border-zinc-500 transition-transform"
              style={{
                clipPath: 'polygon(18% 0%, 82% 0%, 100% 100%, 0% 100%)',
                transform: `rotate(${tilt * 0.35}deg)`,
                transformOrigin: 'bottom center',
              }}
            />
            {/* Ash stream */}
            {ashPouring && (
              <div
                className="absolute top-[7.5rem] left-1/2 -translate-x-1/2 w-2.5 rounded-full opacity-90"
                style={{
                  height: `${28 + tilt * 0.35}px`,
                  background:
                    'linear-gradient(to bottom, #a8a29e, transparent)',
                  transform:
                    tilt >= SPILL_TILT
                      ? 'translateX(14px) rotate(8deg)'
                      : undefined,
                }}
              />
            )}
            {particles.map((p) => (
              <span
                key={p.id}
                className="absolute w-1.5 h-1.5 rounded-full bg-stone-400 pointer-events-none"
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  opacity: p.life,
                }}
              />
            ))}
            {/* Vessel + fill line (same % space so mark matches quality target) */}
            <div className="relative flex flex-col items-center">
              <div className="relative">
                <UrnVessel
                  urn={offeredUrn}
                  size="md"
                  showPlaque={false}
                  className="relative z-10"
                />
                <div
                  className="absolute inset-x-3 bottom-2 rounded-b-xl overflow-hidden pointer-events-none z-[5]"
                  style={{ height: '55%' }}
                >
                  <div
                    className="absolute inset-x-0 bottom-0 bg-stone-500/80 transition-all"
                    style={{ height: `${urnFill}%` }}
                  />
                  <div
                    className="absolute left-0 right-0 border-t border-dashed border-amber-300/90 z-10"
                    style={{ bottom: `${FILL_LINE}%` }}
                    title="Fill line"
                  />
                </div>
              </div>
              <div className="mt-1 text-[10px] font-mono text-amber-200">
                {Math.round(urnFill)}% · line {FILL_LINE}%
                {spillGrams > 0 ? ` · spilled ${Math.round(spillGrams)}g` : ''}
              </div>
            </div>
            <div className="absolute top-2 left-2 text-[10px] font-mono text-amber-300/90">
              Tilt {Math.round(tilt)}° · Quality {pourQuality}
            </div>
          </div>
          <button
            type="button"
            disabled={urnFill < 70 || !currentCase.offeredUrnId}
            onPointerDown={() => urnFill >= 70 && finish()}
            className={`w-full py-3 rounded font-bold ${
              urnFill >= 70
                ? 'bg-amber-500 text-zinc-950'
                : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            Seal Urn (quality {pourQuality}) · +${collectedBonus}
          </button>
        </div>
      )}

      {phase === 'POUR' && !offeredUrn && (
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <p className="text-sm text-zinc-400">No vessel staged.</p>
          <button
            type="button"
            onPointerDown={() => setPhase('SELECT_URN')}
            className="px-4 py-2 bg-amber-600 text-zinc-950 rounded font-bold"
          >
            Choose urn
          </button>
        </div>
      )}
    </div>
  );
};
