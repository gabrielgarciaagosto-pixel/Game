import React, { useMemo, useState } from 'react';
import {
  URN_CATALOG,
  URN_MATERIALS,
  type UrnCatalogEntry,
  type UrnMaterial,
} from '../data/urnCatalog';
import { useGameStore } from '../store/useGameStore';
import { UrnVessel } from './urns/UrnVessel';

export const FuneraryEmporium: React.FC = () => {
  const {
    cash,
    reputation,
    urnInventory,
    showroomInventory,
    buyUrn,
    buyShowroomItem,
    setActiveStation,
  } = useGameStore();

  const [filter, setFilter] = useState<UrnMaterial | 'ALL' | 'MERCH'>('ALL');
  const [inspectId, setInspectId] = useState<string | null>(null);
  const inspected = useMemo(
    () => URN_CATALOG.find((u) => u.id === inspectId) ?? null,
    [inspectId]
  );

  const ownedTotal = Object.values(urnInventory).reduce((a, b) => a + b, 0);

  const urns =
    filter === 'MERCH'
      ? []
      : URN_CATALOG.filter((u) => filter === 'ALL' || u.material === filter);

  const merch = showroomInventory.filter((i) => i.category !== 'URN');

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
              Browse vessels up close. Own {ownedTotal} urn
              {ownedTotal === 1 ? '' : 's'} · Cash ${cash.toLocaleString()} · Rep{' '}
              {reputation}
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
          <FilterChip
            active={filter === 'ALL'}
            label="Urns"
            onPress={() => setFilter('ALL')}
          />
          {URN_MATERIALS.map((m) => (
            <FilterChip
              key={m}
              active={filter === m}
              label={m}
              onPress={() => setFilter(m)}
            />
          ))}
          <FilterChip
            active={filter === 'MERCH'}
            label="Merch"
            onPress={() => setFilter('MERCH')}
          />
        </div>
      </div>

      <div className="relative flex-1 min-h-0 overflow-y-auto p-2 pb-24">
        {filter !== 'MERCH' ? (
          <div className="grid grid-cols-2 gap-2.5">
            {urns.map((urn) => (
              <UrnCard
                key={urn.id}
                urn={urn}
                owned={urnInventory[urn.id] ?? 0}
                canBuy={cash >= urn.cost}
                onInspect={() => setInspectId(urn.id)}
                onBuy={() => buyUrn(urn.id)}
              />
            ))}
          </div>
        ) : (
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

      {inspected && (
        <InspectModal
          urn={inspected}
          owned={urnInventory[inspected.id] ?? 0}
          canBuy={cash >= inspected.cost}
          onClose={() => setInspectId(null)}
          onBuy={() => {
            buyUrn(inspected.id);
          }}
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

function UrnCard({
  urn,
  owned,
  canBuy,
  onInspect,
  onBuy,
}: {
  urn: UrnCatalogEntry;
  owned: number;
  canBuy: boolean;
  onInspect: () => void;
  onBuy: () => void;
}) {
  return (
    <div className="rounded-2xl border border-amber-900/40 bg-gradient-to-b from-[#2a2118] to-[#120e0b] p-2 flex flex-col min-h-[15rem]">
      <button
        type="button"
        onPointerDown={onInspect}
        className="flex-1 flex flex-col items-center justify-end pb-1"
      >
        <UrnVessel urn={urn} size="sm" />
        <div className="mt-1 text-center px-1">
          <div className="text-[12px] font-bold text-amber-50 leading-tight">
            {urn.name}
          </div>
          <div className="text-[9px] text-stone-400">
            {urn.material} · {urn.finish}
          </div>
        </div>
      </button>
      <div className="flex items-center justify-between gap-1 mt-1">
        <span className="text-[10px] text-amber-200/80 font-mono">
          Own {owned}
        </span>
        <button
          type="button"
          disabled={!canBuy}
          onPointerDown={onBuy}
          className={`px-2.5 py-1.5 rounded text-[10px] font-black ${
            canBuy
              ? 'bg-amber-500 text-stone-950'
              : 'bg-stone-800 text-stone-500'
          }`}
        >
          ${urn.cost}
        </button>
      </div>
    </div>
  );
}

function InspectModal({
  urn,
  owned,
  canBuy,
  onClose,
  onBuy,
}: {
  urn: UrnCatalogEntry;
  owned: number;
  canBuy: boolean;
  onClose: () => void;
  onBuy: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] bg-black/80 flex items-end sm:items-center justify-center p-3">
      <div className="w-full max-w-md rounded-2xl border border-amber-700/50 bg-gradient-to-b from-[#2b2118] to-[#100c09] p-4 shadow-2xl">
        <div className="flex justify-between items-start gap-2">
          <div>
            <h3 className="text-lg font-black text-amber-100">{urn.name}</h3>
            <p className="text-[11px] text-stone-400">
              {urn.material} · {urn.silhouette.replace('_', ' ')}
            </p>
          </div>
          <button
            type="button"
            onPointerDown={onClose}
            className="px-2 py-1 rounded bg-stone-900 text-xs"
          >
            Close
          </button>
        </div>

        <div className="my-4 flex justify-center">
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

        <button
          type="button"
          disabled={!canBuy}
          onPointerDown={onBuy}
          className={`mt-4 w-full py-3 rounded-xl font-black ${
            canBuy
              ? 'bg-amber-500 text-stone-950'
              : 'bg-stone-800 text-stone-500'
          }`}
        >
          {canBuy ? `Purchase for $${urn.cost}` : 'Insufficient cash'}
        </button>
      </div>
    </div>
  );
};
