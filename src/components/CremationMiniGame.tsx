import React, { useEffect, useRef, useState } from 'react';
import { audioManager } from '../utils/audioManager';
import {
  brandLabel,
  defaultRetortBay,
  doorFace,
  panelChrome,
  purgeMsFor,
  type RetortButtonStyleId,
} from '../data/crematoryCatalog';
import { CrematoryCatalog } from './crematory/CrematoryCatalog';
import { CaseTransferBar } from './CaseTransferBar';
import { directiveNeedsCremationPermit } from '../data/cremationPermits';
import { permitStatusLabel } from '../data/decedentVitals';
import type { Rank, SweepTool } from '../types/game';
import { displayCaseName } from '../types/game';
import { useGameStore } from '../store/useGameStore';
import { hapticBoneContact, hapticIronRake } from '../utils/haptics';
import { getCremationTargets } from '../utils/mortuaryMath';
import {
  PRIMARY_SP_MAX,
  PRIMARY_SP_MIN,
  SECONDARY_SP_MAX,
  SECONDARY_SP_MIN,
  STIR_DOOR_MIN,
  randomPurgeMs,
  retortProgress,
} from '../retort/retortTypes';
import {
  HearthCharge,
  type BoneContact,
} from './crematory/HearthCharge';
import { ToolArt } from './crematory/crematoryArt';
import { SetPointDial } from './crematory/SetPointDial';
import { ToolDrawer } from './crematory/ToolDrawer';
import {
  createCircularStirState,
  feedCircularStir,
  nearRemains,
  resetCircularStir,
} from './crematory/stirGesture';

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

const ButtonLookContext = React.createContext<RetortButtonStyleId>('millennium');

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

function buttonLookShell(
  color: 'green' | 'red' | 'silver',
  size: 'sm' | 'md',
  look: RetortButtonStyleId
) {
  if (look === 'millennium') return buttonShell(color, size);
  const dim = size === 'sm' ? 'w-10 h-10 text-[8px]' : 'w-14 h-14 text-[10px]';
  if (look === 'brass') {
    const bg =
      color === 'green'
        ? 'bg-[#c4a574] text-[#1a140c]'
        : color === 'red'
          ? 'bg-[#8a3b16] text-[#f6e7c1]'
          : 'bg-[#e6d3a1] text-[#1a140c]';
    return `${dim} rounded-sm border-2 border-[#5c4318] ${bg} font-black shadow-[inset_0_2px_0_rgba(255,255,255,0.45)] active:translate-y-px`;
  }
  if (look === 'touch') {
    const bg =
      color === 'green'
        ? 'bg-emerald-400 text-slate-950'
        : color === 'red'
          ? 'bg-rose-500 text-white'
          : 'bg-slate-100 text-slate-900';
    return `${dim} rounded-md border border-cyan-200/50 ${bg} font-semibold tracking-wide shadow-[inset_0_0_12px_rgba(255,255,255,0.25)]`;
  }
  return `${dim} rounded-full border-[5px] border-[#1a120c] bg-[#f3e6c8] text-[#1a120c] font-black shadow-[inset_0_0_0_3px_#8a7048]`;
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
  const look = React.useContext(ButtonLookContext);
  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPress();
      }}
      className={buttonLookShell(color, size, look)}
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
  const look = React.useContext(ButtonLookContext);
  const startRef = useRef(onHoldStart);
  const endRef = useRef(onHoldEnd);
  startRef.current = onHoldStart;
  endRef.current = onHoldEnd;

  return (
    <button
      type="button"
      disabled={disabled}
      onPointerDown={(e) => {
        if (disabled) return;
        e.stopPropagation();
        e.preventDefault();
        try {
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
        } catch {
          /* automation and some WebViews reject capture; window listeners still end the jog */
        }
        startRef.current();
        const pointerId = e.pointerId;
        const end = (ev: PointerEvent) => {
          if (ev.pointerId !== pointerId) return;
          endRef.current();
          window.removeEventListener('pointerup', end);
          window.removeEventListener('pointercancel', end);
        };
        window.addEventListener('pointerup', end);
        window.addEventListener('pointercancel', end);
      }}
      className={buttonLookShell(color, size, look)}
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

function playControlClick(e: React.PointerEvent) {
  const btn = (e.target as HTMLElement | null)?.closest?.('button');
  if (!btn || (btn as HTMLButtonElement).disabled) return;
  audioManager.playUiClick(
    btn.getAttribute('data-click') === 'tick' ? 'tick' : 'clunk'
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
    retortMachines,
    activeRetortIndex,
    retortBays,
    patchRetort,
    ensureRetortForCase,
    selectRetort,
    chargeRetortFuel,
    queueCaseOnRetort,
  } = useGameStore();

  const bayCount = Math.max(1, retortMachines.length || 1);
  const bayIndex = Math.max(0, Math.min(bayCount - 1, activeRetortIndex || 0));
  const bay = retortBays[bayIndex] ?? defaultRetortBay();
  const [catalogOpen, setCatalogOpen] = useState(false);
  const swipeRef = useRef<{ x: number; y: number } | null>(null);

  const otherCaseIds = new Set(
    retortMachines
      .filter((_, i) => i !== bayIndex)
      .map((m) => m.caseId)
      .filter((id): id is string => !!id)
  );
  const retortBoundCase =
    retort.caseId != null
      ? (cases.find(
          (c) => c.id === retort.caseId && c.location === 'CREMATION'
        ) ?? null)
      : null;
  const currentCase =
    retortBoundCase ??
    (retort.caseId == null || retort.phase === 'IDLE' || retort.phase === 'DONE'
      ? (cases.find(
          (c) => c.location === 'CREMATION' && !otherCaseIds.has(c.id)
        ) ?? null)
      : null);

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
  const [toolMenuOpen, setToolMenuOpen] = useState(false);
  const [toolHeld, setToolHeld] = useState(false);
  const [toolPos, setToolPos] = useState({ x: 52, y: 40 });
  const [toolGlide, setToolGlide] = useState(false);
  const [boneNudge, setBoneNudge] = useState(0);
  const [boneContact, setBoneContact] = useState<BoneContact | null>(null);
  const [contactHot, setContactHot] = useState(false);
  const [hearthHint, setHearthHint] = useState<string | null>(null);
  const [dialChamber, setDialChamber] = useState<'PRIMARY' | 'SECONDARY'>(
    'PRIMARY'
  );
  const [dust, setDust] = useState<
    {
      id: number;
      x: number;
      y: number;
      dx: number;
      dy: number;
      size: number;
      tone: string;
    }[]
  >([]);
  const [scrape, setScrape] = useState<{ id: number; x: number; y: number } | null>(
    null
  );

  const chamberRef = useRef<HTMLDivElement>(null);
  const lastHaptic = useRef(0);
  const lastStirAt = useRef(0);
  const lastContactFx = useRef(0);
  const dustSeq = useRef(1);
  const prevToolPoint = useRef<{ x: number; y: number } | null>(null);
  const strokeRef = useRef({ minY: 100, accum: 0, credited: false });
  const circularStirRef = useRef(createCircularStirState());
  const contactHotTimer = useRef<number | null>(null);

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
    primarySetPoint,
    secondarySetPoint,
  } = retort;

  const secondarySp = secondarySetPoint;
  const primarySp = primarySetPoint;

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
      purgeEndsAt: Date.now() + purgeMsFor(randomPurgeMs(), bay.preheat),
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
    if (!retort.fuelCharged) chargeRetortFuel();
    patchRetort({
      primaryOn: true,
      earlyPrimaryStarts:
        secondaryTemp < 850
          ? earlyPrimaryStarts + 1
          : earlyPrimaryStarts,
      phase: phase === 'LOAD' || phase === 'IDLE' ? 'BURN' : phase,
      audioMode: retort.audioMode === 'OFF' ? 'START' : retort.audioMode,
    });
  };

  const sweepArmed = useRef(false);
  useEffect(() => {
    if (progress < 1 || phase !== 'BURN' || sweepArmed.current) return;
    sweepArmed.current = true;
    const door = useGameStore.getState().retort.doorOpen;
    patchRetort({
      primaryOn: false,
      secondaryOn: false,
      audioMode: 'OFF',
      phase: 'SWEEP',
      doorMoving: door < 0.72 ? 'UP' : null,
      largeBonesLeft: 100,
      mediumBonesLeft: 100,
      fineAshLeft: 100,
    });
    setHearthHint(
      'Calcination finished. Open Tools — sweep; contact nudges bones.'
    );
  }, [progress, phase, patchRetort]);

  const hintAt = useRef(0);
  const toolHeldRef = useRef(false);
  const showHint = (text: string) => {
    if (Date.now() - hintAt.current < 1100) return;
    hintAt.current = Date.now();
    setHearthHint(text);
    window.setTimeout(() => {
      setHearthHint((current) => (current === text ? null : current));
    }, 1600);
  };

  const spawnDust = (
    x: number,
    y: number,
    kind: 'ash' | 'char' | 'ember'
  ) => {
    const count = kind === 'ember' ? 10 : kind === 'ash' ? 14 : 7;
    const motes = Array.from({ length: count }).map((_, i) => {
      const id = dustSeq.current++;
      const angle = -Math.PI / 2 + (i / 12) * Math.PI - 0.4;
      const dist = 18 + (i % 5) * 10;
      return {
        id,
        x,
        y,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist - 10,
        size:
          kind === 'ember'
            ? 4 + (i % 3) * 2
            : kind === 'ash'
              ? 7 + (i % 4) * 3
              : 5 + (i % 3) * 2,
        tone:
          kind === 'ember' ? 'ember' : kind === 'ash' ? '0.95' : '0.55',
      };
    });
    setDust((prev) => [...prev.slice(-28), ...motes]);
    window.setTimeout(() => {
      const ids = new Set(motes.map((m) => m.id));
      setDust((prev) => prev.filter((m) => !ids.has(m.id)));
    }, 980);
    setScrape({ id: dustSeq.current++, x, y });
  };

  /** Shared contact FX for every cremation tool over remains. */
  const applyToolContact = (
    x: number,
    y: number,
    moving: boolean
  ) => {
    if (!moving || !nearRemains(x, y)) return false;
    const now = Date.now();
    setBoneNudge((n) => n + 1);
    setBoneContact((prev) => ({ x, y, n: (prev?.n ?? 0) + 1 }));
    setContactHot(true);
    if (contactHotTimer.current != null) {
      window.clearTimeout(contactHotTimer.current);
    }
    contactHotTimer.current = window.setTimeout(
      () => setContactHot(false),
      220
    );
    if (now - lastContactFx.current > 90) {
      lastContactFx.current = now;
      spawnDust(x, y, phase === 'SWEEP' ? 'char' : 'ember');
    }
    if (now - lastHaptic.current > 140) {
      lastHaptic.current = now;
      void hapticBoneContact();
    }
    return true;
  };

  const pointInChamber = (clientX: number, clientY: number) => {
    const rect = chamberRef.current?.getBoundingClientRect();
    if (!rect) return null;
    const x = Math.min(96, Math.max(4, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.min(94, Math.max(6, ((clientY - rect.top) / rect.height) * 100));
    return { x, y };
  };

  const applyDownstroke = (tool: SweepTool, x: number, y: number) => {
    const live = useGameStore.getState().retort;
    if (live.phase !== 'SWEEP') {
      showHint('The charge is still calcining.');
      return;
    }
    if (live.doorOpen < 0.35) {
      showHint('Open the door to reach the hearth.');
      return;
    }
    if (tool === 'IRON_RAKE') {
      if (live.largeBonesLeft <= 0) {
        showHint('Large bones are clear. Take the iron brush.');
        return;
      }
      useGameStore.setState((s) => ({
        retort: {
          ...s.retort,
          largeBonesLeft: Math.max(0, s.retort.largeBonesLeft - 20),
        },
      }));
      spawnDust(x, y, 'char');
      void hapticIronRake();
    } else if (tool === 'BRISTLE_BRUSH') {
      if (live.largeBonesLeft > 0) {
        showHint('Rake the large bones first.');
        return;
      }
      if (live.mediumBonesLeft <= 0) {
        showHint('Fragments are clear. Take the hand brush.');
        return;
      }
      useGameStore.setState((s) => ({
        retort: {
          ...s.retort,
          mediumBonesLeft: Math.max(0, s.retort.mediumBonesLeft - 22),
        },
      }));
      spawnDust(x, y, 'char');
      void hapticIronRake();
    } else if (tool === 'HAND_BRUSH') {
      if (live.mediumBonesLeft > 0 || live.largeBonesLeft > 0) {
        showHint('Clear bones and fragments before the ash.');
        return;
      }
      if (live.fineAshLeft <= 0) return;
      useGameStore.setState((s) => ({
        retort: {
          ...s.retort,
          fineAshLeft: Math.max(0, s.retort.fineAshLeft - 25),
        },
      }));
      spawnDust(x, y, 'ash');
    }
    setBoneNudge((n) => n + 1);
  };

  const selectTool = (tool: SweepTool) => {
    patchRetort({ activeTool: tool });
    setToolMenuOpen(false);
    setPanelZoomed(false);
    setToolHeld(false);
    setToolGlide(true);
    setToolPos({ x: 18, y: 86 });
    window.setTimeout(() => setToolPos({ x: 54, y: 70 }), 40);
    window.setTimeout(() => setToolGlide(false), 520);
  };

  const moveHeldTool = (clientX: number, clientY: number) => {
    const point = pointInChamber(clientX, clientY);
    if (!point || !activeTool) return;
    const prev = prevToolPoint.current ?? point;
    prevToolPoint.current = point;
    setToolPos(point);

    const dist = Math.hypot(point.x - prev.x, point.y - prev.y);
    const moving = dist > 1.2;
    const dy = point.y - prev.y;
    const overHearth =
      point.x > 10 && point.x < 92 && point.y > 48 && point.y < 98;

    // Contact feedback for ALL tools (rod, rake, brushes)
    applyToolContact(point.x, point.y, moving);

    if (activeTool === 'STIRRING_ROD') {
      const live = useGameStore.getState().retort;
      if (live.doorOpen <= STIR_DOOR_MIN) {
        if (dist > 5) showHint('Open the door past 16% to stir.');
        resetCircularStir(circularStirRef.current);
        return;
      }
      if (live.phase !== 'BURN' || !live.primaryOn) {
        if (dist > 6) showHint('Primary must be firing to stir.');
        resetCircularStir(circularStirRef.current);
        return;
      }
      if (!nearRemains(point.x, point.y)) {
        // Linear wanders outside the charge don't build stir credit
        return;
      }
      const credited = feedCircularStir(circularStirRef.current, point);
      if (credited && Date.now() - lastStirAt.current > 280) {
        lastStirAt.current = Date.now();
        useGameStore.setState((s) => ({
          retort: {
            ...s.retort,
            stirCount: s.retort.stirCount + 1,
            primaryTemp: Math.max(
              850,
              s.retort.primaryTemp - 55 - s.retort.doorOpen * 40
            ),
          },
        }));
        spawnDust(point.x, point.y, 'ember');
        if (Date.now() - lastHaptic.current > 100) {
          lastHaptic.current = Date.now();
          void hapticIronRake();
        }
        showHint('Circular stir — keep orbiting the charge.');
      }
      return;
    }

    // Sweep tools: downstroke still clears piles; contact already nudged bones
    if (dy < -1.5) {
      strokeRef.current = { minY: point.y, accum: 0, credited: false };
      return;
    }
    if (point.y < strokeRef.current.minY) strokeRef.current.minY = point.y;
    if (dy > 0 && overHearth) {
      strokeRef.current.accum += dy;
      const traveled = point.y - strokeRef.current.minY;
      if (
        !strokeRef.current.credited &&
        strokeRef.current.accum >= 11 &&
        traveled >= 11
      ) {
        strokeRef.current.credited = true;
        applyDownstroke(activeTool, point.x, point.y);
      }
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
  };

  const pager =
    bayCount < 2 ? null : (
      <div className="shrink-0 flex items-center justify-center gap-4 py-2">
        <button
          type="button"
          aria-label="Previous retort"
          onPointerDown={() =>
            selectRetort((bayIndex + bayCount - 1) % bayCount)
          }
          className="w-10 h-10 rounded-full border border-stone-500 text-lg leading-none"
        >
          ‹
        </button>
        <div className="flex items-center gap-2">
          {Array.from({ length: bayCount }).map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Retort ${String.fromCharCode(65 + i)}`}
              onPointerDown={() => selectRetort(i)}
              className={`w-2.5 h-2.5 rounded-full ${
                i === bayIndex ? 'bg-orange-300' : 'bg-stone-600'
              }`}
            />
          ))}
        </div>
        <button
          type="button"
          aria-label="Next retort"
          onPointerDown={() => selectRetort((bayIndex + 1) % bayCount)}
          className="w-10 h-10 rounded-full border border-stone-500 text-lg leading-none"
        >
          ›
        </button>
      </div>
    );

  const catalog = catalogOpen ? (
    <CrematoryCatalog
      bay={bay}
      bayIndex={bayIndex}
      onClose={() => setCatalogOpen(false)}
    />
  ) : null;

  if (!currentCase || !targets) {
    return (
      <div
        className="fixed inset-0 z-50 bg-stone-950/95 text-stone-100 flex flex-col items-center justify-center gap-4 p-6 pb-28"
        onPointerDownCapture={playControlClick}
      >
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
        <button
          type="button"
          data-click="tick"
          onPointerDown={() => setCatalogOpen(true)}
          className="px-4 py-2 bg-stone-800 rounded text-sm"
        >
          Upgrades
        </button>
        {pager}
        {catalog}
      </div>
    );
  }

  if (currentCase.isCremated || phase === 'DONE') {
    return (
      <div
        className="safe-screen fixed inset-0 z-50 bg-stone-950/95 text-stone-100 flex flex-col select-none"
        onPointerDownCapture={playControlClick}
      >
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
            Retort {currentCase.cremationRank ?? '—'}
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
        {pager}
        {catalog}
      </div>
    );
  }

  const purgeSecLeft =
    purging && purgeEndsAt
      ? Math.max(0, Math.ceil((purgeEndsAt - Date.now()) / 1000))
      : 0;

  const stockPanel =
    bay.buttons === 'millennium'
      ? 'bg-gradient-to-b from-zinc-300 via-zinc-400 to-zinc-500 border-2 border-zinc-600 shadow-xl text-zinc-900'
      : (panelChrome(bay.buttons) ??
        'bg-gradient-to-b from-zinc-300 via-zinc-400 to-zinc-500 border-2 border-zinc-600 shadow-xl text-zinc-900');
  const controlPanel = (zoomed: boolean) => (
    <div
      className={`${stockPanel} overflow-y-auto ${
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
            Dial at the foot of the retort sets this SP. Stirs {stirCount}/
            {targets.requiredStirs} · Runaways {thermalWarnings}
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

  const queuedName = bay.queueCaseId
    ? cases.find((c) => c.id === bay.queueCaseId)?.name
    : null;
  const queueChoices = cases.filter(
    (c) =>
      c.location === 'COOLER' &&
      (c.directive === 'CREMATION_DIRECT' ||
        c.directive === 'VIEWING_THEN_CREMATION' ||
        c.directive === 'CREMATION_THEN_VIEWING')
  );

  return (
    <ButtonLookContext.Provider value={bay.buttons}>
    <div
      className="safe-screen fixed inset-0 z-50 bg-[#1a2e1a] text-stone-100 flex flex-col select-none overflow-hidden"
      onPointerDownCapture={playControlClick}
    >
      <div className="shrink-0 px-1 pb-2 border-b border-stone-800/80">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-orange-300 tracking-wide truncate">
              {bay.brand === 'millennium'
                ? 'MILLENNIUM'
                : brandLabel(bay.brand).toUpperCase()}{' '}
              — {displayCaseName(currentCase)}
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
          <div className="flex flex-col gap-1 shrink-0">
            <button
              type="button"
              data-click="tick"
              onPointerDown={() => setCatalogOpen(true)}
              className="px-2.5 py-1.5 bg-stone-800 rounded text-[10px]"
            >
              Upgrades
            </button>
            <button
              type="button"
              onPointerDown={() => setActiveStation('OVERVIEW')}
              className="px-2.5 py-1.5 bg-stone-800 rounded text-[10px]"
            >
              Back
            </button>
          </div>
        </div>
        {bay.queueSlot && (
          <div className="mt-1 flex items-center gap-1 overflow-x-auto text-[10px]">
            <span className="text-stone-400 shrink-0">
              {queuedName ? `Next: ${queuedName}` : 'Queue'}
            </span>
            {!bay.queueCaseId &&
              queueChoices.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  data-click="tick"
                  onPointerDown={() => queueCaseOnRetort(c.id)}
                  className="px-2 py-1 rounded bg-stone-800 shrink-0"
                >
                  {displayCaseName(c)}
                </button>
              ))}
          </div>
        )}
        {directiveNeedsCremationPermit(currentCase.directive) &&
          currentCase.cremationPermitStatus !== 'APPROVED' && (
            <div className="mt-2 px-2 py-1.5 rounded border border-amber-700/70 bg-amber-950/50 text-[10px] text-amber-100 leading-snug">
              Cremation permit:{' '}
              <strong>{permitStatusLabel(currentCase.cremationPermitStatus)}</strong>
              . You can fire the retort now, but the State Board will fine an
              unpermitted cremation. File VR-441 on the Computer.
            </div>
          )}
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
              className="retort-brick relative flex-1 min-w-0 rounded-lg border-4 border-zinc-600 shadow-[inset_0_0_40px_rgba(0,0,0,0.65)] overflow-hidden"
              onPointerDown={(e) => {
                swipeRef.current = { x: e.clientX, y: e.clientY };
              }}
              onPointerUp={(e) => {
                const start = swipeRef.current;
                swipeRef.current = null;
                if (!start || bayCount < 2) return;
                const dx = e.clientX - start.x;
                const dy = e.clientY - start.y;
                if (Math.abs(dx) < 56 || Math.abs(dx) < Math.abs(dy) * 1.2) return;
                selectRetort(
                  (bayIndex + (dx < 0 ? 1 : bayCount - 1)) % bayCount
                );
              }}
            >
              <div className="absolute top-1 left-2 z-20 text-[8px] tracking-[0.22em] text-zinc-400 font-black pointer-events-none">
                HEARTH
              </div>

              <div
                className="absolute inset-x-0 top-0 z-30 border-b-4 border-zinc-950 shadow-2xl pointer-events-none overflow-hidden"
                style={{
                  height: `${Math.max(0, (1 - doorOpen) * 100)}%`,
                  transition: doorMoving ? 'none' : 'height 0.05s linear',
                  background:
                    doorFace(bay.door) ??
                    'linear-gradient(90deg, #3f3f46 0%, #a1a1aa 8%, #d4d4d8 18%, #71717a 46%, #e4e4e7 52%, #52525b 78%, #27272a 100%)',
                }}
              >
                <div
                  className="absolute inset-0 opacity-70"
                  style={{
                    background:
                      'repeating-linear-gradient(to bottom, rgba(0,0,0,0.28) 0 2px, transparent 2px 22px)',
                  }}
                />
                <div className="absolute left-2 top-2 bottom-2 w-1.5 rounded-full bg-black/40" />
                <div className="absolute right-2 top-2 bottom-2 w-1.5 rounded-full bg-black/40" />
                <div className="absolute left-1/2 top-[18%] -translate-x-1/2 w-24 h-14 rounded-md border border-zinc-200/40 bg-zinc-900/35 flex flex-col items-center justify-center">
                  <span className="text-[8px] font-black tracking-[0.2em] text-zinc-100">
                    {bay.brand === 'millennium'
                      ? 'MILLENNIUM'
                      : brandLabel(bay.brand).toUpperCase()}
                  </span>
                  <span className="text-[7px] text-zinc-300">
                    {bay.brand === 'millennium' ? 'REFRACTORY' : 'PLATE'}
                  </span>
                </div>
                {Array.from({ length: 4 }).map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 rounded-full bg-zinc-900 border border-zinc-300"
                    style={{
                      left: i < 2 ? 14 : undefined,
                      right: i >= 2 ? 14 : undefined,
                      top: i % 2 === 0 ? 18 : undefined,
                      bottom: i % 2 === 1 ? 28 : undefined,
                    }}
                  />
                ))}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[9px] font-mono text-zinc-100 tracking-widest whitespace-nowrap drop-shadow">
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

              <HearthCharge
                mode={phase === 'SWEEP' ? 'SWEEP' : 'BURN'}
                bonePhase={bonePhase}
                progress={progress}
                nudge={boneNudge}
                contact={boneContact}
                contactHot={contactHot}
                largeBonesLeft={largeBonesLeft}
                mediumBonesLeft={mediumBonesLeft}
                fineAshLeft={fineAshLeft}
              />

              {dust.map((mote) => {
                const ember = mote.tone === 'ember';
                return (
                  <span
                    key={mote.id}
                    className="ash-mote"
                    style={{
                      left: `${mote.x}%`,
                      top: `${mote.y}%`,
                      width: mote.size,
                      height: mote.size,
                      opacity: ember ? 0.95 : Number(mote.tone) || 0.8,
                      background: ember
                        ? 'radial-gradient(circle, #fdba74 0%, #ea580c 55%, transparent 75%)'
                        : undefined,
                      boxShadow: ember
                        ? '0 0 8px rgba(249,115,22,0.85)'
                        : undefined,
                      ['--dx' as string]: `${mote.dx}px`,
                      ['--dy' as string]: `${mote.dy}px`,
                    }}
                  />
                );
              })}
              {scrape && (
                <span
                  key={scrape.id}
                  className="hearth-scrape"
                  style={{
                    left: `${scrape.x}%`,
                    top: `${scrape.y - 8}%`,
                    height: '18%',
                  }}
                />
              )}

              {hearthHint && (
                <div className="absolute top-6 left-2 right-2 z-40 text-center text-[10px] text-amber-100 bg-black/60 rounded px-2 py-1 pointer-events-none">
                  {hearthHint}
                </div>
              )}

              {phase === 'SWEEP' && (
                <div className="absolute top-5 left-2 z-20 text-[9px] font-mono text-stone-200/90 bg-black/50 rounded px-1.5 py-1 pointer-events-none leading-tight">
                  Bone {largeBonesLeft}% · Frag {mediumBonesLeft}% · Ash {fineAshLeft}%
                </div>
              )}

              {activeTool && (
                <div
                  className={`absolute z-50 touch-none ${
                    toolHeld || toolGlide ? '' : 'tool-bob'
                  }`}
                  style={{
                    left: `${toolPos.x}%`,
                    top: `${toolPos.y}%`,
                    // Rotate 180° so tips point up/forward into the chamber
                    // (handle toward the operator). Tip sits near the finger.
                    transform:
                      toolHeld || toolGlide
                        ? 'translate(-50%, -18%) rotate(180deg)'
                        : undefined,
                    transition: toolHeld
                      ? 'none'
                      : 'left 0.45s cubic-bezier(.2,.8,.2,1), top 0.45s cubic-bezier(.2,.8,.2,1)',
                    filter: 'drop-shadow(0 12px 8px rgba(0,0,0,0.6))',
                  }}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    toolHeldRef.current = true;
                    setToolHeld(true);
                    setToolGlide(false);
                    const point = pointInChamber(e.clientX, e.clientY);
                    prevToolPoint.current = point;
                    strokeRef.current = {
                      minY: point?.y ?? 40,
                      accum: 0,
                      credited: false,
                    };
                    resetCircularStir(circularStirRef.current);
                    try {
                      (e.currentTarget as HTMLElement).setPointerCapture?.(
                        e.pointerId
                      );
                    } catch {
                      /* capture can throw on some WebViews; window listeners keep the drag alive */
                    }
                    const pointerId = e.pointerId;
                    const move = (ev: PointerEvent) => {
                      if (ev.pointerId !== pointerId || !toolHeldRef.current)
                        return;
                      moveHeldTool(ev.clientX, ev.clientY);
                    };
                    const end = (ev: PointerEvent) => {
                      if (ev.pointerId !== pointerId) return;
                      toolHeldRef.current = false;
                      setToolHeld(false);
                      prevToolPoint.current = null;
                      resetCircularStir(circularStirRef.current);
                      window.removeEventListener('pointermove', move);
                      window.removeEventListener('pointerup', end);
                      window.removeEventListener('pointercancel', end);
                    };
                    window.addEventListener('pointermove', move);
                    window.addEventListener('pointerup', end);
                    window.addEventListener('pointercancel', end);
                  }}
                >
                  <ToolArt
                    tool={activeTool}
                    className="h-48 w-auto max-w-[11rem] pointer-events-none"
                  />
                </div>
              )}

              {!activeTool && (
                <div className="absolute bottom-2 left-2 right-2 z-20 text-center text-[10px] text-amber-100/90 bg-black/50 rounded px-2 py-1 pointer-events-none">
                  {phase === 'BURN'
                    ? 'Open Tools — stir with circular orbits over the charge'
                    : 'Open Tools — sweep remains; tools nudge bones on contact'}
                </div>
              )}

              {phase === 'SWEEP' && fineAshLeft === 0 && (
                <button
                  type="button"
                  onPointerDown={finishRetortProcess}
                  className="absolute bottom-2 left-2 right-2 z-[60] py-2 bg-amber-500 text-stone-950 font-bold rounded text-[11px]"
                >
                  To Urn Processor →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="shrink-0 px-2 pt-1 flex items-end justify-between gap-2">
        <ToolDrawer
          open={toolMenuOpen}
          activeTool={activeTool}
          attention={phase === 'SWEEP' && !activeTool}
          onToggle={() => setToolMenuOpen((open) => !open)}
          onSelect={selectTool}
        />
        <div className="flex items-end gap-2 pb-0.5">
          <div className="flex flex-col gap-1 mb-6">
            {(
              [
                ['PRIMARY', 'PRI'],
                ['SECONDARY', 'SEC'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                type="button"
                onPointerDown={() => setDialChamber(id)}
                className={`px-2 py-1 rounded text-[9px] font-black tracking-wide ${
                  dialChamber === id
                    ? 'bg-amber-500 text-stone-950'
                    : 'bg-zinc-800 text-zinc-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <SetPointDial
            size="sm"
            label={dialChamber === 'PRIMARY' ? 'PRIMARY SP' : 'AFTERBURNER SP'}
            min={dialChamber === 'PRIMARY' ? PRIMARY_SP_MIN : SECONDARY_SP_MIN}
            max={dialChamber === 'PRIMARY' ? PRIMARY_SP_MAX : SECONDARY_SP_MAX}
            value={dialChamber === 'PRIMARY' ? primarySetPoint : secondarySetPoint}
            onChange={(next) =>
              patchRetort(
                dialChamber === 'PRIMARY'
                  ? { primarySetPoint: next }
                  : { secondarySetPoint: next }
              )
            }
          />
        </div>
      </div>
      {pager}
      {catalog}
    </div>
    </ButtonLookContext.Provider>
  );
};
