import React, { useEffect, useState } from 'react';

/** Pixel width / height of each cut sprite, in sheet order. */
const ASPECT = [
  0.605, 0.524, 0.586, 0.566, 0.586, 0.54, 0.591, 0.584, 0.592, 0.568, 0.591,
  0.622, 0.588, 0.592, 0.558, 0.576, 0.55, 0.585, 0.598, 0.633, 0.647, 0.636,
  0.752, 0.521, 0.619, 0.653, 0.525, 0.547, 0.596, 0.535, 0.613, 0.695, 0.804,
  0.95, 0.566, 0.661, 0.664, 0.611, 0.52, 0.848, 0.634,
];

/** Floor width / height of Gabriel's cropped chapel painting. */
const FLOOR_ASPECT = 986 / 509;

interface Seat {
  id: string;
  sprite: number;
  /** Bottom-center of the visible part, on the pew rail. */
  x: number;
  rail: number;
  /** Full sprite height as a percent of the floor. The pew clips the rest. */
  h: number;
  /** Fraction of the sprite that stays visible above the pew in front. */
  frac: number;
  z: number;
  breathe: number;
  breatheDelay: number;
  settle: number;
  settleDelay: number;
  drift: number;
  lean: number;
}

interface RowSpec {
  ids: number[];
  rail: number;
  /** Full sprite height, percent of the floor, before the fit shrink. */
  h: number;
  frac: number;
  x0: number;
  x1: number;
  z: number;
  side: 'L' | 'R';
}

/**
 * Filled pews, backs to the camera, smaller toward the altar.
 * A pair that shares one drawing (an arm around a child, or around each
 * other) is one sprite. Nobody stands, and the aisle in front of the casket
 * stays empty.
 */
const ROWS: RowSpec[] = [
  // Back pew, just in front of the chancel. The rail is the top of that pew's back.
  { side: 'L', ids: [0, 19, 2, 14, 5, 12, 17, 8, 15, 3], rail: 0.584, h: 12.4, frac: 0.5, x0: 0.02, x1: 0.36, z: 2 },
  { side: 'R', ids: [11, 4, 32, 9, 6, 18, 1, 21, 7, 27], rail: 0.584, h: 12.4, frac: 0.5, x0: 0.64, x1: 0.98, z: 2 },
  // Second pew. Mother-and-child, and the couple, each count as one seat.
  { side: 'L', ids: [10, 35, 23, 16, 39, 26, 25], rail: 0.678, h: 17.4, frac: 0.5, x0: 0.01, x1: 0.33, z: 3 },
  { side: 'R', ids: [24, 20, 28, 33, 29, 22], rail: 0.678, h: 17.4, frac: 0.5, x0: 0.67, x1: 0.99, z: 3 },
  // Third pew. Stay on the wall side of the tall pew ends so those ends stay in front.
  { side: 'L', ids: [40, 30, 36, 13], rail: 0.738, h: 21.5, frac: 0.54, x0: 0.0, x1: 0.26, z: 4 },
  { side: 'R', ids: [34, 31, 37, 38], rail: 0.738, h: 21.5, frac: 0.54, x0: 0.74, x1: 1.0, z: 4 },
];

function pack(row: RowSpec): Seat[] {
  const jitter = (id: number) => 0.95 + ((id * 13) % 7) * 0.014;
  let hs = row.ids.map((id) => row.h * jitter(id));
  const widthOf = (h: number, id: number) => (h / 100) * ASPECT[id] / FLOOR_ASPECT;
  let widths = row.ids.map((id, i) => widthOf(hs[i], id));
  const overlap = 0.8;
  const measure = (ws: number[]) => {
    let gaps = 0;
    for (let i = 0; i < ws.length - 1; i++) gaps += overlap * (ws[i] + ws[i + 1]) / 2;
    return ws[0] / 2 + gaps + ws[ws.length - 1] / 2;
  };
  const span = row.x1 - row.x0;
  const total = measure(widths);
  if (total > span) {
    const k = span / total;
    hs = hs.map((h) => h * k);
    widths = widths.map((w) => w * k);
  }
  const gaps: number[] = [];
  for (let i = 0; i < widths.length - 1; i++) gaps.push(overlap * (widths[i] + widths[i + 1]) / 2);
  const packed = widths[0] / 2 + gaps.reduce((a, b) => a + b, 0) + widths[widths.length - 1] / 2;
  const add = Math.min(Math.max(0, span - packed), packed * 0.2);
  const gapBoost = gaps.length ? add / gaps.length : 0;
  let x = row.x0 + (span - (packed + add)) / 2 + widths[0] / 2;
  return row.ids.map((sprite, i) => {
    const seatX = x;
    const rail = row.rail + (row.side === 'L' ? (seatX - 0.16) * 0.045 : (0.84 - seatX) * 0.045);
    if (i < gaps.length) x += gaps[i] + gapBoost;
    return {
      id: `${row.side}${i}-${sprite}`,
      sprite,
      x: seatX,
      rail,
      h: hs[i],
      frac: row.frac,
      z: row.z,
      breathe: 5.2 + (sprite % 5) * 0.35,
      breatheDelay: (sprite % 8) * 0.28,
      settle: 7.4 + (sprite % 6) * 0.4,
      settleDelay: (sprite % 7) * 0.33,
      drift: sprite % 2 === 0 ? 0.35 : -0.3,
      lean: sprite % 2 === 0 ? 0.45 : -0.4,
    };
  });
}

const SEATS: Seat[] = ROWS.flatMap(pack);

/**
 * Gabriel's rear-view mourners, seated in his pews during a viewing or service.
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
      {SEATS.map((m) => (
        <div
          key={m.id}
          className="chapel-mourner chapel-mourner-sprite absolute overflow-hidden"
          style={{
            left: `${m.x * 100}%`,
            top: `${m.rail * 100}%`,
            width: `${((m.h / 100) * ASPECT[m.sprite]) / FLOOR_ASPECT * 100}%`,
            height: `${m.h * m.frac}%`,
            ['--breathe-dur' as string]: `${m.breathe}s`,
            ['--breathe-delay' as string]: `${m.breatheDelay}s`,
            ['--settle-dur' as string]: `${m.settle}s`,
            ['--settle-delay' as string]: `${m.settleDelay}s`,
            ['--drift' as string]: `${m.drift}px`,
            ['--lean' as string]: `${m.lean}deg`,
            zIndex: m.z,
          }}
        >
          <div className="chapel-mourner-settle">
            <img
              src={`/chapel/mourners/m${String(m.sprite).padStart(2, '0')}.png`}
              alt=""
              draggable={false}
              style={{ width: '100%', height: `${100 / m.frac}%`, display: 'block' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
