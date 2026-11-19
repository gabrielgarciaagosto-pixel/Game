import React, { useEffect, useState } from 'react';

type Hair = 'crop' | 'bob' | 'veil' | 'silver' | 'bun' | 'wave';

interface MournerSpec {
  id: string;
  /** Bottom of the figure. Seated busts rest on the pew-back rail. */
  x: number;
  y: number;
  /** Height as a percent of the floor. Width follows from the drawing. */
  h: number;
  hair: Hair;
  coat: string;
  skin: string;
  stand?: boolean;
  breathe: number;
  breatheDelay: number;
  settle: number;
  settleDelay: number;
  drift: number;
  lean: number;
  turn: number;
  head: number;
  headDelay: number;
}

/** Floor width / height of Gabriel's cropped chapel painting. */
const FLOOR_ASPECT = 986 / 509;

/**
 * Heads and shoulders on the pew rails, a few to a row, larger as the pews
 * come forward. The torso stops at the rail, so the pew back hides it and
 * the row in front is not painted over. One person stands beside the casket
 * during a viewing.
 */
const PEW_MOURNERS: MournerSpec[] = [
  // Front pews, just in front of the chancel.
  { id: 'far-l1', x: 0.25, y: 0.578, h: 6.2, hair: 'crop', coat: '#1c140f', skin: '#e4c2a2', breathe: 5.4, breatheDelay: 0.2, settle: 7.2, settleDelay: 0.4, drift: 0.3, lean: 0.5, turn: 2, head: 8.8, headDelay: 1.1 },
  { id: 'far-l2', x: 0.318, y: 0.576, h: 6.8, hair: 'veil', coat: '#24160f', skin: '#c4896a', breathe: 6.1, breatheDelay: 1.4, settle: 8.2, settleDelay: 1.2, drift: -0.3, lean: -0.4, turn: -2, head: 7.4, headDelay: 0.3 },
  { id: 'far-r1', x: 0.682, y: 0.576, h: 6.4, hair: 'silver', coat: '#1a1816', skin: '#f0d0b4', breathe: 5.2, breatheDelay: 2.1, settle: 6.8, settleDelay: 0.7, drift: 0.3, lean: 0.4, turn: 2, head: 9.0, headDelay: 0.2 },
  { id: 'far-r2', x: 0.75, y: 0.578, h: 5.8, hair: 'bob', coat: '#16141c', skin: '#8d5a3c', breathe: 6.4, breatheDelay: 0.8, settle: 7.6, settleDelay: 1.8, drift: -0.2, lean: -0.5, turn: -3, head: 6.8, headDelay: 1.6 },
  // Second row. Shoulders stop at the rail.
  { id: 'mid-l1', x: 0.10, y: 0.632, h: 7.6, hair: 'wave', coat: '#1a120e', skin: '#d7a882', breathe: 5.8, breatheDelay: 1.1, settle: 8.4, settleDelay: 0.5, drift: 0.4, lean: 0.6, turn: 3, head: 7.2, headDelay: 0.6 },
  { id: 'mid-l2', x: 0.175, y: 0.628, h: 6.9, hair: 'bun', coat: '#201814', skin: '#f2d3b8', breathe: 6.6, breatheDelay: 0.4, settle: 7.4, settleDelay: 1.5, drift: -0.3, lean: -0.5, turn: -2, head: 8.1, headDelay: 2.2 },
  { id: 'mid-r1', x: 0.825, y: 0.628, h: 7.2, hair: 'crop', coat: '#141820', skin: '#c98660', breathe: 5.5, breatheDelay: 1.9, settle: 9.0, settleDelay: 0.9, drift: 0.3, lean: 0.5, turn: 2, head: 7.6, headDelay: 1.0 },
  { id: 'mid-r2', x: 0.90, y: 0.634, h: 8.0, hair: 'veil', coat: '#1c1410', skin: '#e8c6a6', breathe: 6.2, breatheDelay: 0.6, settle: 8.0, settleDelay: 2.0, drift: -0.4, lean: -0.6, turn: -3, head: 6.9, headDelay: 0.4 },
  // Third row, behind the tall foreground ends.
  { id: 'near-l1', x: 0.07, y: 0.728, h: 9.0, hair: 'bob', coat: '#181410', skin: '#a56b45', breathe: 5.6, breatheDelay: 1.3, settle: 7.8, settleDelay: 0.2, drift: 0.4, lean: 0.6, turn: 2, head: 8.4, headDelay: 1.4 },
  { id: 'near-l2', x: 0.15, y: 0.722, h: 9.8, hair: 'silver', coat: '#221812', skin: '#efd0b0', breathe: 6.8, breatheDelay: 0.2, settle: 8.6, settleDelay: 1.1, drift: -0.3, lean: -0.4, turn: -2, head: 7.0, headDelay: 0.8 },
  { id: 'near-r1', x: 0.85, y: 0.722, h: 9.4, hair: 'bun', coat: '#16120e', skin: '#e2be9c', breathe: 5.9, breatheDelay: 2.4, settle: 7.5, settleDelay: 0.6, drift: 0.3, lean: 0.5, turn: 3, head: 9.2, headDelay: 1.8 },
  { id: 'near-r2', x: 0.925, y: 0.730, h: 8.4, hair: 'wave', coat: '#1a1620', skin: '#c47d58', breathe: 6.3, breatheDelay: 1.0, settle: 8.8, settleDelay: 1.7, drift: -0.4, lean: -0.6, turn: -2, head: 7.3, headDelay: 0.5 },
  // Left end of the casket, shoes on the bier-wheel line, belt at the casket top. Faces the casket.
  { id: 'viewer', x: 0.422, y: 0.64, h: 26.6, hair: 'crop', coat: '#14110e', skin: '#e6c4a4', stand: true, breathe: 7.0, breatheDelay: 0.3, settle: 8.2, settleDelay: 1.4, drift: 0.2, lean: 0.2, turn: 0, head: 8.0, headDelay: 0.9 },
];

function widthFor(h: number, stand: boolean): number {
  const pixelAspect = stand ? 64 / 160 : 1.12;
  return (h * pixelAspect) / FLOOR_ASPECT;
}

function HairBack({ hair }: { hair: Hair }) {
  if (hair === 'veil') {
    return <path d="M14 28c0-16 8-24 18-24s18 8 18 24v10c-6 6-12 8-18 8s-12-2-18-8z" fill="#14110e" />;
  }
  if (hair === 'bob') {
    return <path d="M16 24c0-14 6-20 16-20s16 6 16 20v12c-4 3-8 4-16 4s-12-1-16-4z" fill="#1a120e" />;
  }
  if (hair === 'wave') {
    return <path d="M18 24c0-14 6-20 14-20s14 6 16 20c2 10 4 22 2 30-6-8-8-8-12-4 0 8-4 14-8 16-6-10-12-24-12-42z" fill="#2a160e" />;
  }
  if (hair === 'bun') {
    return (
      <g>
        <circle cx="34" cy="6" r="6" fill="#1c140f" />
        <path d="M18 24c1-12 6-18 14-18s14 6 15 18c1 6-2 10-6 12H24c-4-2-7-6-6-12z" fill="#1c140f" />
      </g>
    );
  }
  if (hair === 'silver') {
    return <path d="M18 22c1-12 6-16 14-16s13 4 14 16c0 5-3 8-7 9H25c-4-1-7-4-7-9z" fill="#d9d4ca" />;
  }
  return <path d="M18 22c1-12 6-17 14-17s13 5 14 17c0 5-4 8-7 9H25c-4-1-7-4-7-9z" fill="#1a120e" />;
}

function Face({ skin }: { skin: string }) {
  return (
    <g className="chapel-mourner-head">
      <ellipse cx="32" cy="26" rx="10" ry="11" fill={skin} stroke="#3a2418" strokeWidth="1" />
      <circle cx="28" cy="26" r="1.15" fill="#2a1c14" />
      <circle cx="36" cy="26" r="1.15" fill="#2a1c14" />
      <path d="M30 31.5c1.3 1.2 2.8 1.2 4.1 0" stroke="#7a4a3a" strokeWidth="0.9" fill="none" strokeLinecap="round" />
    </g>
  );
}

function Bust({ m }: { m: MournerSpec }) {
  return (
    <svg viewBox="0 0 64 56" className="h-full w-full overflow-visible" aria-hidden>
      <path
        d="M6 54c1-14 12-22 26-22s25 8 26 22c-8 3-18 4-26 4s-18-1-26-4z"
        fill={m.coat}
        stroke="#1a120c"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M27 36c1.5 5 3 8 5 10 2-2 3.5-5 5-10-2.5 1.6-7.5 1.6-10 0z" fill="#f4efe4" />
      <HairBack hair={m.hair} />
      <Face skin={m.skin} />
    </svg>
  );
}

function Standing({ m }: { m: MournerSpec }) {
  return (
    <svg viewBox="0 0 64 160" className="h-full w-full overflow-visible" aria-hidden>
      <ellipse cx="32" cy="157" rx="12" ry="2.2" fill="#1a120c" opacity="0.32" />
      <path d="M24 84h7l1 62H22z" fill="#1c1814" stroke="#1a120c" strokeWidth="1.3" />
      <path d="M34 84h7l1 62H33z" fill="#161310" stroke="#1a120c" strokeWidth="1.3" />
      <path d="M20 142h12l1 18H18z" fill="#12100e" />
      <path d="M33 142h12l3 18H31z" fill="#12100e" />
      <path
        d="M14 40c0 14 3 28 8 42h20c5-14 8-28 8-42-4 5-10 7-18 7s-14-2-18-7z"
        fill={m.coat}
        stroke="#1a120c"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <rect x="16" y="76" width="32" height="6" rx="1" fill="#3a2e24" stroke="#1a120c" strokeWidth="1" />
      <path d="M27 42c2 8 3 12 5 15 2-3 3-7 5-15-2.5 2-7.5 2-10 0z" fill="#f4efe4" />
      <path d="M12 48c-2 3-3 14-1 28 3-2 4-10 4-16 0-6-1-10-3-12z" fill={m.coat} stroke="#1a120c" strokeWidth="1.1" />
      <path d="M52 48c2 3 3 14 1 28-3-2-4-10-4-16 0-6 1-10 3-12z" fill={m.coat} stroke="#1a120c" strokeWidth="1.1" />
      <rect x="28" y="32" width="8" height="12" rx="2" fill={m.skin} />
      <path d="M14 22c1-12 8-16 16-16 6 0 12 3 14 10-8 2-16 1-22-1-3 2-6 5-8 7z" fill="#1a120e" />
      <ellipse cx="34" cy="22" rx="10" ry="11" fill={m.skin} stroke="#3a2418" strokeWidth="1" />
      <path d="M22 14c2-8 8-12 16-10 5 1 8 4 9 8-8 1-16 0-22 1-1 0-2 1-3 1z" fill="#1a120e" />
      <circle cx="32" cy="21" r="1.15" fill="#2a1c14" />
      <circle cx="39" cy="20.5" r="1.15" fill="#2a1c14" />
      <path d="M38 24l4.5 2-4.5 1.2" fill={m.skin} stroke="#7a4a3a" strokeWidth="0.8" strokeLinejoin="round" />
      <path d="M33 28.5c1.8 1 3.4 1 5.2 0" stroke="#7a4a3a" strokeWidth="0.9" fill="none" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Mourners during a viewing or service.
 * Pointers pass through. They are not chapel layout pieces.
 */
export const ChapelMourners: React.FC<{
  active: boolean;
  /** A viewing keeps one person beside the casket. A service does not. */
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
      {PEW_MOURNERS.filter((m) => !m.stand || aisleViewer).map((m) => (
        <div
          key={m.id}
          className="chapel-mourner absolute"
          style={{
            left: `${m.x * 100}%`,
            top: `${m.y * 100}%`,
            width: `${widthFor(m.h, !!m.stand)}%`,
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
            zIndex: m.stand ? 12 : 2,
          }}
        >
          <div className="chapel-mourner-settle">
            <div className="chapel-mourner-core">
              {m.stand ? <Standing m={m} /> : <Bust m={m} />}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
