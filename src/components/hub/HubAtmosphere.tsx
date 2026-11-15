import React, { useEffect, useRef, useState } from 'react';
import {
  BANK_WARNING_AFTER_MS,
} from '../../data/bankForeclosure';
import { gameNow } from '../../utils/gameNow';
import { useGameStore } from '../../store/useGameStore';

const SPIRIT_CAP = 6;
const FUME_LINGER_MS = 90_000;
const CLASH_MS = 700;
const PAIR_COOLDOWN_MS = 1200;

type Body = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  hue: number;
  seed: number;
  hw: number;
  hh: number;
  min: number;
  max: number;
  clash: string | null;
  clashHue: number | null;
  clashUntil: number;
};

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Shortest-arc mix. Blue 210 and yellow 48 meet at 129, which reads as green. */
function mixHue(a: number, b: number): number {
  let d = (((b - a) % 360) + 360) % 360;
  if (d > 180) d -= 360;
  return (((a + d / 2) % 360) + 360) % 360;
}

function clashColor(a: Body, b: Body): string {
  return `hsl(${mixHue(a.hue, b.hue).toFixed(0)} 78% 62%)`;
}

function spawnBody(el: HTMLElement, width: number, height: number): Body {
  const id = el.dataset.roam || 'mote';
  const seed = hashId(id);
  const hw = (el.offsetWidth || Number(el.dataset.w) || 64) / 2;
  const hh = (el.offsetHeight || Number(el.dataset.h) || 64) / 2;
  const r = Number(el.dataset.r) || Math.max(18, Math.min(hw, hh));
  const hue = Number(el.dataset.hue) || 200;
  const speed = 54 + (seed % 32);
  const ang = ((seed % 360) * Math.PI) / 180;
  const spanX = Math.max(1, width - hw * 2);
  const spanY = Math.max(1, height - hh * 2);
  return {
    id,
    x: hw + ((seed % 1000) / 1000) * spanX,
    y: hh + (((seed >>> 10) % 1000) / 1000) * spanY,
    vx: Math.cos(ang) * speed,
    vy: Math.sin(ang) * speed,
    r,
    hue,
    seed,
    hw,
    hh,
    min: speed * 0.78,
    max: speed + 16,
    clash: null,
    clashHue: null,
    clashUntil: 0,
  };
}

function fireBurst(root: HTMLElement, x: number, y: number, color: string, now: number) {
  const slots = root.querySelectorAll<HTMLElement>('[data-burst]');
  let slot: HTMLElement | null = null;
  slots.forEach((s) => {
    if (!slot && Number(s.dataset.until || 0) <= now) slot = s;
  });
  if (!slot) slot = slots[0] ?? null;
  if (!slot) return;
  slot.dataset.until = String(now + CLASH_MS);
  slot.style.background = `radial-gradient(circle, #fff 0%, ${color} 42%, transparent 72%)`;
  slot.getAnimations().forEach((anim) => anim.cancel());
  slot.animate(
    [
      { opacity: 0.95, transform: `translate(${x}px, ${y}px) scale(0.45)` },
      { opacity: 0, transform: `translate(${x}px, ${y}px) scale(4.2)` },
    ],
    { duration: 640, easing: 'ease-out', fill: 'forwards' }
  );
}

/**
 * Hub wash behind the room buttons. Reads live case, retort, inbox, and debt
 * state. Room glows, fumes, and dust stay in their pre-v0.9.24 places.
 * Only spirits roam, and only once three cases are in the house. A clash
 * tints those spirits for a moment, then they keep moving. Nothing here
 * receives taps.
 */
export const HubAtmosphere: React.FC = () => {
  const cases = useGameStore((s) => s.cases);
  const retort = useGameStore((s) => s.retort);
  const inboxFiles = useGameStore((s) => s.inboxFiles);
  const cash = useGameStore((s) => s.cash);
  const negativeCashSinceMs = useGameStore((s) => s.negativeCashSinceMs);
  const bankWarningIssued = useGameStore((s) => s.bankWarningIssued);
  const bankForeclosed = useGameStore((s) => s.bankForeclosed);
  const embalmingLeftAtMs = useGameStore((s) => s.embalmingLeftAtMs);
  const [tick, setTick] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  const needsClock =
    embalmingLeftAtMs != null ||
    cases.some((c) => c.serviceDateMs != null || c.location === 'CHAPEL') ||
    (cash < 0 && negativeCashSinceMs != null);

  useEffect(() => {
    if (!needsClock) return;
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    return () => window.clearInterval(id);
  }, [needsClock]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const bodies = new Map<string, Body>();
    const pairs = new Map<string, number>();
    let raf = 0;
    let last = performance.now();

    const frame = (now: number) => {
      const reduce = mq.matches;
      const w = root.clientWidth;
      const h = root.clientHeight;
      if (w < 10 || h < 10) {
        if (!reduce) raf = requestAnimationFrame(frame);
        return;
      }
      const dt = Math.min(0.034, (now - last) / 1000);
      last = now;

      const els = [...root.querySelectorAll<HTMLElement>('.hub-spirit[data-roam]')];
      const seen = new Set<string>();
      for (const el of els) {
        const id = el.dataset.roam;
        if (!id) continue;
        seen.add(id);
        if (!bodies.has(id)) bodies.set(id, spawnBody(el, w, h));
      }
      for (const id of [...bodies.keys()]) {
        if (!seen.has(id)) bodies.delete(id);
      }

      const list = [...bodies.values()];
      if (!reduce) {
        for (const b of list) {
          b.vx += Math.sin(now / 680 + b.seed) * 22 * dt;
          b.vy += Math.cos(now / 760 + b.seed * 0.002) * 22 * dt;
          const sp = Math.hypot(b.vx, b.vy) || 1;
          const cap = sp > b.max ? b.max / sp : sp < b.min ? b.min / sp : 1;
          b.vx *= cap;
          b.vy *= cap;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          if (b.x < b.hw) {
            b.x = b.hw;
            b.vx = Math.abs(b.vx);
          } else if (b.x > w - b.hw) {
            b.x = w - b.hw;
            b.vx = -Math.abs(b.vx);
          }
          if (b.y < b.hh) {
            b.y = b.hh;
            b.vy = Math.abs(b.vy);
          } else if (b.y > h - b.hh) {
            b.y = h - b.hh;
            b.vy = -Math.abs(b.vy);
          }
        }

        for (let i = 0; i < list.length; i++) {
          for (let j = i + 1; j < list.length; j++) {
            const a = list[i];
            const b = list[j];
            let dx = b.x - a.x;
            let dy = b.y - a.y;
            let dist = Math.hypot(dx, dy);
            const reach = a.r + b.r;
            if (dist >= reach) continue;
            if (dist < 0.01) {
              dx = 1;
              dy = 0;
              dist = 1;
            }
            const nx = dx / dist;
            const ny = dy / dist;
            const push = (reach - dist) * 0.5 + 0.8;
            a.x -= nx * push;
            a.y -= ny * push;
            b.x += nx * push;
            b.y += ny * push;
            const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny;
            if (rel < 0) {
              const impulse = -rel * 1.05;
              a.vx -= impulse * nx;
              a.vy -= impulse * ny;
              b.vx += impulse * nx;
              b.vy += impulse * ny;
            }
            a.vx -= nx * 28;
            a.vy -= ny * 28;
            b.vx += nx * 28;
            b.vy += ny * 28;

            const key = a.id < b.id ? `${a.id}|${b.id}` : `${b.id}|${a.id}`;
            if ((pairs.get(key) ?? 0) <= now) {
              const hue = mixHue(a.hue, b.hue);
              const color = clashColor(a, b);
              const until = now + CLASH_MS;
              a.clash = color;
              b.clash = color;
              a.clashHue = hue;
              b.clashHue = hue;
              a.clashUntil = until;
              b.clashUntil = until;
              pairs.set(key, now + PAIR_COOLDOWN_MS);
              root.dataset.clashes = String(Number(root.dataset.clashes || 0) + 1);
              fireBurst(root, (a.x + b.x) / 2, (a.y + b.y) / 2, color, now);
            }
          }
        }
      }

      let hot = false;
      for (const el of els) {
        const body = bodies.get(el.dataset.roam || '');
        if (!body) continue;
        el.style.transform = `translate3d(${(body.x - body.hw).toFixed(1)}px, ${(body.y - body.hh).toFixed(1)}px, 0)`;
        const speed = Math.hypot(body.vx, body.vy) || 1;
        el.style.setProperty('--trail-x', `${((-body.vx / speed) * 18).toFixed(1)}px`);
        el.style.setProperty('--trail-y', `${((-body.vy / speed) * 18).toFixed(1)}px`);
        const tint = el.querySelector<HTMLElement>(':scope > .hub-clash-tint');
        const left = body.clashUntil - now;
        const mixing = left > 0 && body.clash != null && body.clashHue != null;
        el.style.setProperty(
          '--spirit-h',
          (mixing && body.clashHue != null ? body.clashHue : body.hue).toFixed(0)
        );
        if (mixing && body.clash) {
          const alpha = Math.min(0.9, left / CLASH_MS);
          if (tint) {
            tint.style.opacity = alpha.toFixed(3);
            tint.style.background = `radial-gradient(circle, ${body.clash} 0%, transparent 70%)`;
          }
          if (alpha > 0.45) hot = true;
        } else if (tint) {
          tint.style.opacity = '0';
        }
        el.dataset.placed = '1';
      }
      root.dataset.clashing = hot ? '1' : '0';
      if (!reduce) raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, []);

  const nowWall = Date.now();
  const nowGame = gameNow();
  void tick;

  const crematoryOn =
    retort.phase === 'BURN' || retort.primaryOn || retort.heated;
  const embalmingTable = cases.some((c) => c.location === 'EMBALMING');
  const embalmingLinger =
    embalmingLeftAtMs != null && nowWall - embalmingLeftAtMs < FUME_LINGER_MS;
  const fumes = embalmingTable || embalmingLinger;
  const coolerOn = cases.some((c) => c.location === 'COOLER');
  const urnOn = cases.some((c) => c.location === 'URN_FILLING');
  const chapelOn = cases.some(
    (c) =>
      c.location === 'CHAPEL' ||
      (c.serviceDateMs != null && c.serviceDateMs >= nowGame - 30 * 60_000)
  );
  const computerUnread = inboxFiles.some((f) => !f.isRead);
  const debtWarn =
    !bankForeclosed &&
    cash < 0 &&
    negativeCashSinceMs != null &&
    (bankWarningIssued ||
      nowGame - negativeCashSinceMs >= BANK_WARNING_AFTER_MS);

  const spiritCount =
    cases.length >= 3 ? Math.min(SPIRIT_CAP, cases.length) : 0;
  const spirits = cases.slice(0, spiritCount).map((c, i) => {
    const h = hashId(c.id);
    const base = [210, 48, 280, 150, 330, 18][i] ?? 210;
    return {
      id: c.id,
      alpha: 0.52 + (h % 4) * 0.05,
      hue: (base + (h % 11) - 5 + 360) % 360,
      r: 36 + (i % 3),
    };
  });

  return (
    <div
      ref={rootRef}
      className="hub-atmo pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {crematoryOn && (
        <div className="hub-atmo-flame">
          <span />
          <span />
          <span />
        </div>
      )}
      {fumes && (
        <div className="hub-atmo-fume">
          <span />
          <span />
          <span />
        </div>
      )}
      {coolerOn && (
        <div className="hub-atmo-frost">
          <span />
          <span />
          <span />
          <span />
        </div>
      )}
      {urnOn && (
        <div className="hub-atmo-dust">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} style={{ ['--i' as string]: i }} />
          ))}
        </div>
      )}
      {chapelOn && (
        <div className="hub-atmo-chapel">
          <span className="hub-candle" />
          <span className="hub-candle hub-candle-b" />
          <span className="hub-petal" />
          <span className="hub-petal hub-petal-b" />
        </div>
      )}
      {computerUnread && <div className="hub-atmo-crt" />}
      {debtWarn && <div className="hub-atmo-debt" />}
      {spirits.map((s) => (
        <div
          key={s.id}
          className="hub-spirit hub-roam"
          data-roam={`spirit-${s.id}`}
          data-r={s.r}
          data-hue={s.hue}
          data-w="84"
          data-h="84"
          style={{
            ['--a' as string]: String(s.alpha),
            ['--spirit-h' as string]: String(s.hue),
          }}
        >
          <span className="hub-spirit-glow" />
          <span className="hub-spirit-core" />
          <span className="hub-spirit-mote" style={{ ['--m' as string]: '0.4' }} />
          <span className="hub-spirit-mote" style={{ ['--m' as string]: '0.7' }} />
          <span className="hub-spirit-mote" style={{ ['--m' as string]: '1' }} />
          <span className="hub-clash-tint" />
        </div>
      ))}
      <div className="hub-clash-layer">
        {Array.from({ length: 6 }, (_, i) => (
          <span key={i} className="hub-clash" data-burst={i} />
        ))}
      </div>
    </div>
  );
};
