import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { resolvePlayerName } from '../data/playerName';
import {
  clampTutorialBell,
  defaultTutorialBell,
  snapTutorialBell,
  TUTORIAL_SPIRIT_SIZE,
  type BellBounds,
  type BellObstacle,
  type BellPoint,
} from '../tutorial/bellPos';
import { tutorialSpiritHeading } from '../tutorial/spirit';
import {
  TUTORIAL_STEPS,
  readTutorialGate,
  resolveTutorialTarget,
  tutorialGateKey,
  tutorialTargetSelector,
  type TutorialStep,
} from '../tutorial/steps';
import { useGameStore } from '../store/useGameStore';

const DRAG_THRESHOLD = 8;
const LONG_PRESS_MS = 380;

const TICKLES = [
  'Hey, that tickles!',
  'Oh, that tickles.',
  'Hee, that tickles!',
  'Careful, that tickles.',
  'Alright, that tickles.',
];

function tickleLine(): string {
  return TICKLES[Math.floor(Math.random() * TICKLES.length)] ?? TICKLES[0];
}

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
  const fabs = document.querySelector('.files-fab-anchor');
  if (fabs && shown(fabs)) push(fabs.getBoundingClientRect());
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

function placeBell(
  saved: BellPoint | null,
  bounds: BellBounds,
  obstacles: BellObstacle[]
): BellPoint {
  const seed = saved ?? defaultTutorialBell(bounds);
  return snapTutorialBell(seed, bounds, obstacles);
}

function sameObstacles(a: BellObstacle[], b: BellObstacle[]): boolean {
  if (a.length !== b.length) return false;
  return a.every(
    (item, i) =>
      item.x === b[i].x &&
      item.y === b[i].y &&
      item.w === b[i].w &&
      item.h === b[i].h
  );
}

function dialogueTop(bounds: BellBounds): number {
  return Math.round(Math.min(bounds.height * 0.56, bounds.height - 250));
}

/** Parked above the dialogue card, low enough that a flight to the cooler crosses the room. */
function centerSpirit(bounds: BellBounds): BellPoint {
  const top = dialogueTop(bounds);
  return {
    x: Math.round(bounds.width / 2 - TUTORIAL_SPIRIT_SIZE / 2),
    y: Math.max(bounds.safeTop + 8, top - TUTORIAL_SPIRIT_SIZE - 18),
  };
}

function clampSpirit(point: BellPoint, bounds: BellBounds): BellPoint {
  return {
    x: Math.min(Math.max(8, point.x), Math.max(8, bounds.width - TUTORIAL_SPIRIT_SIZE - 8)),
    y: Math.min(
      Math.max(bounds.safeTop + 4, point.y),
      Math.max(bounds.safeTop + 4, bounds.height - TUTORIAL_SPIRIT_SIZE - 8)
    ),
  };
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - ((-2 * t + 2) ** 2) / 2;
}

function mostlyVisible(rect: DOMRect): boolean {
  const top = Math.max(rect.top, 0);
  const bottom = Math.min(rect.bottom, window.innerHeight);
  const left = Math.max(rect.left, 0);
  const right = Math.min(rect.right, window.innerWidth);
  return bottom - top > rect.height * 0.55 && right - left > rect.width * 0.4;
}

/** A control the player can actually see, not one buried under the computer. */
function usableTarget(el: Element): boolean {
  if (!shown(el)) return false;
  const rect = el.getBoundingClientRect();
  if (!mostlyVisible(rect)) return false;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const top = document.elementFromPoint(cx, cy);
  if (!top) return false;
  if (top.closest('[data-tutorial-layer]')) return true;
  return el === top || el.contains(top);
}

function orbitRadius(rect: DOMRect): number {
  const span = Math.min(rect.width, rect.height);
  // A big room tile has no free margin beside it. Circle on its face.
  // A small control gets a loop just outside its edge.
  if (span < 96) return span / 2 + TUTORIAL_SPIRIT_SIZE / 2 + 6;
  return span * 0.34;
}

function rockButton(button: HTMLElement) {
  if (button.dataset.tutorialRock === '1') return;
  button.dataset.tutorialRock = '1';
  const anim = button.animate(
    [
      { transform: 'rotate(0deg) translateX(0px)' },
      { transform: 'rotate(-8deg) translateX(-6px)', offset: 0.22 },
      { transform: 'rotate(7deg) translateX(5px)', offset: 0.5 },
      { transform: 'rotate(-3deg) translateX(-2px)', offset: 0.74 },
      { transform: 'rotate(0deg) translateX(0px)' },
    ],
    { duration: 780, easing: 'ease-in-out' }
  );
  const clear = () => {
    delete button.dataset.tutorialRock;
  };
  anim.onfinish = clear;
  anim.oncancel = clear;
}

function brushesButton(
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  button: HTMLElement,
  origin: { x: number; y: number }
): boolean {
  const rect = button.getBoundingClientRect();
  const pad = 8;
  const left = rect.left - origin.x - pad;
  const top = rect.top - origin.y - pad;
  const right = rect.right - origin.x + pad;
  const bottom = rect.bottom - origin.y + pad;
  const reach = TUTORIAL_SPIRIT_SIZE * 0.46;
  for (let i = 0; i <= 4; i += 1) {
    const t = i / 4;
    const cx = x0 + (x1 - x0) * t + TUTORIAL_SPIRIT_SIZE / 2;
    const cy = y0 + (y1 - y0) * t + TUTORIAL_SPIRIT_SIZE / 2;
    const nx = Math.max(left, Math.min(cx, right));
    const ny = Math.max(top, Math.min(cy, bottom));
    if (Math.hypot(cx - nx, cy - ny) <= reach) return true;
  }
  return false;
}

function reduceMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const TutorialLayer: React.FC = () => {
  const titleGate = useGameStore((s) => s.titleGate);
  const hasStartedGame = useGameStore((s) => s.hasStartedGame);
  const tutorial = useGameStore((s) => s.tutorial);
  const tutorialStep = useGameStore((s) => s.tutorialStep);
  const playerName = useGameStore((s) => s.playerName);
  const filesPanelOpen = useGameStore((s) => s.filesPanelOpen);
  const archivesPanelOpen = useGameStore((s) => s.archivesPanelOpen);
  const settingsOpen = useGameStore((s) => s.settingsOpen);
  const activeStation = useGameStore((s) => s.activeStation);
  const computerOpenApp = useGameStore((s) => s.computerOpenApp);
  const tutorialSpirit = useGameStore((s) => s.tutorialSpirit);
  const gateKey = useGameStore((s) => tutorialGateKey(readTutorialGate(s)));
  const stepSettled = useGameStore((s) => {
    const current = TUTORIAL_STEPS[s.tutorialStep];
    return current ? current.done(readTutorialGate(s)) : false;
  });
  const noteTutorialSawRejection = useGameStore((s) => s.noteTutorialSawRejection);
  const beginTutorial = useGameStore((s) => s.beginTutorial);
  const skipTutorial = useGameStore((s) => s.skipTutorial);
  const skipTutorialStep = useGameStore((s) => s.skipTutorialStep);
  const completeTutorialStep = useGameStore((s) => s.completeTutorialStep);
  const setTutorialSpirit = useGameStore((s) => s.setTutorialSpirit);
  const setTutorialSpiritMoved = useGameStore((s) => s.setTutorialSpiritMoved);
  const [dragging, setDragging] = useState(false);
  const [armed, setArmed] = useState(false);
  const [arrived, setArrived] = useState(false);
  const [bounds, setBounds] = useState<BellBounds | null>(() =>
    typeof document === 'undefined' ? null : readBounds()
  );
  const [obstacles, setObstacles] = useState<BellObstacle[]>([]);
  const [tickle, setTickle] = useState<string | null>(null);
  const [aim, setAim] = useState<{ cx: number; cy: number } | null>(null);
  const tickleTimer = useRef<number | null>(null);
  const spiritRef = useRef<HTMLButtonElement>(null);
  const flightWrapRef = useRef<HTMLSpanElement>(null);
  const posRef = useRef<BellPoint | null>(null);
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
  const step = TUTORIAL_STEPS[tutorialStep];
  const aimTarget = resolveTutorialTarget(step?.target, filesPanelOpen);

  useEffect(() => {
    if (tutorial !== 'active') {
      setArrived(false);
    }
  }, [tutorial]);

  useEffect(() => {
    if (tutorial !== 'active' || !arrived) return;
    const id = window.setTimeout(() => completeTutorialStep(), 0);
    return () => window.clearTimeout(id);
  }, [tutorial, tutorialStep, gateKey, arrived, completeTutorialStep]);

  useEffect(() => {
    if (!arrived || tutorial !== 'active' || step?.mode !== 'beat') return;
    const id = window.setTimeout(() => skipTutorialStep(), step.beatMs ?? 800);
    return () => window.clearTimeout(id);
  }, [arrived, tutorial, step, skipTutorialStep]);

  useEffect(() => {
    if (!arrived || tutorial !== 'active' || step?.target !== 'permit-rejection') return;
    if (stepSettled) return;
    let timer = 0;
    let raf = 0;
    const look = () => {
      const el = document.querySelector('[data-tutorial-target="permit-rejection"]');
      if (el && usableTarget(el)) {
        timer = window.setTimeout(() => noteTutorialSawRejection(), 1600);
        return;
      }
      raf = requestAnimationFrame(look);
    };
    raf = requestAnimationFrame(look);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(timer);
    };
  }, [arrived, tutorial, step, stepSettled, gateKey, noteTutorialSawRejection]);

  useEffect(() => {
    setDragging(false);
    setTickle(null);
  }, [tutorialStep, tutorial]);

  useLayoutEffect(() => {
    if (tutorial !== 'active' || titleGate || !hasStartedGame) return;
    const next = screenObstacles();
    setObstacles((prev) => (sameObstacles(prev, next) ? prev : next));
  }, [
    tutorial,
    titleGate,
    hasStartedGame,
    tutorialStep,
    activeStation,
    filesPanelOpen,
    archivesPanelOpen,
    settingsOpen,
    computerOpenApp,
    bounds,
  ]);

  useEffect(() => {
    const measure = () => setBounds(readBounds());
    measure();
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      if (longPressRef.current != null) window.clearTimeout(longPressRef.current);
      if (tickleTimer.current != null) window.clearTimeout(tickleTimer.current);
    };
  }, []);

  const showTickle = () => {
    setTickle(tickleLine());
    if (tickleTimer.current != null) window.clearTimeout(tickleTimer.current);
    tickleTimer.current = window.setTimeout(() => {
      tickleTimer.current = null;
      setTickle(null);
    }, 1600);
  };

  const paint = (point: BellPoint, phase: string) => {
    posRef.current = point;
    const el = spiritRef.current;
    if (!el) return;
    el.style.left = `${point.x}px`;
    el.style.top = `${point.y}px`;
    el.dataset.tutorialPhase = phase;
  };

  useLayoutEffect(() => {
    if (tutorial !== 'active' || !bounds || arrived) return;
    if (tutorialStep > 0 || reduceMotion()) {
      paint(centerSpirit(bounds), 'center');
      setArrived(true);
      return;
    }
    const dest = centerSpirit(bounds);
    const start = { x: -TUTORIAL_SPIRIT_SIZE, y: dest.y };
    paint(start, 'arrive');
    const began = performance.now();
    const glide = { raf: 0, stop: false };
    const go = (now: number) => {
      if (glide.stop) return;
      const raw = Math.min(1, (now - began) / 1500);
      const t = easeInOut(raw);
      paint(
        {
          x: start.x + (dest.x - start.x) * t,
          y: start.y + (dest.y - start.y) * t,
        },
        raw < 1 ? 'arrive' : 'center'
      );
      if (raw < 1) {
        glide.raf = requestAnimationFrame(go);
        return;
      }
      setArrived(true);
    };
    glide.raf = requestAnimationFrame(go);
    return () => {
      glide.stop = true;
      cancelAnimationFrame(glide.raf);
    };
  }, [tutorial, bounds, arrived, tutorialStep]);

  useLayoutEffect(() => {
    if (!arrived || tutorial !== 'active' || !step || !bounds) {
      if (!arrived) setAim(null);
      return;
    }
    if (step.mode !== 'point') {
      setAim(null);
      const wrap = flightWrapRef.current;
      if (wrap) wrap.style.transform = '';
      if (step.mode !== 'talk') return;
      const dest = centerSpirit(bounds);
      const start = posRef.current ?? dest;
      const began = performance.now();
      const duration = reduceMotion() || Math.hypot(dest.x - start.x, dest.y - start.y) < 8 ? 0 : 480;
      const glide = { raf: 0, stop: false };
      const go = (now: number) => {
        if (glide.stop) return;
        const raw = duration <= 0 ? 1 : Math.min(1, (now - began) / duration);
        const t = easeInOut(raw);
        paint(
          {
            x: start.x + (dest.x - start.x) * t,
            y: start.y + (dest.y - start.y) * t,
          },
          raw < 1 ? 'travel' : 'center'
        );
        if (raw < 1) glide.raf = requestAnimationFrame(go);
      };
      glide.raf = requestAnimationFrame(go);
      return () => {
        glide.stop = true;
        cancelAnimationFrame(glide.raf);
      };
    }
    const selector = tutorialTargetSelector(aimTarget);
    if (!selector) return;
    const handle = { raf: 0, stop: false };
    let scrolled = false;
    document.querySelectorAll<HTMLElement>('[data-tutorial-rock]').forEach((el) => {
      delete el.dataset.tutorialRock;
    });
    const origin = rootOrigin();
    const rocked = new Set<HTMLElement>();

    const buttons = () =>
      [...document.querySelectorAll('button')].filter(
        (button): button is HTMLButtonElement =>
          !button.closest('[data-tutorial-layer]') && shown(button)
      );

    const bumpBetween = (from: BellPoint, to: BellPoint) => {
      for (const button of buttons()) {
        if (rocked.has(button)) continue;
        if (!brushesButton(from.x, from.y, to.x, to.y, button, origin)) continue;
        rocked.add(button);
        rockButton(button);
      }
    };

    const lean = (dx: number, dy: number, traveling: boolean) => {
      const wrap = flightWrapRef.current;
      if (!wrap) return;
      if (!traveling) {
        wrap.style.transform = '';
        return;
      }
      const speed = Math.min(1, Math.hypot(dx, dy) / 18);
      const tilt = Math.max(-16, Math.min(16, dx * 0.35));
      const squash = 1 + speed * 0.14;
      const stretch = 1 - speed * 0.1;
      wrap.style.transform = `rotate(${tilt}deg) scale(${squash}, ${stretch})`;
    };

    const finishAt = (el: Element) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left - origin.x + rect.width / 2;
      const cy = rect.top - origin.y + rect.height / 2;
      const radius = orbitRadius(rect);
      setAim({ cx, cy });
      const reduced = reduceMotion();
      const start = posRef.current ?? centerSpirit(bounds);
      const entry = Math.atan2(
        start.y + TUTORIAL_SPIRIT_SIZE / 2 - cy,
        start.x + TUTORIAL_SPIRIT_SIZE / 2 - cx
      );
      const onCircle = (ang: number) => {
        const placed = clampSpirit(
          {
            x: cx + Math.cos(ang) * radius - TUTORIAL_SPIRIT_SIZE / 2,
            y: cy + Math.sin(ang) * radius - TUTORIAL_SPIRIT_SIZE / 2,
          },
          bounds
        );
        const ceiling = Math.max(
          bounds.safeTop + 4,
          rect.top - origin.y - TUTORIAL_SPIRIT_SIZE - 6
        );
        if (placed.y < ceiling) placed.y = ceiling;
        return placed;
      };
      const dest = onCircle(entry);
      const began = performance.now();
      const distance = Math.hypot(dest.x - start.x, dest.y - start.y);
      const duration = reduced ? 0 : Math.min(1500, Math.max(680, distance * 1.05));
      const omega = (0.9 + step.intensity * 0.22) * (step.mood === 'excited' ? 1.35 : 1);

      const orbit = (now: number) => {
        if (handle.stop) return;
        const ang = entry + ((now - began - duration) / 1000) * omega;
        const next = onCircle(ang);
        lean(0, 0, false);
        paint(next, 'orbit');
        handle.raf = requestAnimationFrame(orbit);
      };

      const travel = (now: number) => {
        if (handle.stop) return;
        const raw = duration <= 0 ? 1 : Math.min(1, (now - began) / duration);
        const t = easeInOut(raw);
        const bend = {
          x: cx - TUTORIAL_SPIRIT_SIZE / 2,
          y: cy - TUTORIAL_SPIRIT_SIZE / 2,
        };
        const u = 1 - t;
        const next = clampSpirit(
          {
            x: u * u * start.x + 2 * u * t * bend.x + t * t * dest.x,
            y: u * u * start.y + 2 * u * t * bend.y + t * t * dest.y,
          },
          bounds
        );
        const prev = posRef.current ?? start;
        bumpBetween(prev, next);
        lean(next.x - prev.x, next.y - prev.y, raw < 1);
        paint(next, raw < 1 ? 'travel' : 'orbit');
        if (raw < 1) {
          handle.raf = requestAnimationFrame(travel);
          return;
        }
        if (el instanceof HTMLElement) {
          rocked.add(el);
          rockButton(el);
        }
        if (reduced) return;
        handle.raf = requestAnimationFrame(orbit);
      };

      handle.raf = requestAnimationFrame(travel);
    };

    const watch = () => {
      if (handle.stop) return;
      const el = document.querySelector(selector);
      if (!el || !usableTarget(el)) {
        if (el && !scrolled && !mostlyVisible(el.getBoundingClientRect())) {
          el.scrollIntoView({ block: 'center', inline: 'nearest' });
          scrolled = true;
        }
        const idle = posRef.current ?? centerSpirit(bounds);
        paint(idle, 'wait');
        handle.raf = requestAnimationFrame(watch);
        return;
      }
      finishAt(el);
    };

    watch();
    return () => {
      handle.stop = true;
      cancelAnimationFrame(handle.raf);
    };
  }, [
    arrived,
    tutorial,
    tutorialStep,
    step,
    aimTarget,
    bounds,
    activeStation,
    filesPanelOpen,
    archivesPanelOpen,
    computerOpenApp,
  ]);

  if (titleGate || !hasStartedGame) return null;

  if (tutorial === 'offer') {
    return (
      <div className="fixed inset-0 z-[10010] bg-black/75 flex items-center justify-center p-5">
        <div className="w-full max-w-sm rounded-2xl border border-amber-700/50 bg-[#14110e] p-5 text-[#f3eadc] shadow-2xl">
          <p className="text-[10px] uppercase tracking-[0.22em] text-amber-200/70">
            First cases
          </p>
          <h2
            className="mt-1 text-xl"
            style={{ fontFamily: 'Cinzel, Georgia, serif' }}
          >
            Walk two cases with me?
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-[#d9cbb8]">
            A cremation, then a viewing. We go slow, one thing at a time. Skip
            me if you already know the house.
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

  const talking =
    arrived &&
    (step.mode === 'talk' ||
      step.mode === 'beat' ||
      (step.mode === 'drag' && !dragging));
  if (arrived && step.mode === 'drag' && !dragging) {
    posRef.current = centerSpirit(bounds);
  }
  const pos = !arrived
    ? (posRef.current ?? {
        x: -TUTORIAL_SPIRIT_SIZE,
        y: Math.round(bounds.height * 0.42),
      })
    : (posRef.current ??
      (talking ? centerSpirit(bounds) : placeBell(tutorialSpirit, bounds, obstacles)));
  const cardAtTop =
    aim != null
      ? aim.cy > bounds.height * 0.52
      : step.target === 'files' ||
        step.target === 'archives' ||
        step.target === 'permit';

  const clearLongPress = () => {
    if (longPressRef.current != null) {
      window.clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (step.mode === 'point') return;
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
    if (!drag || drag.pointerId !== e.pointerId || step.mode !== 'drag') return;
    const origin = rootOrigin();
    const dx = e.clientX - origin.x - drag.startX;
    const dy = e.clientY - origin.y - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    if (!drag.moved) showTickle();
    drag.moved = true;
    setArmed(true);
    setDragging(true);
    paint(
      clampTutorialBell({ x: drag.orig.x + dx, y: drag.orig.y + dy }, bounds),
      'drag'
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
      if (!drag.long) showTickle();
      return;
    }
    if (step.mode !== 'drag') return;
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
    paint(next, 'rest');
    setTutorialSpirit(next);
    setTutorialSpiritMoved(true);
  };

  return (
    <>
      {talking && (
        <div
          data-tutorial-layer
          data-tutorial-dim
          className="tutorial-dim"
        />
      )}
      <button
        type="button"
        ref={spiritRef}
        aria-label={tutorialSpiritHeading()}
        data-tutorial-layer
        data-tutorial-spirit
        data-tutorial-arrived={arrived ? 'yes' : 'no'}
        data-tutorial-mode={step.mode}
        data-tutorial-step={step.id}
        data-tutorial-mood={step.mood}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className={`tutorial-spirit fixed z-[86] touch-none select-none ${
          armed ? 'scale-105' : ''
        }`}
        style={{
          left: pos.x,
          top: pos.y,
          width: TUTORIAL_SPIRIT_SIZE,
          height: TUTORIAL_SPIRIT_SIZE,
          pointerEvents: !arrived || step.mode === 'point' ? 'none' : 'auto',
        }}
      >
        {tickle ? <span className="tutorial-spirit-tickle">{tickle}</span> : null}
        <span ref={flightWrapRef} className="tutorial-spirit-flight">
          <span
            className="tutorial-spirit-art"
            data-mood={step.mood}
            data-intensity={String(step.intensity)}
            style={{
              ['--spirit-h' as string]: '36',
              ['--trail-x' as string]: '16px',
              ['--trail-y' as string]: '-8px',
            }}
          >
            <span className="hub-spirit-glow" />
            <span className="hub-spirit-core" />
            <span className="hub-spirit-mote" style={{ ['--m' as string]: '0.45' }} />
            <span className="hub-spirit-mote" style={{ ['--m' as string]: '0.75' }} />
            <span className="hub-spirit-mote" style={{ ['--m' as string]: '1' }} />
          </span>
        </span>
      </button>
      {arrived && !stepSettled && (
        <Lesson
          step={step}
          bounds={bounds}
          talking={talking}
          cardAtTop={cardAtTop}
          line={step.hint(name)}
          onOkay={() => skipTutorialStep()}
          onSkipStep={() => skipTutorialStep()}
          onSkip={() => skipTutorial()}
        />
      )}
    </>
  );
};

function Lesson({
  step,
  bounds,
  talking,
  cardAtTop,
  line,
  onOkay,
  onSkipStep,
  onSkip,
}: {
  step: TutorialStep;
  bounds: BellBounds;
  talking: boolean;
  cardAtTop: boolean;
  line: string;
  onOkay: () => void;
  onSkipStep: () => void;
  onSkip: () => void;
}) {
  const skips = (
    <div className="mt-2 flex gap-1.5">
      <button
        type="button"
        onClick={onSkipStep}
        className="rounded-full border border-amber-500/40 bg-zinc-950/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-100"
      >
        Skip step
      </button>
      <button
        type="button"
        onClick={onSkip}
        className="rounded-full border border-stone-500/50 bg-zinc-950/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-stone-200"
      >
        Skip tutorial
      </button>
    </div>
  );

  if (talking) {
    return (
      <div
        data-tutorial-layer
        data-tutorial-dialogue
        className="tutorial-dialogue"
        style={{
          top: dialogueTop(bounds),
          left: 16,
          width: Math.max(180, bounds.width - 32),
        }}
      >
        <p
          data-tutorial-heading
          className="text-[10px] uppercase tracking-[0.18em] text-amber-200/70"
        >
          {tutorialSpiritHeading()}
        </p>
        <p data-tutorial-line className="mt-1 text-[15px] leading-relaxed text-amber-50">
          {line}
        </p>
        {step.mode === 'talk' && (
          <button
            type="button"
            data-tutorial-okay
            onClick={onOkay}
            className="mt-3 w-full rounded-lg bg-amber-700 py-3 text-sm font-bold text-amber-50"
          >
            Okay
          </button>
        )}
        {skips}
      </div>
    );
  }

  return (
    <div
      data-tutorial-layer
      data-tutorial-lesson
      className="tutorial-lesson"
      style={{
        left: 12,
        right: 12,
        top: cardAtTop ? bounds.safeTop + 8 : undefined,
        bottom: cardAtTop ? undefined : bounds.safeBottom + 12,
      }}
    >
      <p
        data-tutorial-heading
        className="text-[10px] uppercase tracking-[0.18em] text-amber-200/70"
      >
        {tutorialSpiritHeading()}
      </p>
      <p data-tutorial-line className="mt-1 text-[15px] leading-relaxed text-amber-50">
        {line}
      </p>
      {skips}
    </div>
  );
}
