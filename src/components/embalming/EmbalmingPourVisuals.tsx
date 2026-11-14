import React, { useEffect, useId, useRef } from 'react';

export type EmbalmFluid = 'WATER' | 'FORMALDEHYDE' | 'SOFTENER';

export const FLUID_TINT: Record<
  EmbalmFluid,
  { stream: string; edge: string; splash: string; deep: string }
> = {
  FORMALDEHYDE: {
    stream: 'rgba(244, 114, 182, 0.92)',
    edge: 'rgba(253, 224, 240, 0.85)',
    splash: 'rgba(244, 114, 182, 0.7)',
    deep: 'rgba(157, 23, 77, 0.55)',
  },
  SOFTENER: {
    stream: 'rgba(167, 139, 250, 0.9)',
    edge: 'rgba(237, 233, 254, 0.8)',
    splash: 'rgba(167, 139, 250, 0.65)',
    deep: 'rgba(91, 33, 182, 0.5)',
  },
  WATER: {
    stream: 'rgba(125, 211, 252, 0.88)',
    edge: 'rgba(240, 249, 255, 0.9)',
    splash: 'rgba(125, 211, 252, 0.6)',
    deep: 'rgba(12, 74, 110, 0.45)',
  },
};

type BottleProps = {
  kind: 'FORMALDEHYDE' | 'SOFTENER';
};

/** Arterial bottle. Positioning and tilt live on the wrapper so the mouth stays measurable. */
export const ChemicalBottle: React.FC<BottleProps> = ({ kind }) => {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const isForm = kind === 'FORMALDEHYDE';
  const bodyFill = isForm ? '#f9a8d4' : '#c4b5fd';
  const bodyDeep = isForm ? '#db2777' : '#7c3aed';
  const labelBg = isForm ? '#fdf2f8' : '#f5f3ff';
  const labelInk = isForm ? '#9d174d' : '#5b21b6';
  const title = isForm ? '20-INDEX' : 'HUMECTANT';
  const subtitle = isForm ? 'ARTERIAL FLUID' : 'TISSUE SOFTENER';
  const chemLine = isForm ? 'FORMALDEHYDE' : 'SOFTENER';
  const bodyId = `bottle-body-${uid}`;
  const plasticId = `bottle-plastic-${uid}`;

  return (
    <svg viewBox="0 0 76 168" className="w-full h-full drop-shadow-lg">
      <defs>
        <linearGradient id={bodyId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={bodyDeep} stopOpacity="0.55" />
          <stop offset="35%" stopColor={bodyFill} stopOpacity="0.95" />
          <stop offset="100%" stopColor={bodyDeep} stopOpacity="0.75" />
        </linearGradient>
        <linearGradient id={plasticId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.35" />
          <stop offset="40%" stopColor="#f8fafc" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.4" />
        </linearGradient>
      </defs>
      <rect x="26" y="2" width="24" height="14" rx="2" fill="#475569" />
      <rect x="28" y="4" width="20" height="3" rx="1" fill="#64748b" />
      <rect x="30" y="16" width="16" height="8" rx="1.5" fill="#334155" />
      <path d="M30 24 h16 v14 c0 4 -2 6 -8 6 s-8 -2 -8 -6 z" fill="#cbd5e1" opacity="0.85" />
      <path
        d="M18 48 C18 40, 26 38, 38 38 C50 38, 58 40, 58 48 L58 152 C58 158, 52 162, 38 162 C24 162, 18 158, 18 152 Z"
        fill={`url(#${bodyId})`}
        stroke="#1e293b"
        strokeWidth="1.2"
      />
      <path
        d="M22 50 C22 44, 28 42, 38 42 C48 42, 54 44, 54 50 L54 148 C54 152, 48 156, 38 156 C28 156, 22 152, 22 148 Z"
        fill={`url(#${plasticId})`}
      />
      <rect x="24" y="62" width="28" height="58" rx="2" fill={labelBg} stroke={labelInk} strokeWidth="0.8" />
      <text x="38" y="76" textAnchor="middle" fill={labelInk} fontSize="6.5" fontFamily="ui-monospace, monospace" fontWeight="700">
        {title}
      </text>
      <line x1="28" y1="80" x2="48" y2="80" stroke={labelInk} strokeWidth="0.6" />
      <text x="38" y="92" textAnchor="middle" fill={labelInk} fontSize="4.8" fontFamily="ui-sans-serif, system-ui, sans-serif" fontWeight="600">
        {subtitle}
      </text>
      <text x="38" y="104" textAnchor="middle" fill={labelInk} fontSize="5.2" fontFamily="ui-monospace, monospace" fontWeight="700">
        {chemLine}
      </text>
      <text x="38" y="114" textAnchor="middle" fill="#64748b" fontSize="4" fontFamily="ui-sans-serif, system-ui, sans-serif">
        {isForm ? 'Prep Grade' : 'Moisture'}
      </text>
    </svg>
  );
};

type Vec = { x: number; y: number };
type RopePoint = { x: number; y: number; px: number; py: number };
type SplashBit = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  r: number;
  kind: 'drop' | 'spray' | 'ripple' | 'puddle' | 'glint';
};

const ROPE_N = 18;
const BOTTLE_W = 68;

function clamp(n: number, a: number, b: number) {
  return Math.max(a, Math.min(b, n));
}

function bottleBox() {
  const w = BOTTLE_W;
  const h = w * (168 / 76);
  return { w, h, ox: 0.5, oy: 0.17 };
}

/** Mouth and aim in stage pixels. Grip is the neck, under the finger. */
function bottleEmitter(grip: Vec, tiltDeg: number): { mouth: Vec; dir: Vec } {
  const rad = (tiltDeg * Math.PI) / 180;
  const dir = { x: Math.sin(rad), y: -Math.cos(rad) };
  return {
    mouth: { x: grip.x + dir.x * 26, y: grip.y + dir.y * 18 },
    dir,
  };
}

function drawSmooth(ctx: CanvasRenderingContext2D, pts: Vec[]) {
  if (pts.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const xc = (pts[i].x + pts[i + 1].x) / 2;
    const yc = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
  }
  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
}

type SpinePt = { x: number; y: number; nx: number; ny: number; u: number };

/** Ballistic arc plus a slow sine wobble. Normals come from the parabola, so the ribbon cannot kink. */
function sampleSpine(
  origin: Vec,
  dir: Vec,
  speed: number,
  gravity: number,
  time: number,
  amp: number,
  flight: number,
  steps: number
): SpinePt[] {
  const pts: SpinePt[] = [];
  let x = origin.x;
  let y = origin.y;
  let vx = dir.x * speed;
  let vy = dir.y * speed;
  const dt = flight / steps;
  for (let i = 0; i <= steps; i++) {
    const sp = Math.hypot(vx, vy) || 1;
    const nx = -vy / sp;
    const ny = vx / sp;
    const u = i / steps;
    const env = Math.sin(u * Math.PI);
    const wob =
      Math.sin(time * 2.4 + u * 7.4) * amp * env +
      Math.sin(time * 3.6 + u * 4.1) * amp * 0.28 * env;
    pts.push({ x: x + nx * wob, y: y + ny * wob, nx, ny, u });
    vy += gravity * dt;
    x += vx * dt;
    y += vy * dt;
  }
  return pts;
}

function traceSide(ctx: CanvasRenderingContext2D, pts: Vec[], move: boolean) {
  if (pts.length === 0) return;
  if (move) ctx.moveTo(pts[0].x, pts[0].y);
  else ctx.lineTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length - 1; i++) {
    const xc = (pts[i].x + pts[i + 1].x) / 2;
    const yc = (pts[i].y + pts[i + 1].y) / 2;
    ctx.quadraticCurveTo(pts[i].x, pts[i].y, xc, yc);
  }
  ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
}

function drawLiquid(
  ctx: CanvasRenderingContext2D,
  spine: SpinePt[],
  width0: number,
  tint: { stream: string; edge: string; deep: string }
) {
  if (spine.length < 3) return;
  const band = (scale: number, color: string) => {
    const left: Vec[] = [];
    const right: Vec[] = [];
    for (const p of spine) {
      const w = Math.max(0.6, width0 * scale * (1 - p.u * 0.7));
      left.push({ x: p.x + p.nx * w, y: p.y + p.ny * w });
      right.push({ x: p.x - p.nx * w, y: p.y - p.ny * w });
    }
    ctx.beginPath();
    traceSide(ctx, left, true);
    traceSide(ctx, [...right].reverse(), false);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };
  band(1, tint.deep);
  band(0.68, tint.stream);
  band(0.2, tint.edge);
}

export type PourPointer = { x: number; y: number };

type PourStageProps = {
  pointerRef: React.RefObject<PourPointer>;
  tankRef: React.RefObject<HTMLDivElement | null>;
  fluid: EmbalmFluid;
  isPouring: boolean;
  tiltDegrees: number;
  isGlugging: boolean;
  flowOzPerSec: number;
  fillPercent: number;
};

/**
 * Bottle under the finger, slack hose from the left, and a lagged gravity stream.
 * Gameplay (proximity → tilt → ounces) stays in the mini-game; this is the picture.
 */
export const PourStage: React.FC<PourStageProps> = ({
  pointerRef,
  tankRef,
  fluid,
  isPouring,
  tiltDegrees,
  isGlugging,
  flowOzPerSec,
  fillPercent,
}) => {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bottleRef = useRef<HTMLDivElement>(null);
  const live = useRef({
    fluid,
    isPouring,
    tiltDegrees,
    isGlugging,
    flowOzPerSec,
    fillPercent,
  });
  live.current = {
    fluid,
    isPouring,
    tiltDegrees,
    isGlugging,
    flowOzPerSec,
    fillPercent,
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    const bottleEl = bottleRef.current;
    if (!canvas || !stage || !bottleEl) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rope: RopePoint[] = [];
    const splash: SplashBit[] = [];
    const emit = { x: 0, y: 0, dx: 0, dy: 1, ready: false };
    let dripUntil = 0;
    let sheen = 0;
    let lastSplash = 0;
    let last = performance.now();
    let raf = 0;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const maxSplash = reduced ? 24 : 52;

    const ensureRope = (w: number, h: number) => {
      if (rope.length === ROPE_N) return;
      rope.length = 0;
      for (let i = 0; i < ROPE_N; i++) {
        const t = i / (ROPE_N - 1);
        const x = 4 + t * w * 0.22;
        const y = h * 0.34 + Math.sin(t * Math.PI) * h * 0.32;
        rope.push({ x, y, px: x, py: y });
      }
    };

    const stepRope = (w: number, h: number, dt: number, target: Vec, pouring: boolean) => {
      ensureRope(w, h);
      const damp = 0.985;
      const grav = 520;
      for (let i = 1; i < rope.length; i++) {
        const p = rope[i];
        const vx = (p.x - p.px) * damp;
        const vy = (p.y - p.py) * damp;
        p.px = p.x;
        p.py = p.y;
        p.x += vx;
        p.y += vy + grav * dt * dt;
      }
      const lastP = rope[rope.length - 1];
      const follow = pouring ? 0.22 : 0.08;
      lastP.x += (target.x - lastP.x) * follow;
      lastP.y += (target.y - lastP.y) * follow;

      const pin = { x: 0, y: h * 0.38 };
      const span = Math.hypot(target.x - pin.x, target.y - pin.y);
      const rest = Math.max(span * 1.34, span + 48) / (rope.length - 1);
      for (let k = 0; k < 8; k++) {
        rope[0].x = pin.x;
        rope[0].y = pin.y;
        rope[0].px = pin.x;
        rope[0].py = pin.y;
        for (let i = 0; i < rope.length - 1; i++) {
          const a = rope[i];
          const b = rope[i + 1];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const dist = Math.hypot(dx, dy) || 0.0001;
          const diff = (dist - rest) / dist;
          const ox = dx * diff * 0.5;
          const oy = dy * diff * 0.5;
          if (i > 0) {
            a.x += ox;
            a.y += oy;
          }
          b.x -= ox;
          b.y -= oy;
        }
      }
    };

    const nozzleTip = (): { tip: Vec; dir: Vec } => {
      const n = rope.length;
      const a = rope[n - 2];
      const b = rope[n - 1];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      dx /= len;
      dy /= len;
      // The hose may climb into the hand. The spout itself droops, so water leaves downward.
      let ax = dx * 0.35 + 0.25;
      let ay = 0.9;
      const al = Math.hypot(ax, ay) || 1;
      ax /= al;
      ay /= al;
      return {
        tip: { x: b.x + ax * 30, y: b.y + ay * 30 },
        dir: { x: ax, y: ay },
      };
    };

    const burst = (x: number, y: number, inTank: boolean) => {
      if (splash.length > maxSplash) splash.splice(0, 8);
      splash.push({
        x,
        y,
        vx: 0,
        vy: 0,
        age: 0,
        life: 0.7,
        r: inTank ? 22 : 16,
        kind: 'ripple',
      });
      splash.push({
        x,
        y,
        vx: 0,
        vy: 0,
        age: 0,
        life: inTank ? 1.3 : 1.6,
        r: inTank ? 10 : 14,
        kind: 'puddle',
      });
      const drops = reduced ? 4 : 9;
      for (let i = 0; i < drops; i++) {
        const ang = -Math.PI * 0.85 + Math.random() * Math.PI * 0.7;
        const sp = 50 + Math.random() * 140;
        splash.push({
          x,
          y,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp,
          age: 0,
          life: 0.45 + Math.random() * 0.35,
          r: 1.4 + Math.random() * 1.8,
          kind: i % 3 === 0 ? 'spray' : 'drop',
        });
      }
      splash.push({
        x: x + (Math.random() - 0.5) * 10,
        y,
        vx: 0,
        vy: -10,
        age: 0,
        life: 0.35,
        r: 2,
        kind: 'glint',
      });
      if (inTank) sheen = Math.min(1, sheen + 0.35);
    };

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const box = stage.getBoundingClientRect();
      const w = box.width;
      const h = box.height;
      if (w < 8 || h < 8) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pw = Math.round(w * dpr);
      const ph = Math.round(h * dpr);
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const snap = live.current;
      const tint = FLUID_TINT[snap.fluid];
      const pointer = pointerRef.current ?? { x: w * 0.2, y: h * 0.4 };
      const pouring = snap.isPouring;
      const water = snap.fluid === 'WATER';
      const glug =
        pouring && snap.isGlugging ? Math.sin(now / 1000 * 18) * 2.6 : 0;
      const tilt = pouring ? snap.tiltDegrees + glug : 0;
      const { w: bw, h: bh, ox, oy } = bottleBox();

      let mouth: Vec;
      let dir: Vec;

      if (water) {
        const target = pouring
          ? {
              x: clamp(pointer.x, 28, w - 18),
              y: clamp(pointer.y + 12, 20, h - 16),
            }
          : { x: w * 0.2, y: h * 0.78 };
        stepRope(w, h, dt, target, pouring);
        const nozzle = nozzleTip();
        mouth = nozzle.tip;
        dir = nozzle.dir;
        bottleEl.style.display = 'none';
      } else {
        const grip = pouring
          ? {
              x: clamp(pointer.x, 20, w - 20),
              y: clamp(pointer.y + 36, 24, h - 20),
            }
          : { x: w * 0.16, y: h - 28 };
        const emitted = bottleEmitter(grip, tilt);
        mouth = emitted.mouth;
        dir = emitted.dir;
        bottleEl.style.display = 'block';
        bottleEl.style.width = `${bw}px`;
        bottleEl.style.height = `${bh}px`;
        bottleEl.style.left = `${grip.x - bw * ox}px`;
        bottleEl.style.top = `${grip.y - bh * oy}px`;
        bottleEl.style.transformOrigin = `${ox * 100}% ${oy * 100}%`;
        bottleEl.style.transform = `rotate(${tilt}deg)`;
      }

      const lag = reduced ? 0.7 : 0.42;
      if (!emit.ready) {
        emit.x = mouth.x;
        emit.y = mouth.y;
        emit.dx = dir.x;
        emit.dy = dir.y;
        emit.ready = true;
      } else {
        emit.x += (mouth.x - emit.x) * lag;
        emit.y += (mouth.y - emit.y) * lag;
        emit.dx += (dir.x - emit.dx) * 0.35;
        emit.dy += (dir.y - emit.dy) * 0.35;
      }
      const dlen = Math.hypot(emit.dx, emit.dy) || 1;
      const edir = { x: emit.dx / dlen, y: emit.dy / dlen };

      const flow = pouring ? snap.flowOzPerSec : 0;
      const emitting = pouring && flow > 0.05;
      if (emitting) dripUntil = now + 520;
      const dripping = !emitting && now < dripUntil;

      const tankEl = tankRef.current;
      let tank: { x: number; y: number; w: number; h: number; surface: number } | null =
        null;
      if (tankEl) {
        const tr = tankEl.getBoundingClientRect();
        const fill = clamp(snap.fillPercent, 0, 100) / 100;
        tank = {
          x: tr.left - box.left,
          y: tr.top - box.top,
          w: tr.width,
          h: tr.height,
          surface: tr.top - box.top + tr.height * (1 - fill),
        };
      }

      const g = 980;
      let ribbon: SpinePt[] = [];
      if (emitting || dripping) {
        const speed = emitting ? 150 + Math.min(flow, 70) * 2.2 : 80;
        const aim = dripping
          ? { x: edir.x * 0.2, y: Math.max(0.55, edir.y) }
          : edir;
        ribbon = sampleSpine(
          { x: emit.x, y: emit.y },
          aim,
          speed,
          g,
          now / 1000,
          reduced ? 1.1 : emitting ? 3.2 : 1.4,
          emitting ? 0.52 : 0.26,
          reduced ? 16 : 26
        );
        for (let i = 1; i < ribbon.length; i++) {
          const p = ribbon[i];
          const inTank =
            !!tank &&
            p.x > tank.x + 4 &&
            p.x < tank.x + tank.w - 4 &&
            p.y >= tank.surface;
          const onFloor = p.y > h - 6;
          if (!inTank && !onFloor) continue;
          const yHit = inTank && tank ? tank.surface : h - 6;
          ribbon = ribbon.slice(0, i + 1);
          ribbon[ribbon.length - 1] = { ...p, y: yHit, u: p.u };
          if (emitting && now - lastSplash > 80) {
            lastSplash = now;
            burst(p.x, yHit, inTank);
            if (inTank) sheen = Math.min(1, sheen + 0.2);
          }
          break;
        }
        if (dripping && Math.random() < dt * 8) {
          splash.push({
            x: emit.x,
            y: emit.y,
            vx: 0,
            vy: 20,
            age: 0,
            life: 0.25,
            r: 1.6,
            kind: 'glint',
          });
        }
      }

      sheen = Math.max(0, sheen - dt * 0.55);
      for (let i = splash.length - 1; i >= 0; i--) {
        const s = splash[i];
        s.age += dt;
        if (s.kind === 'drop' || s.kind === 'spray') {
          s.vy += g * dt;
          s.x += s.vx * dt;
          s.y += s.vy * dt;
        }
        if (s.age > s.life) splash.splice(i, 1);
      }

      if (water && rope.length > 1) {
        drawSmooth(ctx, rope);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 16;
        ctx.stroke();
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = 7;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(248,250,252,0.45)';
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(0, h * 0.34, 8, 0, Math.PI * 2);
        ctx.fill();
        const tip = nozzleTip();
        const b = rope[rope.length - 1];
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(Math.atan2(tip.dir.y, tip.dir.x));
        ctx.fillStyle = '#334155';
        ctx.fillRect(-4, -7, 18, 14);
        ctx.fillStyle = '#0ea5e9';
        ctx.fillRect(10, -5, 14, 10);
        ctx.fillStyle = '#e0f2fe';
        ctx.fillRect(22, -3, 6, 6);
        ctx.restore();
      }

      if (ribbon.length > 2) {
        const width = emitting
          ? 11 + Math.min(flow, 40) / 10 + (snap.isGlugging ? 1.4 : 0)
          : 3.2;
        drawLiquid(ctx, ribbon, width, tint);
      }

      for (const s of splash) {
        const t = s.age / s.life;
        const fade = 1 - t;
        if (s.kind === 'ripple') {
          ctx.beginPath();
          ctx.ellipse(s.x, s.y, s.r * (0.4 + t * 1.8), s.r * (0.18 + t * 0.45), 0, 0, Math.PI * 2);
          ctx.strokeStyle = tint.edge;
          ctx.globalAlpha = fade * 0.85;
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.globalAlpha = 1;
        } else if (s.kind === 'puddle') {
          ctx.beginPath();
          ctx.ellipse(s.x, s.y, s.r * (0.8 + t), s.r * 0.28, 0, 0, Math.PI * 2);
          ctx.fillStyle = tint.splash;
          ctx.globalAlpha = fade * 0.45;
          ctx.fill();
          ctx.globalAlpha = 1;
        } else if (s.kind === 'glint') {
          ctx.globalAlpha = fade;
          ctx.fillStyle = '#fff';
          ctx.fillRect(s.x, s.y + s.vy * s.age, 2.2, 2.2);
          ctx.globalAlpha = 1;
        } else {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.r * (s.kind === 'spray' ? 0.7 : 1), 0, Math.PI * 2);
          ctx.fillStyle = s.kind === 'spray' ? tint.edge : tint.stream;
          ctx.globalAlpha = fade;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }

      if (tank && sheen > 0.02) {
        ctx.beginPath();
        ctx.ellipse(
          tank.x + tank.w * 0.5,
          tank.surface + 3,
          tank.w * 0.32,
          5,
          0,
          0,
          Math.PI * 2
        );
        ctx.fillStyle = `rgba(255,255,255,${0.28 * sheen})`;
        ctx.fill();
      }
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [pointerRef, tankRef]);

  const showBottle = fluid === 'FORMALDEHYDE' || fluid === 'SOFTENER';

  return (
    <div ref={stageRef} className="pointer-events-none absolute inset-0 z-[12]" aria-hidden>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div ref={bottleRef} className="absolute left-0 top-0" style={{ display: 'none' }}>
        {showBottle ? (
          <ChemicalBottle kind={fluid === 'SOFTENER' ? 'SOFTENER' : 'FORMALDEHYDE'} />
        ) : null}
      </div>
    </div>
  );
};
