import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CaseTransferBar } from './CaseTransferBar';
import { displayCaseName, friendlyToken } from '../types/game';
import {
  caseAtLocation,
  CREMULATOR_REPLACEMENT_COST,
  useGameStore,
} from '../store/useGameStore';
import { hapticHammer } from '../utils/haptics';
import { getUrnById, URN_CATALOG } from '../data/urnCatalog';
import { UrnVessel } from './urns/UrnVessel';
import {
  AshField,
  BoneFragment,
  CremainsMagnet,
  CrushHammer,
  MetalBit,
  type BoneKind,
  type BoneTone,
  type MetalKind,
} from './urns/BoneArt';
import { startAshPourSfx, stopAshPourSfx } from '../utils/soundEffects';
import { boneCrushSfx } from '../audio/boneCrushSfx';
import { crematoryToolSfx } from '../audio/crematoryToolSfx';
import { latchToolMoving, sweepClipFor } from '../audio/crematoryToolSfxPolicy';
import { extractorSfx } from '../audio/extractorSfx';
import { cremulatorSfx } from '../audio/cremulatorSfx';
import {
  cremulatorDamageChance,
  cremulatorRunMs,
} from '../data/facilityUpgrades';
import { ToolArt, type BrushFlex } from './crematory/crematoryArt';

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
  kind: BoneKind;
  x: number;
  y: number;
  rot: number;
  size: number;
  /** 0 big, 1 medium, 2 small, 3 dust */
  stage: 0 | 1 | 2 | 3;
  /** Share of the body. Splits keep the same total. */
  weight: number;
  crushed: boolean;
  tone: BoneTone;
}

interface MetalFragment {
  id: number;
  kind: MetalKind;
  x: number;
  y: number;
  collected: boolean;
}

const BONE_CYCLE: BoneKind[] = ['SHAFT', 'SKULL', 'RIB', 'VERTEBRA', 'KNUCKLE'];
const STARTER_BONES = 42;
const BONE_CAP = 96;

function starterBones(): BoneChunk[] {
  return Array.from({ length: STARTER_BONES }, (_, i) => {
    const kind = BONE_CYCLE[i % BONE_CYCLE.length]!;
    return {
      id: i,
      kind,
      x: 8 + ((i * 19) % 84),
      y: 16 + ((i * 13) % 64),
      rot: (i * 37) % 110 - 55,
      size: kind === 'KNUCKLE' ? 34 : kind === 'RIB' ? 46 : 40 + (i % 4) * 5,
      stage: 0 as const,
      weight: 6,
      crushed: false,
      tone: (i % 5 === 0 ? 2 : i % 2 === 0 ? 1 : 0) as BoneTone,
    };
  });
}

const METAL_KINDS: MetalKind[] = [
  'SCREW',
  'PLATE',
  'STAPLE',
  'SCREW',
  'DENTAL_GOLD',
  'PLATE',
  'STAPLE',
  'SCREW',
];

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
    noteTutorialBeat,
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

  useEffect(() => {
    noteTutorialBeat(phase);
    if (phase !== 'HATCH') {
      crematoryToolSfx.setSweep(null);
      brushAudio.current = false;
    }
  }, [phase, noteTutorialBeat]);
  const [bones, setBones] = useState<BoneChunk[]>(starterBones);
  const [motes, setMotes] = useState<
    Array<{ id: number; x: number; y: number; dx: number; dy: number; size: number }>
  >([]);
  const boneSeq = useRef(STARTER_BONES);
  const bonesRef = useRef(bones);
  bonesRef.current = bones;
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
    METAL_KINDS.map((kind, i) => ({
      id: i,
      kind,
      x: 12 + ((i * 11) % 76),
      y: 18 + ((i * 17) % 58),
      collected: false,
    }))
  );
  const [magnetPos, setMagnetPos] = useState({ x: 50, y: 50 });
  const [brushPos, setBrushPos] = useState({ x: 48, y: 58 });
  const [brushHeld, setBrushHeld] = useState(false);
  const [brushFlex, setBrushFlex] = useState<BrushFlex>({ lean: 0, push: 0 });
  const [ashMotes, setAshMotes] = useState<
    Array<{ id: number; x: number; y: number; dx: number; dy: number; size: number }>
  >([]);
  const brushAudio = useRef(false);
  const prevBrush = useRef<{ x: number; y: number } | null>(null);
  const lastAsh = useRef(0);
  const ashSeq = useRef(1);
  const [urnFill, setUrnFill] = useState(0);
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
  const millToken = useRef(0);
  const millTimer = useRef<number | null>(null);

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
    const total = bones.reduce((sum, bone) => sum + bone.weight, 0);
    if (total <= 0) return 100;
    const done = bones.reduce(
      (sum, bone) => sum + (bone.crushed ? bone.weight : 0),
      0
    );
    return Math.round((done / total) * 100);
  }, [bones]);

  const collectedBonus = useMemo(() => {
    return fragments
      .filter((f) => f.collected)
      .reduce((sum, f) => sum + (f.kind === 'DENTAL_GOLD' ? 85 : 35), 0);
  }, [fragments]);

  const allMetalsCleared = fragments.every((f) => f.collected);

  useEffect(() => {
    void extractorSfx.preload();
    void boneCrushSfx.preload();
    void cremulatorSfx.preload();
    void crematoryToolSfx.preload();
    return () => {
      if (millTimer.current != null) {
        window.clearInterval(millTimer.current);
        millTimer.current = null;
      }
      millToken.current += 1;
      extractorSfx.stop();
      boneCrushSfx.stop();
      cremulatorSfx.stop();
      crematoryToolSfx.setSweep(null);
    };
  }, []);

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
      setDustLevel((d) => Math.min(100, d + 8));
    }, 400);
    return () => clearInterval(id);
  }, [phase, extractorOn]);

  const smashAt = (clientX: number, clientY: number) => {
    if (!trayRef.current || phase !== 'CRUSH') return;
    const rect = trayRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    setHammerPos({ x, y });
    let struck = false;
    let crushed = false;
    const incoming = bonesRef.current;
    const next: BoneChunk[] = [];
    for (const bone of incoming) {
      if (Math.hypot(bone.x - x, bone.y - y) >= 18) {
        next.push(bone);
        continue;
      }
      struck = true;
      if (bone.stage >= 3) {
        next.push(bone);
        continue;
      }
      crushed = true;
      const want = bone.stage === 0 ? 3 : bone.stage === 1 ? 2 : 1;
      const room = Math.max(1, BONE_CAP - (incoming.length - 1));
      const count = Math.max(1, Math.min(want, room));
      const nextStage = (bone.stage + 1) as 1 | 2 | 3;
      const size =
        nextStage === 1
          ? Math.max(32, bone.size * 0.62)
          : nextStage === 2
            ? Math.max(18, bone.size * 0.55)
            : Math.max(14, bone.size * 0.75);
      const share = bone.weight / count;
      for (let k = 0; k < count; k += 1) {
        next.push({
          id: boneSeq.current++,
          kind: bone.kind,
          x: Math.min(92, Math.max(8, bone.x + (k - (count - 1) / 2) * 8)),
          y: Math.min(86, Math.max(12, bone.y + (k % 2 === 0 ? -4 : 5))),
          rot: bone.rot + (k - 1) * 18,
          size,
          stage: nextStage,
          weight: share,
          crushed: nextStage === 3,
          tone: bone.tone,
        });
      }
    }
    if (!struck) return;
    if (!extractorOn) setDustLevel((d) => Math.min(100, d + 14));
    if (Date.now() - lastHammer.current > 120) {
      lastHammer.current = Date.now();
      void hapticHammer();
      if (crushed) boneCrushSfx.play();
    }
    if (!extractorOn) setDustLevel((d) => Math.min(70, d + 4));
    bonesRef.current = next;
    setBones(next);
    setMotes((prev) => [
      ...prev.slice(-40),
      ...Array.from({ length: 14 }, (_, n) => {
        const angle = (n / 14) * Math.PI * 2;
        const dist = 12 + (n % 5) * 7;
        return {
          id: particleId.current++,
          x: x + (n % 3) - 1,
          y,
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist - 6,
          size: 3 + (n % 4) * 2,
        };
      }),
    ]);
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

  const spawnAsh = (x: number, y: number) => {
    const motes = Array.from({ length: 14 }, (_, i) => {
      const angle = -Math.PI / 2 + (i / 12) * Math.PI - 0.4;
      const dist = 18 + (i % 5) * 10;
      return {
        id: ashSeq.current++,
        x,
        y,
        dx: Math.cos(angle) * dist,
        dy: Math.sin(angle) * dist - 10,
        size: 7 + (i % 4) * 3,
      };
    });
    setAshMotes((prev) => [...prev.slice(-28), ...motes]);
    window.setTimeout(() => {
      const ids = new Set(motes.map((m) => m.id));
      setAshMotes((prev) => prev.filter((m) => !ids.has(m.id)));
    }, 980);
  };

  const releaseBrush = () => {
    setBrushHeld(false);
    brushAudio.current = false;
    prevBrush.current = null;
    crematoryToolSfx.setSweep(null);
    setBrushFlex({ lean: 0, push: 0 });
  };

  const sweepWithBrush = (clientX: number, clientY: number) => {
    if (!trayRef.current) return;
    const rect = trayRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    const prev = prevBrush.current ?? { x, y };
    prevBrush.current = { x, y };
    setBrushPos({ x, y });
    const dist = Math.hypot(x - prev.x, y - prev.y);
    const dy = y - prev.y;
    const onTray = x > 4 && x < 96 && y > 6 && y < 98;
    const moving = latchToolMoving(brushAudio.current, dist);
    brushAudio.current = moving;
    crematoryToolSfx.setSweep(
      sweepClipFor({
        tool: 'BRISTLE_BRUSH',
        moving,
        onHearth: onTray,
        touchingBones: false,
        phase: 'SWEEP',
      })
    );
    if (onTray && moving) {
      setBrushFlex({
        lean: Math.max(-1, Math.min(1, (prev.x - x) / 2.2)),
        push: Math.max(0, Math.min(1, dy / 2.4)),
      });
      if (Date.now() - lastAsh.current > 90) {
        lastAsh.current = Date.now();
        spawnAsh(x, y);
      }
    } else {
      setBrushFlex((cur) =>
        cur.lean === 0 && cur.push === 0 ? cur : { lean: 0, push: 0 }
      );
    }
    if (hatchLoaded || !onTray || dy <= 0) return;
    setHatchFill((v) => {
      const next = Math.min(100, v + Math.min(6, dy * 0.45));
      if (next >= 100) {
        setHatchLoaded(true);
        setLoadingSorting(true);
      }
      return next;
    });
    setBones((prevBones) =>
      prevBones.map((b) => ({
        ...b,
        x: b.x + (50 - b.x) * 0.05,
        y: Math.min(88, b.y + Math.max(1.2, dy * 0.35)),
      }))
    );
  };

  const startExtractor = () => {
    noteTutorialBeat('EXTRACTOR');
    setExtractorOn(true);
    extractorSfx.start();
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

  const shutCremulator = (done: boolean) => {
    if (millTimer.current != null) {
      window.clearInterval(millTimer.current);
      millTimer.current = null;
    }
    millToken.current += 1;
    setProcessing(false);
    if (done) setCremulatorProgress(100);
    cremulatorSfx.stop();
  };

  const engageCremulator = () => {
    if (!hatchLoaded || !cremulatorOwned || processing) return;
    const levels = useGameStore.getState().facilityLevels;
    const level = levels.cremulator || 0;
    if (!magnetCleared && !allMetalsCleared) {
      if (Math.random() < cremulatorDamageChance(level)) {
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
    if (millTimer.current != null) {
      window.clearInterval(millTimer.current);
      millTimer.current = null;
    }
    setProcessing(true);
    setLoadingSorting(false);
    setCremulatorProgress(0);
    cremulatorSfx.start();
    const token = ++millToken.current;
    const start = performance.now();
    const duration = cremulatorRunMs(level);
    millTimer.current = window.setInterval(() => {
      if (millToken.current !== token) return;
      const p = Math.min(100, ((performance.now() - start) / duration) * 100);
      if (p >= 100) {
        shutCremulator(true);
        return;
      }
      setCremulatorProgress(p);
    }, 200);
  };

  const emergencyStop = () => {
    shutCremulator(false);
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
    const ashBonus = Math.round((currentCase.cremainsQuality ?? 0) * 0.8);
    completeUrnFilling(
      collectedBonus + pourBonus + ashBonus,
      currentCase.id,
      pourQuality
    );
    setPhase('DONE');
  };

  if (!currentCase) {
    return (
      <div className="fixed inset-0 z-50 bg-zinc-950/95 text-zinc-100 flex flex-col items-center justify-center gap-4 p-6 pb-28">
        <p className="text-center text-sm max-w-sm">
          No cremains on the tray yet. Finish a cremation, then open the processor.
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onPointerDown={() => setActiveStation('CREMATION')}
            className="px-4 py-2 bg-orange-700 rounded font-semibold"
          >
            Open Crematory
          </button>
          <button
            type="button"
            onPointerDown={() => setActiveStation('OVERVIEW')}
            className="px-4 py-2 bg-slate-800 rounded font-semibold"
          >
            Back to hub
          </button>
        </div>
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
            data-tutorial-target="back"
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
          data-tutorial-target="back"
          onPointerDown={() => setActiveStation('OVERVIEW')}
          className="px-2.5 py-1.5 bg-zinc-800 rounded text-[10px] shrink-0"
        >
          Back
        </button>
      </div>

      {(phase === 'CRUSH' ||
        phase === 'MAGNET' ||
        phase === 'HATCH' ||
        phase === 'PROCESSOR') && (
        <div className="shrink-0 mt-2 rounded-lg border border-zinc-600 bg-zinc-800 px-2 py-2">
          <div className="flex items-end justify-between gap-1.5">
            <button
              type="button"
              data-tutorial-target="extractor"
              onPointerDown={startExtractor}
              className={`w-[4.6rem] h-14 rounded-md border-b-4 font-black text-[8px] leading-tight tracking-wide ${
                extractorOn
                  ? 'bg-emerald-500 border-emerald-900 text-emerald-950'
                  : 'bg-emerald-700 border-emerald-950 text-emerald-50 active:translate-y-px active:border-b-2'
              }`}
            >
              START
              <br />
              EXTRACTOR
            </button>
            <div className="flex flex-col items-center justify-end min-w-[4.2rem] pb-0.5">
              <div
                className={`w-7 h-7 rounded-full border-2 border-zinc-950 ${
                  extractorOn || loadingSorting
                    ? 'bg-yellow-300 shadow-[0_0_14px_#fde047]'
                    : 'bg-yellow-950'
                }`}
                aria-hidden
              />
              <span className="text-[7px] uppercase text-zinc-300 text-center leading-tight mt-1">
                Sort remains
              </span>
            </div>
            <button
              type="button"
              data-tutorial-target="engage"
              disabled={!hatchLoaded || processing || cremulatorProgress >= 100}
              onPointerDown={engageCremulator}
              className={`w-[4.2rem] h-14 rounded-md border-b-4 font-black text-[8px] leading-tight disabled:opacity-40 ${
                processing
                  ? 'bg-amber-400 border-amber-900 text-amber-950'
                  : 'bg-zinc-200 border-zinc-500 text-zinc-900 active:translate-y-px active:border-b-2'
              }`}
            >
              ENGAGE
            </button>
            <button
              type="button"
              onPointerDown={emergencyStop}
              className="w-14 h-14 rounded-full border-b-4 border-red-950 bg-red-600 text-white font-black text-[8px] leading-tight active:translate-y-px active:border-b-2"
            >
              EMERGENCY
              <br />
              STOP
            </button>
          </div>
          {hatchLoaded && !magnetCleared && !allMetalsCleared && (
            <p className="text-[9px] text-amber-300 mt-1.5 text-center">
              Warning: Engage without magnet sweep can destroy the cremulator.
            </p>
          )}
        </div>
      )}

      {(phase === 'CRUSH' ||
        phase === 'MAGNET' ||
        phase === 'HATCH' ||
        phase === 'PROCESSOR') && (
        <div className="flex-1 min-h-0 flex flex-col gap-2 mt-2">
          <p className="text-[11px] text-zinc-400 shrink-0">
            {phase === 'CRUSH' &&
              'Tap the hammer. The bones stay in this tray. Start the extractor or the dust will white the screen out.'}
            {phase === 'MAGNET' &&
              'Drag the magnet through the same pile. It pulls screws, plates, and implants.'}
            {phase === 'HATCH' &&
              'Sweep the remains down into the hatch with the Hand Brush. They are still the bones you crushed.'}
            {phase === 'PROCESSOR' &&
              'The tray stays put. Press Engage. Emergency Stop kills the mill.'}
          </p>
          <div
            ref={trayRef}
            data-tutorial-target={phase === 'CRUSH' ? 'hammer' : undefined}
            className="relative flex-1 rounded-xl border border-zinc-500 overflow-hidden touch-none"
            style={{
              backgroundImage: 'url(/textures/tray-steel.jpg)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
            onPointerDown={(e) => {
              (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
              if (phase === 'CRUSH') {
                setHammerHeld(true);
                smashAt(e.clientX, e.clientY);
              } else if (phase === 'MAGNET') {
                moveMagnet(e.clientX, e.clientY);
              } else if (phase === 'HATCH') {
                setBrushHeld(true);
                sweepWithBrush(e.clientX, e.clientY);
              }
            }}
            onPointerMove={(e) => {
              if (phase === 'CRUSH' && (hammerHeld || e.buttons > 0)) {
                smashAt(e.clientX, e.clientY);
              } else if (phase === 'MAGNET' && (e.buttons > 0 || e.pressure > 0)) {
                moveMagnet(e.clientX, e.clientY);
              } else if (phase === 'HATCH' && (brushHeld || e.buttons > 0)) {
                sweepWithBrush(e.clientX, e.clientY);
              }
            }}
            onPointerUp={() => {
              setHammerHeld(false);
              if (phase === 'HATCH') releaseBrush();
            }}
            onPointerCancel={() => {
              setHammerHeld(false);
              if (phase === 'HATCH') releaseBrush();
            }}
          >
            <div className="absolute inset-0 bg-black/10 pointer-events-none" />
            {bones.map((b) => (
              <div
                key={`${b.id}-${b.stage}`}
                className="bone-hit absolute pointer-events-none"
                data-bone-stage={b.stage}
                style={{
                  left: `${b.x}%`,
                  top: `${b.y}%`,
                  width: b.size,
                  height: b.size * 0.62,
                  transform: `translate(-50%, -50%) rotate(${b.rot}deg)`,
                  filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.55))',
                  opacity: phase === 'PROCESSOR' ? 0.55 : 1,
                }}
              >
                <BoneFragment
                  kind={b.kind}
                  stage={b.stage}
                  tone={b.tone}
                  variant={b.id % 3}
                />
              </div>
            ))}
            {fragments.map((f) =>
              f.collected ? null : (
                <div
                  key={`metal-${f.id}`}
                  className="absolute pointer-events-none z-10"
                  style={{
                    left: `${f.x}%`,
                    top: `${f.y}%`,
                    width: f.kind === 'PLATE' ? 34 : f.kind === 'STAPLE' ? 24 : 16,
                    height: f.kind === 'SCREW' ? 30 : 18,
                    transform: 'translate(-50%, -50%)',
                    filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.6))',
                  }}
                >
                  <MetalBit kind={f.kind} />
                </div>
              )
            )}
            {motes.map((m) => (
              <span
                key={m.id}
                className="bone-mote"
                style={{
                  left: `${m.x}%`,
                  top: `${m.y}%`,
                  width: m.size,
                  height: m.size,
                  ['--dx' as string]: `${m.dx}px`,
                  ['--dy' as string]: `${m.dy}px`,
                }}
              />
            ))}
            {phase === 'CRUSH' && (
              <div
                className="absolute pointer-events-none z-20"
                style={{
                  left: `${hammerPos.x}%`,
                  top: `${hammerPos.y}%`,
                  width: 54,
                  height: 96,
                  transform: `translate(-50%, -78%) rotate(${hammerHeld ? -28 : -12}deg)`,
                  filter: 'drop-shadow(0 8px 6px rgba(0,0,0,0.55))',
                }}
              >
                <CrushHammer held={hammerHeld} />
              </div>
            )}
            {phase === 'MAGNET' && (
              <div
                className="absolute pointer-events-none z-20"
                style={{
                  left: `${magnetPos.x}%`,
                  top: `${magnetPos.y}%`,
                  width: 72,
                  height: 96,
                  transform: 'translate(-50%, -70%)',
                  filter: 'drop-shadow(0 8px 6px rgba(0,0,0,0.55))',
                }}
              >
                <CremainsMagnet />
              </div>
            )}
            {ashMotes.map((mote) => (
              <span
                key={mote.id}
                className="ash-mote"
                style={{
                  left: `${mote.x}%`,
                  top: `${mote.y}%`,
                  width: mote.size,
                  height: mote.size,
                  opacity: 0.95,
                  ['--dx' as string]: `${mote.dx}px`,
                  ['--dy' as string]: `${mote.dy}px`,
                }}
              />
            ))}
            {phase === 'HATCH' && (
              <div
                className={`absolute z-50 pointer-events-none ${
                  brushHeld ? '' : 'tool-bob-brush'
                }`}
                data-hatch-brush="hand"
                style={{
                  left: `${brushPos.x}%`,
                  top: `${brushPos.y}%`,
                  transform: brushHeld ? 'translate(-50%, -100%)' : undefined,
                  filter: 'drop-shadow(0 12px 8px rgba(0,0,0,0.6))',
                }}
              >
                <ToolArt
                  tool="BRISTLE_BRUSH"
                  className="h-44 w-auto max-w-[12rem]"
                  flex={brushFlex}
                />
              </div>
            )}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-14 border border-zinc-700 bg-zinc-950/80 rounded-b-lg flex flex-col items-center justify-end pb-1 overflow-hidden z-10">
              <div className="absolute inset-0 opacity-80" style={{ height: `${hatchFill}%`, top: 'auto' }}>
                <AshField seed={4} />
              </div>
              <span className="relative z-10 text-[9px] font-mono text-stone-100">
                HATCH {Math.round(hatchFill)}%
              </span>
            </div>
            {dustLevel > 4 && (
              <div
                className="absolute inset-0 z-30 pointer-events-none"
                style={{
                  opacity: dustLevel / 100,
                  background: '#f4f1ea',
                }}
              >
                {dustLevel > 55 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xs font-bold text-stone-700">
                      Bone dust. Start the extractor.
                    </span>
                  </div>
                )}
              </div>
            )}
            <div className="absolute top-2 left-2 text-[10px] font-mono text-stone-900 bg-stone-100/80 px-1 z-10">
              Crush {crushProgress}%
              {processing ? ` · Mill ${Math.round(cremulatorProgress)}%` : ''}
            </div>
          </div>
          {phase === 'CRUSH' && (
            <button
              type="button"
              data-tutorial-target="crush"
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
          )}
          {phase === 'MAGNET' && (
            <button
              type="button"
              data-tutorial-target="magnet"
              onPointerDown={() => {
                if (allMetalsCleared) setMagnetCleared(true);
                setPhase('HATCH');
              }}
              className={`w-full py-3 rounded font-bold text-sm ${
                allMetalsCleared ? 'bg-emerald-600' : 'bg-amber-800 text-amber-100'
              }`}
            >
              {allMetalsCleared
                ? 'Metals Cleared — Sweep into Hatch →'
                : `Skip magnet (${fragments.filter((f) => !f.collected).length} left) — risky →`}
            </button>
          )}
          {phase === 'HATCH' && (
            <button
              type="button"
              data-tutorial-target="hatch"
              disabled={!hatchLoaded}
              onPointerDown={() => hatchLoaded && setPhase('PROCESSOR')}
              className={`w-full py-3 rounded font-bold text-sm ${
                hatchLoaded ? 'bg-emerald-600' : 'bg-zinc-800 text-zinc-500'
              }`}
            >
              {hatchLoaded ? 'Hatch Loaded — Open Processor →' : 'Sweep remains into hatch'}
            </button>
          )}
          {phase === 'PROCESSOR' && cremulatorProgress >= 100 && (
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
                    {friendlyToken(familyUrn.material)} · prestige {familyUrn.prestigeBonus}
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
                    data-tutorial-target="choose-urn"
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
            className="relative flex-1 rounded-xl border border-zinc-600 flex items-end justify-center pb-6 touch-none overflow-hidden"
            onPointerDown={(e) => {
              e.preventDefault();
              tiltingRef.current = true;
              try {
                e.currentTarget.setPointerCapture(e.pointerId);
              } catch {
                /* window pointermove/up still drive the pour */
              }
              applyPourAt(e.clientY);
            }}
          >
            <div className="absolute inset-0 pointer-events-none" aria-hidden>
              <div className="absolute inset-0 bg-[#7a756e]" />
              <div className="absolute inset-x-0 top-0 h-[62%] bg-gradient-to-b from-[#8d887f] to-[#6a655f]" />
              <div className="absolute left-[10%] top-[8%] w-[28%] h-[22%] bg-[#d6d3d1] border-[6px] border-[#3f3f46] shadow-inner" />
              <div className="absolute left-[14%] top-[12%] w-[20%] h-[14%] bg-[#e7e5e4]/80" />
              <div className="absolute right-[8%] top-[12%] w-[16%] bottom-[38%] bg-[#3f3f46] border border-[#27272a]" />
              <div className="absolute right-[11%] top-[18%] w-[10%] h-2 bg-[#a1a1aa]" />
              <div className="absolute right-[11%] top-[28%] w-[10%] h-2 bg-[#a1a1aa]" />
              <div className="absolute inset-x-0 top-[60%] h-2 bg-[#3f3f46]" />
              <div
                className="absolute inset-x-[4%] bottom-[6%] h-[24%] border border-[#52525b]"
                style={{
                  backgroundImage: 'url(/textures/tray-steel.jpg)',
                  backgroundSize: 'cover',
                }}
              />
            </div>
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
                    className="absolute inset-x-0 bottom-0 overflow-hidden transition-all"
                    style={{ height: `${urnFill}%` }}
                  >
                    <div className="absolute inset-x-0 bottom-0 h-24">
                      <AshField seed={9} />
                    </div>
                  </div>
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
            data-tutorial-target="seal"
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
