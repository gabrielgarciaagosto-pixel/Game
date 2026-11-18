import React from 'react';

/**
 * Chapel nave in the casket's oblique camera.
 * Length runs +x, verticals stay vertical, depth runs up and to the right
 * at dy/dx = -42/86. Parallel edges stay parallel. The casket sprite is
 * not redrawn; this room is built so the bier sits under it.
 */
const K = 0.558;
const DX = 86 * K;
const DY = -42 * K;
const FY = 470;
const X0 = 8;
const X1 = 360;
const SPAN = 1.65;

function at(x: number, y: number, depth = 0): [number, number] {
  return [x + depth * DX, y + depth * DY];
}

function rise(p: [number, number], h: number): [number, number] {
  return [p[0], p[1] - h];
}

function lerp(a: [number, number], b: [number, number], t: number): [number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function poly(pts: [number, number][]): string {
  return `${pts
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`)
    .join(' ')} Z`;
}

function SideCurtain({ side, drape }: { side: 'left' | 'right'; drape: string }) {
  const left = side === 'left';
  const folds = [0, 1, 2, 3, 4, 5];
  return (
    <g>
      {folds.map((i) => {
        const span = 15;
        const x0 = left ? 2 + i * 13 : 438 - i * 13;
        const x1 = left ? x0 + span : x0 - span;
        const lift = i * 7;
        const shear = (left ? 1 : -1) * (8 + i * 3);
        const top = 6 + lift * 0.2;
        const bot = 492 - lift;
        const pts: [number, number][] = [
          [x0, bot],
          [x1, bot - 3],
          [x1 + shear, top + 18],
          [x0 + shear * 0.45, top],
        ];
        const cloth = i % 2 === 0 ? '#7a3d96' : '#5c2a78';
        const lit = i % 2 === 0 ? '#b07cc8' : '#8d56aa';
        return (
          <g key={`${side}-${i}`}>
            <path d={poly(pts)} fill={cloth} />
            <path d={poly(pts)} fill={drape} />
            <path
              d={`M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)} L${pts[3][0].toFixed(1)} ${pts[3][1].toFixed(1)}`}
              stroke={lit}
              strokeWidth="1.4"
              fill="none"
              opacity="0.85"
            />
          </g>
        );
      })}
      <g stroke="#f6ead4" strokeWidth="1.1" opacity="0.75" fill="none">
        {left ? (
          <>
            <path d="M8 48 H28 M10 62 H26 M8 150 H30 M10 164 H26 M8 250 H28 M10 264 H24 M8 360 H30 M10 374 H24" />
          </>
        ) : (
          <>
            <path d="M412 52 H432 M414 66 H430 M410 156 H432 M412 170 H428 M412 258 H434 M414 272 H430 M410 364 H432 M412 378 H428" />
          </>
        )}
      </g>
      <path
        d={left ? 'M4 468 H78' : 'M362 468 H436'}
        stroke="#e6c36a"
        strokeWidth="2.2"
        opacity="0.8"
      />
    </g>
  );
}

function WallWindow({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const shear = w * 0.22;
  const drop = shear * (42 / 86);
  const frame = poly([
    [x, y + h],
    [x + w, y + h - drop],
    [x + w + shear * 0.15, y - drop],
    [x + shear * 0.15, y],
  ]);
  const glass = poly([
    [x + 5, y + h - 5],
    [x + w - 5, y + h - drop - 4],
    [x + w + shear * 0.1 - 4, y - drop + 6],
    [x + shear * 0.1 + 5, y + 6],
  ]);
  const mx = x + w * 0.5;
  return (
    <g>
      <path d={frame} fill="#2c1c14" />
      <path d={glass} fill="#ffe7a8" />
      <path d={glass} fill="#fff6d2" opacity="0.4" />
      <path d={`M${(mx + shear * 0.08).toFixed(1)} ${(y + 8).toFixed(1)} L${(mx - 2).toFixed(1)} ${(y + h - 8).toFixed(1)}`} stroke="#3a2a1c" strokeWidth="2.6" />
      <path d={`M${(x + 8).toFixed(1)} ${(y + h * 0.48).toFixed(1)} L${(x + w - 4).toFixed(1)} ${(y + h * 0.48 - drop * 0.7).toFixed(1)}`} stroke="#3a2a1c" strokeWidth="2.6" />
      <path d={`M${(x + 10).toFixed(1)} ${(y + 12).toFixed(1)} L${(x + w * 0.38).toFixed(1)} ${(y + 10).toFixed(1)}`} stroke="#fff" strokeWidth="1.7" opacity="0.75" />
      <path d={`M${(x - 2).toFixed(1)} ${(y + h + 1).toFixed(1)} L${(x + w + 8).toFixed(1)} ${(y + h - drop).toFixed(1)}`} stroke="#c4a574" strokeWidth="4" />
    </g>
  );
}

function Pew({
  x0,
  x1,
  depth,
  tint,
}: {
  x0: number;
  x1: number;
  depth: number;
  tint: string;
}) {
  const thick = 0.46;
  const seat = 16;
  const back = 50;
  const a = at(x0, FY, depth);
  const b = at(x1, FY, depth);
  const c = at(x1, FY, depth + thick);
  const d = at(x0, FY, depth + thick);
  const slats = [0.06, 0.28, 0.5, 0.72].map((t) => {
    const p = lerp(d, c, t);
    const q = lerp(d, c, t + 0.18);
    return poly([rise(p, seat + 2), rise(q, seat + 2), rise(q, back - 6), rise(p, back - 6)]);
  });
  const endTop = rise(b, back + 4);
  const endBack = rise(c, back + 8);
  const arch = `M${b[0].toFixed(1)} ${b[1].toFixed(1)} L${rise(b, seat)[0].toFixed(1)} ${rise(b, seat)[1].toFixed(1)} L${endTop[0].toFixed(1)} ${(endTop[1] + 8).toFixed(1)} Q${((endTop[0] + endBack[0]) / 2).toFixed(1)} ${(endTop[1] - 10).toFixed(1)} ${endBack[0].toFixed(1)} ${endBack[1].toFixed(1)} L${rise(c, seat)[0].toFixed(1)} ${rise(c, seat)[1].toFixed(1)} L${c[0].toFixed(1)} ${c[1].toFixed(1)} Z`;
  return (
    <g>
      {[a, b, c, d].map((p, i) => (
        <path
          key={i}
          d={poly([p, [p[0] + 3.5, p[1]], rise([p[0] + 3.5, p[1]], seat), rise(p, seat)])}
          fill="#5a3b24"
        />
      ))}
      <path d={poly([a, b, rise(b, seat), rise(a, seat)])} fill="#8d5a32" />
      <path d={poly([a, b, rise(b, 6), rise(a, 6)])} fill="#2c1a10" />
      <path d={poly([rise(a, seat), rise(b, seat), rise(c, seat), rise(d, seat)])} fill="#f0d7b0" />
      <path d={poly([b, c, rise(c, seat), rise(b, seat)])} fill="#6b4428" />
      <path d={poly([rise(d, seat), rise(c, seat), rise(c, back), rise(d, back)])} fill="#4e301c" />
      <path d={poly([rise(d, seat), rise(c, seat), rise(c, back), rise(d, back)])} fill={tint} opacity="0.18" />
      {slats.map((dPath) => (
        <path key={dPath} d={dPath} fill="#b8895a" />
      ))}
      <path
        d={poly([rise(d, back - 6), rise(c, back - 6), rise(c, back + 3), rise(d, back + 3)])}
        fill="#f7ead2"
      />
      <path d={arch} fill="#5c3a22" stroke="#f0d7b0" strokeWidth="1.2" />
      <circle cx={rise(b, back - 10)[0] + 7} cy={rise(b, back - 10)[1]} r="4.5" fill="#f6e6c8" />
      <path
        d={poly([
          rise(lerp(d, c, 0.12), seat - 1),
          rise(lerp(d, c, 0.88), seat - 1),
          rise(lerp(d, c, 0.88), seat - 6),
          rise(lerp(d, c, 0.12), seat - 6),
        ])}
        fill="#3a2416"
      />
    </g>
  );
}

function Candle({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <ellipse cx={x} cy={y + 2} rx="14" ry="5" fill="#1a1008" opacity="0.35" />
      <ellipse cx={x} cy={y} rx="13" ry="4.6" fill="#8a6428" />
      <ellipse cx={x} cy={y - 2} rx="9" ry="3.2" fill="#f0d078" />
      <rect x={x - 2} y={y - 62} width="4" height="60" rx="1" fill="#c4923a" />
      <rect x={x - 1.1} y={y - 40} width="2.2" height="7" fill="#f0d078" />
      <ellipse cx={x} cy={y - 62} rx="7" ry="2.6" fill="#f0d078" />
      <rect x={x - 3.2} y={y - 84} width="6.4" height="22" rx="1.2" fill="#f7ecd2" />
      <path d={`M${x} ${y - 100} C${x + 5} ${y - 90} ${x + 3.2} ${y - 84} ${x} ${y - 84} C${x - 3.2} ${y - 84} ${x - 5} ${y - 90} ${x} ${y - 100} Z`} fill="#fde68a" />
      <path d={`M${x} ${y - 96} C${x + 2} ${y - 90} ${x + 1.2} ${y - 86} ${x} ${y - 86} C${x - 1.2} ${y - 86} ${x - 2} ${y - 90} ${x} ${y - 96} Z`} fill="#fff7d0" />
      <ellipse cx={x} cy={y - 78} rx="16" ry="7" fill="#fbbf24" opacity="0.38" />
    </g>
  );
}

export const ChapelNave: React.FC<{
  floor: string;
  drape: string;
  light: string;
  pew: string;
}> = ({ floor, drape, light, pew }) => {
  const nL = at(X0, FY, 0);
  const nR = at(X1, FY, 0);
  const fR = at(X1, FY, SPAN);
  const fL = at(X0, FY, SPAN);

  const altarA = at(130, FY, 1.28);
  const altarB = at(250, FY, 1.28);
  const altarC = at(250, FY, 1.62);
  const altarD = at(130, FY, 1.62);
  const altarH = 46;

  const standA = at(86, FY, 0.62);
  const standB = at(248, FY, 0.62);
  const standC = at(248, FY, 1.05);
  const standD = at(86, FY, 1.05);
  const standH = 22;

  const leftFlame = at(62, FY, 0.58);
  const rightFlame = at(286, FY, 0.72);

  return (
    <svg
      viewBox="0 0 440 500"
      className="absolute inset-0 h-full w-full pointer-events-none"
      aria-hidden
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="nave-wall" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8d74b8" />
          <stop offset="0.45" stopColor="#6d5296" />
          <stop offset="1" stopColor="#4e3874" />
        </linearGradient>
        <radialGradient id="nave-glass-l" cx="30%" cy="22%" r="42%">
          <stop offset="0" stopColor={light} stopOpacity="0.95" />
          <stop offset="1" stopColor={light} stopOpacity="0" />
        </radialGradient>
        <radialGradient id="nave-glass-r" cx="78%" cy="26%" r="40%">
          <stop offset="0" stopColor={light} stopOpacity="0.9" />
          <stop offset="1" stopColor={light} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="440" height="500" fill="url(#nave-wall)" />
      <path d={poly([rise(fL, 250), rise(fR, 250), fR, fL])} fill="#7d64aa" />
      <path d={poly([nL, fL, rise(fL, 230), rise(nL, 150)])} fill="#5b4584" />
      <path d={poly([nR, fR, rise(fR, 250), rise(nR, 160)])} fill="#534078" />
      <SideCurtain side="left" drape={drape} />
      <SideCurtain side="right" drape={drape} />

      <WallWindow x={92} y={86} w={78} h={102} />
      <WallWindow x={268} y={74} w={78} h={102} />

      <path d={poly([nL, nR, fR, fL])} fill={floor} />
      <path d={poly([nL, nR, fR, fL])} fill="#c4a574" opacity="0.38" />
      <path d={poly([at(132, FY, 0.15), at(196, FY, 0.15), at(196, FY, SPAN - 0.08), at(132, FY, SPAN - 0.08)])} fill="#f3e6c8" opacity="0.16" />
      <g stroke="#f6edd8" strokeOpacity="0.8" fill="none" strokeWidth="1.5">
        {[0.22, 0.48, 0.74, 1.0, 1.28, 1.55].map((d) => {
          const a = at(X0, FY, d);
          const b = at(X1, FY, d);
          return <path key={d} d={`M${a[0].toFixed(1)} ${a[1].toFixed(1)} L${b[0].toFixed(1)} ${b[1].toFixed(1)}`} />;
        })}
        {[40, 80, 120, 160, 200, 240, 280, 320].map((x) => {
          const a = at(x, FY, 0);
          const b = at(x, FY, SPAN);
          return <path key={x} d={`M${a[0].toFixed(1)} ${a[1].toFixed(1)} L${b[0].toFixed(1)} ${b[1].toFixed(1)}`} />;
        })}
      </g>

      <g>
        <path d={poly([altarA, altarB, rise(altarB, altarH), rise(altarA, altarH)])} fill="#6b4e32" />
        <path d={poly([altarB, altarC, rise(altarC, altarH), rise(altarB, altarH)])} fill="#4e3824" />
        <path d={poly([rise(altarA, altarH), rise(altarB, altarH), rise(altarC, altarH), rise(altarD, altarH)])} fill="#c4a574" />
        <path d={poly([altarA, altarB, rise(altarB, altarH * 0.72), rise(altarA, altarH * 0.72)])} fill="#6b3488" />
        <path d={poly([altarA, altarB, rise(altarB, altarH * 0.72), rise(altarA, altarH * 0.72)])} fill={drape} />
        <path d={poly([rise(altarA, altarH), rise(altarB, altarH), rise(altarC, altarH - 2), rise(altarD, altarH - 2)])} fill="#7a3d96" />
        <path d={poly([rise(altarA, altarH), rise(altarB, altarH), rise(altarC, altarH - 2), rise(altarD, altarH - 2)])} fill={drape} />
        <path
          d={`M${rise(altarA, altarH - 8)[0].toFixed(1)} ${rise(altarA, altarH - 8)[1].toFixed(1)} L${rise(altarB, altarH - 8)[0].toFixed(1)} ${rise(altarB, altarH - 8)[1].toFixed(1)}`}
          stroke="#2a1038"
          strokeOpacity="0.45"
        />
        <path
          d={`M${rise(altarA, altarH - 16)[0].toFixed(1)} ${rise(altarA, altarH - 16)[1].toFixed(1)} L${rise(altarB, altarH - 16)[0].toFixed(1)} ${rise(altarB, altarH - 16)[1].toFixed(1)}`}
          stroke="#f3e6c8"
          strokeOpacity="0.45"
        />
        {(() => {
          const cx = rise(lerp(altarA, altarB, 0.5), altarH)[0];
          const cy = rise(lerp(altarA, altarB, 0.5), altarH)[1];
          return (
            <g>
              <rect x={cx - 2.6} y={cy - 58} width="5.2" height="56" fill="#f3e6c4" />
              <rect x={cx - 14} y={cy - 44} width="28" height="5" fill="#f3e6c4" />
            </g>
          );
        })()}
      </g>

      <Pew x0={10} x1={72} depth={0.06} tint={pew} />
      <Pew x0={318} x1={358} depth={0.06} tint={pew} />
      <Pew x0={14} x1={70} depth={0.48} tint={pew} />
      <Pew x0={322} x1={356} depth={0.48} tint={pew} />
      <Pew x0={18} x1={68} depth={0.9} tint={pew} />
      <Pew x0={326} x1={354} depth={0.9} tint={pew} />

      <g>
        {[standA, standB, standC, standD].map((p, i) => (
          <path
            key={i}
            d={poly([p, [p[0] + 4, p[1]], rise([p[0] + 4, p[1]], standH), rise(p, standH)])}
            fill="#5c4030"
          />
        ))}
        <path d={poly([standA, standB, rise(standB, standH), rise(standA, standH)])} fill="#6b3488" />
        <path d={poly([standA, standB, rise(standB, standH), rise(standA, standH)])} fill={drape} />
        <path d={poly([standB, standC, rise(standC, standH), rise(standB, standH)])} fill="#4a2060" />
        <path d={poly([rise(standA, standH), rise(standB, standH), rise(standC, standH), rise(standD, standH)])} fill="#d8b88a" />
        <path
          d={poly([
            rise(standA, standH),
            rise(standB, standH),
            rise(standB, standH + 3),
            rise(standA, standH + 3),
          ])}
          fill="#f0d7b0"
        />
      </g>

      <Candle x={leftFlame[0]} y={leftFlame[1]} />
      <Candle x={rightFlame[0]} y={rightFlame[1]} />

      <rect width="440" height="220" fill="url(#nave-glass-l)" opacity="0.4" />
      <rect width="440" height="240" fill="url(#nave-glass-r)" opacity="0.34" />
    </svg>
  );
};
