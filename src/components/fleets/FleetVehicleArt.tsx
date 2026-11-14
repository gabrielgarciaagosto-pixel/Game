import React from 'react';

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

/** Side elevation of a half-couch casket in the coach bay. */
function Casket({ x, y, w }: { x: number; y: number; w: number }) {
  const h = 16;
  const split = x + w * 0.46;
  return (
    <g>
      <path d={`M${x} ${y + h} h${w} l-1 3 H${x + 1} Z`} fill="#2a160c" />
      <path d={`M${x + 2} ${y + 7} H${x + w - 2} V${y + h} H${x + 2} Z`} fill="#7a4320" />
      <path d={`M${x + 4} ${y + 7} H${split} L${split + 4} ${y - 1} H${x + 10} Z`} fill="#f4e4ea" />
      <path d={`M${split} ${y + 7} H${x + w - 3} V${y + 2} H${split + 6} Z`} fill="#a86432" />
      <path d={`M${x + 8} ${y + 2} H${split - 2}`} stroke="#fff" strokeOpacity="0.55" />
      {[0.22, 0.55, 0.8].map((t) => (
        <g key={t}>
          <rect x={x + w * t} y={y + 9} width="8" height="2.2" rx="1" fill="#e6c878" />
          <path d={`M${x + w * t + 1} ${y + 8} v2 M${x + w * t + 7} ${y + 8} v2`} stroke="#8a6a28" strokeWidth="0.7" />
        </g>
      ))}
    </g>
  );
}

function Spray({ x, y, hue }: { x: number; y: number; hue: string }) {
  return (
    <g>
      <path
        d={`M${x} ${y + 18} C${x - 6} ${y + 8}, ${x + 4} ${y + 6}, ${x} ${y}`}
        fill="none"
        stroke="#2f6b3a"
        strokeWidth="1.6"
      />
      <circle cx={x - 5} cy={y + 2} r="4.2" fill={hue} />
      <circle cx={x + 4} cy={y - 1} r="3.6" fill={hue} opacity="0.85" />
      <circle cx={x} cy={y + 6} r="3.2" fill="#f4efe4" />
    </g>
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
      return (
        <g>
          <path
            d="M28 122 H70 L98 98 H140 L168 64 H250 Q270 60 286 72 L310 64 H360 Q392 64 398 90 V116 H408 V136 H22 V128 Q22 122 28 122 Z"
            fill={`url(#${paint})`}
          />
          <path
            d="M250 78 C270 96, 300 70, 332 108"
            fill="none"
            stroke="#e4c98a"
            strokeWidth="2.3"
          />
          <path
            d="M286 74 C304 96, 332 78, 352 112"
            fill="none"
            stroke="#e4c98a"
            strokeWidth="2.3"
          />
          <Glass d="M178 70 H230 V104 H154 L170 70 Z" fillId={glass} />
          <ellipse cx="340" cy="92" rx="14" ry="10" fill="#1a120c" stroke="#e4c98a" />
          <path d="M330 90 H350 M332 94 H348" stroke="#d8c4a0" strokeWidth="0.7" />
          <Lamp x={64} y={102} glowId={lamp} />
          <Lamp x={386} y={96} glowId={lamp} s={0.9} />
          <rect x="150" y="108" width="36" height="4" fill="#d4b56a" />
          <Wheel cx={112} cy={134} r={23} whitewall />
          <Wheel cx={318} cy={134} r={23} whitewall />
        </g>
      );
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
      return (
        <g>
          <path
            d="M40 120 H86 L112 98 H150 L176 72 H230 V108 H300 V92 H372 V120 H390 V136 H32 V128 Q32 120 40 120 Z"
            fill={`url(#${paint})`}
          />
          <path d="M230 92 H372 V108 H230 Z" fill="#6b4224" />
          <path d="M230 92 H372" stroke="#e6c98a" strokeWidth="2" />
          <path d="M230 108 H372" stroke="#e6c98a" strokeWidth="2" />
          <Glass d="M168 78 H220 V108 H150 L166 78 Z" fillId={glass} />
          <Spray x={258} y={62} hue="#f2f2f2" />
          <Spray x={300} y={54} hue="#d4536a" />
          <Spray x={342} y={64} hue="#f4e2a8" />
          <rect x="78" y="108" width="16" height="8" fill="#d9dee4" />
          <Wheel cx={108} cy={134} r={21} whitewall />
          <Wheel cx={330} cy={134} r={21} whitewall />
        </g>
      );
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
      return (
        <g>
          <path
            d="M40 124 H86 L108 100 H140 L156 62 H330 Q352 62 360 82 V112 H386 V136 H32 V128 Q32 124 40 124 Z"
            fill={`url(#${paint})`}
          />
          <Glass d="M168 68 H214 V108 H168 Z" fillId={glass} />
          <Glass d="M222 68 H268 V108 H222 Z" fillId={glass} />
          <Glass d="M276 68 H322 V108 H276 Z" fillId={glass} />
          <Casket x={184} y={86} w={120} />
          <rect x="70" y="108" width="20" height="8" fill="#ddd" />
          <circle cx="348" cy="100" r="4" fill="#f4e7b0" />
          <Wheel cx={118} cy={134} r={21} hub="#cfd4da" />
          <Wheel cx={310} cy={134} r={21} hub="#cfd4da" />
        </g>
      );
    case 'coa_iron_landau':
      return (
        <g>
          <path
            d="M78 124 Q108 124 118 108 L140 108 Q150 86 176 78 H250 Q286 78 300 100 L318 108 Q340 108 356 124"
            fill="none"
            stroke="#0c1410"
            strokeWidth="10"
          />
          <path
            d="M150 108 H300 V124 H150 Z"
            fill={`url(#${paint})`}
          />
          <path
            d="M168 80 H268 Q286 80 292 98 V112 H160 L168 80 Z"
            fill={`url(#${paint})`}
            stroke="#d4b56a"
            strokeWidth="0.8"
          />
          <path
            d="M188 84 C210 108, 236 82, 262 112"
            fill="none"
            stroke="#e6c98a"
            strokeWidth="2.4"
          />
          <path
            d="M206 84 C224 104, 246 86, 258 110"
            fill="none"
            stroke="#e6c98a"
            strokeWidth="2"
          />
          <Glass d="M176 86 H214 V108 H168 L174 86 Z" fillId={glass} />
          <ellipse cx="118" cy="116" rx="28" ry="12" fill="none" stroke="#0c1410" strokeWidth="6" />
          <ellipse cx="336" cy="116" rx="30" ry="13" fill="none" stroke="#0c1410" strokeWidth="6" />
          <Lamp x={132} y={92} glowId={lamp} />
          <Lamp x={300} y={90} glowId={lamp} s={0.9} />
          <rect x="188" y="70" width="8" height="10" fill="#8a6a32" />
          <circle cx="192" cy="68" r="4" fill={`url(#${lamp})`} />
          <Wheel cx={118} cy={128} r={26} spokes whitewall />
          <Wheel cx={336} cy={128} r={26} spokes whitewall />
        </g>
      );
    case 'coa_glass_formal':
      return (
        <g>
          <path
            d="M24 118 H64 L92 96 H128 L154 70 H188 V112 H392 Q404 112 406 122 V132 H16 V124 Q16 118 24 118 Z"
            fill={`url(#${paint})`}
          />
          <path d="M154 70 H392 V112 H154 Z" fill="#07080a" />
          <Glass d="M162 74 H392 V108 H162 Z" fillId={glass} />
          <path d="M162 74 H392" stroke="#f2f6f8" strokeWidth="1.4" />
          <path d="M162 108 H392" stroke="#f2f6f8" strokeWidth="1.4" />
          {[200, 250, 300, 350].map((x) => (
            <path key={x} d={`M${x} 74 V108`} stroke="#e8eef2" strokeWidth="1.1" />
          ))}
          <Casket x={210} y={86} w={150} />
          <path d="M40 112 H70" stroke="#e8eef2" strokeWidth="2" />
          <rect x="48" y="100" width="22" height="12" rx="1" fill="#e7edf2" />
          <Lamp x={36} y={98} glowId={lamp} s={0.8} />
          <Wheel cx={108} cy={132} r={22} whitewall hub="#e8eef2" />
          <Wheel cx={348} cy={132} r={22} whitewall hub="#e8eef2" />
        </g>
      );
    case 'coa_state_landaulette':
      return (
        <g>
          <path
            d="M16 124 H48 L62 100 H92 L108 86 H132 L148 64 H210 Q230 58 248 70 L270 60 H360 Q400 60 408 92 V116 H418 V138 H8 V130 Q8 124 16 124 Z"
            fill={`url(#${paint})`}
          />
          <path d="M148 64 H248 V78 H140 Z" fill="#163028" opacity="0.9" />
          <path
            d="M200 70 C230 108, 280 66, 330 116"
            fill="none"
            stroke="#e6c98a"
            strokeWidth="2.5"
          />
          <path
            d="M230 68 C258 104, 300 72, 348 116"
            fill="none"
            stroke="#e6c98a"
            strokeWidth="2.2"
          />
          <path
            d="M258 70 C286 100, 324 78, 362 114"
            fill="none"
            stroke="#e6c98a"
            strokeWidth="2"
          />
          <Glass d="M156 72 H196 V108 H140 L152 72 Z" fillId={glass} />
          <path d="M210 86 H340" stroke="#6b3e22" strokeWidth="8" />
          <Casket x={214} y={78} w={120} />
          <path d="M118 86 V78 H128 V70 H136 V86" fill="none" stroke="#d4b56a" strokeWidth="1.4" />
          <circle cx="132" cy="68" r="3.5" fill={`url(#${lamp})`} />
          <Lamp x={52} y={96} glowId={lamp} />
          <Lamp x={168} y={96} glowId={lamp} s={0.8} />
          <Lamp x={388} y={92} glowId={lamp} />
          <rect x="70" y="96" width="14" height="22" rx="1" fill="#8a7040" />
          <path d="M73 100 H81 M73 104 H81 M73 108 H81" stroke="#1a140c" strokeWidth="0.6" />
          <path d="M20 128 H410" stroke="#d4b56a" strokeWidth="1.2" opacity="0.8" />
          <Wheel cx={96} cy={132} r={27} spokes whitewall />
          <Wheel cx={340} cy={132} r={27} spokes whitewall />
        </g>
      );
    default:
      return null;
  }
}

const PAINT: Record<string, [string, string]> = {
  rec_parish_panel: ['#f4f1ea', '#c8c4b8'],
  rec_night_call: ['#24344a', '#101820'],
  rec_laurel: ['#2a241c', '#0c0c0e'],
  rec_silent_arrival: ['#1a1c1e', '#050506'],
  esc_civic_lead: ['#2a2e33', '#101114'],
  esc_garden_deck: ['#1c1c1e', '#070708'],
  esc_procession_twin: ['#161616', '#050505'],
  esc_family_landau: ['#1a1a1c', '#050505'],
  coa_parish_box: ['#2c2c2e', '#0e0e10'],
  coa_iron_landau: ['#1a332c', '#071410'],
  coa_glass_formal: ['#121416', '#050607'],
  coa_state_landaulette: ['#143028', '#061410'],
};

export const FleetVehicleArt: React.FC<{
  vehicleId: string;
  title?: string;
}> = ({ vehicleId, title }) => {
  // Instance suffix: the All tab draws the house coach twice, and duplicate
  // gradient ids make url(#…) resolve to the first <defs> (broken on WebView).
  const instance = React.useId().replace(/[^a-zA-Z0-9]/g, '');
  const g = `${gidOf(vehicleId)}${instance}`;
  const [hi, lo] = PAINT[vehicleId] ?? ['#222', '#111'];
  return (
    <svg
      viewBox="0 0 420 170"
      className="w-full h-full"
      role="img"
      aria-label={title ?? vehicleId}
    >
      <defs>
        <linearGradient id={`${g}-paint`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={hi} />
          <stop offset="55%" stopColor={lo} />
          <stop offset="100%" stopColor="#050505" />
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
      <rect width="420" height="170" fill="transparent" />
      <ellipse cx="210" cy="158" rx="170" ry="6" fill="rgba(0,0,0,0.28)" />
      <Body vehicleId={vehicleId} g={g} />
    </svg>
  );
};
