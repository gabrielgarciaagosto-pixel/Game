import React, { useEffect, useState } from 'react';
import { CaseTransferBar } from './CaseTransferBar';
import { displayCaseName, decayLabel } from '../types/game';
import { caseAtLocation, useGameStore } from '../store/useGameStore';

const FLOWER_TYPES = ['LILIES', 'ROSES', 'WREATH'] as const;

export const ShowroomAndChapelModal: React.FC = () => {
  const {
    cases,
    activeCaseId,
    showroomInventory,
    placedFlowers,
    serviceRatingBonus,
    cash,
    buyShowroomItem,
    placeFloralSpray,
    finalizeServiceAndNextCase,
    setActiveStation,
    takeCaseToStation,
    focusCase,
  } = useGameStore();

  const [tab, setTab] = useState<'BUY' | 'CHAPEL'>('BUY');
  const currentCase = caseAtLocation(cases, 'CHAPEL', activeCaseId);

  useEffect(() => {
    if (currentCase && currentCase.id !== activeCaseId) {
      focusCase(currentCase.id);
    }
  }, [currentCase, activeCaseId, focusCase]);

  if (!currentCase) {
    return (
      <div className="fixed inset-0 z-50 bg-violet-950/95 text-violet-50 flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-center max-w-md">
          No case staged for chapel. Move remains here with Chapel / Move to
          Chapel — hub tiles only open rooms.
        </p>
        <button
          type="button"
          onPointerDown={() => setActiveStation('COOLER')}
          className="px-4 py-2 bg-cyan-700 rounded font-semibold"
        >
          Open Cooler
        </button>
      </div>
    );
  }

  const lateService =
    currentCase.serviceDateMs != null &&
    Date.now() > currentCase.serviceDateMs;

  return (
    <div className="fixed inset-0 z-50 bg-violet-950/95 text-violet-50 p-4 md:p-6 pb-24 flex flex-col select-none overflow-auto">
      <div className="flex justify-between items-center border-b border-violet-800 pb-3 gap-3">
        <div>
          <h2 className="text-lg md:text-xl font-bold text-violet-300">
            SHOWROOM & CHAPEL — {displayCaseName(currentCase)}
          </h2>
          <p className="text-xs text-violet-300/70">
            Prefers {currentCase.preferredFlowers} | Directive:{' '}
            {currentCase.directive} | Cash: ${cash} | Service boost: +
            {serviceRatingBonus}%
            {currentCase.embalmRank
              ? ` | Embalm ${currentCase.embalmRank}`
              : ' | Not embalmed'}
            {currentCase.decayLevel > 5
              ? ` | ${decayLabel(currentCase.decayLevel)}`
              : ''}
            {currentCase.serviceDateMs
              ? ` | Service ${new Date(currentCase.serviceDateMs).toLocaleString()}`
              : ''}
            {lateService ? ' | LATE' : ''}
          </p>
          <CaseTransferBar currentCase={currentCase} showVault />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onPointerDown={() =>
              currentCase && takeCaseToStation(currentCase.id, 'COOLER')
            }
            className="px-3 py-2 bg-cyan-800 rounded text-sm"
          >
            Cooler
          </button>
          <button
            type="button"
            onPointerDown={() => setActiveStation('OVERVIEW')}
            className="px-4 py-2 bg-violet-900 rounded text-sm active:bg-violet-800"
          >
            Main Menu
          </button>
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <button
          type="button"
          onPointerDown={() => setTab('BUY')}
          className={`px-4 py-2 rounded font-semibold ${
            tab === 'BUY' ? 'bg-violet-500' : 'bg-violet-900'
          }`}
        >
          Buy Merchandise
        </button>
        <button
          type="button"
          onPointerDown={() => setTab('CHAPEL')}
          className={`px-4 py-2 rounded font-semibold ${
            tab === 'CHAPEL' ? 'bg-violet-500' : 'bg-violet-900'
          }`}
        >
          Arrange Chapel
        </button>
      </div>

      {tab === 'BUY' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {showroomInventory.map((item) => (
            <div
              key={item.id}
              className="bg-violet-950/80 border border-violet-800 rounded-lg p-4 flex justify-between items-center gap-3"
            >
              <div>
                <div className="font-semibold">{item.name}</div>
                <div className="text-xs text-violet-300/70">
                  {item.category} · Own {item.ownedCount} · Prestige +
                  {item.prestigeBonus} · Resale ${item.resaleValue}
                </div>
              </div>
              <button
                type="button"
                onPointerDown={() => buyShowroomItem(item.id)}
                disabled={cash < item.cost}
                className={`px-3 py-2 rounded font-bold text-sm whitespace-nowrap ${
                  cash >= item.cost
                    ? 'bg-amber-500 text-violet-950 active:bg-amber-400'
                    : 'bg-violet-900 text-violet-500'
                }`}
              >
                Buy ${item.cost}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-4 mt-4">
          <div className="relative h-48 md:h-64 rounded-xl border-2 border-violet-700 bg-gradient-to-b from-violet-900 to-violet-950 overflow-hidden">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-16 md:w-56 md:h-20 bg-amber-800 rounded-sm border border-amber-600 flex items-center justify-center text-xs font-bold">
              {currentCase.isUrnFilled ? 'URN ON BIER' : 'CASKET / BIER'}
            </div>
            {placedFlowers.map((flower, idx) => (
              <div
                key={flower}
                className="absolute text-xs font-bold px-2 py-1 rounded bg-emerald-700/90"
                style={{
                  left: `${18 + idx * 28}%`,
                  bottom: '18%',
                }}
              >
                {flower}
              </div>
            ))}
            <div className="absolute bottom-2 left-3 text-xs text-violet-300">
              Place floral sprays around the casket to boost service ratings.
              Matching preference pays more.
            </div>
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
                  className={`py-3 rounded font-semibold text-sm ${
                    placed
                      ? 'bg-emerald-700'
                      : inv && inv.ownedCount > 0
                        ? preferred
                          ? 'bg-amber-500 text-violet-950 active:bg-amber-400'
                          : 'bg-violet-700 active:bg-violet-600'
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

          <div className="mt-auto grid grid-cols-2 gap-3">
            <button
              type="button"
              onPointerDown={() =>
                finalizeServiceAndNextCase('BURIAL', currentCase.id)
              }
              className="py-3 bg-sky-600 active:bg-sky-500 rounded font-bold"
            >
              Finalize Burial Service
            </button>
            <button
              type="button"
              onPointerDown={() =>
                finalizeServiceAndNextCase('CREMATION', currentCase.id)
              }
              className="py-3 bg-orange-600 active:bg-orange-500 rounded font-bold"
            >
              Finalize Cremation Service
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
