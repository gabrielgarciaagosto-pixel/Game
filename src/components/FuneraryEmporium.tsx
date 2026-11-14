import React, { useEffect, useMemo, useState } from 'react';
import {
  URN_CATALOG,
  URN_MATERIALS,
  type UrnCatalogEntry,
  type UrnMaterial,
} from '../data/urnCatalog';
import {
  CASKET_CATALOG,
  CASKET_MATERIALS,
  type CasketCatalogEntry,
  type CasketMaterial,
} from '../data/casketCatalog';
import { CHAPEL_DECOR_CATALOG } from '../data/chapelDecor';
import {
  FACILITY_UPGRADES,
  missingCollectionReqs,
  nextFacilityTier,
} from '../data/facilityUpgrades';
import {
  ALWAYS_CASKET_IDS,
  ALWAYS_URN_IDS,
  formatHourRange,
  getRemainingRareStock,
  liveRares,
  upcomingRares,
  type RareScheduleEntry,
} from '../data/shopRotation';
import { useGameStore } from '../store/useGameStore';
import { UrnVessel } from './urns/UrnVessel';
import { CasketVessel } from './caskets/CasketVessel';

type Tab = 'URNS' | 'CASKETS' | 'CHAPEL' | 'UPGRADES' | 'MERCH';

export const FuneraryEmporium: React.FC = () => {
  const {
    cash,
    reputation,
    urnInventory,
    casketInventory,
    chapelOwnedDecor,
    facilityLevels,
    shopRotation,
    showroomInventory,
    buyUrn,
    buyCasket,
    buyChapelDecor,
    buyFacilityUpgrade,
    buyShowroomItem,
    setActiveStation,
  } = useGameStore();

  const [tab, setTab] = useState<Tab>('URNS');
  const [urnFilter, setUrnFilter] = useState<UrnMaterial | 'ALL'>('ALL');
  const [casketFilter, setCasketFilter] = useState<CasketMaterial | 'ALL'>(
    'ALL'
  );
  const [inspectUrnId, setInspectUrnId] = useState<string | null>(null);
  const [inspectCasketId, setInspectCasketId] = useState<string | null>(null);
  const [nowTick, setNowTick] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  const now = useMemo(() => new Date(nowTick), [nowTick]);
  const hourLabel = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  const live = useMemo(() => liveRares(now), [now]);
  const upcoming = useMemo(() => upcomingRares(now, 8), [now]);

  const alwaysUrns = useMemo(
    () =>
      URN_CATALOG.filter(
        (u) =>
          (ALWAYS_URN_IDS as readonly string[]).includes(u.id) &&
          (urnFilter === 'ALL' || u.material === urnFilter)
      ),
    [urnFilter]
  );

  const rareUrnsLive = useMemo(
    () =>
      live
        .filter((e) => e.kind === 'urn')
        .map((e) => ({
          entry: e,
          urn: URN_CATALOG.find((u) => u.id === e.id),
          stock: getRemainingRareStock(shopRotation, e, now),
        }))
        .filter(
          (x): x is { entry: RareScheduleEntry; urn: UrnCatalogEntry; stock: number } =>
            !!x.urn && x.stock > 0
        ),
    [live, shopRotation, now]
  );

  const alwaysCaskets = useMemo(
    () =>
      CASKET_CATALOG.filter(
        (c) =>
          (ALWAYS_CASKET_IDS as readonly string[]).includes(c.id) &&
          (casketFilter === 'ALL' || c.material === casketFilter)
      ),
    [casketFilter]
  );

  const rareCasketsLive = useMemo(
    () =>
      live
        .filter((e) => e.kind === 'casket')
        .map((e) => ({
          entry: e,
          casket: CASKET_CATALOG.find((c) => c.id === e.id),
          stock: getRemainingRareStock(shopRotation, e, now),
        }))
        .filter(
          (
            x
          ): x is {
            entry: RareScheduleEntry;
            casket: CasketCatalogEntry;
            stock: number;
          } => !!x.casket && x.stock > 0
        ),
    [live, shopRotation, now]
  );

  const merch = showroomInventory.filter((i) => i.category !== 'URN');
  const inspectedUrn = URN_CATALOG.find((u) => u.id === inspectUrnId) ?? null;
  const inspectedCasket =
    CASKET_CATALOG.find((c) => c.id === inspectCasketId) ?? null;

  const jumpToRequirement = (kind: 'urn' | 'casket', id: string) => {
    if (kind === 'urn') {
      setTab('URNS');
      setInspectUrnId(id);
    } else {
      setTab('CASKETS');
      setInspectCasketId(id);
    }
  };

  return (
    <div className="safe-screen fixed inset-0 z-50 bg-[#140f0c] text-amber-50 flex flex-col select-none overflow-hidden">
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background:
            'radial-gradient(70% 50% at 50% 0%, rgba(180,83,9,0.35), transparent 60%), linear-gradient(180deg, #1c1410, #0c0a09)',
        }}
      />

      <div className="relative shrink-0 px-1 pb-2 border-b border-amber-900/50">
        <div className="flex justify-between items-start gap-2">
          <div className="min-w-0">
            <p className="text-[10px] tracking-[0.28em] text-amber-200/70 font-semibold">
              MORTUARY MERCHANDISE
            </p>
            <h2 className="text-xl font-black tracking-wide text-amber-100 leading-tight">
              Funerary Emporium
            </h2>
            <p className="text-[11px] text-stone-400">
              Cash ${cash.toLocaleString()} · Rep {reputation} · Clock{' '}
              <span className="text-amber-200 font-mono">{hourLabel}</span>
            </p>
          </div>
          <button
            type="button"
            onPointerDown={() => setActiveStation('OVERVIEW')}
            className="px-3 py-1.5 bg-stone-900 border border-stone-700 rounded text-xs font-semibold shrink-0"
          >
            Back
          </button>
        </div>

        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {(
            [
              ['URNS', 'Urns'],
              ['CASKETS', 'Caskets'],
              ['CHAPEL', 'Chapel Decor'],
              ['UPGRADES', 'Upgrades'],
              ['MERCH', 'Merch'],
            ] as const
          ).map(([id, label]) => (
            <FilterChip
              key={id}
              active={tab === id}
              label={label}
              onPress={() => setTab(id)}
            />
          ))}
        </div>
      </div>

      <div className="relative flex-1 min-h-0 overflow-y-auto p-2 pb-24">
        {tab === 'URNS' && (
          <>
            <HintsRow upcoming={upcoming.filter((u) => u.kind === 'urn')} />
            <div className="flex gap-1.5 overflow-x-auto pb-2">
              <FilterChip
                active={urnFilter === 'ALL'}
                label="All"
                onPress={() => setUrnFilter('ALL')}
              />
              {URN_MATERIALS.map((m) => (
                <FilterChip
                  key={m}
                  active={urnFilter === m}
                  label={m}
                  onPress={() => setUrnFilter(m)}
                />
              ))}
            </div>
            {rareUrnsLive.length > 0 && (
              <section className="mb-3">
                <h3 className="text-[10px] font-black tracking-[0.2em] text-amber-300 mb-1.5">
                  LIMITED — LIVE NOW (~2h)
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {rareUrnsLive.map(({ urn, entry, stock }) => (
                    <UrnCard
                      key={urn.id}
                      urn={urn}
                      owned={urnInventory[urn.id] ?? 0}
                      reputation={reputation}
                      cash={cash}
                      rare={entry}
                      stock={stock}
                      onInspect={() => setInspectUrnId(urn.id)}
                      onBuy={() => buyUrn(urn.id)}
                    />
                  ))}
                </div>
              </section>
            )}
            <h3 className="text-[10px] font-black tracking-[0.2em] text-stone-400 mb-1.5">
              FLOOR STOCK
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {alwaysUrns.map((urn) => (
                <UrnCard
                  key={urn.id}
                  urn={urn}
                  owned={urnInventory[urn.id] ?? 0}
                  reputation={reputation}
                  cash={cash}
                  onInspect={() => setInspectUrnId(urn.id)}
                  onBuy={() => buyUrn(urn.id)}
                />
              ))}
            </div>
          </>
        )}

        {tab === 'CASKETS' && (
          <>
            <HintsRow upcoming={upcoming.filter((u) => u.kind === 'casket')} />
            <div className="flex gap-1.5 overflow-x-auto pb-2">
              <FilterChip
                active={casketFilter === 'ALL'}
                label="All"
                onPress={() => setCasketFilter('ALL')}
              />
              {CASKET_MATERIALS.map((m) => (
                <FilterChip
                  key={m}
                  active={casketFilter === m}
                  label={m}
                  onPress={() => setCasketFilter(m)}
                />
              ))}
            </div>
            {rareCasketsLive.length > 0 && (
              <section className="mb-3">
                <h3 className="text-[10px] font-black tracking-[0.2em] text-amber-300 mb-1.5">
                  LIMITED — LIVE NOW (~2h)
                </h3>
                <div className="grid grid-cols-2 gap-2.5">
                  {rareCasketsLive.map(({ casket, entry, stock }) => (
                    <CasketCard
                      key={casket.id}
                      casket={casket}
                      owned={casketInventory[casket.id] ?? 0}
                      reputation={reputation}
                      cash={cash}
                      rare={entry}
                      stock={stock}
                      onInspect={() => setInspectCasketId(casket.id)}
                      onBuy={() => buyCasket(casket.id)}
                    />
                  ))}
                </div>
              </section>
            )}
            <h3 className="text-[10px] font-black tracking-[0.2em] text-stone-400 mb-1.5">
              FLOOR STOCK
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              {alwaysCaskets.map((casket) => (
                <CasketCard
                  key={casket.id}
                  casket={casket}
                  owned={casketInventory[casket.id] ?? 0}
                  reputation={reputation}
                  cash={cash}
                  onInspect={() => setInspectCasketId(casket.id)}
                  onBuy={() => buyCasket(casket.id)}
                />
              ))}
            </div>
          </>
        )}

        {tab === 'CHAPEL' && (
          <div className="space-y-2">
            <p className="text-[11px] text-stone-400 mb-2">
              Permanent chapel upgrades. Once bought, they stay for every future
              service and add ongoing satisfaction.
            </p>
            {CHAPEL_DECOR_CATALOG.map((item) => {
              const owned = chapelOwnedDecor.includes(item.id);
              const canBuy = !owned && cash >= item.cost;
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-amber-900/50 bg-gradient-to-r from-stone-900 to-stone-950 p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-amber-100 text-sm">
                      {item.name}
                      <span className="ml-1 text-[9px] text-stone-500">
                        T{item.tier} · {item.kind}
                      </span>
                    </div>
                    <div className="text-[10px] text-stone-400">{item.blurb}</div>
                    <div className="text-[10px] text-emerald-400/90 mt-0.5">
                      +{item.satisfactionBonus} sat
                      {item.standSlots ? ` · +${item.standSlots} stands` : ''}
                    </div>
                  </div>
                  {owned ? (
                    <span className="text-[10px] font-bold text-emerald-400 shrink-0">
                      OWNED
                    </span>
                  ) : (
                    <button
                      type="button"
                      disabled={!canBuy}
                      onPointerDown={() => buyChapelDecor(item.id)}
                      className={`px-3 py-2 rounded font-bold text-xs shrink-0 ${
                        canBuy
                          ? 'bg-amber-500 text-stone-950'
                          : 'bg-stone-800 text-stone-500'
                      }`}
                    >
                      Buy ${item.cost}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'UPGRADES' && (
          <div className="space-y-3">
            <p className="text-[11px] text-amber-100/80 bg-amber-950/40 border border-amber-800/50 rounded-lg p-2">
              Collection requirements are <strong>ownership-only</strong>. Required
              urns and caskets stay in your collection — upgrades never consume
              them.
            </p>
            {FACILITY_UPGRADES.map((def) => {
              const level = facilityLevels[def.id] ?? 0;
              const tier = nextFacilityTier(def.id, level);
              const missing = tier
                ? missingCollectionReqs(
                    tier.requires,
                    urnInventory,
                    casketInventory
                  )
                : [];
              const canBuy = !!tier && cash >= tier.cost && missing.length === 0;
              return (
                <div
                  key={def.id}
                  className="rounded-xl border border-amber-900/50 bg-stone-950/80 p-3"
                >
                  <div className="font-bold text-amber-100">{def.name}</div>
                  <div className="text-[10px] text-stone-400 mb-1">
                    {def.blurb} · Level {level}/{def.tiers.length}
                  </div>
                  {tier ? (
                    <>
                      <div className="text-[11px] text-stone-200 mb-1">
                        Next: <strong>{tier.label}</strong> — {tier.effect} · $
                        {tier.cost}
                      </div>
                      {tier.requires.length > 0 && (
                        <div className="text-[10px] mb-2 space-y-0.5">
                          <div className="text-stone-400">
                            Requires owning (not consumed):
                          </div>
                          {tier.requires.map((r) => {
                            const ok = !missing.some((m) => m.id === r.id);
                            return (
                              <button
                                key={r.id}
                                type="button"
                                onPointerDown={() =>
                                  jumpToRequirement(r.kind, r.id)
                                }
                                className={`block text-left underline-offset-2 ${
                                  ok
                                    ? 'text-emerald-400'
                                    : 'text-red-300 underline'
                                }`}
                              >
                                {ok ? '✓' : '✗'} {r.label}{' '}
                                <span className="text-stone-500">
                                  ({r.kind}) → shop
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                      <button
                        type="button"
                        disabled={!canBuy}
                        onPointerDown={() => buyFacilityUpgrade(def.id)}
                        className={`px-3 py-2 rounded font-bold text-xs ${
                          canBuy
                            ? 'bg-amber-500 text-stone-950'
                            : 'bg-stone-800 text-stone-500'
                        }`}
                      >
                        Upgrade ${tier.cost}
                      </button>
                    </>
                  ) : (
                    <div className="text-[11px] text-emerald-400 font-bold">
                      MAXED
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'MERCH' && (
          <div className="space-y-2">
            {merch.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-amber-900/50 bg-gradient-to-r from-stone-900 to-stone-950 p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="font-bold text-amber-100">{item.name}</div>
                  <div className="text-[10px] text-stone-400">
                    {item.category} · Own {item.ownedCount} · Prestige +
                    {item.prestigeBonus}
                  </div>
                </div>
                <button
                  type="button"
                  disabled={cash < item.cost}
                  onPointerDown={() => buyShowroomItem(item.id)}
                  className={`px-3 py-2 rounded font-bold text-xs shrink-0 ${
                    cash >= item.cost
                      ? 'bg-amber-500 text-stone-950'
                      : 'bg-stone-800 text-stone-500'
                  }`}
                >
                  Buy ${item.cost}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {inspectedUrn && (
        <InspectUrn
          urn={inspectedUrn}
          owned={urnInventory[inspectedUrn.id] ?? 0}
          reputation={reputation}
          cash={cash}
          onClose={() => setInspectUrnId(null)}
          onBuy={() => buyUrn(inspectedUrn.id)}
        />
      )}
      {inspectedCasket && (
        <InspectCasket
          casket={inspectedCasket}
          owned={casketInventory[inspectedCasket.id] ?? 0}
          reputation={reputation}
          cash={cash}
          onClose={() => setInspectCasketId(null)}
          onBuy={() => buyCasket(inspectedCasket.id)}
        />
      )}
    </div>
  );
};

function FilterChip({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      onPointerDown={onPress}
      className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wide border ${
        active
          ? 'bg-amber-500 text-stone-950 border-amber-200'
          : 'bg-stone-900 text-stone-300 border-stone-700'
      }`}
    >
      {label}
    </button>
  );
}

function HintsRow({
  upcoming,
}: {
  upcoming: Array<RareScheduleEntry & { hoursUntil: number }>;
}) {
  if (upcoming.length === 0) return null;
  return (
    <div className="mb-2 rounded-lg border border-stone-800 bg-stone-950/70 p-2 text-[10px] text-stone-400 space-y-0.5">
      <div className="text-stone-500 font-bold tracking-wide">COMING UP</div>
      {upcoming.slice(0, 3).map((e) => (
        <div key={e.id}>
          ~{e.hoursUntil}h · {e.hint}{' '}
          <span className="text-stone-600">({formatHourRange(e)})</span>
        </div>
      ))}
    </div>
  );
}

function RepLock({
  required,
  reputation,
}: {
  required: number;
  reputation: number;
}) {
  if (required <= 0 || reputation >= required) return null;
  return (
    <div className="absolute inset-0 z-10 rounded-2xl bg-black/65 flex flex-col items-center justify-center text-center p-2">
      <div className="text-lg">🔒</div>
      <div className="text-[10px] font-bold text-amber-200">
        Requires Rep {required}
      </div>
      <div className="text-[9px] text-stone-400">You have {reputation}</div>
    </div>
  );
}

function UrnCard({
  urn,
  owned,
  reputation,
  cash,
  rare,
  stock,
  onInspect,
  onBuy,
}: {
  urn: UrnCatalogEntry;
  owned: number;
  reputation: number;
  cash: number;
  rare?: RareScheduleEntry;
  stock?: number;
  onInspect: () => void;
  onBuy: () => void;
}) {
  const locked = reputation < (urn.reputationRequired ?? 0);
  const canBuy = !locked && cash >= urn.cost && (stock == null || stock > 0);
  return (
    <div className="relative rounded-2xl border border-amber-900/40 bg-gradient-to-b from-[#2a2118] to-[#120e0b] p-2 flex flex-col min-h-[15rem]">
      <RepLock required={urn.reputationRequired ?? 0} reputation={reputation} />
      {rare && (
        <div className="absolute top-2 left-2 z-[5] text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-stone-950">
          {rare.rarity} · {stock} left · {formatHourRange(rare)}
        </div>
      )}
      <button type="button" onPointerDown={onInspect} className="flex-1">
        <UrnVessel urn={urn} size="sm" className="mx-auto" />
        <div className="text-[11px] font-bold text-amber-50 mt-1 leading-tight">
          {urn.name}
        </div>
        <div className="text-[9px] text-stone-400">
          {urn.material} · Own {owned}
        </div>
      </button>
      <button
        type="button"
        disabled={!canBuy}
        onPointerDown={onBuy}
        className={`mt-2 w-full py-2 rounded font-bold text-xs ${
          canBuy
            ? 'bg-amber-500 text-stone-950'
            : 'bg-stone-800 text-stone-500'
        }`}
      >
        {locked ? `Rep ${urn.reputationRequired}` : `Buy $${urn.cost}`}
      </button>
    </div>
  );
}

function CasketCard({
  casket,
  owned,
  reputation,
  cash,
  rare,
  stock,
  onInspect,
  onBuy,
}: {
  casket: CasketCatalogEntry;
  owned: number;
  reputation: number;
  cash: number;
  rare?: RareScheduleEntry;
  stock?: number;
  onInspect: () => void;
  onBuy: () => void;
}) {
  const locked = reputation < (casket.reputationRequired ?? 0);
  const canBuy = !locked && cash >= casket.cost && (stock == null || stock > 0);
  return (
    <div className="relative rounded-2xl border border-amber-900/40 bg-gradient-to-b from-[#2a2118] to-[#120e0b] p-2 flex flex-col min-h-[14rem]">
      <RepLock
        required={casket.reputationRequired ?? 0}
        reputation={reputation}
      />
      {rare && (
        <div className="absolute top-2 left-2 z-[5] text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-stone-950">
          {rare.rarity} · {stock} left · {formatHourRange(rare)}
        </div>
      )}
      <button type="button" onPointerDown={onInspect} className="flex-1">
        <CasketVessel casket={casket} size="sm" className="mx-auto" />
        <div className="text-[11px] font-bold text-amber-50 mt-1 leading-tight">
          {casket.name}
        </div>
        <div className="text-[9px] text-stone-400">
          {casket.material} · Own {owned}
        </div>
      </button>
      <button
        type="button"
        disabled={!canBuy}
        onPointerDown={onBuy}
        className={`mt-2 w-full py-2 rounded font-bold text-xs ${
          canBuy
            ? 'bg-amber-500 text-stone-950'
            : 'bg-stone-800 text-stone-500'
        }`}
      >
        {locked ? `Rep ${casket.reputationRequired}` : `Buy $${casket.cost}`}
      </button>
    </div>
  );
}

function InspectUrn({
  urn,
  owned,
  reputation,
  cash,
  onClose,
  onBuy,
}: {
  urn: UrnCatalogEntry;
  owned: number;
  reputation: number;
  cash: number;
  onClose: () => void;
  onBuy: () => void;
}) {
  const locked = reputation < (urn.reputationRequired ?? 0);
  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-3">
      <div className="w-full max-w-md rounded-2xl border border-amber-800 bg-[#1a1410] p-4">
        <div className="flex justify-between gap-2">
          <h3 className="font-black text-amber-100">{urn.name}</h3>
          <button type="button" onPointerDown={onClose} className="text-stone-400">
            ✕
          </button>
        </div>
        <UrnVessel urn={urn} size="md" className="mx-auto my-3" />
        <p className="text-[11px] text-stone-300">{urn.blurb}</p>
        <p className="text-[10px] text-stone-500 mt-1">
          {urn.finish} · {urn.decoration} · Own {owned}
          {(urn.reputationRequired ?? 0) > 0
            ? ` · Rep ${urn.reputationRequired}+`
            : ''}
        </p>
        <button
          type="button"
          disabled={locked || cash < urn.cost}
          onPointerDown={onBuy}
          className={`mt-3 w-full py-2.5 rounded font-bold text-sm ${
            !locked && cash >= urn.cost
              ? 'bg-amber-500 text-stone-950'
              : 'bg-stone-800 text-stone-500'
          }`}
        >
          {locked ? `Locked — Rep ${urn.reputationRequired}` : `Buy $${urn.cost}`}
        </button>
      </div>
    </div>
  );
}

function InspectCasket({
  casket,
  owned,
  reputation,
  cash,
  onClose,
  onBuy,
}: {
  casket: CasketCatalogEntry;
  owned: number;
  reputation: number;
  cash: number;
  onClose: () => void;
  onBuy: () => void;
}) {
  const locked = reputation < (casket.reputationRequired ?? 0);
  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-end sm:items-center justify-center p-3">
      <div className="w-full max-w-md rounded-2xl border border-amber-800 bg-[#1a1410] p-4">
        <div className="flex justify-between gap-2">
          <h3 className="font-black text-amber-100">{casket.name}</h3>
          <button type="button" onPointerDown={onClose} className="text-stone-400">
            ✕
          </button>
        </div>
        <CasketVessel casket={casket} size="md" className="mx-auto my-3" />
        <p className="text-[11px] text-stone-300">{casket.blurb}</p>
        <p className="text-[10px] text-stone-500 mt-1">
          {casket.finish} · {casket.hardware} · Own {owned}
          {(casket.reputationRequired ?? 0) > 0
            ? ` · Rep ${casket.reputationRequired}+`
            : ''}
        </p>
        <button
          type="button"
          disabled={locked || cash < casket.cost}
          onPointerDown={onBuy}
          className={`mt-3 w-full py-2.5 rounded font-bold text-sm ${
            !locked && cash >= casket.cost
              ? 'bg-amber-500 text-stone-950'
              : 'bg-stone-800 text-stone-500'
          }`}
        >
          {locked
            ? `Locked — Rep ${casket.reputationRequired}`
            : `Buy $${casket.cost}`}
        </button>
      </div>
    </div>
  );
}
