import React, { useState } from 'react';
import {
  coolerBayCapacity,
  coolComposureUpgrades,
  nextFacilityTier,
  totalFacilitySpaceUsed,
} from '../../data/facilityUpgrades';
import { useGameStore } from '../../store/useGameStore';

/**
 * Cool Composure. Cold-storage catalog, same card rhythm as Craigmile,
 * in frost and stainless instead of brass.
 */
export const CoolComposureCatalog: React.FC = () => {
  const cash = useGameStore((s) => s.cash);
  const levels = useGameStore((s) => s.facilityLevels);
  const ownedProperty = useGameStore((s) => s.ownedProperty);
  const buyFacilityUpgrade = useGameStore((s) => s.buyFacilityUpgrade);
  const [note, setNote] = useState<string | null>(null);
  const lines = coolComposureUpgrades();
  const spaceUsed = totalFacilitySpaceUsed(levels);
  const spaceTotal = ownedProperty?.spaceTotal ?? 20;
  const bays = coolerBayCapacity(levels.cooler_bays ?? 0);

  return (
    <div
      className="h-full flex flex-col overflow-hidden text-[#e7f6f8]"
      style={{
        fontFamily: '"Source Sans 3", "Segoe UI", sans-serif',
        background:
          'radial-gradient(120% 80% at 50% -10%, #1c3c48 0%, #0c181e 46%, #070d11 100%)',
      }}
    >
      <header className="shrink-0 px-3 pt-3 pb-2 border-b border-[#9fd7e2]/30">
        <p
          className="text-[10px] tracking-[0.28em] uppercase text-[#9fd7e2]"
          style={{ fontFamily: 'Cinzel, "Libre Baskerville", serif' }}
        >
          Est. 1962 · Cold rooms
        </p>
        <h2
          className="text-[1.35rem] leading-tight text-[#f4fdff]"
          style={{ fontFamily: 'Cinzel, "Libre Baskerville", serif' }}
        >
          Cool Composure
        </h2>
        <p className="text-[11px] text-[#c5e4ea] mt-0.5">
          Drawers, coils, and the extra bays the house cooler can take.
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
          <span className="px-2 py-0.5 rounded border border-[#9fd7e2]/40 bg-black/30">
            Cash ${cash.toLocaleString()}
          </span>
          <span className="px-2 py-0.5 rounded border border-[#9fd7e2]/40 bg-black/30">
            {bays} cooler bays
          </span>
          <span className="px-2 py-0.5 rounded border border-[#9fd7e2]/40 bg-black/30">
            Floor {spaceUsed}/{spaceTotal}
          </span>
        </div>
      </header>
      {note && (
        <p className="px-3 py-1.5 text-[11px] text-[#9fd7e2] border-b border-[#9fd7e2]/20">
          {note}
        </p>
      )}
      <div className="fab-scroll-pad flex-1 min-h-0 overflow-y-auto px-3 pt-3 space-y-2">
        {lines.map((def) => {
          const level = levels[def.id] ?? 0;
          return (
            <section key={def.id} className="space-y-2">
              <p className="text-[11px] text-[#d5eef3]">{def.blurb}</p>
              {def.tiers.map((tier) => {
                const owned = level >= tier.tier;
                const next = nextFacilityTier(def.id, level);
                const isNext = next?.tier === tier.tier;
                const spaceOk = spaceUsed + tier.space <= spaceTotal;
                const canBuy = isNext && cash >= tier.cost && spaceOk;
                return (
                  <article
                    key={tier.tier}
                    className="rounded-lg border border-[#9fd7e2]/25 bg-black/30 px-3 py-2.5"
                  >
                    <p className="text-[10px] tracking-[0.18em] uppercase text-[#9fd7e2]">
                      Refrigeration
                    </p>
                    <h3 className="text-[15px] font-semibold text-[#f4fdff]">
                      {tier.label}
                    </h3>
                    <p className="text-[11px] text-[#d7eef2]">
                      {owned
                        ? 'On the floor'
                        : `${coolerBayCapacity(tier.tier - 1)} bays → ${tier.effect}`}
                    </p>
                    <p className="mt-1 text-[11px] text-[#b7d5dc]">
                      {tier.effect}. Uses {tier.space} facility space.
                      {def.name === 'Cooler Expansion'
                        ? ' The drawers stay in the cooler room.'
                        : ''}
                    </p>
                    {owned ? (
                      <p className="mt-2 text-[11px] font-semibold text-[#d8fbff]">
                        Installed
                      </p>
                    ) : (
                      <button
                        type="button"
                        disabled={!isNext}
                        onClick={() => {
                          if (!isNext) return;
                          const result = buyFacilityUpgrade(def.id);
                          setNote(
                            result.message ??
                              (result.ok
                                ? `${tier.label} installed`
                                : 'Cannot add that bay')
                          );
                        }}
                        className={`mt-2 w-full rounded py-2 text-[12px] font-semibold ${
                          canBuy
                            ? 'bg-[#d7eef3] text-[#102026]'
                            : 'bg-[#1a3038] text-[#9fd7e2]/70'
                        }`}
                      >
                        {!isNext
                          ? 'Later in the line'
                          : !spaceOk
                            ? 'Needs floor space'
                            : `Buy · $${tier.cost.toLocaleString()}`}
                      </button>
                    )}
                  </article>
                );
              })}
            </section>
          );
        })}
      </div>
    </div>
  );
};
