import React, { useEffect, useState } from 'react';

type Pose = 'seat-bow' | 'seat-talk' | 'veil' | 'stand' | 'pair';

interface MournerSpec {
  id: string;
  pose: Pose;
  /** Normalized x within the chapel floor */
  x: number;
  /**
   * Bottom of the figure. Seated busts rest on the pew-back rail.
   * The standing viewer’s feet are in the aisle.
   */
  y: number;
  /** Width as a percent of the floor width. Height as a percent of the floor height. */
  w: number;
  h: number;
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

/**
 * Seated mourners are head and shoulders only, bottomed on the pew-back
 * rail, so the body does not paint over the pew. Sizes grow with the row
 * the way the pews do. The viewer stands in the aisle and leaves for the service.
 */
const PEW_MOURNERS: MournerSpec[] = [
  { id: 'back-l', pose: 'seat-bow', x: 0.30, y: 0.602, w: 2.5, h: 4.2, breathe: 5.4, breatheDelay: 0.2, settle: 7.2, settleDelay: 0.5, drift: 0.4, lean: 0.6, turn: 3, head: 8.8, headDelay: 1.2 },
  { id: 'mid-l', pose: 'seat-talk', x: 0.15, y: 0.608, w: 3.1, h: 5.5, breathe: 6.3, breatheDelay: 1.8, settle: 8.6, settleDelay: 1.1, drift: -0.5, lean: 0.8, turn: 4, head: 7.1, headDelay: 0.4 },
  { id: 'front-l', pose: 'veil', x: 0.09, y: 0.70, w: 3.7, h: 6.6, breathe: 5.7, breatheDelay: 1.3, settle: 7.8, settleDelay: 1.9, drift: 0.4, lean: 0.7, turn: 3, head: 6.6, headDelay: 0.8 },
  { id: 'viewer', pose: 'stand', x: 0.375, y: 0.86, w: 4.2, h: 28, breathe: 7.1, breatheDelay: 0.4, settle: 8.1, settleDelay: 2.8, drift: 0.6, lean: 0.8, turn: 2, head: 7.8, headDelay: 1.5 },
  { id: 'back-r', pose: 'seat-bow', x: 0.70, y: 0.602, w: 2.5, h: 4.2, breathe: 5.1, breatheDelay: 2.2, settle: 6.7, settleDelay: 0.8, drift: -0.4, lean: -0.6, turn: -3, head: 9.1, headDelay: 0.2 },
  { id: 'mid-r', pose: 'seat-talk', x: 0.85, y: 0.608, w: 3.1, h: 5.5, breathe: 6.6, breatheDelay: 0.9, settle: 9.1, settleDelay: 1.6, drift: 0.5, lean: 0.7, turn: -4, head: 7.5, headDelay: 2.6 },
  { id: 'front-r', pose: 'veil', x: 0.91, y: 0.70, w: 3.7, h: 6.6, breathe: 4.6, breatheDelay: 1.5, settle: 8.4, settleDelay: 0.2, drift: -0.4, lean: -0.7, turn: 3, head: 6.9, headDelay: 1.1 },
];

function Head({ cx, cy, rx, ry }: { cx: number; cy: number; rx: number; ry: number }) {
  return (
    <g className="chapel-mourner-head">
      <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="currentColor" />
    </g>
  );
}

function Bust({ lean }: { lean?: number }) {
  return (
    <svg viewBox="0 0 40 34" className="h-full w-full" aria-hidden>
      <path fill="currentColor" d="M4 34c1-9 7-15 16-15s15 6 16 15z" />
      <ellipse cx={20 + (lean ?? 0)} cy={13} rx={7.4} ry={8.2} fill="currentColor" />
    </svg>
  );
}

function MournerPose({ pose }: { pose: Pose }) {
  if (pose === 'seat-bow') return <Bust lean={-1} />;
  if (pose === 'seat-talk') return <Bust lean={2} />;
  if (pose === 'veil') {
    return (
      <svg viewBox="0 0 40 34" className="h-full w-full" aria-hidden>
        <path fill="currentColor" d="M5 34c1-8 7-14 15-14s14 6 15 14z" />
        <path fill="currentColor" d="M10 16c1-8 18-9 21-1 1 3 0 8-2 11-6 1-12 1-17 0-1-3-2-7-2-10z" />
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

/**
 * Ghostly mourners during a viewing.
 * Pointers pass through. They are not chapel layout pieces.
 */
export const ChapelMourners: React.FC<{
  active: boolean;
  /** A viewing may keep one person standing in the aisle. A service does not. */
  aisleViewer?: boolean;
}> = ({ active, aisleViewer = false }) => {
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
      className="chapel-mourners absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden
      data-chapel-mourners
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 1.1s ease',
      }}
    >
      {PEW_MOURNERS.filter((m) => m.id !== 'viewer' || aisleViewer).map((m) => {
        return (
          <div
            key={m.id}
            className="chapel-mourner absolute text-[#2a1c14]"
            style={{
              left: `${m.x * 100}%`,
              top: `${m.y * 100}%`,
              width: `${m.w}%`,
              height: `${m.h}%`,
              ['--breathe-dur' as string]: `${m.breathe}s`,
              ['--breathe-delay' as string]: `${m.breatheDelay}s`,
              ['--settle-dur' as string]: `${m.settle}s`,
              ['--settle-delay' as string]: `${m.settleDelay}s`,
              ['--head-dur' as string]: `${m.head}s`,
              ['--head-delay' as string]: `${m.headDelay}s`,
              ['--drift' as string]: `${m.drift}px`,
              ['--lean' as string]: `${m.lean}deg`,
              ['--turn' as string]: `${m.turn}deg`,
              zIndex: m.id === 'viewer' ? 20 : 1,
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
