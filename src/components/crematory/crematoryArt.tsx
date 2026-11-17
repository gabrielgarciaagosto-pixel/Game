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

/**
 * Plain hearth brush. Wooden handle, natural hair, tips a little singed.
 * This replaced the iron brush. The bristle group flexes against the stroke.
 */
export function PlainHandBrushArt({
  className,
  flex,
}: {
  className?: string;
  flex?: BrushFlex;
}) {
  const uid = useId().replace(/:/g, '');
  const wood = `plain-wood-${uid}`;
  const lean = Math.max(-1, Math.min(1, flex?.lean ?? 0));
  const push = Math.max(0, Math.min(1, flex?.push ?? 0));
  return (
    <svg
      viewBox="0 0 96 248"
      className={className}
      aria-hidden
      data-tool-art="hand-brush"
      data-brush-lean={lean.toFixed(2)}
      data-brush-push={push.toFixed(2)}
    >
      <defs>
        <linearGradient id={wood} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#4a2c1a" />
          <stop offset="0.45" stopColor="#c4a574" />
          <stop offset="1" stopColor="#3f2414" />
        </linearGradient>
      </defs>
      <rect x="34" y="8" width="28" height="126" rx="12" fill={`url(#${wood})`} />
      <path d="M40 22v96" stroke="#fff" strokeWidth="1.4" opacity="0.22" />
      <path
        d="M56 28c5 20 5 44 0 68"
        stroke="#4a2c1a"
        strokeWidth="1.1"
        fill="none"
        opacity="0.4"
      />
      <ellipse cx="48" cy="14" rx="15" ry="8" fill="#c4a574" />
      <ellipse cx="48" cy="14" rx="8" ry="3.2" fill="#4a2c1a" opacity="0.35" />
      <rect x="26" y="128" width="44" height="18" rx="4" fill="#6b4428" />
      <path d="M30 134c12 3 24 3 36 0" stroke="#4a2c1a" strokeWidth="1" fill="none" opacity="0.45" />
      <g
        className="brush-bristles"
        style={{
          transformOrigin: '48px 146px',
          transform: `rotate(${lean * 22}deg) scaleY(${1 - push * 0.28})`,
        }}
      >
        {Array.from({ length: 9 }).map((_, i) => {
          const x = 16 + i * 8;
          const tip = 208 + (i % 3) * 10;
          const bow = (i - 4) * 1.8;
          const mid = 148 + (tip - 148) * 0.72;
          return (
            <g key={i}>
              <path
                d={`M${x} 146 q${bow} ${(mid - 146) / 2} ${bow * 0.35} ${mid - 146}`}
                stroke="#e6d2b0"
                strokeWidth="4.6"
                fill="none"
                strokeLinecap="round"
              />
              <path
                d={`M${x + bow * 0.35} ${mid} q${bow * 0.2} ${(tip - mid) / 2} 0 ${tip - mid}`}
                stroke="#1c1410"
                strokeWidth="4.2"
                fill="none"
                strokeLinecap="round"
              />
            </g>
          );
        })}
        {push > 0.15
          ? [0, 1, 2].map((i) => (
              <circle
                key={`ash-${i}`}
                cx={28 + i * 16}
                cy={198 + (i % 2) * 10}
                r="2.4"
                fill="#d6d3d1"
                opacity={0.35 + push * 0.5}
              />
            ))
          : null}
      </g>
    </svg>
  );
}

export function HandBrushArt({
  className,
  flex,
}: {
  className?: string;
  flex?: BrushFlex;
}) {
  const uid = useId().replace(/:/g, '');
  const wood = `hand-wood-${uid}`;
  const lean = Math.max(-1, Math.min(1, flex?.lean ?? 0));
  const push = Math.max(0, Math.min(1, flex?.push ?? 0));
  return (
    <svg viewBox="0 0 120 156" className={className} aria-hidden data-tool-art="ash-brush">
      <defs>
        <linearGradient id={wood} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#f5deb3" />
          <stop offset="0.5" stopColor="#d6b48a" />
          <stop offset="1" stopColor="#8a5a32" />
        </linearGradient>
      </defs>
      <rect x="28" y="8" width="64" height="78" rx="8" fill={`url(#${wood})`} stroke="#6b3a1f" />
      <circle cx="60" cy="24" r="6" fill="none" stroke="#6b3a1f" strokeWidth="2" />
      <path d="M36 40c16 6 32 6 48 0" stroke="#a1623b" strokeWidth="1.2" fill="none" opacity="0.7" />
      <path d="M36 54c18 8 34 8 50-1" stroke="#a1623b" strokeWidth="1" fill="none" opacity="0.55" />
      <rect x="24" y="84" width="72" height="12" rx="2" fill="#9a7b4f" />
      <g
        className="brush-bristles"
        style={{
          transformOrigin: '60px 94px',
          transform: `rotate(${lean * 14}deg) scaleY(${1 - push * 0.18})`,
        }}
      >
        {Array.from({ length: 22 }).map((_, i) => {
          const x = 28 + i * 3;
          const len = 26 + (i % 3) * 4;
          return (
            <path
              key={i}
              d={`M${x} 94 q${i % 2 ? 1.2 : -1} ${len / 2} ${i % 2 ? 0.6 : -0.4} ${len}`}
              stroke={i % 5 === 0 ? '#f5f5f4' : '#d6d3d1'}
              strokeWidth="2.2"
              fill="none"
              strokeLinecap="round"
              opacity="0.95"
            />
          );
        })}
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
