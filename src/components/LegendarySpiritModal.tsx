import React from 'react';
import { getCasketById } from '../data/casketCatalog';
import { legendarySpiritById } from '../data/legendarySpirits';
import { getUrnById } from '../data/urnCatalog';
import { useGameStore } from '../store/useGameStore';

function vesselName(kind: 'urn' | 'casket', id: string): string {
  if (kind === 'urn') return getUrnById(id)?.name ?? 'a vessel';
  return getCasketById(id)?.name ?? 'a vessel';
}

/**
 * Shown after the family note, and only when an S+ farewell rolled a six.
 * The player can let the spirit stay, or let them cross over.
 */
export const LegendarySpiritModal: React.FC = () => {
  const offer = useGameStore((s) => s.legendaryOffer);
  const feedback = useGameStore((s) => s.serviceFeedback);
  const kept = useGameStore((s) => s.legendaryKept);
  const stay = useGameStore((s) => s.keepLegendarySpirit);
  const cross = useGameStore((s) => s.crossLegendarySpirit);
  const spirit = offer ? legendarySpiritById(offer.spiritId) : null;

  if (!offer || !spirit || feedback) return null;

  const gift = vesselName(spirit.vesselKind, spirit.vesselId);
  const stillHere = kept.filter((row) => row.spiritId !== spirit.id);

  return (
    <div className="fixed inset-0 z-[11040] flex items-center justify-center bg-black/70 p-5 select-none">
      <div
        data-legendary-spirit
        className="max-h-[88vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#6e5a3a] bg-[#14110e] p-5 text-[#f3eadc] shadow-xl"
      >
        <p className="text-[10px] uppercase tracking-[0.22em] text-[#c4a574]">
          Legendary Spirit
        </p>
        <h2
          className="mt-1 text-xl"
          style={{ fontFamily: 'Cinzel, Georgia, serif' }}
        >
          {spirit.name}
        </h2>
        <p className="mt-1 text-[12px] text-[#d9cbb8]">
          The house rolled a {offer.die}. Someone stayed after{' '}
          {offer.decedentName}.
        </p>
        <p className="mt-3 text-sm leading-relaxed text-[#f3eadc]">{spirit.hint}</p>
        <p className="mt-3 text-sm leading-relaxed text-[#d9cbb8]">{spirit.story}</p>
        <p className="mt-3 text-sm leading-relaxed text-[#f3eadc]">{spirit.quirk}</p>
        <p className="mt-3 text-sm leading-relaxed text-[#d9cbb8]">{spirit.rival}</p>
        {offer.showSecret ? (
          <p className="mt-3 text-sm leading-relaxed text-[#e6c98a]">{spirit.secret}</p>
        ) : null}
        {stillHere.length > 0 ? (
          <p className="mt-3 text-[12px] leading-snug text-[#b7aa98]">
            Still with the house:{' '}
            {stillHere
              .map((row) => legendarySpiritById(row.spiritId)?.name ?? 'a friend')
              .join(', ')}
            .
          </p>
        ) : null}
        <p className="mt-4 text-sm leading-relaxed text-[#f3eadc]">
          They can stay, quiet, in the house. Or they can cross over. Crossing
          over lifts the house a little, and sometimes leaves {gift}.
        </p>
        <div className="mt-4 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => stay()}
            className="w-full rounded-lg border border-[#6e5a3a] py-2.5 text-sm font-bold text-[#f3eadc]"
          >
            Stay with the house
          </button>
          <button
            type="button"
            onClick={() => cross()}
            className="w-full rounded-lg bg-[#c4a574] py-2.5 text-sm font-bold text-[#1a140e]"
          >
            Let them cross over
          </button>
        </div>
      </div>
    </div>
  );
};
