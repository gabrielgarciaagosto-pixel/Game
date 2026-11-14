import React from 'react';

export type DesktopIconKind = 'VR441' | 'SHOP' | 'BANK' | 'REALTY';

const META: Record<
  DesktopIconKind,
  { label: string; short: string }
> = {
  VR441: { label: 'State Vital Records', short: 'VR-441' },
  SHOP: { label: 'Funerary Emporium', short: 'Shop' },
  BANK: { label: 'First National Bank', short: 'Bank' },
  REALTY: { label: 'Lychgate Realty', short: 'Realty' },
};

/** Crisp retro desktop icons — glyph art, phosphor-friendly edges. */
export const DesktopAppIcon: React.FC<{
  kind: DesktopIconKind;
  onOpen: () => void;
}> = ({ kind, onOpen }) => {
  const meta = META[kind];
  return (
    <button
      type="button"
      onClick={onOpen}
      style={{ touchAction: 'manipulation' }}
      className="desktop-app-icon flex flex-col items-center gap-1.5 p-2 rounded active:bg-white/10 group"
    >
      <div className="desktop-icon-face relative w-[3.35rem] h-[3.35rem] rounded-[0.35rem] border border-white/25 shadow-[0_0_12px_rgba(120,255,180,0.18),inset_0_1px_0_rgba(255,255,255,0.25)] overflow-hidden">
        <IconArt kind={kind} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/15 to-transparent" />
      </div>
      <span className="desktop-icon-label text-center text-[10px] font-semibold leading-tight max-w-[5.5rem] text-[#c8f5d8] drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)] group-active:text-white">
        {meta.label}
      </span>
    </button>
  );
};

function IconArt({ kind }: { kind: DesktopIconKind }) {
  switch (kind) {
    case 'VR441':
      return (
        <svg viewBox="0 0 56 56" className="w-full h-full" aria-hidden>
          <rect width="56" height="56" fill="#0d3d32" />
          <rect x="6" y="8" width="44" height="40" rx="2" fill="#145c4a" />
          <rect x="10" y="12" width="36" height="6" fill="#8fefc2" opacity="0.9" />
          <rect x="10" y="22" width="28" height="3" fill="#6bc49a" />
          <rect x="10" y="28" width="32" height="3" fill="#6bc49a" />
          <rect x="10" y="34" width="20" height="3" fill="#6bc49a" />
          <text
            x="28"
            y="48"
            textAnchor="middle"
            fill="#d7ffe8"
            fontSize="8"
            fontFamily="ui-monospace, monospace"
            fontWeight="700"
          >
            VR
          </text>
        </svg>
      );
    case 'SHOP':
      return (
        <svg viewBox="0 0 56 56" className="w-full h-full" aria-hidden>
          <rect width="56" height="56" fill="#3d2408" />
          <path d="M8 22 L14 12 H42 L48 22 Z" fill="#d4a04a" />
          <rect x="10" y="22" width="36" height="24" fill="#8a5a1e" />
          <rect x="22" y="30" width="12" height="16" fill="#2a1808" />
          <circle cx="28" cy="18" r="3" fill="#ffe6a8" />
          <text
            x="28"
            y="50"
            textAnchor="middle"
            fill="#ffe6a8"
            fontSize="9"
            fontFamily="ui-monospace, monospace"
            fontWeight="800"
          >
            $
          </text>
        </svg>
      );
    case 'BANK':
      return (
        <svg viewBox="0 0 56 56" className="w-full h-full" aria-hidden>
          <rect width="56" height="56" fill="#0a2e1c" />
          <polygon points="28,8 48,20 8,20" fill="#7dcea0" />
          <rect x="10" y="20" width="36" height="4" fill="#b8f0d0" />
          <rect x="12" y="26" width="6" height="16" fill="#5aab82" />
          <rect x="25" y="26" width="6" height="16" fill="#5aab82" />
          <rect x="38" y="26" width="6" height="16" fill="#5aab82" />
          <rect x="10" y="42" width="36" height="6" fill="#9ee0bc" />
        </svg>
      );
    case 'REALTY':
      return (
        <svg viewBox="0 0 56 56" className="w-full h-full" aria-hidden>
          <rect width="56" height="56" fill="#2c2418" />
          <rect x="10" y="18" width="36" height="28" fill="#c4a574" />
          <polygon points="28,8 48,18 8,18" fill="#8b6914" />
          <rect x="16" y="26" width="8" height="8" fill="#3d3224" />
          <rect x="32" y="26" width="8" height="8" fill="#3d3224" />
          <rect x="24" y="34" width="8" height="12" fill="#2a2118" />
          <rect x="8" y="46" width="40" height="3" fill="#e8d5a8" />
        </svg>
      );
  }
}
