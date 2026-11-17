import React from 'react';

export type BoneKind = 'SHAFT' | 'SKULL' | 'RIB' | 'VERTEBRA' | 'KNUCKLE';
export type MetalKind = 'SCREW' | 'PLATE' | 'STAPLE' | 'DENTAL_GOLD';

const IVORY = '#f4efe6';
const CHALK = '#d6d3d1';
const PORE = '#a8a29e';
const CRACK = '#78716c';

export const BoneFragment: React.FC<{
  kind: BoneKind;
  /** 0 big, 1 medium, 2 small, 3 dust */
  stage: 0 | 1 | 2 | 3;
}> = ({ kind, stage }) => {
  if (stage === 3) {
    return (
      <svg viewBox="0 0 48 32" className="h-full w-full" aria-hidden>
        {Array.from({ length: 22 }, (_, i) => (
          <circle
            key={i}
            cx={4 + ((i * 11) % 40)}
            cy={4 + ((i * 7) % 24)}
            r={i % 5 === 0 ? 1.8 : i % 2 === 0 ? 1.15 : 0.7}
            fill={i % 3 === 0 ? '#fafaf9' : i % 3 === 1 ? IVORY : CHALK}
            opacity={0.8}
          />
        ))}
      </svg>
    );
  }
  if (stage === 2) {
    return (
      <svg viewBox="0 0 48 32" className="h-full w-full" aria-hidden>
        <path d="M6 22 L14 8 L22 18 L16 26 Z" fill={IVORY} stroke={CRACK} strokeWidth="0.6" />
        <path d="M24 6 L34 12 L30 22 L20 16 Z" fill={CHALK} stroke={CRACK} strokeWidth="0.6" />
        <path d="M28 20 L42 16 L44 26 L32 28 Z" fill={IVORY} stroke={CRACK} strokeWidth="0.6" />
        <path d="M10 12 l4 2 M26 10 l3 2" stroke="#fff" strokeOpacity="0.45" />
      </svg>
    );
  }
  const jagged = stage === 1;
  return (
    <svg viewBox="0 0 72 40" className="h-full w-full" aria-hidden>
      {kind === 'SHAFT' && (
        <g>
          <path
            d={
              jagged
                ? 'M8 20 C12 10 22 12 28 16 L34 8 L40 18 L48 12 L58 18 C66 16 70 24 62 28 L48 26 L40 34 L30 24 L18 30 C10 28 6 24 8 20 Z'
                : 'M6 20 C6 12 16 10 22 14 C30 8 40 8 48 14 C58 10 68 14 66 22 C66 30 56 32 48 28 C40 34 28 34 22 28 C14 32 6 28 6 20 Z'
            }
            fill={jagged ? CHALK : IVORY}
            stroke={CRACK}
            strokeWidth="0.8"
          />
          <path d="M18 18 C28 16 44 18 56 20" stroke="#fff" strokeOpacity="0.55" fill="none" />
          <path d="M24 22 C34 26 46 24 54 26" stroke={CRACK} strokeOpacity="0.45" fill="none" />
          {jagged && (
            <g fill={PORE}>
              <circle cx="36" cy="14" r="1.2" />
              <circle cx="40" cy="18" r="0.8" />
              <circle cx="33" cy="17" r="0.7" />
              <circle cx="50" cy="16" r="1" />
            </g>
          )}
        </g>
      )}
      {kind === 'SKULL' && (
        <g>
          <path
            d={
              jagged
                ? 'M10 28 C8 12 22 4 40 6 C58 4 68 16 64 28 L54 22 L48 30 L36 20 L28 30 L16 22 Z'
                : 'M8 26 C8 10 22 4 40 4 C58 4 70 14 66 28 C60 24 50 30 40 28 C28 32 16 28 8 26 Z'
            }
            fill={IVORY}
            stroke={CRACK}
            strokeWidth="0.8"
          />
          <path d="M18 16 C28 12 48 12 58 18" stroke="#fff" strokeOpacity="0.4" fill="none" />
          <path d="M24 20 C32 24 44 18 52 22" stroke={CRACK} strokeOpacity="0.5" fill="none" />
        </g>
      )}
      {kind === 'RIB' && (
        <path
          d={
            jagged
              ? 'M6 28 C18 8 40 6 66 18 L60 24 C40 14 22 18 12 30 Z'
              : 'M4 30 C16 8 40 4 68 16 C60 10 36 12 16 28 Z'
          }
          fill={IVORY}
          stroke={CRACK}
          strokeWidth="0.8"
        />
      )}
      {kind === 'VERTEBRA' && (
        <g>
          <ellipse cx="36" cy="20" rx={jagged ? 14 : 16} ry="12" fill={IVORY} stroke={CRACK} />
          <ellipse cx="36" cy="20" rx="6" ry="5" fill="#57534e" opacity="0.55" />
          <path d="M36 6 L40 14 L32 14 Z" fill={CHALK} stroke={CRACK} />
          <path d="M14 20 H22 M50 20 H58" stroke={CRACK} strokeWidth="3" strokeLinecap="round" />
          {jagged && <path d="M28 12 L36 22 L44 10" stroke={CRACK} fill="none" />}
        </g>
      )}
      {kind === 'KNUCKLE' && (
        <g>
          <path
            d="M16 28 C14 16 22 8 36 10 C50 8 60 16 58 26 C54 34 20 36 16 28 Z"
            fill={IVORY}
            stroke={CRACK}
          />
          <circle cx="28" cy="20" r="1.1" fill={PORE} />
          <circle cx="40" cy="18" r="0.8" fill={PORE} />
          <circle cx="36" cy="26" r="1" fill={PORE} />
          {jagged && <path d="M30 12 L34 24 L42 16" stroke={CRACK} fill="none" />}
        </g>
      )}
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
    <path d="M42 48 h6 M42 64 h6 M42 80 h5 M42 96 h6" stroke="#3b2212" strokeWidth="0.7" opacity="0.45" />
    <ellipse cx="43" cy="136" rx="9" ry="5" fill="#3b2212" />
    <rect x="30" y="22" width="26" height="10" rx="2" fill="#a1a1aa" />
    <path d="M32 24 h20" stroke="#f4f4f5" strokeWidth="1" opacity="0.7" />
    <rect x="8" y="6" width="70" height="28" rx="8" fill="url(#crush-rubber)" stroke="#52525b" strokeWidth="1.2" />
    <path d="M14 12 h52" stroke="#d4d4d8" strokeWidth="1.4" opacity="0.35" />
    <rect x="12" y="18" width="62" height="4" rx="1" fill="#27272a" />
    <ellipse cx="43" cy="32" rx="28" ry="4" fill={held ? '#09090b' : '#18181b'} />
    <circle cx="18" cy="16" r="1.3" fill="#a1a1aa" />
    <circle cx="68" cy="16" r="1.3" fill="#a1a1aa" />
  </svg>
);

export const MetalBit: React.FC<{ kind: MetalKind }> = ({ kind }) => {
  if (kind === 'DENTAL_GOLD') {
    return (
      <svg viewBox="0 0 32 32" className="h-full w-full" aria-hidden>
        <path d="M8 14 H24 L22 26 H10 Z" fill="#fbbf24" stroke="#92400e" />
        <path d="M10 16 H20" stroke="#fef3c7" />
        <circle cx="16" cy="10" r="4" fill="#f59e0b" stroke="#92400e" />
      </svg>
    );
  }
  if (kind === 'PLATE') {
    return (
      <svg viewBox="0 0 40 24" className="h-full w-full" aria-hidden>
        <rect x="2" y="4" width="36" height="16" rx="3" fill="#cbd5e1" stroke="#334155" />
        <rect x="4" y="6" width="32" height="3" fill="#f8fafc" opacity="0.7" />
        <circle cx="10" cy="12" r="2" fill="#0f172a" />
        <circle cx="20" cy="12" r="2" fill="#0f172a" />
        <circle cx="30" cy="12" r="2" fill="#0f172a" />
      </svg>
    );
  }
  if (kind === 'STAPLE') {
    return (
      <svg viewBox="0 0 32 28" className="h-full w-full" aria-hidden>
        <path
          d="M6 8 H26 V12 H22 V22 H18 V12 H14 V22 H10 V12 H6 Z"
          fill="#94a3b8"
          stroke="#1e293b"
        />
        <path d="M8 9 H24" stroke="#f8fafc" strokeOpacity="0.8" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 36" className="h-full w-full" aria-hidden>
      <rect x="6" y="8" width="8" height="24" rx="1" fill="#94a3b8" stroke="#1e293b" />
      <ellipse cx="10" cy="8" rx="7" ry="4" fill="#e2e8f0" stroke="#1e293b" />
      <path d="M6 8 H14" stroke="#0f172a" />
      <path d="M7 12 H13 M7 16 H13 M7 20 H13 M7 24 H13" stroke="#475569" />
    </svg>
  );
};
