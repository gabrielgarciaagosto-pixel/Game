import React, { useEffect, useState } from 'react';

type Pose = 'seat-bow' | 'seat-talk' | 'veil' | 'stand' | 'pair';

interface MournerSpec {
  id: string;
  pose: Pose;
  /** Normalized x within the chapel floor */
  x: number;
  /** Feet line. Keep them in the pews, clear of the bier. */
  y: number;
  scale: number;
  /** Own clocks so the room does not breathe as one. */
  breathe: number;
  breatheDelay: number;
  settle: number;
  settleDelay: number;
  /** A pixel or two. They rock where they are. */
  drift: number;
  lean: number;
  turn: number;
  head: number;
  headDelay: number;
}

const PEW_MOURNERS: MournerSpec[] = [
  { id: 'bow-l', pose: 'seat-bow', x: 0.15, y: 0.7, scale: 0.94, breathe: 5.4, breatheDelay: 0.2, settle: 7.2, settleDelay: 0.5, drift: 1.1, lean: 1.2, turn: 4, head: 8.8, headDelay: 1.2 },
  { id: 'talk-l', pose: 'seat-talk', x: 0.27, y: 0.73, scale: 1, breathe: 6.3, breatheDelay: 1.8, settle: 8.6, settleDelay: 1.1, drift: -1.3, lean: 1.5, turn: 6, head: 7.1, headDelay: 0.4 },
  { id: 'talk-l2', pose: 'seat-talk', x: 0.37, y: 0.69, scale: 0.88, breathe: 4.9, breatheDelay: 0.7, settle: 9.4, settleDelay: 2.4, drift: 1.4, lean: -1.3, turn: -5, head: 8.2, headDelay: 1.7 },
  { id: 'pair', pose: 'pair', x: 0.22, y: 0.86, scale: 1.02, breathe: 6.8, breatheDelay: 2.6, settle: 10.2, settleDelay: 0.3, drift: 0.8, lean: 1.1, turn: -6, head: 9.6, headDelay: 2.2 },
  { id: 'veil', pose: 'veil', x: 0.34, y: 0.84, scale: 0.9, breathe: 5.7, breatheDelay: 1.3, settle: 7.8, settleDelay: 1.9, drift: -1, lean: 1.6, turn: 3, head: 6.6, headDelay: 0.8 },
  { id: 'aisle', pose: 'stand', x: 0.5, y: 0.78, scale: 0.98, breathe: 7.1, breatheDelay: 0.4, settle: 8.1, settleDelay: 2.8, drift: 1.2, lean: 1.8, turn: 4, head: 7.8, headDelay: 1.5 },
  { id: 'bow-r', pose: 'seat-bow', x: 0.64, y: 0.71, scale: 0.92, breathe: 5.1, breatheDelay: 2.2, settle: 6.7, settleDelay: 0.8, drift: -1.2, lean: -1.4, turn: -4, head: 9.1, headDelay: 0.2 },
  { id: 'talk-r', pose: 'seat-talk', x: 0.76, y: 0.74, scale: 0.9, breathe: 6.6, breatheDelay: 0.9, settle: 9.1, settleDelay: 1.6, drift: 1, lean: 1.3, turn: -6, head: 7.5, headDelay: 2.6 },
  { id: 'stand-r', pose: 'stand', x: 0.86, y: 0.67, scale: 0.84, breathe: 4.6, breatheDelay: 1.5, settle: 8.4, settleDelay: 0.2, drift: -0.9, lean: -1.7, turn: 5, head: 6.9, headDelay: 1.1 },
];

function Head({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) {
  return (
    <g className="chapel-mourner-head">
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="currentColor" />
    </g>
  );
}

function MournerPose({ pose }: { pose: Pose }) {
  if (pose === 'seat-bow') {
    return (
      <svg viewBox="0 0 48 62" className="h-full w-full" aria-hidden>
        <Head cx={24} cy={14} rx={6.6} ry={7.4} />
        <path
          fill="currentColor"
          d="M15 26c1-4 6-6 10-5 5 1 8 4 9 8 2 7 3 15 1 23-8 5-20 5-28 0 0-9 2-19 8-26z"
        />
        <path fill="currentColor" d="M16 32c-7 2-10 8-8 13 3-2 7-3 9-2z" />
      </svg>
    );
  }
  if (pose === 'seat-talk') {
    return (
      <svg viewBox="0 0 48 62" className="h-full w-full" aria-hidden>
        <path
          fill="currentColor"
          d="M13 29c2-5 8-7 13-5 4 2 7 6 8 11 2 8 1 16-1 21-8 5-19 4-26-1 1-8 2-19 6-26z"
        />
        <path fill="currentColor" d="M15 35c-6 3-8 9-5 13 3-2 6-3 8-2z" />
        <Head cx={28} cy={15} rx={6.5} ry={7.5} />
      </svg>
    );
  }
  if (pose === 'veil') {
    return (
      <svg viewBox="0 0 46 64" className="h-full w-full" aria-hidden>
        <path
          fill="currentColor"
          d="M14 18c2-8 16-9 20-2 2 4 2 10 0 16-1 2-8 1-10 0-2 1-9 2-10 0 0-5 0-10 0-14z"
        />
        <Head cx={23} cy={16} rx={6.2} ry={7} />
        <path
          fill="currentColor"
          d="M12 32c2-4 8-6 12-5s9 3 11 7c2 8 3 16 1 22-8 4-18 4-26 0 1-8 1-16 2-24z"
        />
      </svg>
    );
  }
  if (pose === 'stand') {
    return (
      <svg viewBox="0 0 40 86" className="h-full w-full" aria-hidden>
        <Head cx={20} cy={11} rx={6.2} ry={7} />
        <path
          fill="currentColor"
          d="M12 22c-3 2-5 8-4 16l1 16h4.5l-.6-14h9.2l-.6 14H26l1-16c1-8-1-14-4-16-3 2-7 2-11 0z"
        />
        <path fill="currentColor" d="M15.2 54.5h4.2l-.8 24h-5z" />
        <path fill="currentColor" d="M21.4 54.5h4.2l1.6 24h-5z" />
        <path fill="currentColor" d="M14 34c2 3 10 3 12 0-2 5-10 5-12 0z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 76 64" className="h-full w-full" aria-hidden>
      <path
        fill="currentColor"
        d="M8 32c2-5 8-7 13-5 4 1 6 5 7 9 1 8 0 16-2 20-7 4-17 3-23-1 1-7 2-16 5-23z"
      />
      <ellipse cx="18" cy="16" rx="6.2" ry="7.2" fill="currentColor" />
      <path
        fill="currentColor"
        d="M36 33c2-5 9-8 15-5 4 2 7 6 8 11 1 8 0 15-2 19-8 4-18 3-24 0 1-8 1-18 3-25z"
      />
      <Head cx={52} cy={16} rx={6.3} ry={7.3} />
    </svg>
  );
}

function sizeFor(pose: Pose, scale: number): { w: number; h: number } {
  if (pose === 'stand') return { w: 26 * scale, h: 56 * scale };
  if (pose === 'pair') return { w: 46 * scale, h: 40 * scale };
  if (pose === 'veil') return { w: 28 * scale, h: 46 * scale };
  return { w: 30 * scale, h: 44 * scale };
}

/**
 * Ghostly mourners during a viewing.
 * Pointers pass through. They are not chapel layout pieces.
 */
export const ChapelMourners: React.FC<{
  active: boolean;
}> = ({ active }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      const t = window.setTimeout(() => setVisible(true), 40);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [active]);

  if (!active && !visible) return null;

  return (
    <div
      className="chapel-mourners absolute inset-0 pointer-events-none z-[1] overflow-hidden"
      aria-hidden
      data-chapel-mourners
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 1.1s ease',
      }}
    >
      <svg width="0" height="0" className="absolute" aria-hidden>
        <filter id="chapel-mourner-ghost" x="-40%" y="-40%" width="180%" height="180%">
          <feTurbulence type="fractalNoise" baseFrequency="0.045" numOctaves="2" seed="3" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.4" xChannelSelector="R" yChannelSelector="G" result="warp" />
          <feGaussianBlur in="warp" stdDeviation="0.55" />
        </filter>
      </svg>
      {PEW_MOURNERS.map((m) => {
        const size = sizeFor(m.pose, m.scale);
        return (
          <div
            key={m.id}
            className="chapel-mourner absolute text-[#f3e6c8]"
            style={{
              left: `${m.x * 100}%`,
              top: `${m.y * 100}%`,
              width: `${size.w}px`,
              height: `${size.h}px`,
              ['--breathe-dur' as string]: `${m.breathe}s`,
              ['--breathe-delay' as string]: `${m.breatheDelay}s`,
              ['--settle-dur' as string]: `${m.settle}s`,
              ['--settle-delay' as string]: `${m.settleDelay}s`,
              ['--head-dur' as string]: `${m.head}s`,
              ['--head-delay' as string]: `${m.headDelay}s`,
              ['--drift' as string]: `${m.drift}px`,
              ['--lean' as string]: `${m.lean}deg`,
              ['--turn' as string]: `${m.turn}deg`,
            }}
          >
            <div className="chapel-mourner-settle">
              <div className="chapel-mourner-core">
                <MournerPose pose={m.pose} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
