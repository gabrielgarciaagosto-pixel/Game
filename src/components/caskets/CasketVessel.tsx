import React, { useId } from 'react';
import type {
  CasketCatalogEntry,
  CasketSilhouette,
} from '../../data/casketCatalog';

function LidPath(s: CasketSilhouette): string {
  switch (s) {
    case 'FULL_COUCH':
      return 'M12 38 H88 L84 52 H16 Z';
    case 'TAPERED':
      return 'M18 40 H82 L76 54 H24 Z';
    case 'OCTAGON':
      return 'M22 36 L30 30 H70 L78 36 L74 52 H26 Z';
    case 'DOME':
      return 'M16 48 C16 28 84 28 84 48 L80 54 H20 Z';
    case 'PANEL':
      return 'M14 40 H86 L82 54 H18 Z';
    case 'HALF_COUCH':
    default:
      return 'M12 40 H50 L48 54 H16 Z';
  }
}

function BodyPath(s: CasketSilhouette): string {
  switch (s) {
    case 'TAPERED':
      return 'M24 54 H76 L70 118 H30 Z';
    case 'OCTAGON':
      return 'M26 52 H74 L78 70 V100 L70 118 H30 L22 100 V70 Z';
    case 'DOME':
      return 'M20 54 H80 V112 C80 118 20 118 20 112 Z';
    default:
      return 'M16 54 H84 V116 H16 Z';
  }
}

export const CasketVessel: React.FC<{
  casket: CasketCatalogEntry;
  className?: string;
  showPlaque?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ casket, className, showPlaque = true, size = 'md' }) => {
  const uid = useId().replace(/:/g, '');
  const body = `cask-body-${uid}`;
  const height =
    size === 'lg' ? 'h-40' : size === 'sm' ? 'h-20' : 'h-28';

  return (
    <svg
      viewBox="0 0 100 140"
      className={`${height} w-auto ${className ?? ''}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={body} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={casket.palette.highlight} />
          <stop offset="0.45" stopColor={casket.palette.body} />
          <stop offset="1" stopColor={casket.palette.bodyDeep} />
        </linearGradient>
        <filter id={`csoft-${uid}`}>
          <feDropShadow dx="0" dy="3" stdDeviation="2" floodOpacity="0.4" />
        </filter>
      </defs>

      <ellipse cx="50" cy="126" rx="34" ry="5" fill="#000" opacity="0.28" />

      <path
        d={BodyPath(casket.silhouette)}
        fill={`url(#${body})`}
        stroke={casket.palette.trim}
        strokeWidth="1.2"
        filter={`url(#csoft-${uid})`}
      />
      {/* lining peek */}
      <path
        d="M22 58 H78 V72 H22 Z"
        fill={casket.palette.lining}
        opacity="0.85"
      />
      <path
        d={LidPath(casket.silhouette)}
        fill={casket.palette.bodyDeep}
        stroke={casket.palette.hardware}
        strokeWidth="1"
      />
      {/* handles */}
      <rect
        x="6"
        y="78"
        width="8"
        height="18"
        rx="2"
        fill={casket.palette.hardware}
      />
      <rect
        x="86"
        y="78"
        width="8"
        height="18"
        rx="2"
        fill={casket.palette.hardware}
      />

      {showPlaque && (
        <text
          x="50"
          y="108"
          textAnchor="middle"
          fill={casket.palette.lining}
          fontSize="5"
          fontFamily="Georgia, serif"
          opacity="0.9"
        >
          {casket.material}
        </text>
      )}
    </svg>
  );
};
