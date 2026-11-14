import React from 'react';

export type EmbalmFluid = 'WATER' | 'FORMALDEHYDE' | 'SOFTENER';

export const FLUID_TINT: Record<
  EmbalmFluid,
  { stream: string; streamEdge: string; splash: string; fill: string }
> = {
  FORMALDEHYDE: {
    stream: 'rgba(244, 114, 182, 0.92)',
    streamEdge: 'rgba(251, 207, 232, 0.55)',
    splash: 'rgba(244, 114, 182, 0.55)',
    fill: '#f472b6',
  },
  SOFTENER: {
    stream: 'rgba(167, 139, 250, 0.9)',
    streamEdge: 'rgba(221, 214, 254, 0.5)',
    splash: 'rgba(167, 139, 250, 0.5)',
    fill: '#a78bfa',
  },
  WATER: {
    stream: 'rgba(125, 211, 252, 0.85)',
    streamEdge: 'rgba(224, 242, 254, 0.55)',
    splash: 'rgba(125, 211, 252, 0.45)',
    fill: '#7dd3fc',
  },
};

type BottleProps = {
  kind: 'FORMALDEHYDE' | 'SOFTENER';
  tiltDegrees: number;
  isPouring: boolean;
  isGlugging: boolean;
  className?: string;
};

/** Classic rectangular arterial-style bottle — generic labels, no brand marks. */
export const ChemicalBottle: React.FC<BottleProps> = ({
  kind,
  tiltDegrees,
  isPouring,
  isGlugging,
  className = '',
}) => {
  const isForm = kind === 'FORMALDEHYDE';
  const bodyFill = isForm ? '#f9a8d4' : '#c4b5fd';
  const bodyDeep = isForm ? '#db2777' : '#7c3aed';
  const labelBg = isForm ? '#fdf2f8' : '#f5f3ff';
  const labelInk = isForm ? '#9d174d' : '#5b21b6';
  const title = isForm ? '20-INDEX' : 'HUMECTANT';
  const subtitle = isForm ? 'ARTERIAL FLUID' : 'TISSUE SOFTENER';
  const chemLine = isForm ? 'FORMALDEHYDE' : 'SOFTENER';

  const tilt = isPouring ? tiltDegrees : 0;
  const glugNudge = isPouring && isGlugging ? 'embalm-glug' : '';

  return (
    <div
      className={`pointer-events-none absolute left-[6%] md:left-[10%] bottom-[12%] origin-[70%_18%] transition-transform duration-150 ease-out ${className}`}
      style={{
        transform: `translateX(${isPouring ? tilt * 0.35 : 0}%) rotate(${tilt}deg)`,
        width: '4.75rem',
      }}
      aria-hidden
    >
      <div className={glugNudge}>
      <svg viewBox="0 0 76 168" className="w-full h-auto drop-shadow-lg">
        <defs>
          <linearGradient id={`bottle-body-${kind}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={bodyDeep} stopOpacity="0.55" />
            <stop offset="35%" stopColor={bodyFill} stopOpacity="0.95" />
            <stop offset="100%" stopColor={bodyDeep} stopOpacity="0.75" />
          </linearGradient>
          <linearGradient id={`bottle-plastic-${kind}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#e2e8f0" stopOpacity="0.35" />
            <stop offset="40%" stopColor="#f8fafc" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        {/* Cap */}
        <rect x="26" y="2" width="24" height="14" rx="2" fill="#475569" />
        <rect x="28" y="4" width="20" height="3" rx="1" fill="#64748b" />
        <rect x="30" y="16" width="16" height="8" rx="1.5" fill="#334155" />
        {/* Neck */}
        <path
          d="M30 24 h16 v14 c0 4 -2 6 -8 6 s-8 -2 -8 -6 z"
          fill="#cbd5e1"
          opacity="0.85"
        />
        {/* Shoulder + body */}
        <path
          d="M18 48
             C18 40, 26 38, 38 38
             C50 38, 58 40, 58 48
             L58 152
             C58 158, 52 162, 38 162
             C24 162, 18 158, 18 152 Z"
          fill={`url(#bottle-body-${kind})`}
          stroke="#1e293b"
          strokeWidth="1.2"
        />
        {/* Plastic sheen */}
        <path
          d="M22 50
             C22 44, 28 42, 38 42
             C48 42, 54 44, 54 50
             L54 148
             C54 152, 48 156, 38 156
             C28 156, 22 152, 22 148 Z"
          fill={`url(#bottle-plastic-${kind})`}
        />
        {/* Label */}
        <rect
          x="24"
          y="62"
          width="28"
          height="58"
          rx="2"
          fill={labelBg}
          stroke={labelInk}
          strokeWidth="0.8"
          opacity="0.96"
        />
        <text
          x="38"
          y="76"
          textAnchor="middle"
          fill={labelInk}
          fontSize="6.5"
          fontFamily="ui-monospace, monospace"
          fontWeight="700"
        >
          {title}
        </text>
        <line x1="28" y1="80" x2="48" y2="80" stroke={labelInk} strokeWidth="0.6" />
        <text
          x="38"
          y="92"
          textAnchor="middle"
          fill={labelInk}
          fontSize="4.8"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
          fontWeight="600"
        >
          {subtitle}
        </text>
        <text
          x="38"
          y="104"
          textAnchor="middle"
          fill={labelInk}
          fontSize="5.2"
          fontFamily="ui-monospace, monospace"
          fontWeight="700"
        >
          {chemLine}
        </text>
        <text
          x="38"
          y="114"
          textAnchor="middle"
          fill="#64748b"
          fontSize="4"
          fontFamily="ui-sans-serif, system-ui, sans-serif"
        >
          {isForm ? 'Prep Grade' : 'Moisture'}
        </text>
      </svg>
      {/* Mouth marker for stream origin (visual only) */}
      <div
        className="absolute w-2 h-2 rounded-full bg-transparent"
        style={{ top: '2%', left: '58%' }}
        data-embalm-mouth
      />
      </div>
    </div>
  );
};

type HoseProps = {
  extended: boolean;
  isPouring: boolean;
};

/** Garden/lab hose that slides in from off-screen when adding water. */
export const WaterHose: React.FC<HoseProps> = ({ extended, isPouring }) => {
  return (
    <div
      className={`pointer-events-none absolute top-[8%] right-0 z-20 transition-transform duration-500 ease-out ${
        extended ? 'translate-x-0' : 'translate-x-[108%]'
      }`}
      aria-hidden
      style={{ width: '58%', maxWidth: '22rem' }}
    >
      <svg viewBox="0 0 320 120" className="w-full h-auto drop-shadow-md">
        <defs>
          <linearGradient id="hose-skin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#64748b" />
            <stop offset="45%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>
        {/* Coil coming from off-screen right */}
        <path
          d="M320 28
             C280 20, 250 18, 220 28
             C190 38, 170 52, 150 58
             C120 68, 95 62, 78 52
             C60 42, 48 36, 36 42"
          fill="none"
          stroke="url(#hose-skin)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M320 28
             C280 20, 250 18, 220 28
             C190 38, 170 52, 150 58
             C120 68, 95 62, 78 52
             C60 42, 48 36, 36 42"
          fill="none"
          stroke="#1e293b"
          strokeWidth="2"
          strokeOpacity="0.35"
          strokeLinecap="round"
        />
        {/* Nozzle */}
        <g transform="translate(18, 34)">
          <rect x="0" y="0" width="28" height="16" rx="3" fill="#334155" />
          <rect x="22" y="2" width="14" height="12" rx="2" fill="#0ea5e9" />
          <rect x="32" y="4" width="8" height="8" rx="1" fill="#38bdf8" />
          {isPouring && (
            <circle cx="40" cy="8" r="3" fill="#7dd3fc" opacity="0.7" className="embalm-stream-pulse" />
          )}
        </g>
      </svg>
    </div>
  );
};

type StreamProps = {
  fluid: EmbalmFluid;
  active: boolean;
  isGlugging: boolean;
  from: 'bottle' | 'hose';
  fillPercent: number;
};

/** Liquid ribbon from bottle mouth or hose tip into the tank, plus splash. */
export const PourStream: React.FC<StreamProps> = ({
  fluid,
  active,
  isGlugging,
  from,
  fillPercent,
}) => {
  if (!active) return null;
  const tint = FLUID_TINT[fluid];
  const splashTop = Math.max(8, 100 - fillPercent);

  return (
    <div className="pointer-events-none absolute inset-0 z-[15]" aria-hidden>
      {/* Stream path */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`stream-grad-${fluid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={tint.streamEdge} />
            <stop offset="40%" stopColor={tint.stream} />
            <stop offset="100%" stopColor={tint.stream} stopOpacity="0.35" />
          </linearGradient>
        </defs>
        {from === 'bottle' ? (
          <path
            d={`M 22 28
                C 34 ${32 + (isGlugging ? 2 : 0)}, 52 ${40 + (isGlugging ? 3 : 0)}, 72 ${splashTop * 0.72}
                C 78 ${splashTop * 0.78}, 80 ${splashTop * 0.85}, 82 ${Math.min(88, splashTop * 0.92)}`}
            fill="none"
            stroke={`url(#stream-grad-${fluid})`}
            strokeWidth={isGlugging ? 2.4 : 1.7}
            strokeLinecap="round"
            className={isGlugging ? 'embalm-stream-wobble' : ''}
            opacity="0.95"
          />
        ) : (
          <path
            d={`M 72 28
                C 74 36, 78 ${48 + (isGlugging ? 2 : 0)}, 82 ${Math.min(86, splashTop * 0.9)}`}
            fill="none"
            stroke={`url(#stream-grad-${fluid})`}
            strokeWidth={isGlugging ? 2.6 : 2}
            strokeLinecap="round"
            className={isGlugging ? 'embalm-stream-wobble' : ''}
            opacity="0.95"
          />
        )}
      </svg>

      {/* Splash / ripples at tank surface */}
      <div
        className="absolute right-[11%] md:right-[13%] w-16 md:w-20"
        style={{ top: `${42 + (100 - fillPercent) * 0.28}%` }}
      >
        <div
          className="embalm-splash-ring absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{
            width: '2.5rem',
            height: '0.85rem',
            borderColor: tint.splash,
            boxShadow: `0 0 10px ${tint.splash}`,
          }}
        />
        <div
          className="embalm-splash-ring-delay absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border"
          style={{
            width: '1.4rem',
            height: '0.5rem',
            borderColor: tint.streamEdge,
          }}
        />
        <div
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
          style={{ background: tint.stream, opacity: 0.8 }}
        />
      </div>
    </div>
  );
};
