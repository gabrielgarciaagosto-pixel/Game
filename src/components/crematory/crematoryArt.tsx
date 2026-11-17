import { useId } from 'react';
import type { SweepTool } from '../../types/game';

export function StirringRodArt({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '');
  const steel = `rod-steel-${uid}`;
  const wood = `rod-wood-${uid}`;
  return (
    <svg viewBox="0 0 72 240" className={className} aria-hidden>
      <defs>
        <linearGradient id={steel} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#3f3f46" />
          <stop offset="0.35" stopColor="#e4e4e7" />
          <stop offset="0.55" stopColor="#a1a1aa" />
          <stop offset="1" stopColor="#27272a" />
        </linearGradient>
        <linearGradient id={wood} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4a2c1a" />
          <stop offset="0.45" stopColor="#a1623b" />
          <stop offset="1" stopColor="#3f2414" />
        </linearGradient>
      </defs>
      <rect x="24" y="8" width="24" height="58" rx="8" fill={`url(#${wood})`} />
      <path d="M28 18h16M28 28h16M28 38h16M28 48h16" stroke="#2a160c" strokeWidth="1.2" opacity="0.55" />
      <rect x="22" y="62" width="28" height="10" rx="2" fill="#71717a" />
      <rect x="31" y="70" width="10" height="128" rx="2" fill={`url(#${steel})`} />
      <path d="M34 78v108" stroke="#fff" strokeWidth="1" opacity="0.35" />
      <path
        d="M28 196c8 6 18 8 28 2 6 10-2 22-16 26-18 4-30-8-28-20 1-4 8-8 16-8z"
        fill="#9a3412"
        stroke="#431407"
        strokeWidth="1.5"
      />
      <path d="M36 204c6 2 12 2 16-2" stroke="#fdba74" strokeWidth="1.4" fill="none" />
      <circle cx="36" cy="18" r="2" fill="#d6d3d1" />
    </svg>
  );
}

export function IronRakeArt({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '');
  const wood = `rake-wood-${uid}`;
  const iron = `rake-iron-${uid}`;
  return (
    <svg viewBox="0 0 150 240" className={className} aria-hidden>
      <defs>
        <linearGradient id={wood} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#44403c" />
          <stop offset="0.4" stopColor="#a8a29e" />
          <stop offset="1" stopColor="#292524" />
        </linearGradient>
        <linearGradient id={iron} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d6d3d1" />
          <stop offset="0.4" stopColor="#57534e" />
          <stop offset="1" stopColor="#1c1917" />
        </linearGradient>
      </defs>
      <rect x="66" y="6" width="18" height="118" rx="6" fill={`url(#${wood})`} />
      <path d="M70 16v96" stroke="#fff" strokeWidth="1.2" opacity="0.25" />
      <ellipse cx="75" cy="14" rx="11" ry="7" fill="#78716c" />
      <rect x="58" y="116" width="34" height="14" rx="3" fill="#3f3f46" stroke="#d4d4d8" strokeWidth="1" />
      <rect x="14" y="126" width="122" height="16" rx="3" fill={`url(#${iron})`} stroke="#1c1917" />
      <path d="M18 130h114" stroke="#e7e5e4" strokeWidth="1.2" opacity="0.45" />
      {Array.from({ length: 7 }).map((_, i) => {
        const x = 24 + i * 16;
        return (
          <g key={i}>
            <path
              d={`M${x} 140 C${x - 2} 168 ${x + 6} 188 ${x + 1} 214`}
              fill="none"
              stroke={`url(#${iron})`}
              strokeWidth="5"
              strokeLinecap="round"
            />
            <path
              d={`M${x + 1} 146 C${x} 170 ${x + 5} 188 ${x + 2} 208`}
              fill="none"
              stroke="#e7e5e4"
              strokeWidth="1"
              opacity="0.4"
            />
            <circle cx={x + 1} cy="214" r="2.2" fill="#292524" />
          </g>
        );
      })}
      <circle cx="28" cy="134" r="1.6" fill="#a8a29e" />
      <circle cx="122" cy="134" r="1.6" fill="#a8a29e" />
    </svg>
  );
}

export type BrushFlex = {
  /** -1 leans left on screen, 1 leans right. Opposite the stroke. */
  lean: number;
  /** 0 at rest, 1 when a downward sweep presses the bristles back. */
  push: number;
};

/** Handle up, bristles down. The head matches the hearth brush in the reference photos. */
const BRUSH_CX = 120;
const BRUSH_ROOT_Y = 172;

function brushTip(t: number, jitter = 0): { x: number; y: number } {
  const spread = t - 0.5;
  const edge = Math.abs(spread) * 2;
  return {
    x: BRUSH_CX + spread * 214,
    y: 334 - Math.pow(edge, 1.45) * 52 + jitter,
  };
}

function brushMassPath(): string {
  let d = '';
  for (let i = 0; i <= 24; i += 1) {
    const p = brushTip(i / 24);
    d += `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }
  return `${d}L206 176L34 176Z`;
}

const BRUSH_MASS = brushMassPath();
const BRUSH_HAIRS = Array.from({ length: 56 }, (_, i) => {
  const t = i / 55;
  const a = { x: 26 + t * 188, y: BRUSH_ROOT_Y };
  const b = brushTip(t, (i % 3 - 1) * 1.4);
  const spread = t - 0.5;
  const mid = {
    x: a.x + (b.x - a.x) * 0.46,
    y: a.y + (b.y - a.y) * 0.46,
  };
  const pale = {
    x: a.x + (b.x - a.x) * 0.42,
    y: a.y + (b.y - a.y) * 0.42,
  };
  return {
    pale: `M${a.x.toFixed(1)} ${a.y} Q${((a.x + pale.x) / 2).toFixed(1)} ${((a.y + pale.y) / 2).toFixed(1)} ${pale.x.toFixed(1)} ${pale.y.toFixed(1)}`,
    scorch: `M${mid.x.toFixed(1)} ${mid.y.toFixed(1)} Q${((mid.x + b.x) / 2 + spread * 4).toFixed(1)} ${((mid.y + b.y) / 2).toFixed(1)} ${b.x.toFixed(1)} ${b.y.toFixed(1)}`,
    paleWide: i % 6 === 0,
    scorchWide: i % 5 === 0,
    paleLight: i % 2 === 0,
    scorchDark: i % 4 === 0,
    tip: b,
  };
});

/**
 * The bench brush from the reference photos. Handle stays up.
 * Only the bristle fan flexes, against the stroke.
 */
export function PlainHandBrushArt({
  className,
  flex,
}: {
  className?: string;
  flex?: BrushFlex;
}) {
  const uid = useId().replace(/:/g, '');
  const block = `brush-block-${uid}`;
  const bare = `brush-bare-${uid}`;
  const red = `brush-red-${uid}`;
  const hair = `brush-hair-${uid}`;
  const lean = Math.max(-1, Math.min(1, flex?.lean ?? 0));
  const push = Math.max(0, Math.min(1, flex?.push ?? 0));
  return (
    <svg
      viewBox="0 0 240 360"
      className={className}
      aria-hidden
      data-tool-art="hand-brush"
      data-brush-lean={lean.toFixed(2)}
      data-brush-push={push.toFixed(2)}
    >
      <defs>
        <linearGradient id={block} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#cbb89a" />
          <stop offset="0.12" stopColor="#f4e7d2" />
          <stop offset="0.48" stopColor="#e6d5b8" />
          <stop offset="0.78" stopColor="#f8f0e2" />
          <stop offset="1" stopColor="#b9a488" />
        </linearGradient>
        <linearGradient id={bare} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#c4a574" />
          <stop offset="0.45" stopColor="#f3e2c4" />
          <stop offset="1" stopColor="#a8845c" />
        </linearGradient>
        <linearGradient id={red} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#7a1418" />
          <stop offset="0.28" stopColor="#c43834" />
          <stop offset="0.55" stopColor="#9a1c20" />
          <stop offset="1" stopColor="#5c1014" />
        </linearGradient>
        <linearGradient
          id={hair}
          x1="0"
          y1="168"
          x2="0"
          y2="340"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#f3e4c8" />
          <stop offset="0.22" stopColor="#e4c896" />
          <stop offset="0.46" stopColor="#8d5a32" />
          <stop offset="0.68" stopColor="#3a2418" />
          <stop offset="1" stopColor="#120c0a" />
        </linearGradient>
      </defs>
      <path
        d="M120 10 C102 10 98 24 101 38 C104 50 108 58 109 78 L112 168 L128 168 L131 78 C132 58 136 50 139 38 C142 24 138 10 120 10 Z"
        fill={`url(#${bare})`}
      />
      <path
        d="M120 16 C106 16 104 28 106 38 L112 160 L128 160 L134 38 C136 28 134 16 120 16 Z"
        fill={`url(#${red})`}
      />
      <path
        d="M108 36 C109 80 110 120 112 156"
        stroke="#f3e6cf"
        strokeWidth="2.4"
        fill="none"
        strokeLinecap="round"
        opacity="0.9"
      />
      <path
        d="M133 32 C131 78 129 124 126 158"
        stroke="#e7d3b0"
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M116 48 l3 22 M122 70 l-2 16"
        stroke="#f6efe2"
        strokeWidth="1"
        opacity="0.45"
        strokeLinecap="round"
      />
      <circle cx="120" cy="32" r="9" fill="#e8d4b4" />
      <circle cx="120" cy="32" r="5.6" fill="#16110e" />
      <path
        d="M116 29.5 a4.2 4.2 0 0 1 7 -1.2"
        stroke="#6a5344"
        strokeWidth="1"
        fill="none"
      />
      <g
        className="brush-bristles"
        style={{
          transformOrigin: '120px 172px',
          transform: `rotate(${lean * 16}deg) scaleY(${1 - push * 0.2})`,
        }}
      >
        <path d={BRUSH_MASS} fill={`url(#${hair})`} />
        {BRUSH_HAIRS.map((strand, i) => (
          <g key={i}>
            <path
              d={strand.pale}
              stroke={strand.paleLight ? '#f7edd8' : '#ecd9b4'}
              strokeWidth={strand.paleWide ? 2.2 : 1.45}
              fill="none"
              strokeLinecap="round"
              opacity="0.7"
            />
            <path
              d={strand.scorch}
              stroke={strand.scorchDark ? '#140e0c' : '#241610'}
              strokeWidth={strand.scorchWide ? 2.6 : 1.9}
              fill="none"
              strokeLinecap="round"
            />
          </g>
        ))}
        {push > 0.15
          ? [0.18, 0.38, 0.55, 0.72, 0.86].map((t, i) => {
              const p = brushTip(t, 0);
              return (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y + 4}
                  r={1.8 + (i % 2)}
                  fill="#d6d3d1"
                  opacity={0.35 + push * 0.5}
                />
              );
            })
          : null}
      </g>
      <rect x="14" y="150" width="212" height="38" rx="16" fill={`url(#${block})`} />
      <path d="M30 178 H210" stroke="#8d7356" strokeWidth="1.4" opacity="0.35" />
      <path
        d="M36 160 C80 156 160 156 206 164"
        stroke="#fff"
        strokeWidth="1.1"
        fill="none"
        opacity="0.22"
      />
      <path
        d="M52 160 h128 c2 0 3 2 2 4 l-2 12 c-8 1 -120 2 -128 0 l-1 -12 c0 -2 1 -4 1 -4 Z"
        fill="#ddd6c8"
        opacity="0.9"
      />
      <path d="M168 160 l12 2 v12 l-14 -1 Z" fill="#e6d3b4" />
      <path
        d="M58 164 h14 M78 166 h9 M94 163 h20 M120 167 h12 M138 164 h16"
        stroke="#5e5952"
        strokeWidth="1.15"
        opacity="0.5"
        strokeLinecap="round"
      />
      <path
        d="M64 172 h10 M108 171 h18 M146 173 h8"
        stroke="#7a756c"
        strokeWidth="0.9"
        opacity="0.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

const FRAGMENT_WIRES = 46;
const FRAGMENT_ATTACH_Y = 286;

function fragmentWire(
  index: number,
  rank: 0 | 1,
  lean: number,
  push: number
): { d: string; stroke: string; width: number } {
  const span = FRAGMENT_WIRES - 1;
  const t = index / span;
  const edge = Math.abs(t - 0.5) * 2;
  const x = 10 + t * 120 + (rank === 0 ? -0.6 : 0.7);
  const length = (rank === 0 ? 46 : 54) - edge * 5 + (index % 3) * 1.1;
  const bow = lean * (8 + edge * 7);
  const squash = push * (rank === 0 ? 10 : 14);
  const tipX = x + bow;
  const tipY = FRAGMENT_ATTACH_Y - length + squash;
  const cx = x + bow * 0.62;
  const cy = FRAGMENT_ATTACH_Y - length * 0.46;
  const stroke =
    rank === 0
      ? index % 2 === 0
        ? '#8a6418'
        : '#a07828'
      : index % 3 === 0
        ? '#f3d48a'
        : '#d4a441';
  return {
    d: `M${x.toFixed(1)} ${FRAGMENT_ATTACH_Y} Q${cx.toFixed(1)} ${cy.toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)}`,
    stroke,
    width: rank === 0 ? 1.15 : 0.85,
  };
}

/** Pizza-oven hearth brush. Grip sits at the low end of this drawing; the game turns the head up. */
export function HandBrushArt({
  className,
  flex,
}: {
  className?: string;
  flex?: BrushFlex;
}) {
  const uid = useId().replace(/:/g, '');
  const pole = `frag-pole-${uid}`;
  const wood = `frag-wood-${uid}`;
  const brass = `frag-brass-${uid}`;
  const grip = `frag-grip-${uid}`;
  const lean = Math.max(-1, Math.min(1, flex?.lean ?? 0));
  const push = Math.max(0, Math.min(1, flex?.push ?? 0));
  const back = Array.from({ length: FRAGMENT_WIRES }, (_, i) =>
    fragmentWire(i, 0, lean, push)
  );
  const front = Array.from({ length: FRAGMENT_WIRES }, (_, i) =>
    fragmentWire(i, 1, lean, push)
  );
  return (
    <svg
      viewBox="0 0 140 360"
      className={className}
      aria-hidden
      data-tool-art="fragment-brush"
      data-brush-lean={lean.toFixed(2)}
      data-brush-push={push.toFixed(2)}
    >
      <defs>
        <linearGradient id={pole} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8b939c" />
          <stop offset="0.28" stopColor="#f7fafc" />
          <stop offset="0.48" stopColor="#c5ced6" />
          <stop offset="0.7" stopColor="#ffffff" />
          <stop offset="1" stopColor="#6d7680" />
        </linearGradient>
        <linearGradient id={wood} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f3e2c4" />
          <stop offset="0.45" stopColor="#e2c48a" />
          <stop offset="1" stopColor="#c4964e" />
        </linearGradient>
        <linearGradient id={brass} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f6e2a8" />
          <stop offset="0.5" stopColor="#c8922e" />
          <stop offset="1" stopColor="#8a5a12" />
        </linearGradient>
        <linearGradient id={grip} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#0c0c0c" />
          <stop offset="0.35" stopColor="#3a3a3a" />
          <stop offset="0.55" stopColor="#141414" />
          <stop offset="1" stopColor="#050505" />
        </linearGradient>
      </defs>
      <rect x="62" y="36" width="16" height="250" rx="3" fill={`url(#${pole})`} />
      <path d="M66 44 v234" stroke="#ffffff" strokeWidth="1.1" opacity="0.55" />
      <path d="M72.5 48 v226" stroke="#9aa3ab" strokeWidth="0.6" opacity="0.45" />
      <rect x="58" y="10" width="24" height="34" rx="7" fill={`url(#${grip})`} />
      <path d="M64 16 v22" stroke="#6b6b6b" strokeWidth="1.2" opacity="0.55" strokeLinecap="round" />
      <rect x="60" y="40" width="20" height="5" rx="1" fill="#1c1c1c" />
      <rect x="58" y="278" width="24" height="10" rx="2" fill="#9aa3ab" />
      <rect x="8" y="286" width="124" height="22" rx="2" fill={`url(#${wood})`} stroke="#a67c3d" strokeWidth="0.8" />
      <path d="M14 294 h112 M18 302 h104" stroke="#f8edd6" strokeWidth="0.7" opacity="0.45" />
      <rect x="8" y="284" width="124" height="5" fill={`url(#${brass})`} />
      <g
        className="brush-bristles"
        style={{
          transformOrigin: '70px 286px',
          transform: `rotate(${lean * -8}deg)`,
        }}
      >
        {back.map((wire, i) => (
          <path
            key={`b${i}`}
            d={wire.d}
            stroke={wire.stroke}
            strokeWidth={wire.width}
            fill="none"
            strokeLinecap="round"
          />
        ))}
        {front.map((wire, i) => (
          <path
            key={`f${i}`}
            d={wire.d}
            stroke={wire.stroke}
            strokeWidth={wire.width}
            fill="none"
            strokeLinecap="round"
          />
        ))}
      </g>
    </svg>
  );
}

export function ToolArt({
  tool,
  className,
  flex,
}: {
  tool: SweepTool;
  className?: string;
  flex?: BrushFlex;
}) {
  if (tool === 'STIRRING_ROD') return <StirringRodArt className={className} />;
  if (tool === 'IRON_RAKE') return <IronRakeArt className={className} />;
  if (tool === 'BRISTLE_BRUSH') {
    return <PlainHandBrushArt className={className} flex={flex} />;
  }
  return <HandBrushArt className={className} flex={flex} />;
}

export function Femur({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '');
  const shade = `bone-shade-${uid}`;
  return (
    <svg viewBox="0 0 36 120" className={className} aria-hidden>
      <defs>
        <linearGradient id={shade} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#d6d3d1" />
          <stop offset="0.5" stopColor="#fafaf9" />
          <stop offset="1" stopColor="#a8a29e" />
        </linearGradient>
      </defs>
      <path
        d="M10 18c0-8 16-10 18-2 4 6 6 8 4 14-4 10-2 28 2 46 3 14-2 28-8 34-8 8-18 6-20-2-2-8 2-16 0-30-3-16 2-36 4-48 1-6-2-8 0-12z"
        fill={`url(#${shade})`}
        stroke="#78716c"
        strokeWidth="1"
      />
      <path d="M16 36c2 16 1 34 3 52" stroke="#a8a29e" strokeWidth="0.8" fill="none" />
      <path d="M14 70l6 4M18 48l-4 3" stroke="#57534e" strokeWidth="0.7" />
      <ellipse cx="14" cy="16" rx="6" ry="5" fill="#e7e5e4" />
      <ellipse cx="24" cy="108" rx="7" ry="5" fill="#d6d3d1" />
    </svg>
  );
}

export function Rib({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 70 36" className={className} aria-hidden>
      <path
        d="M4 28C16 6 40 2 66 14"
        fill="none"
        stroke="#e7e5e4"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M8 26C18 10 40 8 62 16"
        fill="none"
        stroke="#a8a29e"
        strokeWidth="1.2"
      />
    </svg>
  );
}

export function SkullCap({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 78 64" className={className} aria-hidden>
      <path
        d="M8 40c0-22 14-34 31-34s31 12 31 34c0 8-4 14-10 16H18c-6-2-10-8-10-16z"
        fill="#f5f5f4"
        stroke="#78716c"
      />
      <path d="M18 18c8-6 20-8 32-2" stroke="#a8a29e" fill="none" />
      <path d="M22 36c4 6 10 8 16 6" stroke="#57534e" fill="none" />
      <ellipse cx="28" cy="34" rx="6" ry="5" fill="#292524" opacity="0.85" />
      <ellipse cx="50" cy="34" rx="6" ry="5" fill="#292524" opacity="0.85" />
      <path d="M34 48h10" stroke="#44403c" strokeWidth="1.4" />
    </svg>
  );
}

export function BoneShard({ i }: { i: number }) {
  const w = 10 + (i % 4) * 3;
  const h = 7 + (i % 3) * 3;
  return (
    <svg viewBox="0 0 28 18" className="w-full h-full" aria-hidden>
      <path
        d={`M3 12 L${8 + (i % 3)} 3 L${w + 8} ${4 + (i % 2)} L${w + 12} 14 L6 16 Z`}
        fill={i % 2 ? '#e7e5e4' : '#d6d3d1'}
        stroke="#78716c"
        strokeWidth="0.6"
      />
      <path d="M8 8l6 2" stroke="#a8a29e" strokeWidth="0.5" />
      <rect width={w} height={h} fill="none" />
    </svg>
  );
}

export function AshMound({
  amount,
  className,
}: {
  amount: number;
  className?: string;
}) {
  const grains = Math.max(4, Math.round((amount / 100) * 28));
  return (
    <svg viewBox="0 0 220 70" className={className} aria-hidden>
      <ellipse
        cx="110"
        cy="48"
        rx={40 + amount * 0.55}
        ry={10 + amount * 0.12}
        fill="#57534e"
        opacity="0.9"
      />
      <ellipse
        cx="110"
        cy="44"
        rx={28 + amount * 0.4}
        ry={8 + amount * 0.08}
        fill="#a8a29e"
      />
      <ellipse cx="96" cy="40" rx="16" ry="5" fill="#d6d3d1" opacity="0.55" />
      {Array.from({ length: grains }).map((_, i) => (
        <circle
          key={i}
          cx={28 + ((i * 37) % 170)}
          cy={30 + ((i * 13) % 28)}
          r={0.7 + (i % 3) * 0.45}
          fill={i % 4 === 0 ? '#e7e5e4' : '#78716c'}
        />
      ))}
    </svg>
  );
}
