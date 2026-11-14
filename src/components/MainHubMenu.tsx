import React from 'react';
import { displayCaseName } from '../types/game';
import { useGameStore } from '../store/useGameStore';
import { gameNow } from '../utils/gameNow';
import { getCremationTargets } from '../utils/mortuaryMath';
import { retortProgress } from '../retort/retortTypes';
import { URN_CATALOG } from '../data/urnCatalog';

export const MainHubMenu: React.FC = () => {
  const {
    setActiveStation,
    cases,
    activeCaseId,
    cash,
    reputation,
    ossilegiumCommuneGrams,
    retort,
    urnInventory,
  } = useGameStore();

  const coolerCases = cases.filter((c) => c.location === 'COOLER');
  const vaultCount = cases.filter((c) => c.location === 'URN_VAULT').length;
  const activeCase = cases.find((c) => c.id === activeCaseId) ?? null;
  const retortCase = cases.find((c) => c.id === retort.caseId);
  const urnOwned = Object.values(urnInventory).reduce((a, b) => a + b, 0);
  const collectionKinds = URN_CATALOG.filter(
    (u) => (urnInventory[u.id] ?? 0) > 0
  ).length;

  const untaggedUrgentCount = coolerCases.filter(
    (c) => !c.isTagged && gameNow() < c.tagExpiresAt
  ).length;

  const burnPct =
    retort.phase === 'BURN' && retortCase
      ? Math.round(
          retortProgress(
            retort.elapsedSec,
            getCremationTargets(retortCase.weightLbs).targetDurationSec
          ) * 100
        )
      : null;

  const tiles = [
    {
      id: 'COOLER' as const,
      title: 'COOLER',
      subtitle: `${coolerCases.length} / 6 Bays Occupied`,
      badge:
        untaggedUrgentCount > 0
          ? `${untaggedUrgentCount} UNTAGGED`
          : undefined,
      color: 'from-cyan-950 via-slate-950 to-slate-950 border-cyan-500/45',
    },
    {
      id: 'EMBALMING' as const,
      title: 'EMBALMING',
      subtitle: 'Arterial mix & pour table',
      color: 'from-emerald-950 via-slate-950 to-slate-950 border-emerald-500/45',
    },
    {
      id: 'CREMATION' as const,
      title: 'CREMATORY',
      subtitle:
        burnPct != null
          ? `Running · ${burnPct}% — tap to return`
          : 'Millennium · door · tools · dial',
      badge: burnPct != null ? `BURN ${burnPct}%` : undefined,
      color: 'from-orange-950 via-slate-950 to-slate-950 border-orange-500/45',
    },
    {
      id: 'URN_FILLING' as const,
      title: 'URN PROCESSING',
      subtitle: 'Crush, magnet, cremulator',
      color: 'from-amber-950 via-slate-950 to-slate-950 border-amber-500/45',
    },
    {
      id: 'SHOWROOM' as const,
      title: 'CHAPEL',
      subtitle: 'Bier, flowers, family service',
      color: 'from-violet-950 via-slate-950 to-slate-950 border-violet-500/45',
    },
    {
      id: 'EMPORIUM' as const,
      title: 'FUNERARY EMPORIUM',
      subtitle: `${collectionKinds} styles · ${urnOwned} owned`,
      color: 'from-yellow-950 via-[#1a120a] to-slate-950 border-amber-400/50',
    },
    {
      id: 'URN_VAULT' as const,
      title: 'URN VAULT',
      subtitle: `${vaultCount} sealed · collection display`,
      color: 'from-stone-900 via-slate-950 to-slate-950 border-stone-500/45',
    },
  ];

  return (
    <div className="safe-hub w-full h-full bg-[#070b12] text-slate-100 flex flex-col select-none overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(90% 55% at 50% -10%, rgba(180,83,9,0.22), transparent 55%), radial-gradient(60% 40% at 100% 100%, rgba(14,116,144,0.12), transparent 50%)',
        }}
      />

      <div className="relative shrink-0 border-b border-slate-800/90 pb-2 space-y-2 px-1">
        <div>
          <h1 className="text-lg font-black tracking-[0.08em] text-slate-50 leading-tight">
            OSSUARIAN
            <span className="block text-sm font-semibold tracking-[0.22em] text-amber-200/90">
              FIRST URN
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 leading-snug">
            Selected:{' '}
            <span className="text-amber-300 font-semibold">
              {activeCase
                ? `${displayCaseName(activeCase)} · ${activeCase.location}`
                : 'None — Cooler'}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
          <div className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
            $<span className="text-emerald-400 font-bold">{cash.toLocaleString()}</span>
          </div>
          <div className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
            REP <span className="text-sky-400 font-bold">{reputation}</span>
          </div>
          <div className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
            OSS <span className="text-violet-300 font-bold">{ossilegiumCommuneGrams}g</span>
          </div>
          <div className="bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-amber-900/50">
            URNS <span className="text-amber-300 font-bold">{urnOwned}</span>
          </div>
        </div>
      </div>

      <div className="relative flex-1 min-h-0 grid grid-cols-2 gap-2.5 content-start py-3 overflow-y-auto pb-20">
        {tiles.map((tile) => (
          <button
            key={tile.id}
            type="button"
            onPointerDown={() => setActiveStation(tile.id)}
            className={`min-h-[7.25rem] w-full rounded-2xl bg-gradient-to-br ${tile.color} border p-3 flex flex-col justify-between items-start text-left shadow-[0_10px_30px_rgba(0,0,0,0.35)] active:scale-[0.98] transition-transform relative overflow-hidden ${
              tile.id === 'EMPORIUM' ? 'col-span-2 min-h-[6.5rem]' : ''
            }`}
          >
            <span className="absolute -right-2 -bottom-3 text-5xl opacity-[0.1] font-black pointer-events-none">
              {tile.title.slice(0, 1)}
            </span>
            <span className="text-[15px] font-extrabold tracking-wide">
              {tile.title}
            </span>
            {tile.badge && (
              <span className="px-2 py-1 text-[10px] font-bold bg-red-600 text-white rounded animate-pulse">
                {tile.badge}
              </span>
            )}
            <span className="text-[11px] text-slate-300">{tile.subtitle}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
