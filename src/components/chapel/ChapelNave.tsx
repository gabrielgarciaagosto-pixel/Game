import React from 'react';

/**
 * Painted chapel nave. Colors come from the selected décor so family prefs
 * still change the room. Pointers pass through to the bier and flowers.
 */
export const ChapelNave: React.FC<{
  floor: string;
  drape: string;
  light: string;
  pew: string;
}> = ({ floor, drape, light, pew }) => {
  return (
    <svg
      viewBox="0 0 360 280"
      className="absolute inset-0 h-full w-full pointer-events-none"
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id="nave-floor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity="0.25" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="nave-light" cx="50%" cy="28%" r="55%">
          <stop offset="0" stopColor={light} stopOpacity="0.95" />
          <stop offset="1" stopColor={light} stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect x="0" y="0" width="360" height="120" fill="url(#nave-light)" />

      <path d="M18 18 H70 V78 H18 Z" fill="#0b1020" opacity="0.55" />
      <path d="M290 18 H342 V78 H290 Z" fill="#0b1020" opacity="0.55" />
      <path d="M24 24 H64 V70 H24 Z" fill="#fde68a" opacity="0.35" />
      <path d="M296 24 H336 V70 H296 Z" fill="#fde68a" opacity="0.28" />
      <path d="M44 24 V70 M316 24 V70" stroke="#fef3c7" strokeOpacity="0.45" />

      <path d="M0 0 H52 C36 80 48 160 28 280 H0 Z" fill={drape} />
      <path d="M360 0 H308 C324 80 312 160 332 280 H360 Z" fill={drape} />
      <path d="M14 0 C8 90 22 170 10 280" stroke="#000" strokeWidth="7" opacity="0.28" fill="none" />
      <path d="M30 0 C22 100 36 180 24 280" stroke="#000" strokeWidth="5" opacity="0.22" fill="none" />
      <path d="M346 0 C352 90 338 170 350 280" stroke="#000" strokeWidth="7" opacity="0.28" fill="none" />
      <path d="M330 0 C338 100 324 180 336 280" stroke="#000" strokeWidth="5" opacity="0.22" fill="none" />
      <g stroke="#fff" strokeOpacity="0.28" fill="none">
        <path d="M6 36 H40 M8 48 H36 M6 110 H38 M8 122 H34 M6 190 H36 M8 202 H32" />
        <path d="M322 48 H354 M324 60 H350 M322 140 H354 M324 152 H348 M322 220 H354 M324 232 H348" />
      </g>

      <path d="M48 118 L312 118 L340 280 L20 280 Z" fill={floor} />
      <path d="M48 118 L312 118 L340 280 L20 280 Z" fill="url(#nave-floor)" />
      <g stroke="#1c1917" strokeOpacity="0.55" fill="none" strokeWidth="1.4">
        <path d="M70 150 L40 280 M120 150 L90 280 M180 140 L180 280 M240 150 L270 280 M290 150 L330 280" />
        <path d="M54 150 H306 M44 190 H316 M32 230 H328 M24 265 H336" />
      </g>
      <g fill="#fff" opacity="0.07">
        <path d="M70 150 L120 150 L100 190 L54 190 Z" />
        <path d="M240 150 L290 150 L316 190 L210 190 Z" />
        <path d="M44 190 L100 190 L80 230 L32 230 Z" />
      </g>
      <path d="M168 130 L150 280 H210 L192 130 Z" fill="#fff" opacity="0.06" />

      {[
        { y: 168, h: 16, inset: 70 },
        { y: 198, h: 18, inset: 54 },
        { y: 232, h: 22, inset: 36 },
      ].map((row) => (
        <g key={row.y}>
          <path
            d={`M${row.inset} ${row.y} H${150 - (168 - row.y) * 0.15} L${150 - (168 - row.y) * 0.1} ${row.y + row.h} H${row.inset - 6} Z`}
            fill={pew}
          />
          <path
            d={`M${360 - row.inset} ${row.y} H${210 + (168 - row.y) * 0.15} L${210 + (168 - row.y) * 0.1} ${row.y + row.h} H${366 - row.inset} Z`}
            fill={pew}
          />
          <path
            d={`M${row.inset + 4} ${row.y + 3} H${142} M${row.inset + 6} ${row.y + 7} H${140} M${218} ${row.y + 3} H${354 - row.inset} M${220} ${row.y + 7} H${350 - row.inset}`}
            stroke="#3f2912"
            strokeWidth="1.1"
            strokeOpacity="0.7"
          />
          <path
            d={`M${row.inset} ${row.y + row.h} H${146} V${row.y + row.h + 7} H${row.inset - 4} Z`}
            fill="#000"
            opacity="0.28"
          />
          <path
            d={`M${214} ${row.y + row.h} H${360 - row.inset} V${row.y + row.h + 7} H${214} Z`}
            fill="#000"
            opacity="0.28"
          />
        </g>
      ))}

      <path d="M118 96 H242 L250 132 H110 Z" fill="#2a2118" />
      <path d="M126 100 H234 L240 126 H120 Z" fill={drape} opacity="0.85" />
      <path d="M132 104 H228 M140 112 H220 M148 120 H212" stroke="#000" strokeOpacity="0.2" />
      <ellipse cx="180" cy="128" rx="54" ry="8" fill="#000" opacity="0.35" />

      <g>
        <rect x="132" y="78" width="6" height="22" rx="1" fill="#f5e6c8" />
        <rect x="222" y="78" width="6" height="22" rx="1" fill="#f5e6c8" />
        <ellipse cx="135" cy="74" rx="5" ry="7" fill="#fde68a" />
        <ellipse cx="225" cy="76" rx="4" ry="6" fill="#fbbf24" />
        <ellipse cx="135" cy="100" rx="16" ry="5" fill="#fbbf24" opacity="0.35" />
        <ellipse cx="225" cy="102" rx="14" ry="4" fill="#fbbf24" opacity="0.28" />
      </g>
    </svg>
  );
};
