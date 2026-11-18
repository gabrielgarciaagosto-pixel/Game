import React from 'react';

/**
 * Chapel nave in the same oblique camera as the casket art.
 * Length runs +x, verticals stay vertical, depth runs up and to the right
 * at the casket's slope (86 across, 42 up). Parallel edges stay parallel.
 * The casket sprite is not redrawn; the room is built so it can sit on this floor.
 */
const DX = 86 * 0.62;
const DY = -42 * 0.62;
const SPAN = 3.1;

function at(x: number, y: number, depth = 0): [number, number] {
  return [x + depth * DX, y + depth * DY];
}

function rise(p: [number, number], h: number): [number, number] {
  return [p[0], p[1] - h];
}

function poly(pts: [number, number][]): string {
  return `${pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(' ')} Z`;
}

function Pew({
  x0,
  x1,
  depth,
  thick,
  color,
}: {
  x0: number;
  x1: number;
  depth: number;
  thick: number;
  color: string;
}) {
  const floorY = 250;
  const a = at(x0, floorY, depth);
  const b = at(x1, floorY, depth);
  const c = at(x1, floorY, depth + thick);
  const d = at(x0, floorY, depth + thick);
  const seat = 14;
  const back = 28;
  return (
    <g>
      <path d={poly([a, b, rise(b, seat), rise(a, seat)])} fill={color} />
      <path d={poly([rise(a, seat), rise(b, seat), rise(c, seat), rise(d, seat)])} fill="#1a120c" opacity="0.35" />
      <path d={poly([b, c, rise(c, seat), rise(b, seat)])} fill="#120c08" opacity="0.55" />
      <path d={poly([rise(d, seat), rise(c, seat), rise(c, back), rise(d, back)])} fill={color} />
      <path d={poly([rise(c, seat), rise(c, back), rise(b, back), rise(b, seat)])} fill="#0e0a08" opacity="0.45" />
      <path
        d={poly([rise(d, back - 4), rise(c, back - 4), rise(c, back), rise(d, back)])}
        fill="#f3e6c8"
        opacity="0.18"
      />
    </g>
  );
}

export const ChapelNave: React.FC<{
  floor: string;
  drape: string;
  light: string;
  pew: string;
}> = ({ floor, drape, light, pew }) => {
  const floorY = 258;
  const nL = at(12, floorY, 0);
  const nR = at(196, floorY, 0);
  const fR = at(196, floorY, SPAN);
  const fL = at(12, floorY, SPAN);
  const wallH = 132;
  const backBL = fL;
  const backBR = fR;
  const backTL = rise(fL, wallH);
  const backTR = rise(fR, wallH);
  const rightTN = rise(nR, wallH * 0.72);

  return (
    <svg
      viewBox="0 0 360 280"
      className="absolute inset-0 h-full w-full pointer-events-none"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="nave-floor-shade" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.15" />
          <stop offset="1" stopColor="#000" stopOpacity="0.45" />
        </linearGradient>
        <radialGradient id="nave-window" cx="50%" cy="40%" r="60%">
          <stop offset="0" stopColor={light} stopOpacity="0.95" />
          <stop offset="1" stopColor={light} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="360" height="280" fill="#120a16" />
      <path d={poly([backTL, backTR, backBR, backBL])} fill="#1a121c" />
      <path
        d={poly([
          nL,
          fL,
          rise(fL, wallH),
          rise(nL, wallH * 0.55),
        ])}
        fill="#0e0912"
      />
      <path d={poly([nR, fR, backTR, rightTN])} fill="#0c0810" />

      <path d={poly([at(12, floorY, 0.15), at(2, floorY, 0.15), rise(at(2, floorY, 0.15), 110), rise(at(12, floorY, 0.15), 124)])} fill={drape} />
      <path d={poly([at(196, floorY, 0.35), at(214, floorY, 0.7), rise(at(214, floorY, 0.7), 96), rise(at(196, floorY, 0.35), 112)])} fill={drape} />

      {[0.18, 0.42, 0.66].map((t) => {
        const x = 48 + t * 90;
        const bl = at(x, floorY, SPAN);
        const win = rise(bl, 78);
        return (
          <g key={t}>
            <path d={poly([win, [win[0] + 28, win[1]], [bl[0] + 28, bl[1] - 36], [bl[0], bl[1] - 36]])} fill="#0b1020" />
            <path d={poly([[win[0] + 3, win[1] + 4], [win[0] + 25, win[1] + 4], [bl[0] + 25, bl[1] - 40], [bl[0] + 3, bl[1] - 40]])} fill="#fde68a" opacity="0.38" />
            <path d={`M${(win[0] + 14).toFixed(1)} ${(win[1] + 4).toFixed(1)} V${(bl[1] - 40).toFixed(1)}`} stroke="#fef3c7" strokeOpacity="0.45" />
          </g>
        );
      })}

      <path d={poly([nL, nR, fR, fL])} fill={floor} />
      <path d={poly([nL, nR, fR, fL])} fill="url(#nave-floor-shade)" />
      <g stroke="#f3e6c8" strokeOpacity="0.34" fill="none" strokeWidth="1.15">
        {[0.35, 0.7, 1.05, 1.45, 1.9, 2.4, 2.85].map((d) => {
          const a = at(12, floorY, d);
          const b = at(196, floorY, d);
          return <path key={d} d={`M${a[0].toFixed(1)} ${a[1].toFixed(1)} L${b[0].toFixed(1)} ${b[1].toFixed(1)}`} />;
        })}
        {[36, 72, 108, 144, 180].map((x) => {
          const a = at(x, floorY, 0);
          const b = at(x, floorY, SPAN);
          return <path key={x} d={`M${a[0].toFixed(1)} ${a[1].toFixed(1)} L${b[0].toFixed(1)} ${b[1].toFixed(1)}`} />;
        })}
      </g>

      <ellipse cx="150" cy="228" rx="62" ry="11" fill="#000" opacity="0.28" />

      <Pew x0={18} x1={78} depth={0.15} thick={0.28} color={pew} />
      <Pew x0={128} x1={190} depth={0.15} thick={0.28} color={pew} />
      <Pew x0={28} x1={86} depth={1.15} thick={0.26} color={pew} />
      <Pew x0={124} x1={186} depth={1.15} thick={0.26} color={pew} />

      {(() => {
        const a = at(22, floorY, 2.15);
        const b = at(78, floorY, 2.15);
        const c = at(78, floorY, 2.7);
        const d = at(22, floorY, 2.7);
        const h = 26;
        return (
          <g>
            <path d={poly([a, b, rise(b, h), rise(a, h)])} fill="#2a2118" />
            <path d={poly([b, c, rise(c, h), rise(b, h)])} fill="#1a140e" />
            <path d={poly([rise(a, h), rise(b, h), rise(c, h), rise(d, h)])} fill="#3a2c20" />
            <path d={poly([rise(a, h), rise(b, h), rise(c, h + 2), rise(d, h + 2)])} fill={drape} opacity="0.9" />
            <rect x={rise(a, h)[0] + 10} y={rise(a, h)[1] - 22} width="5" height="20" rx="1" fill="#f5e6c8" />
            <rect x={rise(b, h)[0] - 18} y={rise(b, h)[1] - 24} width="5" height="22" rx="1" fill="#f5e6c8" />
            <ellipse cx={rise(a, h)[0] + 12.5} cy={rise(a, h)[1] - 26} rx="4.5" ry="6" fill="#fde68a" />
            <ellipse cx={rise(b, h)[0] - 15.5} cy={rise(b, h)[1] - 28} rx="4" ry="5.5" fill="#fbbf24" />
            <ellipse cx={rise(a, h)[0] + 16} cy={rise(a, h)[1] - 8} rx="16" ry="5" fill={light} />
          </g>
        );
      })()}

      <rect x="0" y="0" width="360" height="280" fill="url(#nave-window)" opacity="0.55" />
    </svg>
  );
};
