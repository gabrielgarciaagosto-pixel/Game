import React, { useEffect, useRef, useState } from 'react';
import { resolvePlayerName } from '../data/playerName';
import {
  bellSide,
  clampTutorialBell,
  defaultTutorialBell,
  snapTutorialBell,
  TUTORIAL_BELL_SIZE,
  type BellBounds,
  type BellObstacle,
  type BellPoint,
} from '../tutorial/bellPos';
import { TUTORIAL_STEPS } from '../tutorial/steps';
import { useGameStore } from '../store/useGameStore';

const DRAG_THRESHOLD = 8;
const LONG_PRESS_MS = 380;

function cssLengthPx(name: string, fallback: number): number {
  const probe = document.createElement('div');
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  if (name.endsWith('top') || name.endsWith('bottom')) {
    probe.style.height = `var(${name})`;
  } else {
    probe.style.width = `var(${name})`;
  }
  document.body.appendChild(probe);
  const rect = probe.getBoundingClientRect();
  probe.remove();
  const px = name.endsWith('top') || name.endsWith('bottom') ? rect.height : rect.width;
  return px > 0 ? px : fallback;
}

function readBounds(): BellBounds {
  const root = document.getElementById('root');
  const rect = root?.getBoundingClientRect();
  return {
    width: rect?.width || window.innerWidth,
    height: rect?.height || window.innerHeight,
    safeTop: cssLengthPx('--safe-top', 48),
    safeLeft: cssLengthPx('--safe-left', 12),
    safeRight: cssLengthPx('--safe-right', 12),
    safeBottom: cssLengthPx('--safe-bottom', 12),
  };
}

function rootOrigin(): { x: number; y: number } {
  const rect = document.getElementById('root')?.getBoundingClientRect();
  return { x: rect?.left ?? 0, y: rect?.top ?? 0 };
}

function shown(el: Element): boolean {
  for (
    let node: Element | null = el;
    node && node !== document.documentElement;
    node = node.parentElement
  ) {
    const style = getComputedStyle(node);
    if (
      style.display === 'none' ||
      style.visibility === 'hidden' ||
      Number(style.opacity) === 0
    ) {
      return false;
    }
  }
  const rect = el.getBoundingClientRect();
  return rect.width > 2 && rect.height > 2;
}

function paintsOverBell(el: Element): boolean {
  for (
    let node: Element | null = el;
    node && node !== document.body;
    node = node.parentElement
  ) {
    const z = getComputedStyle(node).zIndex;
    if (z !== 'auto' && Number(z) > 80) return true;
  }
  return false;
}

/** Header chrome and back/close/DEV controls the bell must not cover. */
function screenObstacles(): BellObstacle[] {
  const origin = rootOrigin();
  const out: BellObstacle[] = [];
  const push = (rect: DOMRect) => {
    out.push({
      x: rect.left - origin.x,
      y: rect.top - origin.y,
      w: rect.width,
      h: rect.height,
    });
  };
  const header = document.querySelector('.safe-hub > .relative.z-40');
  if (header && shown(header)) push(header.getBoundingClientRect());
  document.querySelectorAll('button').forEach((button) => {
    if (button.closest('[data-tutorial-layer]')) return;
    if (!shown(button)) return;
    const label = (button.getAttribute('aria-label') || button.innerText || '')
      .split('\n')[0]
      .trim();
    const dev = /developer tools/i.test(label);
    const chrome =
      /^(back|close|close tab|shut down|settings|✕|×)$/i.test(label) ||
      /desktop$/i.test(label);
    if (!dev && !chrome) return;
    if (!dev && paintsOverBell(button)) return;
    push(button.getBoundingClientRect());
  });
  return out;
}

function placeBell(saved: BellPoint | null, bounds: BellBounds): BellPoint {
  const seed = saved ?? defaultTutorialBell(bounds);
  return snapTutorialBell(seed, bounds, screenObstacles());
}

export const TutorialLayer: React.FC = () => {
  const titleGate = useGameStore((s) => s.titleGate);
  const hasStartedGame = useGameStore((s) => s.hasStartedGame);
  const tutorial = useGameStore((s) => s.tutorial);
  const tutorialStep = useGameStore((s) => s.tutorialStep);
  const playerName = useGameStore((s) => s.playerName);
  const filesPanelOpen = useGameStore((s) => s.filesPanelOpen);
  const archivesPanelOpen = useGameStore((s) => s.archivesPanelOpen);
  const tutorialFileRead = useGameStore((s) => s.tutorialFileRead);
  const activeStation = useGameStore((s) => s.activeStation);
  const computerOpenApp = useGameStore((s) => s.computerOpenApp);
  const tutorialCaseId = useGameStore((s) => s.tutorialCaseId);
  const cases = useGameStore((s) => s.cases);
  const permitSubmissions = useGameStore((s) => s.permitSubmissions);
  const tutorialBell = useGameStore((s) => s.tutorialBell);
  const beginTutorial = useGameStore((s) => s.beginTutorial);
  const skipTutorial = useGameStore((s) => s.skipTutorial);
  const skipTutorialStep = useGameStore((s) => s.skipTutorialStep);
  const completeTutorialStep = useGameStore((s) => s.completeTutorialStep);
  const setTutorialBell = useGameStore((s) => s.setTutorialBell);
  const [hintOpen, setHintOpen] = useState(true);
  const [dragPos, setDragPos] = useState<BellPoint | null>(null);
  const [armed, setArmed] = useState(false);
  const [bounds, setBounds] = useState<BellBounds | null>(() =>
    typeof document === 'undefined' ? null : readBounds()
  );
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    orig: BellPoint;
    moved: boolean;
    long: boolean;
  } | null>(null);
  const longPressRef = useRef<number | null>(null);

  const name = resolvePlayerName(playerName);
  const tutorialCase = cases.find((c) => c.id === tutorialCaseId);
  const permitFiled =
    tutorialCase == null
      ? permitSubmissions.length > 0
      : tutorialCase.cremationPermitStatus !== 'NONE' ||
        permitSubmissions.some((s) => s.caseId === tutorialCase.id);
  const tagged = tutorialCase == null ? false : tutorialCase.isTagged;
  const step = TUTORIAL_STEPS[tutorialStep];

  useEffect(() => {
    if (tutorial !== 'active') return;
    completeTutorialStep();
  }, [
    tutorial,
    tutorialStep,
    filesPanelOpen,
    archivesPanelOpen,
    tutorialFileRead,
    activeStation,
    computerOpenApp,
    permitFiled,
    tagged,
    completeTutorialStep,
  ]);

  useEffect(() => {
    setHintOpen(true);
  }, [tutorialStep, tutorial]);

  useEffect(() => {
    const measure = () => setBounds(readBounds());
    measure();
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      if (longPressRef.current != null) {
        window.clearTimeout(longPressRef.current);
      }
    };
  }, []);

  if (titleGate || !hasStartedGame) return null;

  if (tutorial === 'offer') {
    return (
      <div className="fixed inset-0 z-[10010] bg-black/75 flex items-center justify-center p-5">
        <div className="w-full max-w-sm rounded-2xl border border-amber-700/50 bg-[#14110e] p-5 text-[#f3eadc] shadow-2xl">
          <p className="text-[10px] uppercase tracking-[0.22em] text-amber-200/70">
            First case
          </p>
          <h2
            className="mt-1 text-xl"
            style={{ fontFamily: 'Cinzel, Georgia, serif' }}
          >
            A short walkthrough, {name}?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#d9cbb8]">
            One case, from the file to the permit, through the rooms, and into
            Archives. You can skip it.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => beginTutorial()}
              className="w-full rounded-lg bg-amber-700 py-3 text-sm font-bold text-amber-50"
            >
              Start tutorial
            </button>
            <button
              type="button"
              onClick={() => skipTutorial()}
              className="w-full rounded-lg border border-[#3a3228] py-3 text-sm text-[#d9cbb8]"
            >
              Skip tutorial
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (tutorial !== 'active' || !step || !bounds) return null;

  const resting = placeBell(tutorialBell, bounds);
  const pos = dragPos ?? resting;
  const side = bellSide(pos, bounds.width);
  const roomBelow = bounds.height - (pos.y + TUTORIAL_BELL_SIZE);
  const openUp = roomBelow < 150;
  const panelWidth = Math.min(288, Math.max(160, bounds.width - 24));

  const clearLongPress = () => {
    if (longPressRef.current != null) {
      window.clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    const origin = rootOrigin();
    dragRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX - origin.x,
      startY: e.clientY - origin.y,
      orig: pos,
      moved: false,
      long: false,
    };
    clearLongPress();
    longPressRef.current = window.setTimeout(() => {
      const drag = dragRef.current;
      if (!drag || drag.pointerId !== e.pointerId) return;
      drag.long = true;
      setArmed(true);
    }, LONG_PRESS_MS);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* capture optional */
    }
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const origin = rootOrigin();
    const dx = e.clientX - origin.x - drag.startX;
    const dy = e.clientY - origin.y - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    drag.moved = true;
    setArmed(true);
    setDragPos(
      clampTutorialBell({ x: drag.orig.x + dx, y: drag.orig.y + dy }, bounds)
    );
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const drag = dragRef.current;
    dragRef.current = null;
    clearLongPress();
    setArmed(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    if (!drag || drag.pointerId !== e.pointerId) return;
    if (!drag.moved) {
      if (!drag.long) setHintOpen((open) => !open);
      setDragPos(null);
      return;
    }
    const origin = rootOrigin();
    const next = snapTutorialBell(
      clampTutorialBell(
        {
          x: drag.orig.x + (e.clientX - origin.x - drag.startX),
          y: drag.orig.y + (e.clientY - origin.y - drag.startY),
        },
        bounds
      ),
      bounds,
      screenObstacles()
    );
    setDragPos(null);
    setTutorialBell(next);
  };

  return (
    <div
      data-tutorial-layer
      className={`fixed z-[80] flex gap-2 pointer-events-none ${
        openUp ? 'flex-col-reverse' : 'flex-col'
      } ${side === 'right' ? 'items-end' : 'items-start'}`}
      style={{
        left: side === 'left' ? pos.x : undefined,
        right: side === 'right' ? bounds.width - (pos.x + TUTORIAL_BELL_SIZE) : undefined,
        top: openUp ? undefined : pos.y,
        bottom: openUp ? bounds.height - (pos.y + TUTORIAL_BELL_SIZE) : undefined,
        width: panelWidth,
      }}
    >
      <button
        type="button"
        aria-label="Tutorial hint"
        data-tutorial-bell
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`pointer-events-auto w-11 h-11 rounded-full border-2 bg-zinc-950/90 text-amber-200 shadow-lg shadow-black/50 flex items-center justify-center touch-none select-none ${
          armed
            ? 'border-amber-100 scale-110'
            : 'border-amber-300/80'
        }`}
        style={{ width: TUTORIAL_BELL_SIZE, height: TUTORIAL_BELL_SIZE }}
      >
        <span className="text-lg leading-none" aria-hidden>
          🔔
        </span>
      </button>
      {!dragPos && hintOpen && (
        <div className="pointer-events-auto w-full rounded-xl border border-amber-600/50 bg-zinc-950/95 px-3 py-2 text-[12px] leading-snug text-amber-50 shadow-xl">
          {step.hint(name)}
        </div>
      )}
      {!dragPos && (
        <div className="pointer-events-auto flex gap-1.5">
          <button
            type="button"
            onClick={() => skipTutorialStep()}
            className="rounded-full border border-amber-500/40 bg-zinc-950/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-100"
          >
            Skip step
          </button>
          <button
            type="button"
            onClick={() => skipTutorial()}
            className="rounded-full border border-stone-500/50 bg-zinc-950/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-200"
          >
            Skip tutorial
          </button>
        </div>
      )}
    </div>
  );
};
