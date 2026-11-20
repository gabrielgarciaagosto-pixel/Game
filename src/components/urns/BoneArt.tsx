import React, { useId } from 'react';

export type BoneKind = 'SHAFT' | 'SKULL' | 'RIB' | 'VERTEBRA' | 'KNUCKLE';
export type MetalKind = 'SCREW' | 'PLATE' | 'STAPLE' | 'DENTAL_GOLD';

/** 0 chalk white, 1 ash grey, 2 heat-stained tan. Straight from the retort. */
export type BoneTone = 0 | 1 | 2;

const TONE = {
  0: { lit: '#fbfaf7', mid: '#e7e1d6', deep: '#b7aea3', crack: '#5c564f', pore: '#8a837a' },
  1: { lit: '#d9d6d1', mid: '#b7b3ad', deep: '#6f6b66', crack: '#3f3c39', pore: '#57534e' },
  2: { lit: '#efe2cc', mid: '#c9b18e', deep: '#8c7356', crack: '#5c4636', pore: '#7c6248' },
} as const;

function cracks(seed: number): Array<{ d: string; w: number }> {
  const shift = (seed % 5) * 2;
  const lines = [
    `M${12 + shift} 16 C${26 + shift} 14 ${34 + shift} 22 ${52 + shift} 18`,
    `M${16 + shift} 30 C${30} ${24 + (seed % 4)} ${44} 34 ${64 - shift} 26`,
    `M${28 + (seed % 6)} 8 C${30} 18 ${26} 26 ${32 + shift} 38`,
    `M${48 - shift} 10 C${50} 20 ${54} 22 ${56} 36`,
    `M10 ${20 + shift} C22 18 24 32 16 36`,
  ];
  return lines.slice(0, 3 + (seed % 3)).map((d, i) => ({ d, w: i === 0 ? 0.85 : 0.4 }));
}

export const BoneFragment: React.FC<{
  kind: BoneKind;
  /** 0 big, 1 medium, 2 small, 3 dust */
  stage: 0 | 1 | 2 | 3;
  tone?: BoneTone;
  variant?: number;
}> = ({ kind, stage, tone = 0, variant = 0 }) => {
  const uid = useId().replace(/:/g, '');
  const ink = TONE[tone];
  const body = `bone-body-${uid}`;
  const seed = kind.length * 3 + variant + tone * 5 + stage;
  if (stage === 3) {
    return <AshField seed={seed} compact />;
  }
  const silhouette = shape(kind, stage > 0, variant);
  return (
    <svg viewBox="0 0 80 48" className="h-full w-full" aria-hidden>
      <defs>
        <linearGradient id={body} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={ink.lit} />
          <stop offset="0.45" stopColor={ink.mid} />
          <stop offset="1" stopColor={ink.deep} />
        </linearGradient>
        <clipPath id={`bone-clip-${uid}`}>
          <path d={silhouette} />
        </clipPath>
      </defs>
      <path d={silhouette} fill={`url(#${body})`} />
      <g clipPath={`url(#bone-clip-${uid})`}>
      <path d={silhouette} fill="#fff" opacity="0.16" />
      {pores(seed).map((p) => (
        <circle key={`${p.x}-${p.y}`} cx={p.x} cy={p.y} r={p.r} fill={ink.pore} opacity="0.7" />
      ))}
      {cracks(seed).map((line) => (
        <path
          key={line.d}
          d={line.d}
          fill="none"
          stroke={ink.crack}
          strokeWidth={line.w}
          strokeLinecap="round"
          opacity="0.9"
        />
      ))}
      </g>
      {kind === 'SHAFT' && (
        <ellipse cx={variant === 1 ? 18 : 64} cy="24" rx="5" ry="7" fill={ink.deep} opacity="0.55" />
      )}
      {kind === 'VERTEBRA' && (
        <ellipse cx="40" cy="24" rx="7" ry="5" fill={ink.deep} opacity="0.4" />
      )}
      <path
        d={silhouette}
        fill="none"
        stroke={ink.crack}
        strokeWidth="0.7"
        strokeLinejoin="round"
      />
    </svg>
  );
};

function pores(seed: number): Array<{ x: number; y: number; r: number }> {
  return Array.from({ length: 8 }, (_, i) => {
    const n = (seed * 17 + i * 29) % 90;
    return {
      x: 14 + (n % 52),
      y: 10 + ((n * 3) % 28),
      r: 0.45 + (i % 3) * 0.35,
    };
  });
}

function shape(kind: BoneKind, broken: boolean, variant: number): string {
  const v = variant % 3;
  if (kind === 'SHAFT') {
    const forms = [
      'M4 26 L10 16 L18 20 L22 12 L30 18 L36 11 L46 17 L54 12 L66 18 L74 22 L70 30 L58 26 L50 34 L40 24 L28 34 L16 28 Z',
      'M8 18 L20 10 L34 16 L48 8 L62 14 L76 20 L72 28 L60 24 L48 32 L34 22 L18 30 L6 24 Z',
      'M6 30 L14 18 L24 26 L32 14 L42 22 L50 12 L60 20 L72 16 L76 28 L64 34 L52 26 L40 36 L26 28 L12 36 Z',
    ];
    return broken ? forms[v]! : forms[(v + 1) % 3]!;
  }
  if (kind === 'SKULL') {
    const forms = [
      'M8 34 C6 16 20 6 36 8 C52 4 70 14 68 28 L60 22 L52 34 L42 20 L32 32 L20 22 Z',
      'M14 36 C10 20 24 8 42 6 C60 8 72 18 66 34 C56 28 48 38 36 32 C24 40 16 36 14 36 Z',
      'M10 28 C12 12 28 4 46 8 C62 6 74 16 70 30 L58 24 L50 36 L38 22 L28 34 L16 24 Z',
    ];
    return forms[v]!;
  }
  if (kind === 'RIB') {
    const forms = [
      'M4 38 C18 16 36 6 72 18 C64 12 40 14 16 32 C10 36 6 40 4 38 Z',
      'M8 40 C16 22 30 10 48 12 C66 8 76 18 74 28 C66 22 50 24 34 32 C22 38 12 42 8 40 Z',
      'M6 34 C20 12 44 6 70 14 L64 22 C46 16 28 20 14 36 Z',
    ];
    return forms[v]!;
  }
  if (kind === 'VERTEBRA') {
    const forms = [
      'M40 8 C48 8 54 14 54 20 C62 16 72 20 70 28 C62 30 56 26 54 32 C54 40 46 44 40 44 C34 44 26 40 26 32 C22 28 12 32 12 24 C14 16 26 16 30 20 C32 12 34 8 40 8 Z',
      'M40 10 C50 10 56 16 54 24 C66 20 74 26 70 32 C60 30 54 28 52 36 C48 42 32 42 28 36 C24 30 16 34 12 26 C14 18 26 18 30 22 C32 14 34 10 40 10 Z',
      'M38 6 L46 14 H64 L58 22 H48 L54 40 H28 L34 22 H20 L14 14 H32 Z',
    ];
    return broken ? forms[2]! : forms[v % 2]!;
  }
  const joints = [
    'M18 34 C14 18 26 8 40 10 C54 8 66 18 62 34 C56 42 22 42 18 34 Z',
    'M12 28 C14 14 28 6 42 12 L50 6 L58 16 C68 14 74 26 66 36 C54 44 20 42 12 28 Z',
    'M20 36 C16 22 24 10 38 12 C48 6 60 12 64 24 C70 34 58 44 40 42 C24 44 16 40 20 36 Z',
  ];
  return joints[v]!;
}

/** Sandy cremains. Pale grey, darker grit, a few chips. Not a flat wash. */
export const AshField: React.FC<{ seed?: number; compact?: boolean }> = ({
  seed = 1,
  compact = false,
}) => {
  const count = compact ? 22 : 80;
  const grains = Array.from({ length: count }, (_, i) => {
    const n = (i * 17 + seed * 13) % 97;
    const x = (n * 9) % 100;
    const y = (n * 13 + i * 5) % 100;
    const r = compact ? 2.4 + (n % 5) * 1.3 : 0.7 + (n % 5) * 0.55;
    const fill = n % 7 === 0 ? '#3f3f46' : n % 4 === 0 ? '#d6d3d1' : n % 3 === 0 ? '#f5f5f4' : '#a8a29e';
    return { i, x, y, r, fill };
  });
  return (
    <svg viewBox="0 0 100 100" className="h-full w-full" aria-hidden preserveAspectRatio="none">
      {!compact && <rect width="100" height="100" fill="#d9d3c7" />}
      {grains.map((g) => (
        <ellipse
          key={g.i}
          cx={g.x}
          cy={g.y}
          rx={g.r}
          ry={g.r * (0.6 + (g.i % 3) * 0.2)}
          fill={g.fill}
          opacity={0.75}
        />
      ))}
    </svg>
  );
};

/** Rubber mallet for the cremulator tray. */
export const CrushHammer: React.FC<{ held?: boolean }> = ({ held = false }) => (
  <svg viewBox="0 0 86 150" className="h-full w-full" aria-hidden>
    <defs>
      <linearGradient id="crush-handle" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0" stopColor="#4a2c18" />
        <stop offset="0.45" stopColor="#c4894a" />
        <stop offset="0.72" stopColor="#8a5a2b" />
        <stop offset="1" stopColor="#3b2212" />
      </linearGradient>
      <linearGradient id="crush-rubber" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#3f3f46" />
        <stop offset="0.35" stopColor="#18181b" />
        <stop offset="1" stopColor="#09090b" />
      </linearGradient>
    </defs>
    <rect x="36" y="28" width="14" height="108" rx="6" fill="url(#crush-handle)" />
    <path d="M40 40 v84" stroke="#f5deb3" strokeWidth="1.2" opacity="0.35" />
    <rect x="30" y="22" width="26" height="10" rx="2" fill="#a1a1aa" />
    <rect x="8" y="6" width="70" height="28" rx="8" fill="url(#crush-rubber)" stroke="#52525b" strokeWidth="1.2" />
    <path d="M14 12 h52" stroke="#d4d4d8" strokeWidth="1.4" opacity="0.35" />
    <ellipse cx="43" cy="32" rx="28" ry="4" fill={held ? '#09090b' : '#18181b'} />
  </svg>
);

/**
 * Handheld cremains magnet. Drawn from the working shape: D-handle,
 * T-bar release, black housing, wide rare-earth face. Not a catalog photo.
 */
export const CremainsMagnet: React.FC = () => (
  <svg viewBox="0 0 90 120" className="h-full w-full" aria-hidden>
    <defs>
      <linearGradient id="mag-face" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#d4d4d8" />
        <stop offset="0.5" stopColor="#71717a" />
        <stop offset="1" stopColor="#3f3f46" />
      </linearGradient>
    </defs>
    <path
      d="M22 38 V18 C22 8 68 8 68 18 V38"
      fill="none"
      stroke="#18181b"
      strokeWidth="7"
      strokeLinecap="round"
    />
    <rect x="14" y="36" width="62" height="28" rx="3" fill="#18181b" stroke="#3f3f46" />
    <circle cx="28" cy="50" r="2.2" fill="#a1a1aa" />
    <circle cx="62" cy="50" r="2.2" fill="#a1a1aa" />
    <rect x="42" y="22" width="6" height="18" rx="1" fill="#a1a1aa" />
    <rect x="30" y="18" width="30" height="4" rx="1" fill="#e4e4e7" />
    <rect x="18" y="62" width="54" height="36" rx="2" fill="url(#mag-face)" stroke="#27272a" />
    <path d="M22 68 H68" stroke="#f4f4f5" strokeOpacity="0.35" />
    <rect x="16" y="94" width="58" height="6" rx="1" fill="#09090b" />
  </svg>
);

export const MetalBit: React.FC<{ kind: MetalKind }> = ({ kind }) => {
  if (kind === 'DENTAL_GOLD') {
    return (
      <svg viewBox="0 0 32 32" className="h-full w-full" aria-hidden>
        <path d="M8 14 H24 L22 26 H10 Z" fill="#eab308" stroke="#713f12" />
        <path d="M11 16 H20" stroke="#fef9c3" strokeOpacity="0.7" />
        <circle cx="16" cy="10" r="4" fill="#ca8a04" stroke="#713f12" />
      </svg>
    );
  }
  if (kind === 'PLATE') {
    return (
      <svg viewBox="0 0 40 24" className="h-full w-full" aria-hidden>
        <rect x="2" y="4" width="36" height="16" rx="2" fill="#a1a1aa" stroke="#27272a" />
        <path d="M4 7 H34" stroke="#f4f4f5" strokeOpacity="0.45" />
        <circle cx="10" cy="13" r="1.6" fill="#18181b" />
        <circle cx="20" cy="13" r="1.6" fill="#18181b" />
        <circle cx="30" cy="13" r="1.6" fill="#18181b" />
      </svg>
    );
  }
  if (kind === 'STAPLE') {
    return (
      <svg viewBox="0 0 32 28" className="h-full w-full" aria-hidden>
        <path d="M6 8 H26 V12 H22 V22 H18 V12 H14 V22 H10 V12 H6 Z" fill="#a8a29e" stroke="#292524" />
        <path d="M8 9.5 H24" stroke="#fafaf9" strokeOpacity="0.45" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 36" className="h-full w-full" aria-hidden>
      <path d="M7 10 H13 L12 30 H8 Z" fill="#a1a1aa" stroke="#27272a" />
      <ellipse cx="10" cy="8" rx="6" ry="3.2" fill="#d4d4d8" stroke="#27272a" />
      <path d="M6 8 H14" stroke="#18181b" strokeWidth="0.8" />
      <path d="M8 14 H12 M8 18 H12 M8 22 H12" stroke="#52525b" strokeWidth="0.6" />
    </svg>
  );
};
