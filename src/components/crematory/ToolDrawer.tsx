import React from 'react';
import type { SweepTool } from '../../types/game';
import { ToolArt } from './crematoryArt';

export const CREMATORY_TOOLS: {
  id: SweepTool;
  name: string;
  blurb: string;
}[] = [
  {
    id: 'STIRRING_ROD',
    name: 'Stirring Rod',
    blurb: 'Orbit the charge in circles. Door past 16%; primary on.',
  },
  {
    id: 'IRON_RAKE',
    name: 'Iron Rake',
    blurb: 'Sweep large bones downward. Nudges remains on contact.',
  },
  {
    id: 'BRISTLE_BRUSH',
    name: 'Hand Brush',
    blurb: 'Sweep fragments downward. The bristles flex in the ash.',
  },
  {
    id: 'HAND_BRUSH',
    name: 'Ash Brush',
    blurb: 'Sweep fine ash. Raises dust when it kisses the heap.',
  },
];

export const ToolDrawer: React.FC<{
  open: boolean;
  activeTool: SweepTool | null;
  attention?: boolean;
  onToggle: () => void;
  onSelect: (tool: SweepTool) => void;
}> = ({ open, activeTool, attention, onToggle, onSelect }) => {
  return (
    <div className="relative z-[70]">
      {open && (
        <div className="absolute bottom-[calc(100%+0.5rem)] left-0 w-[min(92vw,22rem)] max-h-[62vh] overflow-y-auto rounded-2xl border border-stone-500/80 bg-gradient-to-b from-zinc-800 to-zinc-950 shadow-2xl p-2 space-y-1.5">
          <div className="px-1 pb-1 flex items-baseline justify-between">
            <span className="text-[10px] font-black tracking-[0.2em] text-amber-200">
              CREMATORY TOOLS
            </span>
            <span className="text-[9px] text-stone-400">Tap to take in hand</span>
          </div>
          {CREMATORY_TOOLS.map((tool) => {
            const selected = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onSelect(tool.id);
                }}
                className={`w-full flex items-center gap-3 rounded-xl border px-2 py-1.5 text-left ${
                  selected
                    ? 'border-amber-400 bg-amber-950/50'
                    : 'border-zinc-600 bg-zinc-900/80'
                }`}
              >
                <div className="w-14 h-20 shrink-0 rounded-lg bg-gradient-to-b from-zinc-700 to-zinc-950 border border-zinc-600 flex items-center justify-center overflow-hidden">
                  <ToolArt
                    tool={tool.id}
                    className={
                      tool.id === 'BRISTLE_BRUSH'
                        ? 'h-[4.6rem] w-auto'
                        : 'h-[4.6rem] w-auto rotate-180'
                    }
                  />
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-bold text-stone-100">{tool.name}</div>
                  <div className="text-[10px] leading-snug text-stone-400">
                    {tool.blurb}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onPointerDown={(e) => {
          e.stopPropagation();
          onToggle();
        }}
        className={`w-16 h-16 rounded-2xl border-2 shadow-lg flex flex-col items-center justify-center gap-0.5 ${
          open
            ? 'bg-amber-600 border-amber-200 text-stone-950'
            : 'bg-gradient-to-b from-zinc-500 to-zinc-800 border-zinc-300 text-amber-100'
        } ${attention && !open ? 'animate-pulse' : ''}`}
      >
        <span className="text-lg leading-none">⚒</span>
        <span className="text-[9px] font-black tracking-wider">
          {open ? 'CLOSE' : 'TOOLS'}
        </span>
      </button>
    </div>
  );
};
