import React from 'react';
import { titleAt } from '../data/rankProgression';
import { useGameStore } from '../store/useGameStore';

/** The moment a house title changes. One card, even if several titles were crossed. */
export const RankFanfare: React.FC = () => {
  const fanfare = useGameStore((s) => s.rankFanfare);
  const dismiss = useGameStore((s) => s.dismissRankFanfare);
  if (!fanfare) return null;
  const from = titleAt(fanfare.fromIndex);
  const to = titleAt(fanfare.toIndex);
  const jumped = to.index - from.index > 1;
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-6"
      data-rank-up
      data-rank-title={to.title}
      data-rank-tier={to.tier}
    >
      <div className="w-full max-w-sm rounded-2xl border border-amber-200/40 bg-[#1a140c] px-6 py-7 text-center shadow-[0_24px_80px_rgba(0,0,0,0.55)]">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-200/80">
          House rank
        </p>
        <p className="mt-3 font-serif text-5xl leading-none text-amber-100">{to.tier}</p>
        <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-amber-200/70">
          {to.tierName}
        </p>
        <h2 className="mt-3 font-serif text-2xl text-[#f6efe4]">{to.title}</h2>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">
          {jumped
            ? `${from.title} is behind you. The house skipped ahead and now keeps you as ${to.title}.`
            : `${from.title} gives way. The house now keeps you as ${to.title}.`}
        </p>
        <button
          type="button"
          onClick={dismiss}
          onPointerDown={dismiss}
          className="mt-6 w-full rounded-full bg-amber-200 py-2.5 text-sm font-black text-amber-950"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
