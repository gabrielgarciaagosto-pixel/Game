import React from 'react';
import {
  CrestLandau,
  DraperEight,
  FortyOneBed,
  IvoryDeck,
  PewterParish,
  SilentArrival,
  SilverLandau,
} from './profiles';

/**
 * Side-profile art for every Lampblack model.
 * Silhouettes, lamps, landau irons, and era details are per vehicle — not recolors.
 */

function gidOf(id: string): string {
  return id.replace(/[^a-z0-9]/g, '');
}

function Wheel({
  cx,
  cy,
  r,
  spokes = false,
  whitewall = false,
  hub = '#c6a15a',
}: {
  cx: number;
  cy: number;
  r: number;
  spokes?: boolean;
  whitewall?: boolean;
  hub?: string;
}) {
  const ticks = spokes ? 12 : 0;
  return (
    <g>
      <ellipse
        cx={cx}
        cy={cy + r * 0.72}
        rx={r * 0.95}
        ry={3.2}
        fill="rgba(0,0,0,0.35)"
      />
      <circle cx={cx} cy={cy} r={r} fill="#141414" />
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.78}
        fill={whitewall ? '#f3efe4' : '#222'}
      />
      <circle cx={cx} cy={cy} r={r * (whitewall ? 0.58 : 0.62)} fill="#101010" />
      {Array.from({ length: ticks }).map((_, i) => {
        const a = (Math.PI * 2 * i) / ticks;
        const inner = r * 0.22;
        const outer = r * (whitewall ? 0.52 : 0.58);
        return (
          <line
            key={i}
            x1={cx + Math.cos(a) * inner}
            y1={cy + Math.sin(a) * inner}
            x2={cx + Math.cos(a) * outer}
            y2={cy + Math.sin(a) * outer}
            stroke="#d9d3c4"
            strokeWidth={1.1}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={r * 0.16} fill={hub} />
      <circle cx={cx} cy={cy} r={r * 0.06} fill="#3a2c14" />
    </g>
  );
}

function Lamp({
  x,
  y,
  s = 1,
  glowId,
}: {
  x: number;
  y: number;
  s?: number;
  glowId: string;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <ellipse cx="0" cy="2" rx="7" ry="3" fill="rgba(255,220,140,0.25)" />
      <rect x="-3.2" y="-2" width="6.4" height="10" rx="1" fill="#8a6a32" />
      <rect x="-2.2" y="-1" width="4.4" height="7" rx="0.6" fill="#e8c56a" />
      <circle cx="0" cy="-4" r="5.2" fill={`url(#${glowId})`} />
      <circle cx="-1.2" cy="-5.2" r="1.4" fill="#fff8e0" opacity="0.85" />
      <path d="M-4 6 H4 L3 9 H-3 Z" fill="#6d5324" />
    </g>
  );
}

function Glass({
  d,
  fillId,
}: {
  d: string;
  fillId: string;
}) {
  return (
    <path
      d={d}
      fill={`url(#${fillId})`}
      stroke="#d5e6ee"
      strokeOpacity="0.35"
      strokeWidth="0.6"
    />
  );
}

function Body({
  vehicleId,
  g,
}: {
  vehicleId: string;
  g: string;
}) {
  const glass = `${g}-glass`;
  const paint = `${g}-paint`;
  const lamp = `${g}-lamp`;

  switch (vehicleId) {
    case 'rec_parish_panel':
      return (
        <g>
          <path
            d="M62 112 H92 L118 86 H156 L176 58 H332 Q348 58 352 74 V112 H368 V128 H52 V120 Q52 112 62 112 Z"
            fill={`url(#${paint})`}
            stroke="#b7b3a8"
            strokeWidth="1"
          />
          <path d="M176 58 H328 V74 H168 Z" fill="#d9d6cc" />
          <Glass d="M186 64 H248 V98 H168 L182 64 Z" fillId={glass} />
          <Glass d="M258 64 H318 V98 H258 Z" fillId={glass} />
          <rect x="252" y="78" width="3" height="34" fill="#8d8980" />
          <rect x="70" y="118" width="28" height="8" rx="1" fill="#2a2a2a" />
          <rect x="332" y="118" width="30" height="8" rx="1" fill="#2a2a2a" />
          <rect x="300" y="86" width="18" height="6" fill="#c45a3a" />
          <circle cx="78" cy="104" r="4" fill="#f4e7b8" />
          <circle cx="78" cy="104" r="2" fill="#fff" />
          <rect x="148" y="100" width="10" height="3" rx="0.5" fill="#8d8980" />
          <path d="M168 78 H176 V98" stroke="#9a968c" strokeWidth="1.2" />
          <Wheel cx={128} cy={128} r={20} hub="#9aa0a6" />
          <Wheel cx={300} cy={128} r={20} hub="#9aa0a6" />
        </g>
      );
    case 'rec_night_call':
      return (
        <g>
          <path
            d="M48 118 H86 L112 92 H150 L176 70 H340 Q358 70 364 88 V118 H378 V132 H40 V124 Q40 118 48 118 Z"
            fill={`url(#${paint})`}
            stroke="#8aa4c4"
            strokeWidth="0.8"
          />
          <path d="M150 92 H360" stroke="#d5dde8" strokeWidth="1.4" opacity="0.7" />
          <Glass d="M186 76 H250 V108 H164 L178 76 Z" fillId={glass} />
          <Glass d="M262 76 H340 V108 H262 Z" fillId={glass} />
          <circle cx="96" cy="108" r="5" fill="#111" stroke="#c9a15a" strokeWidth="1" />
          <path d="M96 104 V112 M92 108 H100" stroke="#c9a15a" strokeWidth="0.8" />
          <circle cx="70" cy="112" r="2.2" fill="#e8b15a" />
          <circle cx="352" cy="100" r="2" fill="#e07040" />
          <Wheel cx={120} cy={130} r={21} whitewall hub="#d7dde6" />
          <Wheel cx={312} cy={130} r={21} whitewall hub="#d7dde6" />
        </g>
      );
    case 'rec_laurel':
      return (
        <g>
          <path
            d="M36 120 H78 L104 96 H148 L172 68 H300 Q318 68 330 78 L352 68 H368 Q384 68 388 86 V112 H400 V134 H28 V126 Q28 120 36 120 Z"
            fill={`url(#${paint})`}
          />
          <path d="M40 124 H396" stroke="#d4b56a" strokeWidth="1.6" />
          <path d="M176 112 Q210 96 250 112" fill="#1a120c" opacity="0.85" />
          <Glass d="M182 74 H236 V104 H158 L174 74 Z" fillId={glass} />
          <Glass d="M248 74 H292 V104 H248 Z" fillId={glass} />
          <path
            d="M300 80 Q332 74 348 96"
            fill="none"
            stroke="#e6c97a"
            strokeWidth="2"
          />
          <rect x="336" y="86" width="22" height="16" rx="2" fill="#140e0a" />
          <path d="M338 90 H356 M338 94 H354 M338 98 H350" stroke="#c4a574" strokeWidth="0.7" />
          <Lamp x={70} y={100} glowId={lamp} s={0.85} />
          <Wheel cx={118} cy={132} r={22} whitewall />
          <Wheel cx={330} cy={132} r={22} whitewall />
        </g>
      );
    case 'rec_silent_arrival':
      return <SilentArrival paint={paint} glass={glass} />;
    case 'esc_civic_lead':
      return (
        <g>
          <path
            d="M70 118 H108 L132 96 H168 L196 74 H268 L292 96 H330 Q348 96 352 112 V122 H368 V134 H58 V126 Q58 118 70 118 Z"
            fill={`url(#${paint})`}
          />
          <Glass d="M176 80 H230 V108 H156 L172 80 Z" fillId={glass} />
          <Glass d="M238 80 H276 V108 H238 Z" fillId={glass} />
          <rect x="78" y="104" width="28" height="12" rx="1" fill="#d5dbe3" />
          <path d="M82 108 H102 M84 111 H100 M86 114 H98" stroke="#1a1a1a" strokeWidth="0.8" />
          <circle cx="72" cy="110" r="5" fill="#f4e7b8" stroke="#cfd6de" />
          <circle cx="338" cy="110" r="4.5" fill="#f0e2a8" />
          <rect x="318" y="100" width="16" height="6" rx="1" fill="#3a3e44" />
          <path d="M108 118 H330" stroke="#9aa3ad" strokeWidth="1.2" />
          <Wheel cx={124} cy={132} r={20} hub="#bfc6ce" />
          <Wheel cx={300} cy={132} r={20} hub="#bfc6ce" />
        </g>
      );
    case 'esc_garden_deck':
      return <IvoryDeck paint={paint} glass={glass} />;
    case 'flw_forty_one':
      return <FortyOneBed paint={paint} glass={glass} />;
    case 'esc_procession_twin':
      return (
        <g>
          <path
            d="M118 118 H168 L190 100 H250"
            fill="none"
            stroke="#9aa3ad"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <path
            d="M150 108 H250"
            stroke="#c5ccd4"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M168 96 Q200 70 236 88 L250 78"
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="10"
            strokeLinecap="round"
          />
          <path
            d="M176 90 Q206 74 230 86"
            fill={`url(#${paint})`}
            stroke="#e6c98a"
            strokeWidth="1.2"
          />
          <ellipse cx="206" cy="84" rx="22" ry="10" fill={`url(#${paint})`} stroke="#d4b56a" />
          <path d="M236 78 L268 48" stroke="#d7dee6" strokeWidth="3" />
          <path d="M248 58 L278 70 L270 86 Z" fill={`url(#${glass})`} stroke="#e8f4ff" strokeOpacity="0.4" />
          <rect x="248" y="100" width="28" height="16" rx="3" fill="#111" stroke="#c6a15a" />
          <path d="M300 70 V108" stroke="#111" strokeWidth="3" />
          <path d="M292 70 H324 L318 78 H298 Z" fill="#111" />
          <path d="M318 74 L336 66 L332 86 Z" fill="#7a1020" />
          <circle cx="210" cy="78" r="2" fill="#e8c56a" />
          <Wheel cx={132} cy={124} r={28} spokes whitewall hub="#e6c98a" />
          <Wheel cx={292} cy={124} r={26} spokes whitewall hub="#e6c98a" />
        </g>
      );
    case 'esc_family_landau':
      return (
        <g>
          <path
            d="M18 116 H58 L82 96 H118 L142 72 H360 L382 90 H398 Q412 96 412 112 V122 H420 V136 H12 V124 Q12 116 18 116 Z"
            fill={`url(#${paint})`}
          />
          <path d="M250 72 H360 V112 H250 Z" fill="#14110e" />
          <path
            d="M268 78 C290 100, 320 74, 348 110"
            fill="none"
            stroke="#e4c98a"
            strokeWidth="2.2"
          />
          <Glass d="M150 78 H196 V108 H132 L146 78 Z" fillId={glass} />
          <Glass d="M204 78 H246 V108 H204 Z" fillId={glass} />
          <Glass d="M262 80 H300 V106 H262 Z" fillId={glass} />
          <Glass d="M308 80 H346 V106 H308 Z" fillId={glass} />
          <circle cx="168" cy="70" r="2.4" fill="#f2d48a" />
          <circle cx="188" cy="70" r="2.4" fill="#f2d48a" />
          <rect x="46" y="104" width="26" height="10" rx="1" fill="#e4e8ee" />
          <path d="M50 108 H68" stroke="#222" strokeWidth="1" />
          <Lamp x={40} y={100} glowId={lamp} s={0.75} />
          <Wheel cx={100} cy={132} r={22} whitewall />
          <Wheel cx={360} cy={132} r={22} whitewall />
        </g>
      );
    case 'coa_parish_box':
      return <PewterParish paint={paint} glass={glass} />;
    case 'coa_iron_landau':
      return <DraperEight paint={paint} glass={glass} />;
    case 'coa_glass_formal':
      return <SilverLandau paint={paint} glass={glass} />;
    case 'coa_state_landaulette':
      return <CrestLandau paint={paint} glass={glass} />;
    default:
      return null;
  }
}

const PAINT: Record<string, [string, string, string?]> = {
  rec_parish_panel: ['#f4f1ea', '#c8c4b8'],
  rec_night_call: ['#24344a', '#101820'],
  rec_laurel: ['#2a241c', '#0c0c0e'],
  rec_silent_arrival: ['#3a414a', '#2c323a', '#242a32'],
  esc_civic_lead: ['#2a2e33', '#101114'],
  esc_garden_deck: ['#f7f1e4', '#e4d2ae', '#c4b08a'],
  flw_forty_one: ['#f6f3ec', '#e4ddd0', '#b7b0a2'],
  esc_procession_twin: ['#161616', '#050505'],
  esc_family_landau: ['#1a1a1c', '#050505'],
  coa_parish_box: ['#d4c8b6', '#a89884', '#6e655c'],
  coa_iron_landau: ['#2a2e32', '#121416', '#07080a'],
  coa_glass_formal: ['#f4f6f8', '#c8ced4', '#8e969e'],
  coa_state_landaulette: ['#2c3036', '#14161a', '#07080a'],
};

export const FleetVehicleArt: React.FC<{
  vehicleId: string;
  title?: string;
}> = ({ vehicleId, title }) => {
  // Instance suffix: the All tab draws the house coach twice, and duplicate
  // gradient ids make url(#…) resolve to the first <defs> (broken on WebView).
  const instance = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const g = `${gidOf(vehicleId)}${instance}`;
  const spec = PAINT[vehicleId] ?? ['#222', '#111'];
  const hi = spec[0];
  const mid = spec[1];
  const shade = spec[2] ?? '#050505';
  const tall = vehicleId === 'rec_silent_arrival';
  const vbH = tall ? 198 : 170;
  return (
    <svg
      viewBox={`0 0 420 ${vbH}`}
      className="w-full h-full"
      role="img"
      aria-label={title ?? vehicleId}
    >
      <defs>
        <linearGradient id={`${g}-paint`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={hi} />
          <stop offset="48%" stopColor={mid} />
          <stop offset="100%" stopColor={shade} />
        </linearGradient>
        <linearGradient id={`${g}-glass`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#e7f6ff" stopOpacity="0.72" />
          <stop offset="40%" stopColor="#1c4a5c" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#071018" />
        </linearGradient>
        <radialGradient id={`${g}-lamp`} cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#fff8dc" />
          <stop offset="45%" stopColor="#e8c56a" />
          <stop offset="100%" stopColor="#6a4a12" />
        </radialGradient>
      </defs>
      <rect width="420" height={vbH} fill="transparent" />
      <ellipse cx="210" cy={tall ? 188 : 158} rx="170" ry="6" fill="rgba(0,0,0,0.28)" />
      <Body vehicleId={vehicleId} g={g} />
    </svg>
  );
};
