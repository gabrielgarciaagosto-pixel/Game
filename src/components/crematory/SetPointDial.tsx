import React, { useRef } from 'react';

interface SetPointDialProps {
  value: number;
  min: number;
  max: number;
  label: string;
  unit?: string;
  size?: 'sm' | 'md';
  onChange: (next: number) => void;
}

/** Hold and slide sideways. The knob rotates with the set point. */
export const SetPointDial: React.FC<SetPointDialProps> = ({
  value,
  min,
  max,
  label,
  unit = '°F',
  size = 'md',
  onChange,
}) => {
  const drag = useRef<{ x: number; value: number } | null>(null);
  const span = Math.max(1, max - min);
  const clamped = Math.min(max, Math.max(min, value));
  const angle = -135 + ((clamped - min) / span) * 270;
  const dim = size === 'sm' ? 'w-[4.6rem] h-[4.6rem]' : 'w-[5.6rem] h-[5.6rem]';

  const apply = (clientX: number) => {
    if (!drag.current) return;
    const dx = clientX - drag.current.x;
    const raw = drag.current.value + (dx / 150) * span;
    const stepped = Math.round(raw / 5) * 5;
    onChange(Math.min(max, Math.max(min, stepped)));
  };

  return (
    <div className="flex flex-col items-center select-none">
      <div className="text-[8px] font-black tracking-[0.16em] text-amber-200/90 mb-1">
        {label}
      </div>
      <div
        role="slider"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={clamped}
        aria-label={`${label} set point`}
        className={`${dim} relative rounded-full touch-none cursor-ew-resize`}
        style={{
          background:
            'radial-gradient(circle at 35% 30%, #fcd9a0, #b45309 42%, #78350f 70%, #1c1917 100%)',
          boxShadow:
            'inset 0 2px 3px rgba(255,255,255,0.45), 0 6px 10px rgba(0,0,0,0.45)',
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          e.preventDefault();
          (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
          drag.current = { x: e.clientX, value: clamped };
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          apply(e.clientX);
        }}
        onPointerUp={() => {
          drag.current = null;
        }}
        onPointerCancel={() => {
          drag.current = null;
        }}
      >
        <svg viewBox="0 0 100 100" className="absolute inset-[7%] w-[86%] h-[86%]">
          <circle cx="50" cy="50" r="46" fill="#18181b" stroke="#3f3f46" strokeWidth="2" />
          {Array.from({ length: 19 }).map((_, i) => {
            const a = ((-135 + i * (270 / 18)) * Math.PI) / 180;
            const inner = i % 3 === 0 ? 30 : 34;
            return (
              <line
                key={i}
                x1={50 + Math.cos(a) * inner}
                y1={50 + Math.sin(a) * inner}
                x2={50 + Math.cos(a) * 42}
                y2={50 + Math.sin(a) * 42}
                stroke={i % 3 === 0 ? '#fbbf24' : '#71717a'}
                strokeWidth={i % 3 === 0 ? 1.6 : 0.8}
              />
            );
          })}
          <g style={{ transform: `rotate(${angle}deg)`, transformOrigin: '50px 50px' }}>
            <line x1="50" y1="50" x2="50" y2="16" stroke="#fb923c" strokeWidth="3" strokeLinecap="round" />
            <circle cx="50" cy="16" r="2.4" fill="#ffedd5" />
          </g>
          <circle cx="50" cy="50" r="16" fill="#27272a" stroke="#a16207" strokeWidth="1.5" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="font-mono text-[10px] text-amber-200 leading-none mt-0.5 tabular-nums">
            {Math.round(clamped)}
          </span>
        </div>
      </div>
      <div className="text-[8px] text-stone-400 mt-1 tracking-wide">
        HOLD · SLIDE · {unit}
      </div>
    </div>
  );
};
