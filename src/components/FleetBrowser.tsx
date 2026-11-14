import React, { useMemo, useState } from 'react';
import {
  FLEET_BRAND,
  FLEET_CATALOG,
  FLEET_CLASS_LABEL,
  fleetBonusLine,
  resolveCortege,
  type FleetClass,
  type FleetVehicle,
} from '../data/funeralFleets';
import { useGameStore } from '../store/useGameStore';
import { TapButton } from './TapButton';
import { FleetVehicleArt } from './fleets/FleetVehicleArt';

type Filter = 'ALL' | FleetClass;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'ALL', label: 'All' },
  { id: 'RECOVERY', label: 'Recovery' },
  { id: 'ESCORT', label: 'Escort' },
  { id: 'COACH', label: 'Coaches' },
];

/**
 * Lampblack Coach & Motor — cortege showroom.
 * Tap-safe cards; purchase confirm; assign or auto-best per class.
 */
export const FleetBrowser: React.FC = () => {
  const cash = useGameStore((s) => s.cash);
  const ownedFleetIds = useGameStore((s) => s.ownedFleetIds);
  const fleetAssignment = useGameStore((s) => s.fleetAssignment);
  const intermentScore = useGameStore((s) => s.intermentScore);
  const buyFleetVehicle = useGameStore((s) => s.buyFleetVehicle);
  const assignFleetVehicle = useGameStore((s) => s.assignFleetVehicle);

  const [filter, setFilter] = useState<Filter>('ALL');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    body: string;
    action: () => void;
  } | null>(null);

  const cortege = useMemo(
    () => resolveCortege(ownedFleetIds, fleetAssignment),
    [ownedFleetIds, fleetAssignment]
  );
  const detail = FLEET_CATALOG.find((v) => v.id === detailId) ?? null;
  const list = FLEET_CATALOG.filter(
    (v) => filter === 'ALL' || v.fleetClass === filter
  );

  const owned = (id: string) => ownedFleetIds.includes(id);

  const runBuy = (v: FleetVehicle) => {
    setConfirm({
      title: `Purchase ${v.name}`,
      body: `Add the ${v.tierName.toLowerCase()} ${v.name} to the garage for $${v.price.toLocaleString()}? ${fleetBonusLine(v)}. The cortege uses your best in each class unless you assign this one.`,
      action: () => {
        const r = buyFleetVehicle(v.id);
        setFlash(r.message);
        setConfirm(null);
      },
    });
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
          Est. 1912 · Cortege motorworks
        </p>
        <h2
          className="text-[1.35rem] leading-tight text-[#f6efe2]"
          style={{ fontFamily: 'Cinzel, "Libre Baskerville", serif' }}
        >
          {FLEET_BRAND}
        </h2>
        <p className="text-[11px] text-[#d9cbb6] mt-0.5">
          Recovery vans, escorts, and funeral coaches
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
          <span className="px-2 py-0.5 rounded border border-[#c4a574]/40 bg-black/30">
            Cash ${cash.toLocaleString()}
          </span>
          <span className="px-2 py-0.5 rounded border border-[#c4a574]/40 bg-black/30">
            Interment {intermentScore}
          </span>
          <span className="px-2 py-0.5 rounded border border-[#c4a574]/40 bg-black/30">
            Garage {ownedFleetIds.length}
          </span>
        </div>
      </header>

      <main className="flex-1 min-h-0 overflow-y-auto px-3 py-3 space-y-3 pb-16">
        {flash && (
          <div className="rounded border border-[#c4a574]/50 bg-[#2a2118] px-3 py-2 text-[12px] text-[#f6efe2]">
            {flash}
          </div>
        )}

        {!detail && (
          <>
            {filter === 'ALL' && (
              <section className="rounded-lg overflow-hidden border border-[#c4a574]/40 bg-[#1a1612]">
                <div className="h-36 bg-gradient-to-b from-[#3a342c] to-[#12100e]">
                  <FleetVehicleArt
                    vehicleId="coa_state_landaulette"
                    title="State Landaulette"
                  />
                </div>
                <div className="px-3 py-2">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-[#c4a574]">
                    House coach
                  </p>
                  <p
                    className="text-lg text-[#f6efe2]"
                    style={{ fontFamily: '"Libre Baskerville", Georgia, serif' }}
                  >
                    State Landaulette
                  </p>
                  <p className="text-[11px] text-[#d9cbb6]">
                    Six lamps, full landau cage · Interment +38
                  </p>
                </div>
              </section>
            )}

            <section className="rounded border border-[#c4a574]/25 bg-black/25 px-2.5 py-2 text-[11px] text-[#e7dcc8] space-y-0.5">
              <div className="text-[10px] uppercase tracking-wider text-[#c4a574]">
                Cortege tonight
              </div>
              <div>
                Recovery:{' '}
                {cortege.recovery
                  ? `${cortege.recovery.name} (${cortege.assigned.recovery ? 'assigned' : 'auto'})`
                  : 'none'}
              </div>
              <div>
                Escort:{' '}
                {cortege.escort
                  ? `${cortege.escort.name} (${cortege.assigned.escort ? 'assigned' : 'auto'})`
                  : 'none'}
              </div>
              <div>
                Coach:{' '}
                {cortege.coach
                  ? `${cortege.coach.name} (${cortege.assigned.coach ? 'assigned' : 'auto'})`
                  : 'none'}
              </div>
            </section>

            <div className="flex gap-1.5">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilter(f.id)}
                  style={{ touchAction: 'manipulation' }}
                  className={`flex-1 py-1.5 rounded text-[11px] font-semibold border ${
                    filter === f.id
                      ? 'bg-[#c4a574] text-[#1a140c] border-[#c4a574]'
                      : 'bg-black/30 text-[#f3ead7] border-[#c4a574]/30'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="space-y-3">
              {list.map((v) => (
                <TapButton
                  key={v.id}
                  onTap={() => setDetailId(v.id)}
                  className="w-full text-left rounded-lg overflow-hidden border border-[#c4a574]/35 bg-[#171410]"
                >
                  <div className="h-28 bg-gradient-to-b from-[#322c26] to-[#100e0c]">
                    <FleetVehicleArt vehicleId={v.id} title={v.name} />
                  </div>
                  <div className="p-3 space-y-1">
                    <div className="flex justify-between gap-2 items-start">
                      <h3
                        className="text-[#f6efe2] leading-snug"
                        style={{
                          fontFamily: '"Libre Baskerville", Georgia, serif',
                        }}
                      >
                        {v.name}
                      </h3>
                      <span className="shrink-0 text-[#e6c98a] font-semibold">
                        ${v.price.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#c4a574]">
                      {FLEET_CLASS_LABEL[v.fleetClass]} · {v.tierName} · {v.era}
                    </p>
                    <p className="text-[12px] text-[#e7dcc8]">{fleetBonusLine(v)}</p>
                    {owned(v.id) && (
                      <p className="text-[10px] uppercase tracking-wider text-[#9ddeaf]">
                        In the garage
                      </p>
                    )}
                  </div>
                </TapButton>
              ))}
            </div>
          </>
        )}

        {detail && (
          <article className="space-y-3">
            <TapButton
              onTap={() => setDetailId(null)}
              className="text-[12px] font-semibold text-[#e6c98a]"
            >
              ← Back to showroom
            </TapButton>
            <div className="rounded-lg overflow-hidden border border-[#c4a574]/40 bg-[#141210]">
              <div className="h-44 bg-gradient-to-b from-[#3a342c] to-[#0e0c0a]">
                <FleetVehicleArt vehicleId={detail.id} title={detail.name} />
              </div>
              <div className="p-3 space-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-[#c4a574]">
                    {FLEET_CLASS_LABEL[detail.fleetClass]} · {detail.tierName} ·{' '}
                    {detail.era}
                  </p>
                  <h3
                    className="text-2xl text-[#f6efe2]"
                    style={{
                      fontFamily: '"Libre Baskerville", Georgia, serif',
                    }}
                  >
                    {detail.name}
                  </h3>
                  <p className="text-[13px] text-[#e7dcc8] mt-1 leading-relaxed">
                    {detail.blurb}
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[12px] border-y border-[#c4a574]/25 py-3">
                  <Spec k="Asking" v={`$${detail.price.toLocaleString()}`} />
                  <Spec k="Bonus" v={fleetBonusLine(detail)} />
                  <Spec k="Length" v={detail.length} />
                  <Spec k="Power" v={detail.power} />
                  <Spec k="Crew" v={detail.crew} />
                  <Spec k="Finish" v={detail.finish} />
                </div>
                <p className="text-[11px] text-[#d9cbb6] leading-snug">
                  {detail.fleetClass === 'RECOVERY' &&
                    'Recovery vans add reputation when a service succeeds.'}
                  {detail.fleetClass === 'ESCORT' &&
                    'Escorts add cortege cash on a successful service.'}
                  {detail.fleetClass === 'COACH' &&
                    'Coaches add Interment for this service and the house total on the HUD.'}
                  {' '}
                  Best owned vehicle in each class rolls automatically.
                </p>
                {owned(detail.id) ? (
                  <div className="space-y-2">
                    <p className="text-[12px] text-[#9ddeaf]">In the garage.</p>
                    <TapButton
                      onTap={() => {
                        assignFleetVehicle(detail.fleetClass, detail.id);
                        setFlash(`${detail.name} assigned to the cortege.`);
                      }}
                      className="w-full py-2.5 rounded bg-[#c4a574] text-[#1a140c] text-[12px] font-bold"
                    >
                      Assign to cortege
                    </TapButton>
                    <TapButton
                      onTap={() => {
                        assignFleetVehicle(detail.fleetClass, null);
                        setFlash(
                          `${FLEET_CLASS_LABEL[detail.fleetClass]} set to auto-best.`
                        );
                      }}
                      className="w-full py-2 rounded border border-[#c4a574]/50 text-[12px] text-[#f3ead7]"
                    >
                      Use best in class
                    </TapButton>
                  </div>
                ) : (
                  <TapButton
                    onTap={() => runBuy(detail)}
                    className="w-full py-2.5 rounded bg-[#c4a574] text-[#1a140c] text-[13px] font-bold disabled:opacity-40"
                  >
                    Purchase · ${detail.price.toLocaleString()}
                  </TapButton>
                )}
              </div>
            </div>
          </article>
        )}
      </main>

      {confirm && (
        <div className="absolute inset-0 z-30 bg-black/60 flex items-end justify-center p-4">
          <div className="w-full max-w-sm rounded-lg border border-[#c4a574]/50 bg-[#1a1612] p-4 space-y-3">
            <h4
              className="text-[#f6efe2]"
              style={{ fontFamily: '"Libre Baskerville", Georgia, serif' }}
            >
              {confirm.title}
            </h4>
            <p className="text-[13px] text-[#e7dcc8]">{confirm.body}</p>
            <div className="flex gap-2">
              <TapButton
                onTap={() => setConfirm(null)}
                className="flex-1 py-2 rounded border border-[#c4a574]/40 text-[12px]"
              >
                Cancel
              </TapButton>
              <TapButton
                onTap={confirm.action}
                className="flex-1 py-2 rounded bg-[#c4a574] text-[#1a140c] text-[12px] font-bold"
              >
                Confirm
              </TapButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function Spec({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase text-[#c4a574]/80">{k}</div>
      <div className="font-semibold text-[#f6efe2]">{v}</div>
    </div>
  );
}
