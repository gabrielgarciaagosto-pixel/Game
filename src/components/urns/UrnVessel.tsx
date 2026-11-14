import { useId } from 'react';
import type { UrnCatalogEntry, UrnSilhouette } from '../../data/urnCatalog';

function BodyPath(silhouette: UrnSilhouette): string {
  switch (silhouette) {
    case 'TOWER':
      return 'M34 78 C34 52 38 34 50 28 C62 34 66 52 66 78 L62 118 C62 128 38 128 38 118 Z';
    case 'TEAR':
      return 'M50 24 C68 48 74 72 68 108 C64 124 36 124 32 108 C26 72 32 48 50 24 Z';
    case 'CUBE':
      return 'M28 48 H72 V118 H28 Z';
    case 'VASE':
      return 'M42 36 C58 36 64 48 64 58 C72 62 76 78 72 104 C70 118 30 118 28 104 C24 78 28 62 36 58 C36 48 42 36 42 36 Z';
    case 'KEEPSAKE':
      return 'M38 58 C38 46 44 40 50 40 C56 40 62 46 62 58 L60 108 C60 116 40 116 40 108 Z';
    case 'ART_DECO':
      return 'M30 44 L50 28 L70 44 L66 118 H34 Z';
    case 'TEMPLE':
      return 'M26 52 H74 V110 H26 Z';
    case 'CLASSIC':
    default:
      return 'M36 48 C34 38 42 32 50 32 C58 32 66 38 64 48 C74 54 76 78 70 108 C68 120 32 120 30 108 C24 78 26 54 36 48 Z';
  }
}

export const UrnVessel: React.FC<{
  urn: UrnCatalogEntry;
  className?: string;
  showPlaque?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ urn, className, showPlaque = true, size = 'md' }) => {
  const uid = useId().replace(/:/g, '');
  const body = `urn-body-${uid}`;
  const shine = `urn-shine-${uid}`;
  const height =
    size === 'lg' ? 'h-56' : size === 'sm' ? 'h-28' : 'h-40';

  return (
    <svg
      viewBox="0 0 100 150"
      className={`${height} w-auto ${className ?? ''}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={body} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={urn.palette.highlight} />
          <stop offset="0.35" stopColor={urn.palette.body} />
          <stop offset="1" stopColor={urn.palette.bodyDeep} />
        </linearGradient>
        <linearGradient id={shine} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.45" />
          <stop offset="0.4" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#000" stopOpacity="0.25" />
        </linearGradient>
        <filter id={`soft-${uid}`}>
          <feDropShadow dx="0" dy="4" stdDeviation="2.2" floodOpacity="0.45" />
        </filter>
      </defs>

      <ellipse cx="50" cy="132" rx="28" ry="6" fill="#000" opacity="0.28" />

      {/* base plinth */}
      <path
        d="M30 118 H70 L66 130 H34 Z"
        fill={urn.palette.base}
        stroke="#000"
        strokeOpacity="0.25"
      />

      {/* body */}
      <path
        d={BodyPath(urn.silhouette)}
        fill={`url(#${body})`}
        stroke={urn.palette.bodyDeep}
        strokeWidth="1.2"
        filter={`url(#soft-${uid})`}
      />
      <path
        d={BodyPath(urn.silhouette)}
        fill={`url(#${shine})`}
        opacity="0.55"
      />

      {/* material accents */}
      {urn.material === 'MARBLE' && (
        <>
          <path
            d="M40 58 C46 70 44 90 48 110"
            stroke={urn.palette.accent}
            strokeWidth="1.1"
            fill="none"
            opacity="0.45"
          />
          <path
            d="M56 50 C54 72 60 92 58 112"
            stroke={urn.palette.accent}
            strokeWidth="0.8"
            fill="none"
            opacity="0.35"
          />
        </>
      )}
      {(urn.material === 'BRONZE' || urn.material === 'STEEL') && (
        <path
          d="M34 78 H66"
          stroke={urn.palette.accent}
          strokeWidth="2"
          opacity="0.7"
        />
      )}
      {urn.material === 'WOOD' && (
        <>
          <path d="M40 60 C48 68 52 90 56 112" stroke="#000" strokeOpacity="0.18" fill="none" />
          <path d="M52 52 C50 70 46 92 44 114" stroke="#000" strokeOpacity="0.12" fill="none" />
        </>
      )}
      {urn.silhouette === 'ART_DECO' && (
        <>
          <path d="M38 70 H62" stroke={urn.palette.accent} strokeWidth="1.5" />
          <path d="M40 86 H60" stroke={urn.palette.accent} strokeWidth="1" />
          <path d="M42 102 H58" stroke={urn.palette.accent} strokeWidth="1" />
        </>
      )}
      {urn.silhouette === 'TEMPLE' && (
        <>
          <path d="M24 52 L50 34 L76 52 Z" fill={urn.palette.lid} stroke={urn.palette.bodyDeep} />
          <path d="M30 52 V110 M40 52 V110 M50 52 V110 M60 52 V110 M70 52 V110" stroke={urn.palette.accent} strokeWidth="1.2" opacity="0.5" />
        </>
      )}

      {/* lid / finial */}
      {urn.silhouette !== 'TEMPLE' && (
        <>
          <ellipse
            cx="50"
            cy={urn.silhouette === 'CUBE' ? 48 : 34}
            rx={urn.silhouette === 'CUBE' ? 22 : 16}
            ry="5"
            fill={urn.palette.lid}
            stroke={urn.palette.bodyDeep}
          />
          <path
            d={
              urn.silhouette === 'CUBE'
                ? 'M30 48 H70 V40 H30 Z'
                : 'M38 34 C38 24 62 24 62 34 Z'
            }
            fill={urn.palette.lid}
            stroke={urn.palette.bodyDeep}
          />
          <circle cx="50" cy={urn.silhouette === 'CUBE' ? 36 : 22} r="3.2" fill={urn.palette.accent} />
        </>
      )}

      {showPlaque && (
        <rect
          x="40"
          y="88"
          width="20"
          height="10"
          rx="1.5"
          fill={urn.palette.accent}
          opacity="0.85"
        />
      )}
    </svg>
  );
};
