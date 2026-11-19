import React, { useRef, useState } from 'react';
import {
  foreclosureMsRemaining,
  formatRealCountdown,
} from '../data/bankForeclosure';
import { resolveCortege } from '../data/funeralFleets';
import { getUrnById } from '../data/urnCatalog';
import { useTapAction } from '../hooks/useTapAction';
import {
  isChapelGathering,
  serviceProgressPct,
  serviceTiming,
} from '../data/pacing';
import { useGameNow } from '../hooks/useGameNow';
import { getCremationTargets } from '../utils/mortuaryMath';
import { retortProgress } from '../retort/retortTypes';
import { directiveLabel, displayCaseName, type StationId } from '../types/game';
import { TAG_WINDOW_MS, useGameStore, type LastCaseNote } from '../store/useGameStore';
import { HubAtmosphere } from './hub/HubAtmosphere';
import { titleProgress } from '../data/rankProgression';
import { noteUrnsTap } from '../dev/devSummon';
import { DeskCalendar } from './hub/DeskCalendar';
import { NewsTicker } from './hub/NewsTicker';
import type { DecedentCase } from '../types/game';

type StatId = 'cash' | 'rep' | 'int' | 'oss' | 'urns';

const BOB: { dur: string; delay: string }[] = [
  { dur: '4.6s', delay: '0s' },
  { dur: '5.5s', delay: '-1.3s' },
  { dur: '3.8s', delay: '-0.5s' },
  { dur: '6.2s', delay: '-2.2s' },
  { dur: '4.3s', delay: '-0.9s' },
  { dur: '5.7s', delay: '-1.8s' },
  { dur: '5.0s', delay: '-2.7s' },
];

function lastCaseLine(note: LastCaseNote | null, cases: DecedentCase[]): string {
  const newest = cases.reduce<DecedentCase | null>(
    (best, c) => (!best || c.arrivedAt > best.arrivedAt ? c : best),
    null
  );
  const newestAt = newest?.arrivedAt ?? 0;
  if (note && note.at >= newestAt) {
    const live = cases.find((c) => c.id === note.id);
    const name = live ? displayCaseName(live) : note.name;
    return `${name} · ${note.service}`;
  }
  if (newest) {
    return `${displayCaseName(newest)} · ${directiveLabel(newest.directive)}`;
  }
  if (note) return `${note.name} · ${note.service}`;
  return 'None yet';
}

function RankStrip({ xp }: { xp: number }) {
  const progress = titleProgress(xp);
  const { current, next, into, span, pct } = progress;
  return (
    <div
      className="rounded-xl border border-amber-900/50 bg-black/35 px-2.5 py-1.5"
      data-rank-display
      data-rank-tier={current.tier}
      data-rank-title={current.title}
      data-rank-pct={pct}
    >
      <div className="flex items-baseline justify-between gap-2">
        <p className="min-w-0 truncate text-[12px] leading-tight">
          <span className="mr-1.5 inline-flex min-w-[1.4rem] items-center justify-center rounded bg-amber-200/15 px-1 font-black text-amber-100">
            {current.tier}
          </span>
          <span className="font-semibold text-amber-50">{current.title}</span>
        </p>
        <span className="shrink-0 font-mono text-[10px] text-slate-400">
          {next ? `${into}/${span}` : 'Kept'}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-amber-300"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function HubBurst({ id }: { id: StationId }) {
  if (id === 'CREMATION') {
    return (
      <span className="hub-fx hub-fx-flame">
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
    );
  }
  if (id === 'URN_FILLING') {
    return (
      <span className="hub-fx hub-fx-dust">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </span>
    );
  }
  if (id === 'COOLER') {
    return (
      <span className="hub-fx hub-fx-frost">
        <i />
        <i />
        <i />
        <i />
      </span>
    );
  }
  if (id === 'EMBALMING') {
    return (
      <span className="hub-fx hub-fx-drip">
        <i />
        <i />
        <i />
      </span>
    );
  }
  if (id === 'SHOWROOM') {
    return (
      <span className="hub-fx hub-fx-chapel">
        <i />
        <i />
        <i />
        <i />
      </span>
    );
  }
  if (id === 'URN_VAULT') {
    return (
      <span className="hub-fx hub-fx-gold">
        <i />
        <i />
        <i />
        <i />
      </span>
    );
  }
  return (
    <span className="hub-fx hub-fx-crt">
      <i />
    </span>
  );
}

function HubRoomButton({
  id,
  title,
  subtitle,
  badge,
  badgeTone,
  color,
  wide,
  bob,
  bursting,
  live,
  onPick,
}: {
  id: StationId;
  title: string;
  subtitle: string;
  badge?: string;
  badgeTone?: 'alert' | 'live';
  color: string;
  wide: boolean;
  bob: { dur: string; delay: string };
  bursting: boolean;
  live?: boolean;
  onPick: (id: StationId) => void;
}) {
  const tap = useTapAction(() => onPick(id));
  return (
    <div
      className={`hub-bob h-full min-h-0 ${wide ? 'col-span-2' : ''}`}
      style={{
        ['--bob-dur' as string]: bob.dur,
        ['--bob-delay' as string]: bob.delay,
      }}
    >
      <button
        type="button"
        {...tap}
        data-tutorial-target={
          id === 'COOLER'
            ? 'cooler'
            : id === 'CREMATION'
              ? 'crematory'
              : id === 'COMPUTER'
                ? 'computer'
                : id === 'EMBALMING'
                  ? 'embalming'
                  : id === 'SHOWROOM'
                    ? 'chapel'
                    : id === 'URN_FILLING'
                      ? 'urn'
                      : undefined
        }
        data-chapel-live={id === 'SHOWROOM' && live ? '1' : undefined}
        className={`h-full min-h-0 w-full rounded-2xl bg-gradient-to-br ${color} border p-2 flex flex-col justify-between items-start text-left shadow-[0_10px_30px_rgba(0,0,0,0.35)] active:scale-[0.98] relative overflow-hidden`}
      >
        {live && <span className="hub-chapel-live-glow" aria-hidden />}
        {bursting && <HubBurst id={id} />}
        <span aria-hidden className="absolute -right-2 -bottom-3 text-5xl opacity-[0.1] font-black pointer-events-none">
          {title.slice(0, 1)}
        </span>
        <span className="relative text-[14px] font-extrabold tracking-wide leading-tight">{title}</span>
        {badge && (
          <span
            className={`relative px-2 py-1 text-[10px] font-bold rounded ${
              badgeTone === 'live'
                ? 'bg-amber-300 text-stone-950'
                : 'bg-red-600 text-white animate-pulse'
            }`}
          >
            {badge}
          </span>
        )}
        <span className="relative line-clamp-2 text-[11px] leading-tight text-slate-300">{subtitle}</span>
      </button>
    </div>
  );
}

function StatChip({
  id,
  active,
  onTap,
  children,
  className,
}: {
  id: StatId;
  active: boolean;
  onTap: (id: StatId) => void;
  children: React.ReactNode;
  className: string;
}) {
  const tap = useTapAction(() => onTap(id));
  return (
    <button
      type="button"
      {...tap}
      aria-expanded={active}
      data-stat-chip={id}
      className={`bg-slate-950/80 px-2.5 py-1.5 rounded-lg border font-mono text-[11px] ${className} ${
        active ? 'ring-1 ring-amber-300/70' : ''
      }`}
    >
      {children}
    </button>
  );
}

export const MainHubMenu: React.FC = () => {
  const {
    setActiveStation,
    cases,
    cash,
    reputation,
    intermentScore,
    ossilegiumCommuneGrams,
    retort,
    retortMachines,
    urnInventory,
    lastCase,
    ownedProperty,
    activeLoans,
    ownedFleetIds,
    fleetAssignment,
    negativeCashSinceMs,
    overdraftAccruedMs,
    bankForeclosed,
    careerXp,
    coolerCapacity,
  } = useGameStore();

  const coolerCases = cases.filter((c) => c.location === 'COOLER');
  const vaultCount = cases.filter((c) => c.location === 'URN_VAULT').length;
  const urnOwned = Object.values(urnInventory).reduce((a, b) => a + b, 0);
  const [openStat, setOpenStat] = useState<StatId | null>(null);
  const [burst, setBurst] = useState<StationId | null>(null);
  const navTimer = useRef<number | null>(null);

  const clockOn = cases.some((c) => c.serviceDateMs != null);
  const now = useGameNow(clockOn);
  const liveServices = cases
    .filter(
      (c) => isChapelGathering(c.directive) && serviceTiming(c.serviceDateMs, now) === 'grace'
    )
    .sort((a, b) => (a.serviceDateMs ?? 0) - (b.serviceDateMs ?? 0));
  const leadService = liveServices[0] ?? null;
  const servicePct =
    leadService?.serviceDateMs != null
      ? serviceProgressPct(leadService.serviceDateMs, now)
      : null;

  const untaggedUrgentCount = coolerCases.filter(
    (c) => !c.isTagged && !c.nameExpired && c.tagRemainingMs > 0 && c.tagRemainingMs <= TAG_WINDOW_MS
  ).length;

  const roster = retortMachines.length > 0 ? retortMachines : [retort];
  const burning = roster
    .map((m, i) => ({
      m,
      i,
      c: cases.find((c) => c.id === m.caseId),
    }))
    .filter((x) => x.m.phase === 'BURN' && x.c);
  const leadBurn = burning[0] ?? null;
  const burnPct =
    leadBurn && leadBurn.c
      ? Math.round(
          retortProgress(
            leadBurn.m.elapsedSec,
            getCremationTargets(leadBurn.c.weightLbs).targetDurationSec
          ) * 100
        )
      : null;

  const tiles: {
    id: StationId;
    title: string;
    subtitle: string;
    badge?: string;
    badgeTone?: 'alert' | 'live';
    color: string;
    live?: boolean;
  }[] = [
    {
      id: 'COOLER',
      title: 'COOLER',
      subtitle: `${coolerCases.length} / ${coolerCapacity()} Bays Occupied`,
      badge: untaggedUrgentCount > 0 ? `${untaggedUrgentCount} UNTAGGED` : undefined,
      color: 'from-cyan-950/80 via-slate-950/65 to-slate-950/80 border-cyan-500/45',
    },
    {
      id: 'EMBALMING',
      title: 'EMBALMING',
      subtitle: 'Arterial mix & pour table',
      color: 'from-emerald-950/80 via-slate-950/65 to-slate-950/80 border-emerald-500/45',
    },
    {
      id: 'CREMATION',
      title: 'CREMATORY',
      subtitle:
        burnPct != null
          ? roster.length > 1
            ? `Retort ${String.fromCharCode(65 + (leadBurn?.i ?? 0))} · ${burnPct}%`
            : `Running · ${burnPct}% — tap to return`
          : 'Millennium · door · tools · dial',
      badge: burnPct != null ? `BURN ${burnPct}%` : undefined,
      color: 'from-orange-950/75 via-slate-950/60 to-slate-950/78 border-orange-500/45',
    },
    {
      id: 'URN_FILLING',
      title: 'URN PROCESSING',
      subtitle: 'Crush, magnet, cremulator',
      color: 'from-amber-950/75 via-slate-950/60 to-slate-950/78 border-amber-500/45',
    },
    {
      id: 'SHOWROOM',
      title: 'CHAPEL',
      subtitle: servicePct != null ? 'SERVICE IN PROGRESS' : 'Bier, flowers, family service',
      badge: servicePct != null ? `SERVICE ${servicePct}%` : undefined,
      badgeTone: servicePct != null ? 'live' : undefined,
      live: servicePct != null,
      color: servicePct != null
        ? 'from-amber-950/80 via-violet-950/75 to-slate-950/80 border-amber-200/55'
        : 'from-violet-950/75 via-slate-950/60 to-slate-950/78 border-violet-500/45',
    },
    {
      id: 'URN_VAULT',
      title: 'URN VAULT',
      subtitle: `${vaultCount} sealed · collection display`,
      color: 'from-stone-900/75 via-slate-950/60 to-slate-950/78 border-stone-500/45',
    },
    {
      id: 'COMPUTER',
      title: 'COMPUTER',
      subtitle: 'Desktop · Shop · Fleets · Craigmile · Settings',
      color: 'from-teal-950/75 via-slate-950/60 to-slate-950/78 border-teal-500/45',
    },
  ];

  const pickRoom = (id: StationId) => {
    setOpenStat(null);
    setBurst(id);
    if (navTimer.current != null) window.clearTimeout(navTimer.current);
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    navTimer.current = window.setTimeout(() => {
      setActiveStation(id);
    }, reduced ? 0 : 680);
  };

  const debt = activeLoans.reduce((sum, l) => sum + l.principalRemaining, 0);
  const coach = resolveCortege(ownedFleetIds, fleetAssignment).coach;
  const urnLines = Object.entries(urnInventory)
    .filter(([, n]) => n > 0)
    .slice(0, 4)
    .map(([id, n]) => `${getUrnById(id)?.name ?? id} ×${n}`);
  const urnExtra = Object.values(urnInventory).filter((n) => n > 0).length - urnLines.length;

  const statCopy: Record<StatId, { title: string; body: string; detail: string }> = {
    cash: {
      title: 'Cash',
      body: 'House operating balance. Service payouts, vessel sales, fines, and loan drafts all post here. A negative balance starts the bank’s foreclosure clock.',
      detail: `$${cash.toLocaleString()} on hand · ${ownedProperty.label}, ${ownedProperty.city} ${ownedProperty.stateCode} · loans $${debt.toLocaleString()} outstanding${
        cash < 0 && negativeCashSinceMs != null && !bankForeclosed
          ? ` · foreclosure in ${formatRealCountdown(foreclosureMsRemaining(overdraftAccruedMs))}`
          : ''
      }`,
    },
    rep: {
      title: 'Reputation',
      body: 'Standing with families and the board. Finer urns and caskets in the emporium unlock as it rises. Decay, fines, and failed services cut it.',
      detail: `Now ${reputation}.`,
    },
    int: {
      title: 'Interment',
      body: 'House total from the funeral coach. Each successful service adds that coach’s interment. Recovery vans add reputation; escorts and flower cars add cash.',
      detail: coach
        ? `House interment ${intermentScore}. Coach ${coach.name} adds ${coach.interment} per successful service.`
        : `House interment ${intermentScore}. No coach in the garage yet.`,
    },
    oss: {
      title: 'Ossilegium Commune',
      body: 'Communal cremains kept by the house. Finishing a cremation sets aside about two percent of that case’s bone ash.',
      detail: `${ossilegiumCommuneGrams} g on hand.`,
    },
    urns: {
      title: 'Urns in stock',
      body: 'Vessels on the shelf for cremation families. Staging one for a case takes it out of this count.',
      detail:
        urnOwned === 0
          ? 'Shelf is empty.'
          : `${urnOwned} on the shelf. ${urnLines.join(', ')}${urnExtra > 0 ? ` +${urnExtra} more` : ''}.`,
    },
  };

  const open = openStat ? statCopy[openStat] : null;

  return (
    <div
      className="safe-hub relative w-full h-full bg-[#070b12] text-slate-100 flex flex-col select-none overflow-hidden"
      data-hub-root
    >
      <HubAtmosphere />
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            'radial-gradient(90% 55% at 50% -10%, rgba(180,83,9,0.22), transparent 55%), radial-gradient(60% 40% at 100% 100%, rgba(14,116,144,0.12), transparent 50%)',
        }}
      />

      {openStat && (
        <button
          type="button"
          aria-label="Dismiss stat"
          className="fixed inset-0 z-30 cursor-default bg-transparent"
          onClick={() => setOpenStat(null)}
        />
      )}

      <div className="relative z-40 shrink-0 border-b border-slate-800/90 pb-1.5 space-y-1 px-1">
        <NewsTicker />
        <RankStrip xp={careerXp} />
        <p className="text-[11px] text-slate-400 leading-snug" data-hub-last-case>
          Last case:{' '}
          <span className="text-amber-300 font-semibold">{lastCaseLine(lastCase, cases)}</span>
        </p>

        <div className="flex flex-wrap gap-1.5">
          <StatChip
            id="cash"
            active={openStat === 'cash'}
            onTap={(id) => setOpenStat((s) => (s === id ? null : id))}
            className="border-slate-800"
          >
            $
            <span className={`font-bold ${cash < 0 ? 'text-red-400' : 'text-emerald-400'}`}>
              {cash.toLocaleString()}
            </span>
          </StatChip>
          <StatChip
            id="rep"
            active={openStat === 'rep'}
            onTap={(id) => setOpenStat((s) => (s === id ? null : id))}
            className="border-slate-800"
          >
            REP <span className="text-sky-400 font-bold">{reputation}</span>
          </StatChip>
          <StatChip
            id="int"
            active={openStat === 'int'}
            onTap={(id) => setOpenStat((s) => (s === id ? null : id))}
            className="border-amber-700/50"
          >
            INT <span className="text-amber-200 font-bold">{intermentScore}</span>
          </StatChip>
          <StatChip
            id="oss"
            active={openStat === 'oss'}
            onTap={(id) => setOpenStat((s) => (s === id ? null : id))}
            className="border-slate-800"
          >
            OSS <span className="text-violet-300 font-bold">{ossilegiumCommuneGrams}g</span>
          </StatChip>
          <StatChip
            id="urns"
            active={openStat === 'urns'}
            onTap={(id) => {
              if (import.meta.env.VITE_PUBLIC_DEMO !== '1') noteUrnsTap();
              setOpenStat((s) => (s === id ? null : id));
            }}
            className="border-amber-900/50"
          >
            URNS <span className="text-amber-300 font-bold">{urnOwned}</span>
          </StatChip>
        </div>

        {open && (
          <div
            className="rounded-xl border border-slate-700 bg-slate-950/95 p-3 text-[12px] text-slate-300 shadow-xl"
            data-hub-stat={openStat}
          >
            <div className="text-[10px] uppercase tracking-[0.16em] text-amber-200/90">
              {open.title}
            </div>
            <p className="mt-1 leading-snug">{open.body}</p>
            <p className="mt-2 font-mono text-[11px] text-slate-100 leading-snug">{open.detail}</p>
          </div>
        )}
      </div>

      <div
        className="relative z-10 min-h-0 flex-1 overflow-hidden grid grid-cols-2 grid-rows-4 gap-1.5 py-1.5"
        data-hub-grid
      >
        {tiles.map((tile, index) => (
          <HubRoomButton
            key={tile.id}
            id={tile.id}
            title={tile.title}
            subtitle={tile.subtitle}
            badge={tile.badge}
            badgeTone={tile.badgeTone}
            color={tile.color}
            wide={tile.id === 'COMPUTER'}
            bob={BOB[index] ?? BOB[0]}
            bursting={burst === tile.id || Boolean(tile.live)}
            live={tile.live}
            onPick={pickRoom}
          />
        ))}
      </div>
      <div
        className="pointer-events-none absolute z-20"
        style={{ left: 'var(--safe-left)', bottom: 'var(--safe-bottom)' }}
      >
        <DeskCalendar />
      </div>
    </div>
  );
};
