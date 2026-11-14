import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import {
  gameDate,
  gameNow,
  getClockOffsetMs,
  subscribeClock,
} from '../utils/gameNow';
import * as actions from './devActions';
import { DEV_TOOLS } from './flags';

const POS_KEY = 'ossuarian-dev-fab-pos';
const DRAG_THRESHOLD = 8;

type Pos = { x: number; y: number };

function loadPos(): Pos {
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Pos;
      if (typeof p.x === 'number' && typeof p.y === 'number') return p;
    }
  } catch {
    /* ignore */
  }
  return { x: 16, y: 120 };
}

function clampPos(p: Pos): Pos {
  const size = 44;
  const maxX = Math.max(0, window.innerWidth - size - 8);
  const maxY = Math.max(0, window.innerHeight - size - 8);
  return {
    x: Math.min(maxX, Math.max(8, p.x)),
    y: Math.min(maxY, Math.max(8, p.y)),
  };
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-3">
      <div className="text-[10px] uppercase tracking-[0.18em] text-lime-400/80 mb-1.5 font-mono">
        {title}
      </div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Btn({
  label,
  onClick,
  danger,
}: {
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-2 py-1 text-[11px] font-mono rounded border ${
        danger
          ? 'border-red-500/60 bg-red-950/70 text-red-200 active:bg-red-900'
          : 'border-lime-500/40 bg-zinc-900 text-lime-100 active:bg-zinc-800'
      }`}
    >
      {label}
    </button>
  );
}

function useFps() {
  const [fps, setFps] = useState(0);
  useEffect(() => {
    let frames = 0;
    let last = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      frames += 1;
      if (t - last >= 500) {
        setFps(Math.round((frames * 1000) / (t - last)));
        frames = 0;
        last = t;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  return fps;
}

/**
 * Self-contained developer overlay. Mount only when DEV_TOOLS is true.
 * Strip for release by flipping `src/dev/flags.ts` (or VITE_DEV_TOOLS=0).
 */
export const DevToolsOverlay: React.FC = () => {
  const hasStartedGame = useGameStore((s) => s.hasStartedGame);
  const activeStation = useGameStore((s) => s.activeStation);
  const cash = useGameStore((s) => s.cash);
  const reputation = useGameStore((s) => s.reputation);

  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<Pos>(() => clampPos(loadPos()));
  const [clockLabel, setClockLabel] = useState(() => gameDate().toLocaleString());
  const [audioLine, setAudioLine] = useState(() => actions.audioDebugLine());
  const [cashInput, setCashInput] = useState(String(cash));
  const [repInput, setRepInput] = useState(String(reputation));
  const fps = useFps();

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);

  useEffect(() => {
    const onResize = () => setPos((p) => clampPos(p));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    return subscribeClock(() => {
      setClockLabel(gameDate().toLocaleString());
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => {
      setClockLabel(gameDate().toLocaleString());
      setAudioLine(actions.audioDebugLine());
    }, 500);
    return () => window.clearInterval(id);
  }, [open]);

  // Splash only excluded — FAB lives on hub + every station after Start.
  if (!DEV_TOOLS || !hasStartedGame) return null;

  const onPointerDown = (e: React.PointerEvent) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d || d.pointerId !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    d.moved = true;
    setPos(clampPos({ x: d.origX + dx, y: d.origY + dy }));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (!d) return;
    if (!d.moved) {
      setOpen((v) => !v);
      return;
    }
    const next = clampPos({
      x: d.origX + (e.clientX - d.startX),
      y: d.origY + (e.clientY - d.startY),
    });
    setPos(next);
    try {
      localStorage.setItem(POS_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <button
        type="button"
        aria-label="Developer tools"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="fixed z-[9998] w-11 h-11 rounded-full border-2 border-lime-400/80 bg-zinc-950/90 text-lime-300 shadow-lg shadow-black/50 flex items-center justify-center touch-none select-none"
        style={{ left: pos.x, top: pos.y }}
      >
        <span className="font-mono text-[10px] font-bold tracking-wider">DEV</span>
      </button>

      {open && (
        <div
          className="fixed z-[9999] inset-x-3 bottom-3 top-[18%] max-w-lg mx-auto rounded-md border border-lime-500/50 bg-zinc-950/95 text-lime-100 shadow-2xl flex flex-col overflow-hidden"
          style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
        >
          <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-lime-500/30 bg-zinc-900/90">
            <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-950 bg-lime-400 px-1.5 py-0.5 rounded-sm">
              DEV
            </span>
            <span className="text-[11px] text-lime-200/90 truncate">
              tools · not ship UI
            </span>
            <button
              type="button"
              className="ml-auto text-[11px] text-lime-300/80 px-2 py-0.5 border border-lime-500/30 rounded"
              onClick={() => setOpen(false)}
            >
              close
            </button>
          </div>

          <div className="px-3 py-2 text-[10px] text-lime-300/70 border-b border-lime-500/20 space-y-0.5 shrink-0">
            <div>
              clock {clockLabel} · offset{' '}
              {(getClockOffsetMs() / 3_600_000).toFixed(2)}h · now {gameNow()}
            </div>
            <div>
              {audioLine} · fps {fps} · ${cash} · rep {reputation} ·{' '}
              {activeStation}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 overscroll-contain">
            <Section title="Spawn">
              <Btn
                label="Direct Cremation"
                onClick={() => actions.spawnDirective('CREMATION_DIRECT')}
              />
              <Btn
                label="Direct Burial*"
                onClick={() => actions.spawnDirective('BURIAL_VIEWING')}
              />
              <Btn
                label="Burial Viewing"
                onClick={() => actions.spawnDirective('BURIAL_VIEWING')}
              />
              <Btn
                label="Viewing→Cremation"
                onClick={() => actions.spawnDirective('VIEWING_THEN_CREMATION')}
              />
              <Btn
                label="Ossuary Memorial"
                onClick={() => actions.spawnDirective('CREMATION_THEN_VIEWING')}
              />
            </Section>

            <Section title="Time">
              <Btn label="Next day" onClick={() => actions.skipToNextDay()} />
              <Btn label="+1h" onClick={() => actions.advanceHours(1)} />
              <Btn label="+2h" onClick={() => actions.advanceHours(2)} />
              <Btn label="+5h" onClick={() => actions.advanceHours(5)} />
              <Btn label="+10h" onClick={() => actions.advanceHours(10)} />
              <Btn
                label="Day rares"
                onClick={() => actions.jumpToRareTone('LIGHT')}
              />
              <Btn
                label="Night rares"
                onClick={() => actions.jumpToRareTone('DARK')}
              />
              <Btn
                label="Force rare rotate"
                onClick={() => actions.forceRareRotation()}
              />
            </Section>

            <Section title="Economy">
              <Btn label="+$1000" onClick={() => actions.addCash(1000)} />
              <Btn label="+50 rep" onClick={() => actions.addReputation(50)} />
              <div className="flex items-center gap-1 w-full">
                <input
                  className="w-24 bg-zinc-900 border border-lime-500/30 rounded px-1.5 py-1 text-[11px]"
                  value={cashInput}
                  onChange={(e) => setCashInput(e.target.value)}
                  inputMode="numeric"
                />
                <Btn
                  label="Set $"
                  onClick={() => actions.setCash(Number(cashInput) || 0)}
                />
                <input
                  className="w-16 bg-zinc-900 border border-lime-500/30 rounded px-1.5 py-1 text-[11px]"
                  value={repInput}
                  onChange={(e) => setRepInput(e.target.value)}
                  inputMode="numeric"
                />
                <Btn
                  label="Set rep"
                  onClick={() => actions.setReputation(Number(repInput) || 0)}
                />
              </div>
            </Section>

            <Section title="Cases / Crematory">
              <Btn
                label="Force family urn now"
                onClick={() => actions.forceFamilyUrnNow()}
              />
              <Btn
                label="Pick family urn (active)"
                onClick={() => actions.forcePickFamilyUrnForActive()}
              />
              <Btn
                label="Finish burn + cremulator"
                onClick={() => actions.instantFinishBurn()}
              />
              <Btn label="Fill cooler" onClick={() => actions.fillCooler()} />
              <Btn label="Clear cooler" onClick={() => actions.clearCooler()} />
            </Section>

            <Section title="Collection / Facility">
              <Btn
                label="Own all urns/caskets/décor"
                onClick={() => actions.unlockAllCollection()}
              />
              <Btn
                label="Max facility upgrades"
                onClick={() => actions.maxFacilityUpgrades()}
              />
              <Btn
                label="Reset facility upgrades"
                onClick={() => actions.resetFacilityUpgrades()}
              />
            </Section>

            <Section title="Audio">
              <Btn label="Mute all" onClick={() => actions.muteAllAudio()} />
              <Btn label="Unmute" onClick={() => actions.unmuteAudio()} />
            </Section>

            <Section title="Danger">
              <Btn
                label="Reset save…"
                danger
                onClick={() => {
                  if (
                    window.confirm(
                      'Reset Ossuarian save and reload? This cannot be undone.'
                    )
                  ) {
                    actions.resetSave();
                  }
                }}
              />
            </Section>

            <p className="text-[9px] text-lime-500/50 mt-2 leading-relaxed">
              * “Direct Burial” currently maps to Burial Viewing intake (no
              separate directive id). Strip via{' '}
              <code className="text-lime-400/70">src/dev/flags.ts</code> or{' '}
              <code className="text-lime-400/70">VITE_DEV_TOOLS=0</code>.
            </p>
          </div>
        </div>
      )}
    </>
  );
};
