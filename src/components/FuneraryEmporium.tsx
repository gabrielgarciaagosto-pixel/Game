import React, { useEffect, useMemo, useState } from 'react';
import {
  CASKET_CATALOG,
  type CasketCatalogEntry,
} from '../data/casketCatalog';
import { CHAPEL_DECOR_CATALOG } from '../data/chapelDecor';
import {
  emporiumFacilityUpgrades,
  missingCollectionReqs,
  nextFacilityTier,
  totalFacilitySpaceUsed,
  type CollectionReq,
  type FacilityUpgradeId,
} from '../data/facilityUpgrades';
import {
  ALWAYS_CASKET_IDS,
  ALWAYS_URN_IDS,
  formatHourRange,
  getRemainingRareStock,
  liveRares,
  upcomingRares,
  type ItemRarity,
  type RareScheduleEntry,
} from '../data/shopRotation';
import {
  URN_CATALOG,
  type UrnCatalogEntry,
} from '../data/urnCatalog';
import { MODERN_ALWAYS_IDS } from '../data/urnVariety';
import { useGameStore } from '../store/useGameStore';
import { friendlyToken } from '../types/game';
import { formatTimeOf } from '../utils/clock12';
import { gameDate, gameNow, subscribeClock } from '../utils/gameNow';
import { activeMarket, quotedPrice } from '../news/newsWire';
import { CasketVessel } from './caskets/CasketVessel';
import { UrnVessel } from './urns/UrnVessel';
import { TapButton } from './TapButton';
import { CatalogSheet } from './CatalogSheet';
import { useSheetOpen } from './useSheetOpen';

type ShopTab = 'URNS' | 'CASKETS' | 'CHAPEL' | 'UPGRADES' | 'MERCH';

type InspectTarget =
  | { kind: 'urn'; id: string }
  | { kind: 'casket'; id: string }
  | null;

function formatClock(d: Date): string {
  return formatTimeOf(d);
}

function rarityClass(r: ItemRarity): string {
  switch (r) {
    case 'LEGENDARY':
      return 'bg-amber-400 text-stone-950 border-amber-200';
    case 'RARE':
      return 'bg-sky-800 text-sky-50 border-sky-500/50';
    case 'UNCOMMON':
      return 'bg-emerald-900 text-emerald-100 border-emerald-700/50';
    default:
      return 'bg-stone-800 text-stone-300 border-stone-600';
  }
}

function catalogUrn(id: string): UrnCatalogEntry | undefined {
  return URN_CATALOG.find((u) => u.id === id);
}

function catalogCasket(id: string): CasketCatalogEntry | undefined {
  return CASKET_CATALOG.find((c) => c.id === id);
}

function canPurchase(opts: {
  cash: number;
  cost: number;
  reputation: number;
  reputationRequired: number;
  stock?: number;
}): boolean {
  if (opts.cash < opts.cost) return false;
  if (opts.reputation < opts.reputationRequired) return false;
  if (opts.stock != null && opts.stock <= 0) return false;
  return true;
}

type EmporiumProps = {
  /** Render inside Computer fake-browser (no full-screen Back to hub) */
  embedded?: boolean;
  onClose?: () => void;
};

export const FuneraryEmporium: React.FC<EmporiumProps> = ({
  embedded = false,
  onClose,
}) => {
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
    setComputerOpenApp,
    ownedProperty,
  } = useGameStore();

  const [tab, setTab] = useState<ShopTab>('URNS');

  useEffect(() => {
    document.documentElement.dataset.shopOpen = '1';
    return () => {
      delete document.documentElement.dataset.shopOpen;
    };
  }, []);
  const [inspect, setInspect] = useState<InspectTarget>(null);
  const [now, setNow] = useState(() => gameDate());
  const [confirmBuy, setConfirmBuy] = useState<{
    title: string;
    body: string;
    run: () => void;
  } | null>(null);
  const [spaceBlock, setSpaceBlock] = useState<string | null>(null);
  useSheetOpen(confirmBuy != null || inspect != null);

  const spaceUsed = totalFacilitySpaceUsed(facilityLevels);
  const spaceTotal = ownedProperty?.spaceTotal ?? 20;
  const newsWire = useGameStore((s) => s.newsWire);
  const market = activeMarket(newsWire, now.getTime());

  const requestBuy = (title: string, body: string, run: () => void) => {
    setConfirmBuy({ title, body, run });
  };

  useEffect(() => {
    const id = window.setInterval(() => setNow(gameDate()), 1000);
    const unsub = subscribeClock(() => setNow(gameDate()));
    return () => {
      window.clearInterval(id);
      unsub();
    };
  }, []);

  const live = useMemo(() => liveRares(now), [now]);
  const upcoming = useMemo(() => upcomingRares(now, 6), [now]);

  const modernUrns = useMemo(
    () =>
      MODERN_ALWAYS_IDS.map((id) => catalogUrn(id)).filter(
        (u): u is UrnCatalogEntry => !!u
      ),
    []
  );
  const alwaysUrns = useMemo(
    () =>
      ALWAYS_URN_IDS.map((id) => catalogUrn(id)).filter(
        (u): u is UrnCatalogEntry => !!u
      ),
    []
  );
  const alwaysCaskets = useMemo(
    () =>
      ALWAYS_CASKET_IDS.map((id) => catalogCasket(id)).filter(
        (c): c is CasketCatalogEntry => !!c
      ),
    []
  );

  const rareUrnRows = useMemo(
    () =>
      live
        .filter((e) => e.kind === 'urn')
        .map((entry) => {
          const urn = catalogUrn(entry.id);
          if (!urn) return null;
          return {
            urn,
            entry,
            stock: getRemainingRareStock(shopRotation, entry, now),
          };
        })
        .filter(
          (
            r
          ): r is {
            urn: UrnCatalogEntry;
            entry: RareScheduleEntry;
            stock: number;
          } => !!r
        ),
    [live, shopRotation, now]
  );

  const rareCasketRows = useMemo(
    () =>
      live
        .filter((e) => e.kind === 'casket')
        .map((entry) => {
          const casket = catalogCasket(entry.id);
          if (!casket) return null;
          return {
            casket,
            entry,
            stock: getRemainingRareStock(shopRotation, entry, now),
          };
        })
        .filter(
          (
            r
          ): r is {
            casket: CasketCatalogEntry;
            entry: RareScheduleEntry;
            stock: number;
          } => !!r
        ),
    [live, shopRotation, now]
  );

  const upcomingUrns = useMemo(
    () => upcoming.filter((e) => e.kind === 'urn'),
    [upcoming]
  );
  const upcomingCaskets = useMemo(
    () => upcoming.filter((e) => e.kind === 'casket'),
    [upcoming]
  );

  const merch = showroomInventory.filter((i) => i.category !== 'URN');
  const ownedUrnTotal = Object.values(urnInventory).reduce((a, b) => a + b, 0);
  const ownedCasketTotal = Object.values(casketInventory).reduce(
    (a, b) => a + b,
    0
  );

  const inspectedUrn =
    inspect?.kind === 'urn' ? catalogUrn(inspect.id) ?? null : null;
  const inspectedCasket =
    inspect?.kind === 'casket' ? catalogCasket(inspect.id) ?? null : null;
  const inspectedRare =
    inspect == null
      ? null
      : (live.find((e) => e.kind === inspect.kind && e.id === inspect.id) ??
        null);

  const jumpToCollection = (req: CollectionReq) => {
    if (req.kind === 'urn') {
      setTab('URNS');
      setInspect({ kind: 'urn', id: req.id });
    } else {
      setTab('CASKETS');
      setInspect({ kind: 'casket', id: req.id });
    }
  };

  return (
    <div
      className={`${
        embedded
          ? 'files-overlap-clear absolute inset-0'
          : 'safe-screen fixed inset-0 z-50'
      } bg-[#140f0c] text-amber-50 flex flex-col select-none overflow-hidden`}
    >
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
              Own {ownedUrnTotal} urn{ownedUrnTotal === 1 ? '' : 's'} ·{' '}
              {ownedCasketTotal} casket{ownedCasketTotal === 1 ? '' : 's'} · Cash
              ${cash.toLocaleString()} · Rep {reputation}
            </p>
            <p className="text-[10px] text-amber-200/60 font-mono mt-0.5">
              Floor clock {formatClock(now)} · rares rotate on the hour
            </p>
          </div>
          {!embedded && (
            <button
              type="button"
              onClick={() => setActiveStation('OVERVIEW')}
              className="px-3 py-1.5 bg-stone-900 border border-stone-700 rounded text-xs font-semibold shrink-0"
              style={{ touchAction: 'manipulation' }}
            >
              Back
            </button>
          )}
          {embedded && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-stone-900 border border-stone-700 rounded text-xs font-semibold shrink-0"
              style={{ touchAction: 'manipulation' }}
            >
              Desktop
            </button>
          )}
        </div>

        <div className="mt-2 flex gap-1.5 overflow-x-auto pb-1">
          {(
            [
              ['URNS', 'Urns'],
              ['CASKETS', 'Caskets'],
              ['CHAPEL', 'Chapel'],
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

      {market && (
        <div
          data-shop-news
          className="mx-2 mt-2 flex items-start gap-1.5 rounded-lg border border-amber-700/50 bg-amber-950/50 px-2 py-1.5 text-[11px] leading-snug text-amber-50"
        >
          <span
            aria-label={market.dir === 'up' ? 'Prices up' : 'Prices down'}
            className={market.dir === 'up' ? 'text-emerald-300' : 'text-rose-300'}
          >
            {market.dir === 'up' ? '▲' : '▼'}
          </span>
          <span>
            {market.goodLabel} {market.dir === 'up' ? '+' : '−'}
            {market.pct}% · {market.text}
          </span>
        </div>
      )}

      <div
        className={`relative flex-1 min-h-0 overflow-y-auto p-2 pb-3 ${
          confirmBuy || inspect ? 'pointer-events-none' : ''
        }`}
        aria-hidden={confirmBuy != null || inspect != null}
      >
        {tab === 'URNS' && (
          <div className="space-y-4">
            {rareUrnRows.length > 0 && (
              <section>
                <SectionLabel>Hour-gated rares</SectionLabel>
                <div className="grid grid-cols-2 gap-2.5">
                  {rareUrnRows.map(({ urn, entry, stock }) => (
                    <UrnCard
                      key={`rare-${urn.id}`}
                      urn={urn}
                      owned={urnInventory[urn.id] ?? 0}
                      reputation={reputation}
                      cash={cash}
                      rare={entry}
                      stock={stock}
                      onInspect={() => setInspect({ kind: 'urn', id: urn.id })}
                      onBuy={() => requestBuy("Confirm urn", `Purchase for listed price?`, () => { buyUrn(urn.id); })}
                    />
                  ))}
                </div>
              </section>
            )}

            <section>
              <SectionLabel>Modern line</SectionLabel>
              <div className="grid grid-cols-2 gap-2.5">
                {modernUrns.map((urn) => (
                  <UrnCard
                    key={urn.id}
                    urn={urn}
                    owned={urnInventory[urn.id] ?? 0}
                    reputation={reputation}
                    cash={cash}
                    onInspect={() => setInspect({ kind: 'urn', id: urn.id })}
                    onBuy={() => requestBuy("Confirm urn", `Purchase for listed price?`, () => { buyUrn(urn.id); })}
                  />
                ))}
              </div>
            </section>

            <section>
              <SectionLabel>House classics</SectionLabel>
              <div className="grid grid-cols-2 gap-2.5">
                {alwaysUrns.map((urn) => (
                  <UrnCard
                    key={urn.id}
                    urn={urn}
                    owned={urnInventory[urn.id] ?? 0}
                    reputation={reputation}
                    cash={cash}
                    onInspect={() => setInspect({ kind: 'urn', id: urn.id })}
                    onBuy={() => requestBuy("Confirm urn", `Purchase for listed price?`, () => { buyUrn(urn.id); })}
                  />
                ))}
              </div>
            </section>

            {upcomingUrns.length > 0 && (
              <ComingUpSection
                items={upcomingUrns}
                resolveName={(id) => catalogUrn(id)?.name ?? id}
              />
            )}
          </div>
        )}

        {tab === 'CASKETS' && (
          <div className="space-y-4">
            {rareCasketRows.length > 0 && (
              <section>
                <SectionLabel>Hour-gated rares</SectionLabel>
                <div className="grid grid-cols-2 gap-2.5">
                  {rareCasketRows.map(({ casket, entry, stock }) => (
                    <CasketCard
                      key={`rare-${casket.id}`}
                      casket={casket}
                      owned={casketInventory[casket.id] ?? 0}
                      reputation={reputation}
                      cash={cash}
                      rare={entry}
                      stock={stock}
                      onInspect={() =>
                        setInspect({ kind: 'casket', id: casket.id })
                      }
                      onBuy={() => requestBuy("Confirm casket", `Purchase for listed price?`, () => { buyCasket(casket.id); })}
                    />
                  ))}
                </div>
              </section>
            )}

            <section>
              <SectionLabel>Always in stock</SectionLabel>
              <div className="grid grid-cols-2 gap-2.5">
                {alwaysCaskets.map((casket) => (
                  <CasketCard
                    key={casket.id}
                    casket={casket}
                    owned={casketInventory[casket.id] ?? 0}
                    reputation={reputation}
                    cash={cash}
                    onInspect={() =>
                      setInspect({ kind: 'casket', id: casket.id })
                    }
                    onBuy={() => requestBuy("Confirm casket", `Purchase for listed price?`, () => { buyCasket(casket.id); })}
                  />
                ))}
              </div>
            </section>

            {upcomingCaskets.length > 0 && (
              <ComingUpSection
                items={upcomingCaskets}
                resolveName={(id) => catalogCasket(id)?.name ?? id}
              />
            )}
          </div>
        )}

        {tab === 'CHAPEL' && (
          <div className="space-y-2">
            <SectionLabel>Permanent chapel upgrades</SectionLabel>
            {CHAPEL_DECOR_CATALOG.map((item) => {
              const owned = chapelOwnedDecor.includes(item.id);
              const canBuy = !owned && cash >= item.cost;
              return (
                <div
                  key={item.id}
                  className="rounded-xl border border-amber-900/50 bg-gradient-to-r from-stone-900 to-stone-950 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-bold text-amber-100 leading-tight">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        {item.kind} · Tier {item.tier} · Sat +
                        {item.satisfactionBonus}
                        {item.standSlots
                          ? ` · +${item.standSlots} stands`
                          : ''}
                      </div>
                      <p className="text-[11px] text-stone-300 mt-1 leading-snug">
                        {item.blurb}
                      </p>
                    </div>
                    {owned ? (
                      <span className="shrink-0 px-2.5 py-1.5 rounded text-[10px] font-black bg-emerald-900/60 text-emerald-200 border border-emerald-700/50">
                        Owned
                      </span>
                    ) : (
                      <TapButton
                        disabled={!canBuy}
                        onTap={() =>
                          requestBuy(
                            'Confirm décor',
                            `Buy ${item.name} for $${item.cost}?`,
                            () => {
                              buyChapelDecor(item.id);
                            }
                          )
                        }
                        className={`shrink-0 px-3 py-2 rounded font-bold text-xs ${
                          canBuy
                            ? 'bg-amber-500 text-stone-950'
                            : 'bg-stone-800 text-stone-500'
                        }`}
                      >
                        Buy ${item.cost}
                      </TapButton>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {tab === 'UPGRADES' && (
          <div className="space-y-3">
            <SectionLabel>Facility upgrades</SectionLabel>
            <p className="text-[10px] text-stone-500 px-0.5">
              Collection gates are ownership-only — required vessels stay in your
              inventory. Space {spaceUsed}/{spaceTotal} at{' '}
              {ownedProperty?.label ?? 'home'}.
            </p>
            {(spaceBlock ||
              emporiumFacilityUpgrades().some((def) => {
                const level = facilityLevels[def.id as FacilityUpgradeId] ?? 0;
                const next = nextFacilityTier(def.id, level);
                return !!next && spaceUsed + next.space > spaceTotal;
              })) && (
              <div className="rounded-lg border border-rose-700/60 bg-rose-950/40 p-2.5 space-y-2">
                <p className="text-[11px] text-rose-100">
                  {spaceBlock ??
                    `Needs more facility space (${spaceUsed}/${spaceTotal} used). Relocate via Lychgate Realty.`}
                </p>
                <TapButton
                  onTap={() => {
                    // Switch computer app only — do not call onClose/goDesktop
                    // (that would clear computerOpenApp and dump to wallpaper).
                    setComputerOpenApp('REALTY');
                  }}
                  className="w-full py-2 rounded-lg bg-emerald-800 text-[11px] font-black text-emerald-50"
                >
                  Open Lychgate Realty
                </TapButton>
              </div>
            )}
            {emporiumFacilityUpgrades().map((def) => {
              const level = facilityLevels[def.id as FacilityUpgradeId] ?? 0;
              const next = nextFacilityTier(def.id, level);
              const missing = next
                ? missingCollectionReqs(
                    next.requires,
                    urnInventory,
                    casketInventory
                  )
                : [];
              const missingKeys = new Set(
                missing.map((m) => `${m.kind}:${m.id}`)
              );
              const spaceOk =
                !!next && spaceUsed + next.space <= spaceTotal;
              const canBuy =
                !!next && cash >= next.cost && missing.length === 0 && spaceOk;

              return (
                <div
                  key={def.id}
                  className="rounded-xl border border-amber-900/50 bg-gradient-to-b from-[#2a2118] to-[#120e0b] p-3"
                >
                  <div className="font-bold text-amber-100">{def.name}</div>
                  <div className="text-[10px] text-stone-400">
                    Level {level}
                    {next ? ` → ${next.tier}` : ' · Maxed'}
                  </div>
                  <p className="text-[11px] text-stone-300 mt-1">{def.blurb}</p>

                  {next ? (
                    <div className="mt-2 rounded-lg border border-stone-800 bg-stone-950/50 p-2.5">
                      <div className="text-[12px] font-semibold text-amber-50">
                        {next.label}
                      </div>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        {next.effect} · ${next.cost.toLocaleString()}
                      </div>

                      {next.requires.length > 0 && (
                        <div className="mt-2">
                          <p className="text-[10px] text-amber-200/70 font-semibold">
                            Requires owning (not consumed):
                          </p>
                          <ul className="mt-1 space-y-1">
                            {next.requires.map((req) => {
                              const key = `${req.kind}:${req.id}`;
                              const have = !missingKeys.has(key);
                              return (
                                <li
                                  key={key}
                                  className="flex items-center justify-between gap-2 text-[10px]"
                                >
                                  <span
                                    className={
                                      have
                                        ? 'text-emerald-300'
                                        : 'text-rose-300'
                                    }
                                  >
                                    {have ? '✓' : '✗'} {req.label}{' '}
                                    <span className="text-stone-500">
                                      ({req.kind})
                                    </span>
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => jumpToCollection(req)}
                                    style={{ touchAction: 'manipulation' }}
                                    className="shrink-0 px-2 py-0.5 rounded border border-stone-700 bg-stone-900 text-[9px] font-bold text-amber-100"
                                  >
                                    Find in shop
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={
                          !next ||
                          missing.length > 0 ||
                          (spaceOk && cash < next.cost)
                        }
                        onClick={() => {
                          if (!spaceOk) {
                            setSpaceBlock(
                              `Needs more facility space (${spaceUsed + next.space} required, ${spaceTotal} available). Relocate via Lychgate Realty.`
                            );
                            return;
                          }
                          requestBuy(
                            'Confirm upgrade',
                            `${def.name}: ${next.label} for $${next.cost}? Uses ${next.space} space.`,
                            () => {
                              const r = buyFacilityUpgrade(def.id);
                              if (!r.ok && r.reason === 'space') {
                                setSpaceBlock(r.message ?? 'Needs more space');
                              } else {
                                setSpaceBlock(null);
                              }
                            }
                          );
                        }}
                        className={`mt-2.5 w-full py-2 rounded-lg text-[11px] font-black ${
                          canBuy
                            ? 'bg-amber-500 text-stone-950'
                            : 'bg-stone-800 text-stone-500'
                        }`}
                        style={{ touchAction: 'manipulation' }}
                      >
                        {missing.length > 0
                          ? 'Missing collection'
                          : !spaceOk
                            ? 'Needs more space'
                            : cash < next.cost
                              ? 'Insufficient cash'
                              : `Upgrade · $${next.cost}`}
                      </button>
                    </div>
                  ) : (
                    <p className="mt-2 text-[11px] text-emerald-300/80 font-semibold">
                      Fully upgraded
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {tab === 'MERCH' && (
          <div className="space-y-2">
            <SectionLabel>Showroom merch</SectionLabel>
            {merch.map((item) => {
              const ask =
                item.category === 'FLOWER'
                  ? quotedPrice(item.cost, 'FLOWERS', newsWire, now.getTime())
                  : item.cost;
              return (
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
                <TapButton
                  disabled={cash < ask}
                  onTap={() =>
                    requestBuy(
                      'Confirm merch',
                      `Buy ${item.name} for $${ask}?`,
                      () => {
                        buyShowroomItem(item.id);
                      }
                    )
                  }
                  className={`px-3 py-2 rounded font-bold text-xs shrink-0 ${
                    cash >= ask
                      ? 'bg-amber-500 text-stone-950'
                      : 'bg-stone-800 text-stone-500'
                  }`}
                >
                  Buy <PriceAsk base={item.cost} ask={ask} />
                </TapButton>
              </div>
              );
            })}
            {merch.length === 0 && (
              <p className="text-[11px] text-stone-500 text-center py-8">
                No merch in stock.
              </p>
            )}
          </div>
        )}
      </div>

      
      {confirmBuy && (
        <CatalogSheet z={220}>
          <div className="w-full rounded-xl border border-amber-700 bg-stone-950 p-4 space-y-3">
            <h4 className="font-bold text-amber-50">{confirmBuy.title}</h4>
            <p className="text-[12px] text-stone-300">{confirmBuy.body}</p>
            <div className="flex gap-2 relative z-20">
              <TapButton
                data-catalog-back
                onTap={() => setConfirmBuy(null)}
                className="flex-1 min-h-14 py-4 rounded-xl bg-stone-800 text-sm font-black"
              >
                Back
              </TapButton>
              <TapButton
                data-catalog-buy
                onTap={() => {
                  confirmBuy.run();
                  setConfirmBuy(null);
                }}
                className="flex-1 min-h-14 py-4 rounded-xl bg-amber-500 text-stone-950 text-sm font-black"
              >
                Confirm
              </TapButton>
            </div>
          </div>
        </CatalogSheet>
      )}

      {inspectedUrn && (
        <UrnInspectModal
          urn={inspectedUrn}
          owned={urnInventory[inspectedUrn.id] ?? 0}
          reputation={reputation}
          cash={cash}
          rare={inspectedRare}
          stock={
            inspectedRare
              ? getRemainingRareStock(shopRotation, inspectedRare, now)
              : undefined
          }
          onClose={() => setInspect(null)}
          onBuy={() => requestBuy("Confirm urn", `Purchase for listed price?`, () => { buyUrn(inspectedUrn.id); })}
        />
      )}

      {inspectedCasket && (
        <CasketInspectModal
          casket={inspectedCasket}
          owned={casketInventory[inspectedCasket.id] ?? 0}
          reputation={reputation}
          cash={cash}
          rare={inspectedRare}
          stock={
            inspectedRare
              ? getRemainingRareStock(shopRotation, inspectedRare, now)
              : undefined
          }
          onClose={() => setInspect(null)}
          onBuy={() => requestBuy("Confirm casket", `Purchase for listed price?`, () => { buyCasket(inspectedCasket.id); })}
        />
      )}
    </div>
  );
};

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] tracking-[0.2em] uppercase text-amber-200/60 font-semibold mb-1.5 px-0.5">
      {children}
    </p>
  );
}

function ComingUpSection({
  items,
  resolveName,
}: {
  items: Array<RareScheduleEntry & { hoursUntil: number }>;
  resolveName: (id: string) => string;
}) {
  return (
    <section className="rounded-xl border border-stone-800/80 bg-stone-950/40 p-2.5">
      <SectionLabel>Coming up</SectionLabel>
      <ul className="space-y-1.5">
        {items.map((e) => (
          <li key={e.id} className="text-[11px] text-stone-400 leading-snug">
            <span className="text-stone-300 font-semibold">
              {resolveName(e.id)}
            </span>
            <span className="text-stone-500"> · </span>
            <span className="text-amber-200/80">{e.rarity}</span>
            <span className="text-stone-500">
              {' '}
              · ~{e.hoursUntil}h · {formatHourRange(e)}
            </span>
            <span className="block text-[10px] text-stone-500 italic">
              {e.hint}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

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
      onClick={onPress}
      style={{ touchAction: 'manipulation' }}
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

function LockBadge({ required }: { required: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-black tracking-wide bg-stone-950/80 text-rose-200 border border-rose-800/60">
      LOCK · Rep {required}
    </span>
  );
}

function RarityBadge({ rarity }: { rarity: ItemRarity }) {
  return (
    <span
      className={`inline-flex px-1.5 py-0.5 rounded text-[8px] font-black tracking-wide border ${rarityClass(rarity)}`}
    >
      {rarity}
    </span>
  );
}

function PriceAsk({ base, ask }: { base: number; ask: number }) {
  const up = ask > base;
  const down = ask < base;
  return (
    <span>
      ${ask}
      {up || down ? (
        <span className={up ? 'text-emerald-200' : 'text-rose-200'}>
          {' '}
          {up ? '▲' : '▼'}
        </span>
      ) : null}
    </span>
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
  const newsWire = useGameStore((s) => s.newsWire);
  const ask = quotedPrice(urn.cost, 'URNS', newsWire, gameNow());
  const locked = reputation < (urn.reputationRequired ?? 0);
  const canBuy = canPurchase({
    cash,
    cost: ask,
    reputation,
    reputationRequired: urn.reputationRequired ?? 0,
    stock,
  });

  return (
    <div className="rounded-2xl border border-amber-900/40 bg-gradient-to-b from-[#2a2118] to-[#120e0b] p-2 flex flex-col min-h-[15rem]">
      <button
        type="button"
        onClick={onInspect}
        style={{ touchAction: 'manipulation' }}
        className="flex-1 flex flex-col items-center justify-end pb-1"
      >
        <div className="w-full flex justify-between items-start gap-1 mb-1 px-0.5 min-h-[1.1rem]">
          {rare ? <RarityBadge rarity={rare.rarity} /> : <span />}
          {locked && <LockBadge required={urn.reputationRequired} />}
        </div>
        <UrnVessel urn={urn} size="sm" />
        <div className="mt-1 text-center px-1">
          <div className="text-[12px] font-bold text-amber-50 leading-tight">
            {urn.name}
          </div>
          <div className="text-[9px] text-stone-400">
            {urn.modular
              ? `${friendlyToken(urn.modular.body)} · ${urn.finish}`
              : `${friendlyToken(urn.material)} · ${friendlyToken(urn.finish)}`}
          </div>
          {rare && (
            <div className="text-[9px] text-amber-200/70 mt-0.5 font-mono">
              {formatHourRange(rare)} · {stock ?? 0} left
            </div>
          )}
        </div>
      </button>
      <div className="flex items-center justify-between gap-1 mt-1">
        <span className="text-[10px] text-amber-200/80 font-mono">
          Own {owned}
        </span>
        <button
          type="button"
          disabled={!canBuy}
          onClick={onBuy}
          style={{ touchAction: 'manipulation' }}
          className={`px-2.5 py-1.5 rounded text-[10px] font-black ${
            canBuy
              ? 'bg-amber-500 text-stone-950'
              : 'bg-stone-800 text-stone-500'
          }`}
        >
          {locked ? `Rep ${urn.reputationRequired}` : <PriceAsk base={urn.cost} ask={ask} />}
        </button>
      </div>
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
  const newsWire = useGameStore((s) => s.newsWire);
  const ask = quotedPrice(casket.cost, 'CASKETS', newsWire, gameNow());
  const locked = reputation < (casket.reputationRequired ?? 0);
  const canBuy = canPurchase({
    cash,
    cost: ask,
    reputation,
    reputationRequired: casket.reputationRequired ?? 0,
    stock,
  });

  return (
    <div className="rounded-2xl border border-amber-900/40 bg-gradient-to-b from-[#2a2118] to-[#120e0b] p-2 flex flex-col min-h-[17.5rem]">
      <button
        type="button"
        onClick={onInspect}
        style={{ touchAction: 'manipulation' }}
        className="flex-1 flex flex-col items-center justify-end pb-1"
      >
        <div className="w-full flex justify-between items-start gap-1 mb-1 px-0.5 min-h-[1.1rem]">
          {rare ? <RarityBadge rarity={rare.rarity} /> : <span />}
          {locked && <LockBadge required={casket.reputationRequired} />}
        </div>
        <CasketVessel casket={casket} size="sm" className="scale-[1.16]" />
        <div className="mt-1 text-center px-1">
          <div className="text-[12px] font-bold text-amber-50 leading-tight">
            {casket.name}
          </div>
          <div className="text-[9px] text-stone-400">
            {friendlyToken(casket.material)} · {friendlyToken(casket.finish)}
          </div>
          {rare && (
            <div className="text-[9px] text-amber-200/70 mt-0.5 font-mono">
              {formatHourRange(rare)} · {stock ?? 0} left
            </div>
          )}
        </div>
      </button>
      <div className="flex items-center justify-between gap-1 mt-1">
        <span className="text-[10px] text-amber-200/80 font-mono">
          Own {owned}
        </span>
        <button
          type="button"
          disabled={!canBuy}
          onClick={onBuy}
          style={{ touchAction: 'manipulation' }}
          className={`px-2.5 py-1.5 rounded text-[10px] font-black ${
            canBuy
              ? 'bg-amber-500 text-stone-950'
              : 'bg-stone-800 text-stone-500'
          }`}
        >
          {locked ? `Rep ${casket.reputationRequired}` : <PriceAsk base={casket.cost} ask={ask} />}
        </button>
      </div>
    </div>
  );
}

function UrnInspectModal({
  urn,
  owned,
  reputation,
  cash,
  rare,
  stock,
  onClose,
  onBuy,
}: {
  urn: UrnCatalogEntry;
  owned: number;
  reputation: number;
  cash: number;
  rare: RareScheduleEntry | null;
  stock?: number;
  onClose: () => void;
  onBuy: () => void;
}) {
  const newsWire = useGameStore((s) => s.newsWire);
  const ask = quotedPrice(urn.cost, 'URNS', newsWire, gameNow());
  const locked = reputation < (urn.reputationRequired ?? 0);
  const canBuy = canPurchase({
    cash,
    cost: ask,
    reputation,
    reputationRequired: urn.reputationRequired ?? 0,
    stock: rare ? stock : undefined,
  });

  return (
    <CatalogSheet>
      <div className="w-full rounded-2xl border border-amber-700/50 bg-gradient-to-b from-[#2b2118] to-[#100c09] p-4 shadow-2xl">
        <div>
          <div className="flex flex-wrap gap-1 mb-1">
            {rare && <RarityBadge rarity={rare.rarity} />}
            {locked && <LockBadge required={urn.reputationRequired} />}
          </div>
          <h3 className="text-lg font-black text-amber-100">{urn.name}</h3>
          <p className="text-[11px] text-stone-400">
            {urn.modular
              ? `${friendlyToken(urn.modular.body)} · ${friendlyToken(urn.modular.lid)} lid`
              : `${friendlyToken(urn.material)} · ${friendlyToken(urn.silhouette)}`}
          </p>
        </div>

        <div className="my-4 flex justify-center pointer-events-none">
          <div className="relative">
            <div className="absolute inset-0 blur-2xl bg-amber-600/20 rounded-full" />
            <UrnVessel urn={urn} size="lg" className="relative" />
          </div>
        </div>

        <p className="text-sm text-stone-200 leading-snug">{urn.blurb}</p>
        <p className="text-[11px] text-amber-200/80 mt-2">
          Finish: {urn.finish}. Decoration: {urn.decoration}.
        </p>
        <p className="text-[11px] text-stone-400 mt-1">
          Resale to families ${urn.resaleValue} · Prestige +{urn.prestigeBonus} ·
          Owned {owned}
        </p>
        {rare && (
          <p className="text-[11px] text-amber-200/70 mt-1 font-mono">
            Window {formatHourRange(rare)} · {stock ?? 0} remaining this window
          </p>
        )}
        {locked && (
          <p className="text-[11px] text-rose-300 mt-1">
            Requires reputation {urn.reputationRequired} (you have {reputation})
          </p>
        )}

        <div className="mt-4 flex gap-2 relative z-20">
          <TapButton
            data-catalog-back
            onTap={onClose}
            className="flex-1 min-h-14 py-4 rounded-xl bg-stone-800 text-sm font-black text-stone-100"
          >
            Back
          </TapButton>
          <TapButton
            data-catalog-buy
            aria-disabled={!canBuy}
            onTap={() => {
              if (canBuy) onBuy();
            }}
            className={`flex-[1.4] min-h-14 py-4 rounded-xl text-sm font-black ${
              canBuy
                ? 'bg-amber-500 text-stone-950'
                : 'bg-stone-800 text-stone-500'
            }`}
          >
            {locked
              ? `Locked · Rep ${urn.reputationRequired}`
              : canBuy
                ? <>Buy <PriceAsk base={urn.cost} ask={ask} /></>
                : rare && (stock ?? 0) <= 0
                  ? 'Sold out'
                  : 'Insufficient cash'}
          </TapButton>
        </div>
      </div>
    </CatalogSheet>
  );
}

function CasketInspectModal({
  casket,
  owned,
  reputation,
  cash,
  rare,
  stock,
  onClose,
  onBuy,
}: {
  casket: CasketCatalogEntry;
  owned: number;
  reputation: number;
  cash: number;
  rare: RareScheduleEntry | null;
  stock?: number;
  onClose: () => void;
  onBuy: () => void;
}) {
  const newsWire = useGameStore((s) => s.newsWire);
  const ask = quotedPrice(casket.cost, 'CASKETS', newsWire, gameNow());
  const locked = reputation < (casket.reputationRequired ?? 0);
  const canBuy = canPurchase({
    cash,
    cost: ask,
    reputation,
    reputationRequired: casket.reputationRequired ?? 0,
    stock: rare ? stock : undefined,
  });
  const coffin = casket.silhouette === 'TAPERED' || casket.silhouette === 'OCTAGON';
  const [lid, setLid] = useState<'open' | 'closed' | null>(null);

  const lidShown =
    lid ??
    (casket.silhouette === 'HALF_COUCH' || casket.silhouette === 'FULL_COUCH'
      ? 'open'
      : 'closed');

  return (
    <CatalogSheet>
      <div className="w-full rounded-2xl border border-amber-700/50 bg-gradient-to-b from-[#2b2118] to-[#100c09] p-4 shadow-2xl">
        <div>
          <div className="flex flex-wrap gap-1 mb-1">
            {rare && <RarityBadge rarity={rare.rarity} />}
            {locked && <LockBadge required={casket.reputationRequired} />}
          </div>
          <h3 className="text-lg font-black text-amber-100">{casket.name}</h3>
          <p className="text-[11px] text-stone-400">
            {friendlyToken(casket.material)} · {friendlyToken(casket.silhouette)}
          </p>
        </div>

        <div className="my-4 flex justify-center pointer-events-none">
          <div className="relative">
            <div className="absolute inset-0 blur-2xl bg-amber-600/20 rounded-full" />
            <CasketVessel casket={casket} size="lg" className="relative scale-110" lid={lid ?? undefined} />
          </div>
        </div>

        {!coffin && (
          <div className="flex justify-center gap-2 mb-3 relative z-20">
            <TapButton
              onTap={() => setLid('open')}
              className={`min-h-12 px-4 py-3 rounded-xl text-sm font-black ${
                lidShown === 'open'
                  ? 'bg-amber-500 text-stone-950'
                  : 'bg-stone-800 text-stone-300'
              }`}
            >
              Lid open
            </TapButton>
            <TapButton
              onTap={() => setLid('closed')}
              className={`min-h-12 px-4 py-3 rounded-xl text-sm font-black ${
                lidShown === 'closed'
                  ? 'bg-amber-500 text-stone-950'
                  : 'bg-stone-800 text-stone-300'
              }`}
            >
              Lid closed
            </TapButton>
          </div>
        )}

        <p className="text-sm text-stone-200 leading-snug">{casket.blurb}</p>
        <p className="text-[11px] text-amber-200/80 mt-2">
          Finish: {casket.finish}. Hardware: {casket.hardware}.
        </p>
        <p className="text-[11px] text-stone-400 mt-1">
          Resale ${casket.resaleValue} · Prestige +{casket.prestigeBonus} · Owned{' '}
          {owned}
        </p>
        {rare && (
          <p className="text-[11px] text-amber-200/70 mt-1 font-mono">
            Window {formatHourRange(rare)} · {stock ?? 0} remaining this window
          </p>
        )}
        {locked && (
          <p className="text-[11px] text-rose-300 mt-1">
            Requires reputation {casket.reputationRequired} (you have{' '}
            {reputation})
          </p>
        )}

        <div className="mt-4 flex gap-2 relative z-20">
          <TapButton
            data-catalog-back
            onTap={onClose}
            className="flex-1 min-h-14 py-4 rounded-xl bg-stone-800 text-sm font-black text-stone-100"
          >
            Back
          </TapButton>
          <TapButton
            data-catalog-buy
            aria-disabled={!canBuy}
            onTap={() => {
              if (canBuy) onBuy();
            }}
            className={`flex-[1.4] min-h-14 py-4 rounded-xl text-sm font-black ${
              canBuy
                ? 'bg-amber-500 text-stone-950'
                : 'bg-stone-800 text-stone-500'
            }`}
          >
            {locked
              ? `Locked · Rep ${casket.reputationRequired}`
              : canBuy
                ? <>Buy <PriceAsk base={casket.cost} ask={ask} /></>
                : rare && (stock ?? 0) <= 0
                  ? 'Sold out'
                  : 'Insufficient cash'}
          </TapButton>
        </div>
      </div>
    </CatalogSheet>
  );
}
