import React, { useId } from 'react';
import type { CasketCatalogEntry, CasketSilhouette } from '../../data/casketCatalog';

function isWood(material: CasketCatalogEntry['material']) {
  return (
    material === 'OAK' ||
    material === 'CHERRY' ||
    material === 'WALNUT' ||
    material === 'PINE' ||
    material === 'MAHOGANY'
  );
}

/** Top-down three-quarter casket. Head is on the left, foot on the right. */
function shell(s: CasketSilhouette) {
  switch (s) {
    case 'TAPERED':
      return {
        lid: 'M40 26 L168 32 L176 58 L30 58 Z',
        side: 'M30 58 L176 58 L184 80 L24 78 Z',
        head: 'M24 42 L40 26 L30 58 L24 78 Z',
        foot: 'M168 32 L184 40 L184 80 L176 58 Z',
      };
    case 'OCTAGON':
      return {
        lid: 'M48 24 L156 24 L176 36 L176 58 L28 58 L28 36 Z',
        side: 'M28 58 L176 58 L182 78 L22 78 Z',
        head: 'M22 40 L28 36 L28 58 L22 78 Z',
        foot: 'M176 36 L182 40 L182 78 L176 58 Z',
      };
    case 'DOME':
      return {
        lid: 'M32 58 C32 22 176 18 180 58 Z',
        side: 'M28 58 L184 58 L188 80 L22 80 Z',
        head: 'M22 46 L32 40 L28 58 L22 80 Z',
        foot: 'M180 40 L188 46 L188 80 L184 58 Z',
      };
    default:
      return {
        lid: 'M32 26 L176 26 L184 58 L26 58 Z',
        side: 'M26 58 L184 58 L190 80 L20 80 Z',
        head: 'M20 40 L32 26 L26 58 L20 80 Z',
        foot: 'M176 26 L190 40 L190 80 L184 58 Z',
      };
  }
}

export const CasketVessel: React.FC<{
  casket: CasketCatalogEntry;
  className?: string;
  showPlaque?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ casket, className, showPlaque = true, size = 'md' }) => {
  const uid = useId().replace(/:/g, '');
  const lid = `cask-lid-${uid}`;
  const side = `cask-side-${uid}`;
  const width = size === 'lg' ? 'w-64' : size === 'sm' ? 'w-40' : 'w-52';
  const g = shell(casket.silhouette);
  const wood = isWood(casket.material);
  const half = casket.silhouette === 'HALF_COUCH';
  const couch = casket.silhouette === 'FULL_COUCH' || half;

  return (
    <svg viewBox="0 0 210 100" className={`${width} h-auto ${className ?? ''}`} aria-hidden>
      <defs>
        <linearGradient id={lid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={casket.palette.highlight} />
          <stop offset="0.55" stopColor={casket.palette.body} />
          <stop offset="1" stopColor={casket.palette.bodyDeep} />
        </linearGradient>
        <linearGradient id={side} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={casket.palette.body} />
          <stop offset="1" stopColor="#1c1410" />
        </linearGradient>
      </defs>

      <ellipse cx="104" cy="90" rx="86" ry="7" fill="#000" opacity="0.35" />

      <path d={g.side} fill={`url(#${side})`} />
      <path d={g.head} fill={casket.palette.bodyDeep} />
      <path d={g.foot} fill={casket.palette.body} />
      <path d={g.lid} fill={`url(#${lid})`} stroke={casket.palette.trim} strokeWidth="1" />

      {wood ? (
        <g fill="none" stroke="#3f2912" strokeWidth="1.15" opacity="0.72" strokeLinecap="round">
          <path d="M40 34 C70 30 90 40 120 34 C150 28 168 36 176 32" />
          <path d="M38 42 C72 46 100 38 140 44 C160 48 174 42 180 46" />
          <path d="M36 50 C80 46 110 54 160 48" />
        </g>
      ) : (
        <g stroke="#fff" strokeWidth="0.4" opacity="0.35">
          {Array.from({ length: 7 }, (_, i) => (
            <line key={i} x1="36" x2="176" y1={32 + i * 3.4} y2={32 + i * 3.4} />
          ))}
        </g>
      )}

      <path d="M40 28 C90 24 140 24 176 28" stroke="#fff" strokeOpacity="0.45" fill="none" />

      {half && (
        <>
          <path d="M34 30 L100 30 L102 56 L30 56 Z" fill={casket.palette.lining} />
          <path d="M40 36 H92 M40 44 H90 M42 50 H88" stroke="#fff" strokeOpacity="0.35" />
          <path d="M48 34 V52 M64 34 V52 M80 34 V52" stroke="#7c2d12" strokeOpacity="0.25" />
        </>
      )}
      {casket.silhouette === 'FULL_COUCH' && (
        <>
          <path d="M104 28 V56" stroke={casket.palette.trim} strokeWidth="1.2" />
          <path d="M40 48 H168" stroke={casket.palette.lining} strokeWidth="3" opacity="0.85" />
        </>
      )}
      {casket.silhouette === 'PANEL' && (
        <g fill="none" stroke={casket.palette.trim} opacity="0.7">
          <rect x="48" y="32" width="36" height="18" rx="1" />
          <rect x="92" y="32" width="36" height="18" rx="1" />
          <rect x="136" y="32" width="32" height="18" rx="1" />
        </g>
      )}
      {couch && !half && (
        <path d="M48 50 H160" stroke={casket.palette.lining} strokeWidth="2" opacity="0.7" />
      )}

      {[58, 100, 146].map((x) => (
        <g key={x}>
          <rect x={x} y="64" width="22" height="7" rx="2" fill={casket.palette.hardware} />
          <rect x={x + 2} y="66" width="16" height="2" rx="1" fill="#fff" opacity="0.35" />
          <circle cx={x + 3} cy="72" r="1.3" fill="#1c1917" />
          <circle cx={x + 19} cy="72" r="1.3" fill="#1c1917" />
        </g>
      ))}

      {showPlaque && (
        <text
          x="104"
          y="52"
          textAnchor="middle"
          fill={casket.palette.lining}
          fontSize="7"
          fontFamily="Georgia, serif"
        >
          {casket.material}
        </text>
      )}
    </svg>
  );
};
