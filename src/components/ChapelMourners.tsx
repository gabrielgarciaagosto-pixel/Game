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
 * the row in front is not painted over. They face the altar, so only the
 * backs of their heads show. Nobody stands by the casket.
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
];

function widthFor(h: number): number {
  return (h * 1.12) / FLOOR_ASPECT;
}

function BackOfHead({ hair, skin }: { hair: Hair; skin: string }) {
  const neck = <rect x="28" y="30" width="8" height="8" rx="2" fill={skin} />;
  const ears = (
    <g>
      <ellipse cx="20" cy="24" rx="2.4" ry="3.2" fill={skin} />
      <ellipse cx="44" cy="24" rx="2.4" ry="3.2" fill={skin} />
    </g>
  );
  if (hair === 'veil') {
    return (
      <path
        d="M10 28c0-16 10-24 22-24s22 8 22 24v18c-4 6-12 8-22 8s-18-2-22-8z"
        fill="#14110e"
        stroke="#1a120c"
        strokeWidth="1.1"
      />
    );
  }
  if (hair === 'bob') {
    return (
      <g>
        {neck}
        <path
          d="M14 24c0-14 8-20 18-20s18 6 18 20v16c-3 4-9 6-18 6s-15-2-18-6z"
          fill="#1a120e"
          stroke="#1a120c"
          strokeWidth="1.1"
        />
        <path d="M32 10v16" stroke="#3a2a22" strokeWidth="0.7" opacity="0.7" />
      </g>
    );
  }
  if (hair === 'wave') {
    return (
      <g>
        {neck}
        <path
          d="M16 22c0-12 7-18 16-18s16 6 16 18c1 8 2 16 4 26-8-2-10 2-14 6-2-8-4-10-8-8-2 8-6 16-10 18-6-8-8-24-4-42z"
          fill="#2a160e"
          stroke="#1a120c"
          strokeWidth="1"
        />
      </g>
    );
  }
  if (hair === 'bun') {
    return (
      <g>
        {ears}
        {neck}
        <path
          d="M22 24c1-12 5-16 10-16s9 4 10 16c0 4-3 7-10 7s-10-3-10-7z"
          fill="#1c140f"
          stroke="#1a120c"
          strokeWidth="1"
        />
        <circle cx="32" cy="30" r="5.5" fill="#1c140f" stroke="#1a120c" strokeWidth="1" />
      </g>
    );
  }
  if (hair === 'silver') {
    return (
      <g>
        {ears}
        {neck}
        <path
          d="M22 24c1-11 5-15 10-15s9 4 10 15c0 4-3 6-10 6s-10-2-10-6z"
          fill="#d9d4ca"
          stroke="#6e675e"
          strokeWidth="1"
        />
        <path d="M32 12v10" stroke="#8a847c" strokeWidth="0.7" />
      </g>
    );
  }
  return (
    <g>
      {ears}
      {neck}
      <path
        d="M22 24c1-12 5-16 10-16s9 4 10 16c0 4-3 6-10 6s-10-2-10-6z"
        fill="#1a120e"
        stroke="#1a120c"
        strokeWidth="1"
      />
      <path d="M32 11v12" stroke="#3a2a22" strokeWidth="0.7" opacity="0.8" />
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
      <path d="M26 34h12v6c-2 2-4 3-6 3s-4-1-6-3z" fill="#2a2118" />
      <g className="chapel-mourner-head">
        <BackOfHead hair={m.hair} skin={m.skin} />
      </g>
    </svg>
  );
}

/**
 * Mourners during a viewing or service.
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
      className="chapel-mourners absolute inset-0 pointer-events-none overflow-hidden"
      aria-hidden
      data-chapel-mourners
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 1.1s ease',
      }}
    >
      {PEW_MOURNERS.map((m) => (
        <div
          key={m.id}
          className="chapel-mourner absolute"
          style={{
            left: `${m.x * 100}%`,
            top: `${m.y * 100}%`,
            width: `${widthFor(m.h)}%`,
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
            zIndex: 2,
          }}
        >
          <div className="chapel-mourner-settle">
            <div className="chapel-mourner-core">
              <Bust m={m} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
