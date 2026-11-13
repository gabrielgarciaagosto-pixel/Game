import React, { useMemo, useRef, useState } from 'react';
import { displayCaseName } from '../types/game';
import { useGameStore } from '../store/useGameStore';

type Phase = 'MAGNET' | 'CREMULATOR' | 'POUR';

interface MetalFragment {
  id: number;
  kind: 'TITANIUM' | 'DENTAL_GOLD';
  x: number;
  y: number;
  collected: boolean;
}

export const UrnFillingMiniGame: React.FC = () => {
  const { coolerCases, activeCaseId, completeUrnFilling, setActiveStation } =
    useGameStore();
  const currentCase =
    coolerCases.find((c) => c.id === activeCaseId) ?? coolerCases[0] ?? null;

  const [phase, setPhase] = useState<Phase>('MAGNET');
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
  const [cremulatorProgress, setCremulatorProgress] = useState(0);
  const [isPulverizing, setIsPulverizing] = useState(false);
  const [urnFill, setUrnFill] = useState(0);
  const [isTilting, setIsTilting] = useState(false);
  const [tilt, setTilt] = useState(0);
  const trayRef = useRef<HTMLDivElement>(null);
  const pourRef = useRef<HTMLDivElement>(null);

  const collectedBonus = useMemo(() => {
    return fragments
      .filter((f) => f.collected)
      .reduce((sum, f) => sum + (f.kind === 'DENTAL_GOLD' ? 85 : 35), 0);
  }, [fragments]);

  const allCollected = fragments.every((f) => f.collected);

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
        // Magnetic pull visual nudge toward magnet
        if (dist < 28) {
          return {
            ...f,
            x: f.x - dx * 0.15,
            y: f.y - dy * 0.15,
          };
        }
        return f;
      })
    );
  };

  const handleCremulator = () => {
    if (isPulverizing || cremulatorProgress >= 100) return;
    setIsPulverizing(true);
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(100, ((now - start) / 2200) * 100);
      setCremulatorProgress(p);
      if (p < 100) {
        requestAnimationFrame(tick);
      } else {
        setIsPulverizing(false);
      }
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
      const rate = ((nextTilt - 20) / 55) * 2.2;
      setUrnFill((v) => Math.min(100, +(v + rate).toFixed(1)));
    }
  };

  const finish = () => {
    const pourBonus = urnFill >= 95 ? 120 : urnFill >= 70 ? 60 : 20;
    completeUrnFilling(collectedBonus + pourBonus);
  };

  if (!currentCase) {
    return (
      <div className="fixed inset-0 z-50 bg-zinc-950/95 text-zinc-100 flex flex-col items-center justify-center gap-4 p-6">
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

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 text-zinc-100 p-4 md:p-6 pb-24 flex flex-col select-none">
      <div className="flex justify-between items-center border-b border-zinc-800 pb-3 gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-amber-300">
            URN PROCESSOR — {displayCaseName(currentCase)}
          </h2>
          <p className="text-xs text-zinc-400">
            Magnetic metals recovered: ${collectedBonus} | Phase: {phase}
          </p>
        </div>
        <button
          type="button"
          onPointerDown={() => setActiveStation('OVERVIEW')}
          className="px-4 py-2 bg-zinc-800 rounded text-sm active:bg-zinc-700"
        >
          Main Menu
        </button>
      </div>

      {phase === 'MAGNET' && (
        <div className="flex-1 flex flex-col gap-3 mt-4">
          <p className="text-sm text-zinc-400">
            Drag the magnetic wand across the cooling tray to pull titanium
            implants and dental gold before pulverizing.
          </p>
          <div
            ref={trayRef}
            className="relative flex-1 rounded-xl border-2 border-zinc-700 bg-gradient-to-b from-stone-800 to-stone-950 overflow-hidden touch-none"
            onPointerDown={(e) => {
              (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
              moveMagnet(e.clientX, e.clientY);
            }}
            onPointerMove={(e) => {
              if (e.buttons > 0 || e.pressure > 0) moveMagnet(e.clientX, e.clientY);
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
                  title={f.kind}
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
            disabled={!allCollected}
            onPointerDown={() => allCollected && setPhase('CREMULATOR')}
            className={`w-full py-3 rounded font-bold ${
              allCollected
                ? 'bg-emerald-600 active:bg-emerald-500'
                : 'bg-zinc-800 text-zinc-500'
            }`}
          >
            {allCollected
              ? 'Metals Cleared — Load Cremulator →'
              : `Sweep remaining metals (${fragments.filter((f) => !f.collected).length} left)`}
          </button>
        </div>
      )}

      {phase === 'CREMULATOR' && (
        <div className="flex-1 flex flex-col justify-center gap-6 mt-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 text-center">
            <div className="text-xs uppercase tracking-widest text-zinc-500 mb-2">
              Cremulator Drum
            </div>
            <div className="text-4xl font-mono text-amber-300 mb-4">
              {Math.round(cremulatorProgress)}%
            </div>
            <div className="h-3 bg-zinc-800 rounded overflow-hidden mb-6">
              <div
                className="h-full bg-amber-500 transition-all"
                style={{ width: `${cremulatorProgress}%` }}
              />
            </div>
            <button
              type="button"
              disabled={isPulverizing || cremulatorProgress >= 100}
              onPointerDown={handleCremulator}
              className="px-6 py-3 bg-orange-600 active:bg-orange-500 rounded font-bold disabled:opacity-40"
            >
              {cremulatorProgress >= 100
                ? 'Pulverized'
                : isPulverizing
                  ? 'Pulverizing…'
                  : 'Start Cremulator'}
            </button>
          </div>
          {cremulatorProgress >= 100 && (
            <button
              type="button"
              onPointerDown={() => setPhase('POUR')}
              className="w-full py-3 bg-emerald-600 active:bg-emerald-500 rounded font-bold"
            >
              Transfer Ash to Funnel →
            </button>
          )}
        </div>
      )}

      {phase === 'POUR' && (
        <div className="flex-1 flex flex-col gap-4 mt-4">
          <p className="text-sm text-zinc-400">
            Hold and drag upward on the funnel to tilt and pour ash into the urn.
          </p>
          <div
            ref={pourRef}
            className="relative flex-1 rounded-xl border-2 border-zinc-700 bg-zinc-900 flex items-end justify-center pb-8 touch-none overflow-hidden"
            onPointerDown={(e) => {
              setIsTilting(true);
              handlePourMove(e);
            }}
            onPointerMove={handlePourMove}
            onPointerUp={() => setIsTilting(false)}
            onPointerLeave={() => setIsTilting(false)}
          >
            <div
              className="absolute top-10 w-28 h-20 bg-zinc-600"
              style={{
                clipPath: 'polygon(20% 0%, 80% 0%, 100% 100%, 0% 100%)',
                transform: `rotate(${tilt * 0.3}deg)`,
                transformOrigin: 'bottom center',
              }}
            />
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
                ? 'bg-amber-500 text-zinc-950 active:bg-amber-400'
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
