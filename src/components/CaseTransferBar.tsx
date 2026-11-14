import React from 'react';
import type { CaseLocation, DecedentCase } from '../types/game';
import { decayLabel } from '../types/game';
import { useGameStore } from '../store/useGameStore';

interface Props {
  currentCase: DecedentCase;
  showVault?: boolean;
}

const DESTINATIONS: Array<{
  location: CaseLocation;
  label: string;
  className: string;
  when?: (c: DecedentCase) => boolean;
}> = [
  {
    location: 'COOLER',
    label: 'Move to Cooler',
    className: 'bg-cyan-700 active:bg-cyan-600',
  },
  {
    location: 'CHAPEL',
    label: 'Move to Chapel',
    className: 'bg-violet-700 active:bg-violet-600',
  },
  {
    location: 'URN_VAULT',
    label: 'Store in Urn Vault',
    className: 'bg-amber-600 active:bg-amber-500 text-slate-950',
    when: (c) => c.isUrnFilled,
  },
];

export const CaseTransferBar: React.FC<Props> = ({
  currentCase,
  showVault = false,
}) => {
  const moveActiveCaseTo = useGameStore((s) => s.moveActiveCaseTo);

  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      <span className="text-[11px] uppercase tracking-wider text-slate-500 mr-1">
        Transfer
      </span>
      {currentCase.decayLevel > 0 && (
        <span
          className={`text-[11px] font-mono px-2 py-1 rounded ${
            currentCase.decayLevel >= 40
              ? 'bg-red-900 text-red-200'
              : 'bg-amber-900/80 text-amber-200'
          }`}
        >
          Decay {Math.round(currentCase.decayLevel)}% ·{' '}
          {decayLabel(currentCase.decayLevel)}
        </span>
      )}
      {currentCase.embalmRank && (
        <span className="text-[11px] font-mono px-2 py-1 rounded bg-emerald-900/80 text-emerald-200">
          Embalm {currentCase.embalmRank}
        </span>
      )}
      {currentCase.cremationRank && (
        <span className="text-[11px] font-mono px-2 py-1 rounded bg-orange-900/80 text-orange-200">
          Cremation {currentCase.cremationRank}
        </span>
      )}
      {DESTINATIONS.filter((d) => {
        if (d.location === 'URN_VAULT' && !showVault) return false;
        if (d.location === currentCase.location) return false;
        return d.when ? d.when(currentCase) : true;
      }).map((d) => (
        <button
          key={d.location}
          type="button"
          onPointerDown={() => moveActiveCaseTo(d.location)}
          className={`px-3 py-2 rounded text-xs font-bold ${d.className}`}
        >
          {d.label}
        </button>
      ))}
    </div>
  );
};
