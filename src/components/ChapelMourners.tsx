import React, { useEffect, useState } from 'react';

type MournerVariant = 0 | 1 | 2 | 3;

interface MournerSpec {
  id: string;
  variant: MournerVariant;
  /** Normalized x within chapel floor */
  x: number;
  /** Normalized y — keep in pew band, behind focal */
  y: number;
  scale: number;
  delay: number;
}

const PEW_MOURNERS: MournerSpec[] = [
  { id: 'm1', variant: 0, x: 0.18, y: 0.78, scale: 0.92, delay: 0 },
  { id: 'm2', variant: 1, x: 0.3, y: 0.82, scale: 1, delay: 0.4 },
  { id: 'm3', variant: 2, x: 0.7, y: 0.81, scale: 0.95, delay: 0.8 },
  { id: 'm4', variant: 3, x: 0.82, y: 0.77, scale: 1.05, delay: 0.2 },
  { id: 'm5', variant: 1, x: 0.22, y: 0.68, scale: 0.85, delay: 1.1 },
  { id: 'm6', variant: 0, x: 0.78, y: 0.69, scale: 0.88, delay: 0.6 },
];

function MournerSvg({ variant }: { variant: MournerVariant }) {
  // Soft standing / seated silhouettes — simple shapes, no faces
  if (variant === 0) {
    return (
      <svg viewBox="0 0 40 70" className="w-full h-full" aria-hidden>
        <ellipse cx="20" cy="12" rx="8" ry="9" fill="currentColor" />
        <path
          d="M10 24 Q20 20 30 24 L32 58 Q20 62 8 58 Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  if (variant === 1) {
    return (
      <svg viewBox="0 0 40 70" className="w-full h-full" aria-hidden>
        <circle cx="20" cy="11" r="8" fill="currentColor" />
        <path
          d="M12 22 L28 22 L30 40 L26 55 L14 55 L10 40 Z"
          fill="currentColor"
        />
        <path d="M8 38 Q4 48 10 52" fill="currentColor" opacity="0.7" />
      </svg>
    );
  }
  if (variant === 2) {
    return (
      <svg viewBox="0 0 44 70" className="w-full h-full" aria-hidden>
        <ellipse cx="22" cy="13" rx="9" ry="10" fill="currentColor" />
        <path
          d="M8 26 Q22 18 36 26 L34 50 Q22 58 10 50 Z"
          fill="currentColor"
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 36 68" className="w-full h-full" aria-hidden>
      <circle cx="18" cy="10" r="7" fill="currentColor" />
      <rect x="10" y="20" width="16" height="28" rx="4" fill="currentColor" />
      <path d="M10 48 L8 62 L14 62 L16 48 Z" fill="currentColor" />
      <path d="M26 48 L28 62 L22 62 L20 48 Z" fill="currentColor" />
    </svg>
  );
}

/**
 * Semi-translucent mourners during active viewing services.
 * pointer-events-none — never blocks bier/urn/flower drags.
 * Not part of chapel layout pieces — ignored by satisfaction scoring.
 */
export const ChapelMourners: React.FC<{
  active: boolean;
}> = ({ active }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (active) {
      const t = window.setTimeout(() => setVisible(true), 40);
      return () => clearTimeout(t);
    }
    setVisible(false);
  }, [active]);

  if (!active && !visible) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none z-[1] overflow-hidden"
      aria-hidden
      style={{
        opacity: visible ? 1 : 0,
        transition: 'opacity 1.1s ease',
      }}
    >
      {PEW_MOURNERS.map((m) => (
        <div
          key={m.id}
          className="absolute -translate-x-1/2 -translate-y-full text-violet-950/45"
          style={{
            left: `${m.x * 100}%`,
            top: `${m.y * 100}%`,
            width: `${28 * m.scale}px`,
            height: `${48 * m.scale}px`,
            animation: `chapel-mourner-breathe 3.6s ease-in-out ${m.delay}s infinite`,
          }}
        >
          <MournerSvg variant={m.variant} />
        </div>
      ))}
    </div>
  );
};
