import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { formatDateTime12 } from '../utils/clock12';
import {
  gameDate,
  gameNow,
  getClockOffsetMs,
  subscribeClock,
} from '../utils/gameNow';
import * as actions from './devActions';
import { stationLabel } from '../types/game';
import { DEV_TOOLS } from './flags';

const POS_KEY = 'ossuarian-dev-fab-pos';
const DRAG_THRESHOLD = 8;
type Pos = { x: number; y: number };

function defaultPos(): Pos {
  const size = 44;
  return {
    x: 10,
    y: Math.max(8, window.innerHeight - size - 56),
  };
}

function loadPos(): Pos {
  try {
    const raw = localStorage.getItem(POS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Pos;
      if (typeof p.x === 'number' && typeof p.y === 'number') {
        // The old default sat on the Cooler card. Start clear of that corner.
        if (p.x < 72 && p.y < 220) return defaultPos();
        return p;
      }
    }
  } catch {
    /* ignore */
  }
  return defaultPos();
}

function clampPos(p: Pos): Pos {
  const size = 44;
  const maxX = Math.max(8, window.innerWidth - size - 8);
  const maxY = Math.max(8, window.innerHeight - size - 8);
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

/**
 * Two-tap danger control (Capacitor-safe).
 * No window.confirm — Android WebView often swallows it and the wipe never runs.
 * Uses pointerup (not click) so touch inside the scroll panel registers.
 */
function ResetGameButton() {
  const [armed, setArmed] = useState(false);
  const guardRef = useRef(false);

  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(false), 5000);
    return () => window.clearTimeout(t);
  }, [armed]);

  const onPointerUp = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (guardRef.current) return;
    guardRef.current = true;
    window.setTimeout(() => {
      guardRef.current = false;
    }, 350);

    if (!armed) {
      setArmed(true);
      return;
    }
    setArmed(false);
    actions.resetGame();
  };

  return (
    <div className="flex flex-col gap-1 w-full">
      <button
        type="button"
        data-testid="dev-reset-game"
        onPointerUp={onPointerUp}
        onClick={(e) => {
          // Fallback for environments that only synthesize click
          e.preventDefault();
          e.stopPropagation();
        }}
        className={`w-full px-2 py-2 text-[11px] font-mono rounded border font-bold tracking-wide touch-manipulation ${
          armed
            ? 'border-red-400 bg-red-600 text-white animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.55)]'
            : 'border-red-500/70 bg-red-950/80 text-red-100 active:bg-red-900'
        }`}
      >
        {armed ? 'TAP AGAIN TO WIPE ALL PROGRESS' : 'Reset Game'}
      </button>
      {armed && (
        <p className="text-[9px] text-red-300/80 font-mono leading-snug">
          Second tap wipes Case Files + cooler + money/rep/inventory/clock and
          returns to the title screen. No undo.
        </p>
      )}
    </div>
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
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    moved: boolean;
  } | null>(null);
  const [clockLabel, setClockLabel] = useState(() =>
    formatDateTime12(gameDate().getTime())
  );
  const [audioLine, setAudioLine] = useState(() => actions.audioDebugLine());
  const [cashInput, setCashInput] = useState(String(cash));
  const [repInput, setRepInput] = useState(String(reputation));
  const fps = useFps();

  useEffect(() => {
    const onResize = () => setPos((p) => clampPos(p));
    window.addEventListener('resize', onResize);
    const openTools = () => setOpen(true);
    window.addEventListener('ossuarian-dev-open', openTools);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('ossuarian-dev-open', openTools);
    };
  }, []);

  useEffect(() => {
    return subscribeClock(() => {
      setClockLabel(formatDateTime12(gameDate().getTime()));
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const id = window.setInterval(() => {
      setClockLabel(formatDateTime12(gameDate().getTime()));
      setAudioLine(actions.audioDebugLine());
    }, 500);
    return () => window.clearInterval(id);
  }, [open]);

  if (!DEV_TOOLS || !hasStartedGame) return null;

  const onPointerDown = (e: React.PointerEvent) => {
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      origX: pos.x,
      origY: pos.y,
      moved: false,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* capture optional */
    }
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
              {stationLabel(activeStation)}
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
              <Btn
                label="Cash −$500"
                onClick={() => actions.setCashNegative(-500)}
                danger
              />
              <Btn
                label="Bank FF +2h"
                onClick={() => actions.fastForwardBankHours(2)}
              />
              <Btn
                label="Bank FF +4h"
                onClick={() => actions.fastForwardBankHours(4)}
                danger
              />
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
                label="Mark active embalmed"
                onClick={() => actions.markActiveEmbalmed()}
              />
              <Btn
                label="Retort burn"
                onClick={() => actions.startRetortBurn()}
              />
              <Btn
                label="Urn crush tray"
                onClick={() => actions.stageUrnCrush()}
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
              <Btn
                label="Bank QA cash $80k"
                onClick={() => actions.grantBankTestCash()}
              />
            </Section>

            <Section title="Fleets">
              <Btn
                label="Fleet cash $90k"
                onClick={() => actions.grantFleetCash()}
              />
              <Btn
                label="Own all cortege"
                onClick={() => actions.ownAllFleets()}
              />
              <Btn label="Clear garage" onClick={() => actions.clearFleets()} />
              <Btn
                label="Zero interment"
                onClick={() => actions.zeroInterment()}
              />
              <Btn
                label="Demo burial (fleet)"
                onClick={() => actions.completeFleetDemoService()}
              />
            </Section>

            <Section title="Audio">
              <Btn label="Mute all" onClick={() => actions.muteAllAudio()} />
              <Btn label="Unmute" onClick={() => actions.unmuteAudio()} />
            </Section>

            <Section title="Danger">
              <ResetGameButton />
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
