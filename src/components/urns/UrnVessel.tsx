import { useId } from 'react';
import type {
  UrnAccent,
  UrnBody,
  UrnCatalogEntry,
  UrnFinishId,
  UrnLid,
  UrnMaterial,
  UrnSilhouette,
} from '../../data/urnCatalog';

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
  if (urn.modular) {
    return (
      <ModularUrn
        urn={urn}
        uid={uid}
        className={className}
        showPlaque={showPlaque}
        size={size}
      />
    );
  }
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

interface BodyGeom {
  path: string;
  top: number;
  bottom: number;
  left: number;
  right: number;
  lidRx: number;
  orb?: boolean;
}

const MODERN_BODY: Record<UrnBody, BodyGeom> = {
  VASE: {
    path: 'M40 50 C40 38 60 38 60 50 C70 56 74 74 70 108 C68 120 32 120 30 108 C26 74 30 56 40 50 Z',
    top: 42,
    bottom: 120,
    left: 28,
    right: 72,
    lidRx: 12,
  },
  CYLINDER: {
    path: 'M36 46 H64 Q70 46 70 52 V110 Q70 118 64 118 H36 Q30 118 30 110 V52 Q30 46 36 46 Z',
    top: 46,
    bottom: 118,
    left: 30,
    right: 70,
    lidRx: 20,
  },
  CUBE: {
    path: 'M26 70 H74 V118 H26 Z',
    top: 70,
    bottom: 118,
    left: 26,
    right: 74,
    lidRx: 24,
  },
  CHEST: {
    path: 'M16 86 H84 V118 H16 Z',
    top: 86,
    bottom: 118,
    left: 16,
    right: 84,
    lidRx: 34,
  },
  ORB: {
    path: '',
    top: 56,
    bottom: 116,
    left: 20,
    right: 80,
    lidRx: 12,
    orb: true,
  },
  CAPSULE: {
    path: 'M50 44 C74 44 80 66 80 90 C80 116 66 128 50 128 C34 128 20 116 20 90 C20 66 26 44 50 44 Z',
    top: 44,
    bottom: 128,
    left: 22,
    right: 78,
    lidRx: 14,
  },
  TEARDROP: {
    path: 'M50 36 C68 56 76 80 68 112 C64 126 36 126 32 112 C24 80 32 56 50 36 Z',
    top: 36,
    bottom: 126,
    left: 26,
    right: 74,
    lidRx: 8,
  },
};

const METAL_FINISH: ReadonlySet<UrnFinishId> = new Set([
  'BRUSHED_BRASS',
  'BRONZE',
  'PEWTER',
  'SILVER',
  'GOLD',
  'GUNMETAL',
  'CORTEN',
]);

function ModularUrn({
  urn,
  uid,
  className,
  showPlaque,
  size,
}: {
  urn: UrnCatalogEntry;
  uid: string;
  className?: string;
  showPlaque: boolean;
  size: 'sm' | 'md' | 'lg';
}) {
  const modular = urn.modular;
  if (!modular) return null;
  const geom = MODERN_BODY[modular.body];
  const height = size === 'lg' ? 'h-56' : size === 'sm' ? 'h-28' : 'h-40';
  const body = `urn-body-${uid}`;
  const shade = `urn-shade-${uid}`;
  const shine = `urn-shine-${uid}`;
  const clip = `urn-clip-${uid}`;
  const shineOpacity =
    modular.finishId === 'GLOSS_BLACK' || modular.finishId === 'GLASS'
      ? 0.62
      : modular.finishId === 'MATTE_BLACK' ||
          modular.finishId === 'MATTE_WHITE' ||
          modular.finishId === 'BIO'
        ? 0.16
        : 0.4;
  const fillOpacity = modular.finishId === 'GLASS' ? 0.78 : 1;

  return (
    <svg viewBox="0 0 100 150" className={`${height} w-auto ${className ?? ''}`} aria-hidden>
      <defs>
        <linearGradient id={body} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={urn.palette.highlight} />
          <stop offset="0.45" stopColor={urn.palette.body} />
          <stop offset="1" stopColor={urn.palette.bodyDeep} />
        </linearGradient>
        <linearGradient id={shade} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.4" />
          <stop offset="0.42" stopColor="#000" stopOpacity="0.04" />
          <stop offset="0.72" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="1" stopColor="#fff" stopOpacity="0.22" />
        </linearGradient>
        <linearGradient id={shine} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.65" />
          <stop offset="0.4" stopColor="#fff" stopOpacity="0.04" />
          <stop offset="1" stopColor="#000" stopOpacity="0.18" />
        </linearGradient>
        <clipPath id={clip}>
          {geom.orb ? (
            <circle cx="50" cy="86" r="30" />
          ) : (
            <path d={geom.path} />
          )}
        </clipPath>
      </defs>

      <ellipse cx="50" cy="138" rx="26" ry="6" fill="#000" opacity="0.28" />
      {geom.orb ? (
        <path d="M32 114 H68 L62 130 H38 Z" fill={urn.palette.base} stroke="#000" strokeOpacity="0.25" />
      ) : (
        <path
          d={`M${geom.left - 1} ${geom.bottom - 1} H${geom.right + 1} L${geom.right - 4} ${geom.bottom + 10} H${geom.left + 4} Z`}
          fill={urn.palette.base}
          stroke="#000"
          strokeOpacity="0.22"
        />
      )}

      {geom.orb ? (
        <circle cx="50" cy="86" r="30" fill={`url(#${body})`} fillOpacity={fillOpacity} stroke={urn.palette.bodyDeep} />
      ) : (
        <path d={geom.path} fill={`url(#${body})`} fillOpacity={fillOpacity} stroke={urn.palette.bodyDeep} strokeWidth="1.05" />
      )}
      <g clipPath={`url(#${clip})`}>
        {geom.orb ? (
          <circle cx="50" cy="86" r="30" fill={`url(#${shade})`} />
        ) : (
          <path d={geom.path} fill={`url(#${shade})`} />
        )}
        {geom.orb ? (
          <circle cx="50" cy="86" r="30" fill={`url(#${shine})`} opacity={shineOpacity} />
        ) : (
          <path d={geom.path} fill={`url(#${shine})`} opacity={shineOpacity} />
        )}
        <FinishSkin finishId={modular.finishId} accent={urn.palette.accent} />
        <AccentMark kind={modular.accent} geom={geom} color={urn.palette.accent} />
        {modular.body === 'CUBE' && (
          <path d="M64 70 V118" stroke="#fff" strokeOpacity="0.22" />
        )}
        {modular.body === 'CHEST' && (
          <path d="M24 94 H76 V112 H24 Z" fill="none" stroke={urn.palette.bodyDeep} strokeOpacity="0.35" />
        )}
      </g>

      <LidMark
        kind={modular.lid}
        body={modular.body}
        top={geom.top}
        rx={geom.lidRx}
        lid={urn.palette.lid}
        deep={urn.palette.bodyDeep}
        accent={urn.palette.accent}
        bodyColor={urn.palette.body}
      />

      {showPlaque && !geom.orb && (
        <rect
          x="42"
          y={geom.bottom - 22}
          width="16"
          height="8"
          rx="1.2"
          fill={urn.palette.accent}
          opacity="0.9"
        />
      )}
    </svg>
  );
}

function FinishSkin({ finishId, accent }: { finishId: UrnFinishId; accent: string }) {
  if (
    finishId === 'MARBLE_WHITE' ||
    finishId === 'MARBLE_BEIGE' ||
    finishId === 'MARBLE_BLACK_GOLD'
  ) {
    const vein = finishId === 'MARBLE_WHITE' ? '#a8a29e' : finishId === 'MARBLE_BEIGE' ? '#a8845a' : accent;
    return (
      <g fill="none" stroke={vein} strokeLinecap="round" opacity="0.75">
        <path d="M38 60 C46 78 42 96 48 118" strokeWidth="1.3" />
        <path d="M58 54 C52 76 62 98 56 120" strokeWidth="0.8" />
      </g>
    );
  }
  if (finishId === 'GRANITE') {
    return (
      <g fill="#1c1917">
        <circle cx="40" cy="78" r="1.1" opacity="0.45" />
        <circle cx="58" cy="92" r="0.8" opacity="0.4" />
        <circle cx="46" cy="104" r="1" opacity="0.35" />
        <circle cx="62" cy="70" r="0.7" opacity="0.4" />
      </g>
    );
  }
  if (METAL_FINISH.has(finishId)) {
    return (
      <g stroke="#fff" strokeWidth="0.45" opacity="0.28">
        {Array.from({ length: 8 }, (_, i) => (
          <line key={i} x1="24" x2="76" y1={58 + i * 7} y2={58 + i * 7} />
        ))}
      </g>
    );
  }
  if (finishId === 'MAPLE' || finishId === 'WALNUT' || finishId === 'CHERRY' || finishId === 'BAMBOO' || finishId === 'SABLE') {
    return (
      <g fill="none" stroke="#3f2a16" strokeWidth="0.7" opacity="0.4">
        <path d="M40 62 C48 74 44 96 52 118" />
        <path d="M56 58 C52 80 58 100 54 120" />
      </g>
    );
  }
  if (finishId === 'GLASS') {
    return <path d="M40 58 C46 78 44 100 42 120" stroke="#fff" strokeWidth="2.2" fill="none" opacity="0.55" />;
  }
  if (finishId === 'BIO') {
    return (
      <g stroke="#d6d3d1" strokeWidth="0.6" opacity="0.45">
        <path d="M42 70 H58" />
        <path d="M40 86 H60" />
        <path d="M43 102 H57" />
      </g>
    );
  }
  if (finishId === 'GLAZE') {
    return <path d="M32 78 C44 70 56 90 70 80" stroke={accent} strokeWidth="3" fill="none" opacity="0.45" />;
  }
  return null;
}

function AccentMark({
  kind,
  geom,
  color,
}: {
  kind: UrnAccent;
  geom: BodyGeom;
  color: string;
}) {
  if (kind === 'NONE') return null;
  const y = geom.orb ? 90 : (geom.top + geom.bottom) / 2;
  const left = geom.left + 6;
  const right = geom.right - 6;
  if (kind === 'BAND') {
    return <path d={`M${left} ${y} H${right}`} stroke={color} strokeWidth="2.4" fill="none" />;
  }
  if (kind === 'STRIPE') {
    return (
      <g stroke={color} fill="none">
        <path d={`M${left} ${y - 5} H${right}`} strokeWidth="1.15" />
        <path d={`M${left} ${y + 5} H${right}`} strokeWidth="1.15" />
      </g>
    );
  }
  if (kind === 'ENGRAVED') {
    return (
      <g stroke={color} fill="none" opacity="0.9">
        <path d={`M${left + 2} ${y - 7} H${right - 2}`} strokeWidth="0.55" />
        <path d={`M${left + 4} ${y} H${right - 4}`} strokeWidth="0.4" />
        <path d={`M${left + 2} ${y + 7} H${right - 2}`} strokeWidth="0.55" />
        <path d={`M50 ${y - 3.5} L53 ${y} L50 ${y + 3.5} L47 ${y} Z`} />
      </g>
    );
  }
  return <rect x="46" y={y - 14} width="8" height="28" rx="1.4" fill={color} opacity="0.92" />;
}

function LidMark({
  kind,
  body,
  top,
  rx,
  lid,
  deep,
  accent,
  bodyColor,
}: {
  kind: UrnLid;
  body: UrnBody;
  top: number;
  rx: number;
  lid: string;
  deep: string;
  accent: string;
  bodyColor: string;
}) {
  const left = 50 - rx;
  const right = 50 + rx;
  const square = body === 'CUBE' || body === 'CHEST';
  if (square && kind === 'FLUSH') {
    return <path d={`M${left + 3} ${top + 3} H${right - 3}`} stroke={deep} strokeWidth="0.8" />;
  }
  if (square && kind === 'DISC') {
    return (
      <path
        d={`M${left} ${top - 7} H${right} V${top} H${left} Z`}
        fill={lid}
        stroke={deep}
        strokeWidth="0.7"
      />
    );
  }
  if (square && kind === 'DOME') {
    return (
      <path
        d={`M${left} ${top} Q50 ${top - 8} ${right} ${top} V${top + 5} H${left} Z`}
        fill={lid}
        stroke={deep}
        strokeWidth="0.7"
      />
    );
  }
  if (square && kind === 'KNOB') {
    return (
      <g>
        <path d={`M${left} ${top - 5} H${right} V${top} H${left} Z`} fill={lid} stroke={deep} strokeWidth="0.7" />
        <circle cx="50" cy={top - 9} r="3.1" fill={accent} stroke={deep} strokeWidth="0.4" />
        <circle cx="49" cy={top - 10} r="1" fill="#fff" opacity="0.7" />
      </g>
    );
  }
  if (kind === 'FLUSH') {
    return (
      <ellipse cx="50" cy={top + 2} rx={rx * 0.92} ry="3" fill={bodyColor} stroke={deep} strokeWidth="0.6" />
    );
  }
  if (kind === 'DISC') {
    return (
      <g>
        <ellipse cx="50" cy={top} rx={rx} ry="4" fill={deep} />
        <ellipse cx="50" cy={top - 3} rx={rx} ry="3.4" fill={lid} stroke={deep} strokeWidth="0.7" />
        <path d={`M${50 - rx * 0.4} ${top - 4} H${50 + rx * 0.1}`} stroke="#fff" strokeOpacity="0.5" fill="none" />
      </g>
    );
  }
  if (kind === 'DOME') {
    return (
      <path
        d={`M${left} ${top} Q50 ${top - 16} ${right} ${top} Z`}
        fill={lid}
        stroke={deep}
        strokeWidth="0.8"
      />
    );
  }
  return (
    <g>
      <path d={`M${50 - rx * 0.62} ${top} Q50 ${top - 10} ${50 + rx * 0.62} ${top} Z`} fill={lid} stroke={deep} />
      <circle cx="50" cy={top - 12} r="3.3" fill={accent} stroke={deep} strokeWidth="0.45" />
      <circle cx="49" cy={top - 13} r="1" fill="#fff" opacity="0.7" />
    </g>
  );
}
