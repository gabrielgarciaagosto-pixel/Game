import React, { useState } from 'react';
import {
  BRAND_OFFERS,
  BUTTON_OFFERS,
  DOOR_OFFERS,
  FUEL_TIERS,
  PREHEAT_PRICE,
  QUALITY_TIERS,
  QUEUE_PRICE,
  SPEED_TIERS,
  defaultRetortBay,
  brandLabel,
  buttonLabel,
  cremainsQualityScore,
  doorLabel,
  fuelCostFor,
  speedTimeFraction,
} from '../../data/crematoryCatalog';
import { nextFacilityTier } from '../../data/facilityUpgrades';
import { retortCount } from '../../retort/retortRoster';
import { useGameStore } from '../../store/useGameStore';
import { audioManager } from '../../utils/audioManager';

/**
 * Craigmile Crematory Corp. Brass-on-black cards, same family as Lampblack.
 * Stat lines show the current figure and the next one. A purchase lands on
 * the retort the player has selected.
 */
export const CrematoryCatalog: React.FC = () => {
  const cash = useGameStore((s) => s.cash);
  const levels = useGameStore((s) => s.facilityLevels);
  const wardrobe = useGameStore((s) => s.crematoryWardrobe);
  const bays = useGameStore((s) => s.retortBays);
  const active = useGameStore((s) => s.activeRetortIndex);
  const buyTrack = useGameStore((s) => s.buyCrematoryTrack);
  const buyTrim = useGameStore((s) => s.buyCrematoryCosmetic);
  const buyFacilityUpgrade = useGameStore((s) => s.buyFacilityUpgrade);
  const count = retortCount(levels);
  const [bayIndex, setBayIndex] = useState(() =>
    Math.max(0, Math.min(count - 1, active ?? 0))
  );
  const [note, setNote] = useState<string | null>(null);
  const index = Math.max(0, Math.min(count - 1, bayIndex));
  const bay = bays[index] ?? defaultRetortBay();
  const letter = String.fromCharCode(65 + index);
  const speedNow = Math.round(speedTimeFraction(bay.speedTier) * 100);
  const speedNext = SPEED_TIERS[bay.speedTier];
  const speedAfter = speedNext
    ? Math.round(speedTimeFraction(speedNext.tier) * 100)
    : speedNow;
  const qualityNow = cremainsQualityScore(bay.qualityTier);
  const qualityOffer = QUALITY_TIERS[bay.qualityTier];
  const qualityAfter = qualityOffer
    ? cremainsQualityScore(qualityOffer.tier)
    : qualityNow;
  const fuelNow = fuelCostFor(bay.fuelTier);
  const fuelOffer = FUEL_TIERS[bay.fuelTier];
  const fuelAfter = fuelOffer ? fuelCostFor(fuelOffer.tier) : fuelNow;
  const chamber = nextFacilityTier('retort_bay', levels.retort_bay ?? 0);
  const house = levels.crematory ?? 0;

  const flash = (result: { ok: boolean; message: string }) => {
    setNote(result.ok ? result.message : result.message);
  };

  return (
    <div
      className="h-full flex flex-col overflow-hidden text-[#f3ead7]"
      style={{
        fontFamily: '"Source Sans 3", "Segoe UI", sans-serif',
        background:
          'radial-gradient(120% 80% at 50% -10%, #3a3228 0%, #141210 42%, #0c0b0a 100%)',
      }}
    >
      <header className="shrink-0 px-3 pt-3 pb-2 border-b border-[#c4a574]/30">
        <p
          className="text-[10px] tracking-[0.28em] uppercase text-[#c4a574]"
          style={{ fontFamily: 'Cinzel, "Libre Baskerville", serif' }}
        >
          Est. 1947 · Tulsa works
        </p>
        <h2
          className="text-[1.35rem] leading-tight text-[#f6efe2]"
          style={{ fontFamily: 'Cinzel, "Libre Baskerville", serif' }}
        >
          Craigmile Crematory Corp
        </h2>
        <p className="text-[11px] text-[#d9cbb6] mt-0.5">
          Burners, brick, plates, and the buttons on the door
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
          <span className="px-2 py-0.5 rounded border border-[#c4a574]/40 bg-black/30">
            Cash ${cash.toLocaleString()}
          </span>
          <span className="px-2 py-0.5 rounded border border-[#c4a574]/40 bg-black/30">
            {count === 1 ? 'One retort' : `${count} retorts`}
          </span>
          {house > 0 && (
            <span className="px-2 py-0.5 rounded border border-[#c4a574]/40 bg-black/30">
              House efficiency {house}
            </span>
          )}
        </div>
        {count > 1 && (
          <div className="mt-2 flex gap-1.5">
            {Array.from({ length: count }).map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  audioManager.playUiClick('tick');
                  setBayIndex(i);
                }}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold border ${
                  i === index
                    ? 'bg-[#c4a574] text-[#1a140c] border-[#c4a574]'
                    : 'bg-black/30 text-[#f3ead7] border-[#c4a574]/30'
                }`}
              >
                Retort {String.fromCharCode(65 + i)}
              </button>
            ))}
          </div>
        )}
        <p className="mt-2 text-[11px] text-[#e7dcc8]">
          Buying for retort {letter}. A second chamber is a house purchase.
        </p>
      </header>
      {note && (
        <p className="px-3 py-1.5 text-[11px] text-[#c4a574] border-b border-[#c4a574]/20">
          {note}
        </p>
      )}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 pt-3 pb-36 space-y-2">
        <Card
          kicker="Speed"
          title={speedNext?.name ?? 'Speed line'}
          now={`Burn time ${speedNow}% of stock`}
          next={speedNext ? `${speedAfter}% of stock` : 'Finished'}
          price={speedNext?.price ?? null}
          flavor={
            speedNext?.flavor ??
            'Five tiers in. The clock will not go shorter on this line.'
          }
          owned={!speedNext}
          onBuy={
            speedNext
              ? () => flash(buyTrack('speed', index))
              : undefined
          }
        />
        <Card
          kicker="Quality"
          title={qualityOffer?.name ?? 'Quality line'}
          now={`Cremains ${qualityNow}`}
          next={qualityOffer ? `${qualityAfter}` : 'Finished'}
          price={qualityOffer?.price ?? null}
          flavor={
            qualityOffer?.flavor ??
            'Processor, cooling, and filtration are all in. Poor trays come up less often.'
          }
          owned={!qualityOffer}
          onBuy={qualityOffer ? () => flash(buyTrack('quality', index)) : undefined}
        />
        <Card
          kicker="Fuel"
          title={fuelOffer?.name ?? 'Fuel line'}
          now={`$${fuelNow} per firing`}
          next={fuelOffer ? `$${fuelAfter} per firing` : 'Finished'}
          price={fuelOffer?.price ?? null}
          flavor={
            fuelOffer?.flavor ??
            'The meter is as lean as this chamber gets.'
          }
          owned={!fuelOffer}
          onBuy={fuelOffer ? () => flash(buyTrack('fuel', index)) : undefined}
        />
        <Card
          kicker="Capacity"
          title="Pre-heat"
          now={bay.preheat ? 'Warm start' : 'Cold start'}
          next={bay.preheat ? 'Fitted' : 'Loads near 480°F'}
          price={bay.preheat ? null : PREHEAT_PRICE}
          flavor="The next case starts warm, and the purge is shorter."
          owned={bay.preheat}
          onBuy={bay.preheat ? undefined : () => flash(buyTrack('preheat', index))}
        />
        <Card
          kicker="Capacity"
          title="Queue slot"
          now={bay.queueSlot ? 'One waiting' : 'No queue'}
          next={bay.queueSlot ? 'Fitted' : 'Hold the next case'}
          price={bay.queueSlot ? null : QUEUE_PRICE}
          flavor="A cooler case waits, then loads when this chamber clears."
          owned={bay.queueSlot}
          onBuy={bay.queueSlot ? undefined : () => flash(buyTrack('queue', index))}
        />
        <Card
          kicker="Chambers"
          title={chamber?.label ?? 'Retort bays'}
          now={`${1 + (levels.retort_bay ?? 0)} retort${(levels.retort_bay ?? 0) > 0 ? 's' : ''}`}
          next={chamber ? chamber.effect : 'Three chambers'}
          price={chamber?.cost ?? null}
          flavor={
            chamber
              ? 'Needs floor space, the same way the other facility lines do.'
              : 'The house is at three retorts.'
          }
          owned={!chamber}
          onBuy={
            chamber
              ? () => {
                  const result = buyFacilityUpgrade('retort_bay');
                  flash({
                    ok: result.ok,
                    message:
                      result.message ??
                      (result.ok ? 'Chamber added' : 'Cannot add a chamber'),
                  });
                }
              : undefined
          }
        />

        <p className="pt-2 text-[10px] tracking-[0.22em] uppercase text-[#c4a574]">
          Plate, door, buttons
        </p>
        <TrimRow
          label="Showing"
          value={`${brandLabel(bay.brand)} · ${doorLabel(bay.door)} · ${buttonLabel(bay.buttons)}`}
        />
        {BRAND_OFFERS.map((offer) => (
          <Card
            key={offer.id}
            kicker="Brand"
            title={offer.name}
            now={bay.brand === offer.id ? 'On this retort' : brandLabel(bay.brand)}
            next={offer.name}
            price={wardrobe.brands.includes(offer.id) ? 0 : offer.price}
            flavor={offer.flavor}
            owned={bay.brand === offer.id}
            action={wardrobe.brands.includes(offer.id) ? 'Show' : 'Buy'}
            onBuy={() => flash(buyTrim('brand', offer.id, index))}
          />
        ))}
        <Card
          kicker="Brand"
          title="Millennium"
          now={bay.brand === 'millennium' ? 'On this retort' : brandLabel(bay.brand)}
          next="Millennium"
          price={0}
          flavor="The stock plate. Zinc, refractory, the buttons you already know."
          owned={bay.brand === 'millennium'}
          action="Show"
          onBuy={() => flash(buyTrim('brand', 'millennium', index))}
        />
        {DOOR_OFFERS.map((offer) => (
          <Card
            key={offer.id}
            kicker="Door"
            title={offer.name}
            now={bay.door === offer.id ? 'On this door' : doorLabel(bay.door)}
            next={offer.name}
            price={wardrobe.doors.includes(offer.id) ? 0 : offer.price}
            flavor={offer.flavor}
            owned={bay.door === offer.id}
            action={wardrobe.doors.includes(offer.id) ? 'Show' : 'Buy'}
            onBuy={() => flash(buyTrim('door', offer.id, index))}
          />
        ))}
        <Card
          kicker="Door"
          title="Mill zinc"
          now={bay.door === 'zinc' ? 'On this door' : doorLabel(bay.door)}
          next="Mill zinc"
          price={0}
          flavor="The original door face."
          owned={bay.door === 'zinc'}
          action="Show"
          onBuy={() => flash(buyTrim('door', 'zinc', index))}
        />
        {BUTTON_OFFERS.map((offer) => (
          <Card
            key={offer.id}
            kicker="Buttons"
            title={offer.name}
            now={bay.buttons === offer.id ? 'On the panel' : buttonLabel(bay.buttons)}
            next={offer.name}
            price={wardrobe.buttons.includes(offer.id) ? 0 : offer.price}
            flavor={offer.flavor}
            owned={bay.buttons === offer.id}
            action={wardrobe.buttons.includes(offer.id) ? 'Show' : 'Buy'}
            onBuy={() => flash(buyTrim('buttons', offer.id, index))}
          />
        ))}
        <Card
          kicker="Buttons"
          title="Millennium pushbuttons"
          now={
            bay.buttons === 'millennium'
              ? 'On the panel'
              : buttonLabel(bay.buttons)
          }
          next="Millennium pushbuttons"
          price={0}
          flavor="Round green, red, and silver. This is the default."
          owned={bay.buttons === 'millennium'}
          action="Show"
          onBuy={() => flash(buyTrim('buttons', 'millennium', index))}
        />
      </div>
    </div>
  );
};

function TrimRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-[#c4a574]/25 bg-black/25 px-2.5 py-2 text-[11px] text-[#e7dcc8]">
      <span className="text-[10px] uppercase tracking-wider text-[#c4a574]">
        {label}
      </span>
      <p>{value}</p>
    </div>
  );
}

function Card({
  kicker,
  title,
  now,
  next,
  price,
  flavor,
  owned,
  action,
  onBuy,
}: {
  kicker: string;
  title: string;
  now: string;
  next: string;
  price: number | null;
  flavor: string;
  owned?: boolean;
  action?: string;
  onBuy?: () => void;
}) {
  return (
    <section className="rounded-lg overflow-hidden border border-[#c4a574]/35 bg-[#171410]">
      <div className="px-2.5 py-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-[#c4a574]">
          {kicker}
        </p>
        <h3 className="font-serif text-[15px] leading-tight">{title}</h3>
        <p className="text-[12px] text-[#f3ead7] mt-1">
          {now}
          <span className="text-[#c4a574]"> → </span>
          {next}
        </p>
        <p className="text-[11px] text-[#e7dcc8]/75 mt-1 leading-snug">{flavor}</p>
      </div>
      <div className="px-2.5 pb-2">
        {owned ? (
          <p className="text-[11px] text-[#c4a574]">On this retort</p>
        ) : onBuy ? (
          <button
            type="button"
            onClick={() => {
              audioManager.playUiClick('tick');
              onBuy();
            }}
            className="w-full py-2 rounded bg-[#c4a574] text-[#1a140c] text-[12px] font-bold"
          >
            {action ?? 'Buy'}
            {price != null && price > 0 ? ` · $${price.toLocaleString()}` : ''}
            {price === 0 ? ' · owned' : ''}
          </button>
        ) : null}
      </div>
    </section>
  );
}
