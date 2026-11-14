import React, { useEffect, useMemo } from 'react';
import { CaseTransferBar } from './CaseTransferBar';
import { displayCaseName, decayLabel } from '../types/game';
import { caseAtLocation, useGameStore } from '../store/useGameStore';
import { getUrnById, URN_CATALOG } from '../data/urnCatalog';
import { UrnVessel } from './urns/UrnVessel';

const FLOWER_TYPES = ['LILIES', 'ROSES', 'WREATH'] as const;

export const ShowroomAndChapelModal: React.FC = () => {
  const {
    cases,
    activeCaseId,
    showroomInventory,
    urnInventory,
    placedFlowers,
    serviceRatingBonus,
    cash,
    placeFloralSpray,
    offerUrnToCase,
    finalizeServiceAndNextCase,
    setActiveStation,
    takeCaseToStation,
    focusCase,
  } = useGameStore();

  const currentCase = caseAtLocation(cases, 'CHAPEL', activeCaseId);

  useEffect(() => {
    if (currentCase && currentCase.id !== activeCaseId) {
      focusCase(currentCase.id);
    }
  }, [currentCase, activeCaseId, focusCase]);

  const ownedUrns = useMemo(
    () =>
      URN_CATALOG.filter((u) => (urnInventory[u.id] ?? 0) > 0).concat(
        currentCase?.offeredUrnId
          ? URN_CATALOG.filter((u) => u.id === currentCase.offeredUrnId)
          : []
      ).filter(
        (u, i, arr) => arr.findIndex((x) => x.id === u.id) === i
      ),
    [urnInventory, currentCase?.offeredUrnId]
  );

  if (!currentCase) {
    return (
      <div className="fixed inset-0 z-50 bg-violet-950/95 text-violet-50 flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-center max-w-md">
          No case staged for chapel. Move remains here with Chapel / Move to
          Chapel — hub tiles only open rooms. Buy vessels in the Funerary
          Emporium.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onPointerDown={() => setActiveStation('EMPORIUM')}
            className="px-4 py-2 bg-amber-600 text-stone-950 rounded font-semibold"
          >
            Open Emporium
          </button>
          <button
            type="button"
            onPointerDown={() => setActiveStation('COOLER')}
            className="px-4 py-2 bg-cyan-700 rounded font-semibold"
          >
            Open Cooler
          </button>
        </div>
      </div>
    );
  }

  const lateService =
    currentCase.serviceDateMs != null &&
    Date.now() > currentCase.serviceDateMs;
  const offered = getUrnById(currentCase.offeredUrnId);
  const urnMatch =
    offered != null && offered.material === currentCase.preferredUrnMaterial;

  return (
    <div className="safe-screen fixed inset-0 z-50 bg-violet-950/95 text-violet-50 flex flex-col select-none overflow-auto">
      <div className="flex justify-between items-start border-b border-violet-800 pb-3 gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-violet-300">
            CHAPEL — {displayCaseName(currentCase)}
          </h2>
          <p className="text-[10px] text-violet-300/70 leading-snug">
            Prefers {currentCase.preferredFlowers} · Urn taste{' '}
            {currentCase.preferredUrnMaterial} · {currentCase.directive} · $
            {cash}
            {currentCase.embalmRank
              ? ` · Embalm ${currentCase.embalmRank}`
              : ''}
            {currentCase.decayLevel > 5
              ? ` · ${decayLabel(currentCase.decayLevel)}`
              : ''}
            {lateService ? ' · LATE' : ''}
          </p>
          <CaseTransferBar currentCase={currentCase} showVault />
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <button
            type="button"
            onPointerDown={() => setActiveStation('OVERVIEW')}
            className="px-3 py-2 bg-violet-900 rounded text-xs"
          >
            Back
          </button>
          <button
            type="button"
            onPointerDown={() => takeCaseToStation(currentCase.id, 'COOLER')}
            className="px-3 py-2 bg-cyan-800 rounded text-xs"
          >
            Cooler
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-4 mt-3">
        <div className="relative h-44 rounded-xl border-2 border-violet-700 bg-gradient-to-b from-violet-900 to-violet-950 overflow-hidden">
          <div className="absolute left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2 w-44 h-14 bg-amber-900 rounded-sm border border-amber-600 flex items-center justify-center text-[10px] font-bold">
            {currentCase.isUrnFilled ? 'URN ON BIER' : 'CASKET / BIER'}
          </div>
          {offered && (
            <div className="absolute left-1/2 top-[18%] -translate-x-1/2">
              <UrnVessel urn={offered} size="sm" />
            </div>
          )}
          {placedFlowers.map((flower, idx) => (
            <div
              key={flower}
              className="absolute text-[10px] font-bold px-2 py-1 rounded bg-emerald-700/90"
              style={{ left: `${18 + idx * 28}%`, bottom: '14%' }}
            >
              {flower}
            </div>
          ))}
          <div className="absolute bottom-2 left-3 right-3 text-[10px] text-violet-300">
            Service boost +{serviceRatingBonus}%
            {urnMatch ? ' · Urn taste matched ★' : offered ? ' · Urn offered' : ''}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <h3 className="text-xs font-black tracking-[0.18em] text-amber-200">
              OFFER URN TO FAMILY
            </h3>
            <button
              type="button"
              onPointerDown={() => setActiveStation('EMPORIUM')}
              className="text-[10px] px-2 py-1 rounded bg-amber-700/80"
            >
              Emporium →
            </button>
          </div>
          {ownedUrns.length === 0 ? (
            <p className="text-[11px] text-violet-300/80">
              No vessels in stock. Buy urns at the Funerary Emporium.
            </p>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onPointerDown={() => offerUrnToCase(currentCase.id, null)}
                className={`shrink-0 px-3 py-2 rounded-lg border text-[10px] ${
                  !currentCase.offeredUrnId
                    ? 'border-amber-400 bg-amber-950/50'
                    : 'border-violet-800 bg-violet-950'
                }`}
              >
                None
              </button>
              {ownedUrns.map((urn) => {
                const selected = currentCase.offeredUrnId === urn.id;
                const preferred = urn.material === currentCase.preferredUrnMaterial;
                return (
                  <button
                    key={urn.id}
                    type="button"
                    onPointerDown={() =>
                      offerUrnToCase(currentCase.id, selected ? null : urn.id)
                    }
                    className={`shrink-0 w-24 rounded-xl border p-1.5 text-center ${
                      selected
                        ? 'border-amber-400 bg-amber-950/40'
                        : preferred
                          ? 'border-emerald-500/70 bg-violet-950'
                          : 'border-violet-800 bg-violet-950'
                    }`}
                  >
                    <UrnVessel urn={urn} size="sm" showPlaque={false} className="mx-auto h-16" />
                    <div className="text-[9px] font-bold leading-tight mt-0.5">
                      {urn.name}
                      {preferred ? ' ★' : ''}
                    </div>
                    <div className="text-[8px] text-violet-300">
                      Own {urnInventory[urn.id] ?? (selected ? 0 : 0)}
                      {selected ? ' · staged' : ''}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {FLOWER_TYPES.map((flower) => {
            const inv = showroomInventory.find((i) =>
              i.id.includes(flower.toLowerCase())
            );
            const placed = placedFlowers.includes(flower);
            const preferred = currentCase.preferredFlowers === flower;
            return (
              <button
                key={flower}
                type="button"
                disabled={placed || !inv || inv.ownedCount <= 0}
                onPointerDown={() =>
                  placeFloralSpray(flower, currentCase.id)
                }
                className={`py-3 rounded font-semibold text-[11px] ${
                  placed
                    ? 'bg-emerald-700'
                    : inv && inv.ownedCount > 0
                      ? preferred
                        ? 'bg-amber-500 text-violet-950'
                        : 'bg-violet-700'
                      : 'bg-violet-950 text-violet-600'
                }`}
              >
                {placed
                  ? `${flower} placed`
                  : `Place ${flower}${preferred ? ' ★' : ''} (${inv?.ownedCount ?? 0})`}
              </button>
            );
          })}
        </div>

        <div className="mt-auto grid grid-cols-2 gap-3 pb-2">
          <button
            type="button"
            onPointerDown={() =>
              finalizeServiceAndNextCase('BURIAL', currentCase.id)
            }
            className="py-3 bg-sky-600 active:bg-sky-500 rounded font-bold text-sm"
          >
            Finalize Burial
          </button>
          <button
            type="button"
            onPointerDown={() =>
              finalizeServiceAndNextCase('CREMATION', currentCase.id)
            }
            className="py-3 bg-orange-600 active:bg-orange-500 rounded font-bold text-sm"
          >
            Finalize Cremation
          </button>
        </div>
      </div>
    </div>
  );
};
