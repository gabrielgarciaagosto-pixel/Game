import React from 'react';
import { displayCaseName } from '../types/game';
import { useGameStore } from '../store/useGameStore';

export const MainHubMenu: React.FC = () => {
  const {
    setActiveStation,
    coolerCases,
    activeCaseId,
    cash,
    reputation,
    ossilegiumCommuneGrams,
  } = useGameStore();

  const untaggedUrgentCount = coolerCases.filter(
    (c) => !c.isTagged && Date.now() < c.tagExpiresAt
  ).length;

  const tiles = [
    {
      id: 'COOLER' as const,
      title: 'COOLER',
      subtitle: `${coolerCases.length} / 6 Bays Occupied`,
      badge:
        untaggedUrgentCount > 0
          ? `${untaggedUrgentCount} UNTAGGED (TIMER ACTIVE!)`
          : undefined,
      color: 'from-cyan-900/80 to-slate-900 border-cyan-500/50',
    },
    {
      id: 'EMBALMING' as const,
      title: 'EMBALMING ROOM',
      subtitle: 'Chemical Mixing & Arterial Prep',
      color: 'from-emerald-900/80 to-slate-900 border-emerald-500/50',
    },
    {
      id: 'CREMATION' as const,
      title: 'CREMATORY',
      subtitle: 'Retort Burn, Stir & 3-Tool Sweep',
      color: 'from-orange-900/80 to-slate-900 border-orange-500/50',
    },
    {
      id: 'URN_FILLING' as const,
      title: 'URN PROCESSING',
      subtitle: 'Magnet Sweep, Cremulator & Funnel',
      color: 'from-amber-900/80 to-slate-900 border-amber-500/50',
    },
    {
      id: 'SHOWROOM' as const,
      title: 'CHAPEL & SHOWROOM',
      subtitle: 'Floral Layout, Caskets & Services',
      color: 'from-violet-900/80 to-slate-900 border-violet-500/50',
    },
  ];

  const activeCase = coolerCases.find((c) => c.id === activeCaseId);

  return (
    <div className="w-full h-full bg-slate-950 text-slate-100 p-4 md:p-6 flex flex-col justify-between select-none">
      <div className="flex justify-between items-center border-b border-slate-800 pb-3 gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-wider text-slate-100">
            DEATH IS MY BUSINESS
          </h1>
          <p className="text-xs text-slate-400">
            Selected Case:{' '}
            <span className="text-amber-300 font-semibold">
              {activeCase
                ? `${displayCaseName(activeCase)} (${activeCase.weightLbs} lbs)`
                : 'None — Select a body in the Cooler'}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap justify-end gap-2 md:gap-4 font-mono text-sm">
          <div className="bg-slate-900 px-3 md:px-4 py-2 rounded border border-slate-800">
            CASH:{' '}
            <span className="text-emerald-400 font-bold">
              ${cash.toLocaleString()}
            </span>
          </div>
          <div className="bg-slate-900 px-3 md:px-4 py-2 rounded border border-slate-800">
            REP: <span className="text-sky-400 font-bold">{reputation}</span>
          </div>
          <div className="bg-slate-900 px-3 md:px-4 py-2 rounded border border-slate-800">
            OSS:{' '}
            <span className="text-violet-300 font-bold">
              {ossilegiumCommuneGrams} g
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-5 my-auto py-4">
        {tiles.map((tile) => (
          <button
            key={tile.id}
            type="button"
            onPointerDown={() => setActiveStation(tile.id)}
            className={`aspect-square max-h-44 w-full rounded-2xl bg-gradient-to-br ${tile.color} border-2 p-4 md:p-5 flex flex-col justify-between items-start text-left shadow-lg active:scale-95 transition-transform relative overflow-hidden`}
          >
            <span className="text-base md:text-lg font-extrabold tracking-wide">
              {tile.title}
            </span>

            {tile.badge && (
              <span className="px-2 py-1 text-[11px] font-bold bg-red-600 text-white rounded animate-pulse">
                {tile.badge}
              </span>
            )}

            <span className="text-xs text-slate-300">{tile.subtitle}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
