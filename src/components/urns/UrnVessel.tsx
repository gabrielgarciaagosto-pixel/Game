import { useId } from 'react';
import type { UrnCatalogEntry, UrnMaterial, UrnSilhouette } from '../../data/urnCatalog';

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

function MaterialMarks({
  material,
  silhouette,
  accent,
}: {
  material: UrnMaterial;
  silhouette: UrnSilhouette;
  accent: string;
}) {
  if (material === 'MARBLE' || material === 'STONE') {
    return (
      <g fill="none" stroke={material === 'STONE' ? '#44403c' : '#78716c'} strokeLinecap="round">
        <path d="M38 52 C44 66 42 84 48 112" strokeWidth="1.6" opacity="0.7" />
        <path d="M58 46 C54 68 62 90 57 114" strokeWidth="1.15" opacity="0.55" />
        <path d="M44 70 C52 78 48 96 53 108" strokeWidth="0.7" opacity="0.4" />
        {material === 'STONE' && (
          <>
            <circle cx="46" cy="80" r="1.1" fill="#57534e" stroke="none" opacity="0.55" />
            <circle cx="60" cy="96" r="0.8" fill="#44403c" stroke="none" opacity="0.5" />
            <circle cx="42" cy="100" r="0.7" fill="#292524" stroke="none" opacity="0.45" />
          </>
        )}
      </g>
    );
  }
  if (material === 'BRONZE') {
    return (
      <g>
        <path d="M36 70 C44 78 42 96 48 112" stroke="#3f6212" strokeWidth="2.2" fill="none" opacity="0.55" />
        <path d="M58 60 C56 82 64 98 60 114" stroke="#65a30d" strokeWidth="1.4" fill="none" opacity="0.4" />
        <path d="M34 86 H66" stroke={accent} strokeWidth="1.6" opacity="0.75" />
      </g>
    );
  }
  if (material === 'STEEL') {
    return (
      <g stroke="#e2e8f0" strokeWidth="0.45" opacity="0.55">
        {Array.from({ length: 10 }, (_, i) => (
          <line key={i} x1="32" x2="68" y1={58 + i * 5} y2={58 + i * 5} />
        ))}
        <path d="M40 48 C46 70 46 96 42 116" stroke="#fff" strokeWidth="2.2" opacity="0.35" fill="none" />
      </g>
    );
  }
  if (material === 'CERAMIC' || material === 'PORCELAIN') {
    return (
      <g>
        <path d="M40 50 C48 58 44 64 50 70 C56 76 52 84 58 92" stroke="#fff" strokeWidth="2" fill="none" opacity="0.35" />
        <path d="M46 62 C44 78 50 90 48 108" stroke={accent} strokeWidth="1.3" fill="none" opacity="0.45" />
        <ellipse cx="44" cy="78" rx="3" ry="1.2" fill="#fff" opacity="0.35" />
        <ellipse cx="58" cy="96" rx="2" ry="0.8" fill="#fff" opacity="0.28" />
      </g>
    );
  }
  if (material === 'WOOD') {
    return (
      <g fill="none" stroke="#3f2a16" strokeWidth="0.7" opacity="0.45">
        <path d="M40 54 C48 62 46 86 54 112" />
        <path d="M52 50 C50 70 46 92 44 114" />
        <path d="M46 60 C54 72 50 94 56 110" opacity="0.7" />
      </g>
    );
  }
  if (material === 'GLASS') {
    return (
      <path
        d="M40 50 C46 72 44 96 42 114"
        stroke="#fff"
        strokeWidth="2.4"
        fill="none"
        opacity="0.55"
      />
    );
  }
  if (silhouette === 'ART_DECO') {
    return (
      <g stroke={accent} fill="none">
        <path d="M38 70 H62" strokeWidth="1.5" />
        <path d="M40 86 H60" strokeWidth="1" />
        <path d="M42 102 H58" strokeWidth="1" />
      </g>
    );
  }
  return null;
}

export const UrnVessel: React.FC<{
  urn: UrnCatalogEntry;
  className?: string;
  showPlaque?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ urn, className, showPlaque = true, size = 'md' }) => {
  const uid = useId().replace(/:/g, '');
  const body = `urn-body-${uid}`;
  const shade = `urn-shade-${uid}`;
  const shine = `urn-shine-${uid}`;
  const height = size === 'lg' ? 'h-56' : size === 'sm' ? 'h-28' : 'h-40';
  const bodyPath = BodyPath(urn.silhouette);

  return (
    <svg
      viewBox="0 0 100 150"
      className={`${height} w-auto ${className ?? ''}`}
      aria-hidden
    >
      <defs>
        <linearGradient id={body} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={urn.palette.highlight} />
          <stop offset="0.42" stopColor={urn.palette.body} />
          <stop offset="1" stopColor={urn.palette.bodyDeep} />
        </linearGradient>
        <linearGradient id={shade} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.45" />
          <stop offset="0.38" stopColor="#000" stopOpacity="0.05" />
          <stop offset="0.72" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.28" />
        </linearGradient>
        <linearGradient id={shine} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.7" />
          <stop offset="0.35" stopColor="#fff" stopOpacity="0.05" />
          <stop offset="1" stopColor="#000" stopOpacity="0.2" />
        </linearGradient>
      </defs>

      <ellipse cx="50" cy="136" rx="30" ry="7" fill="#000" opacity="0.32" />

      <path
        d="M30 118 H70 L66 132 H34 Z"
        fill={urn.palette.base}
        stroke="#000"
        strokeOpacity="0.25"
      />
      <path d="M34 124 H66" stroke="#fff" strokeOpacity="0.25" />

      <path d={bodyPath} fill={`url(#${body})`} stroke={urn.palette.bodyDeep} strokeWidth="1.15" />
      <path d={bodyPath} fill={`url(#${shade})`} />
      <path d={bodyPath} fill={`url(#${shine})`} opacity="0.45" />

      <MaterialMarks
        material={urn.material}
        silhouette={urn.silhouette}
        accent={urn.palette.accent}
      />

      {urn.silhouette === 'TEMPLE' && (
        <>
          <path d="M24 52 L50 34 L76 52 Z" fill={urn.palette.lid} stroke={urn.palette.bodyDeep} />
          <path
            d="M30 52 V110 M40 52 V110 M50 52 V110 M60 52 V110 M70 52 V110"
            stroke={urn.palette.accent}
            strokeWidth="1.2"
            opacity="0.45"
          />
        </>
      )}
      {urn.silhouette === 'ART_DECO' && urn.material !== 'CERAMIC' && (
        <g stroke={urn.palette.accent} fill="none">
          <path d="M38 70 H62" strokeWidth="1.4" />
          <path d="M40 86 H60" strokeWidth="1" />
        </g>
      )}

      {urn.silhouette !== 'TEMPLE' && (
        <>
          <ellipse
            cx="50"
            cy={urn.silhouette === 'CUBE' ? 48 : 34}
            rx={urn.silhouette === 'CUBE' ? 22 : 16}
            ry="5"
            fill={urn.palette.bodyDeep}
            opacity="0.35"
          />
          <ellipse
            cx="50"
            cy={urn.silhouette === 'CUBE' ? 46 : 32}
            rx={urn.silhouette === 'CUBE' ? 22 : 16}
            ry="5"
            fill={urn.palette.lid}
            stroke={urn.palette.bodyDeep}
          />
          <path
            d={
              urn.silhouette === 'CUBE'
                ? 'M30 46 H70 V38 H30 Z'
                : 'M38 32 C38 22 62 22 62 32 Z'
            }
            fill={urn.palette.lid}
            stroke={urn.palette.bodyDeep}
          />
          <path
            d={urn.silhouette === 'CUBE' ? 'M32 40 H48' : 'M42 26 C46 23 52 23 56 27'}
            stroke="#fff"
            strokeOpacity="0.55"
            fill="none"
          />
          <circle cx="50" cy={urn.silhouette === 'CUBE' ? 34 : 20} r="3.2" fill={urn.palette.accent} />
          <circle cx="49" cy={urn.silhouette === 'CUBE' ? 33 : 19} r="1.1" fill="#fff" opacity="0.7" />
        </>
      )}

      {showPlaque && (
        <rect x="40" y="88" width="20" height="10" rx="1.5" fill={urn.palette.accent} opacity="0.9" />
      )}
    </svg>
  );
};
