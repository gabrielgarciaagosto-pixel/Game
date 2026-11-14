import React, { useEffect, useMemo, useRef } from 'react';
import { CaseTransferBar } from './CaseTransferBar';
import { displayCaseName, decayLabel } from '../types/game';
import { caseAtLocation, useGameStore } from '../store/useGameStore';
import { gameNow } from '../utils/gameNow';
import { getUrnById, URN_CATALOG } from '../data/urnCatalog';
import { CASKET_CATALOG, getCasketById } from '../data/casketCatalog';
import {
  BASIC_URN_PEDESTAL,
  CHAPEL_DECOR_CATALOG,
  getChapelDecorById,
  maxFlowerStands,
  type ChapelLayoutPiece,
  type FlowerKind,
} from '../data/chapelDecor';
import {
  scoreChapelArrangement,
  satisfactionToRewards,
} from '../utils/chapelSatisfaction';
import { caseUsesUrnStand } from '../data/familyUrnPick';
import { directiveLabel } from '../types/game';
import { ChapelMourners } from './ChapelMourners';
import { UrnVessel } from './urns/UrnVessel';
import { CasketVessel } from './caskets/CasketVessel';

const FLOWER_TYPES = ['LILIES', 'ROSES', 'WREATH'] as const;

export const ShowroomAndChapelModal: React.FC = () => {
  const {
    cases,
    activeCaseId,
    showroomInventory,
    urnInventory,
    casketInventory,
    chapelOwnedDecor,
    chapelLayouts,
    cash,
    placeFloralSpray,
    removeChapelFlower,
    offerUrnToCase,
    offerCasketToCase,
    finalizeServiceAndNextCase,
    setActiveStation,
    takeCaseToStation,
    focusCase,
    ensureChapelLayout,
    setChapelTheme,
    moveChapelPiece,
  } = useGameStore();

  const currentCase = caseAtLocation(cases, 'CHAPEL', activeCaseId);

  useEffect(() => {
    if (currentCase && currentCase.id !== activeCaseId) {
      focusCase(currentCase.id);
    }
  }, [currentCase, activeCaseId, focusCase]);

  useEffect(() => {
    if (currentCase) ensureChapelLayout(currentCase.id);
  }, [currentCase, ensureChapelLayout]);

  const layout = currentCase ? chapelLayouts[currentCase.id] : undefined;
  /** Live drag overrides — score uses these; store persists only on release. */
  const [dragOverrides, setDragOverrides] = React.useState<
    Record<string, { x: number; y: number }>
  >({});

  const scoredPieces = useMemo(() => {
    if (!layout) return [];
    if (Object.keys(dragOverrides).length === 0) return layout.pieces;
    return layout.pieces.map((p) =>
      dragOverrides[p.id] ? { ...p, ...dragOverrides[p.id] } : p
    );
  }, [layout, dragOverrides]);

  const ownedUrns = useMemo(
    () =>
      URN_CATALOG.filter((u) => (urnInventory[u.id] ?? 0) > 0)
        .concat(
          currentCase?.offeredUrnId
            ? URN_CATALOG.filter((u) => u.id === currentCase.offeredUrnId)
            : []
        )
        .filter((u, i, arr) => arr.findIndex((x) => x.id === u.id) === i),
    [urnInventory, currentCase?.offeredUrnId]
  );

  const ownedCaskets = useMemo(
    () =>
      CASKET_CATALOG.filter((c) => (casketInventory[c.id] ?? 0) > 0)
        .concat(
          currentCase?.offeredCasketId
            ? CASKET_CATALOG.filter((c) => c.id === currentCase.offeredCasketId)
            : []
        )
        .filter((c, i, arr) => arr.findIndex((x) => x.id === c.id) === i),
    [casketInventory, currentCase?.offeredCasketId]
  );

  const offeredForScore = getUrnById(currentCase?.offeredUrnId ?? null);
  const score = useMemo(() => {
    if (!currentCase || !layout) {
      return null;
    }
    return scoreChapelArrangement({
      pieces: scoredPieces,
      preferred: currentCase.preferredFlowers,
      ownedDecorIds: chapelOwnedDecor,
      theme: layout.theme,
      decayLevel: currentCase.decayLevel,
      urnPrestige: offeredForScore?.prestigeBonus ?? 0,
    });
  }, [currentCase, layout, chapelOwnedDecor, scoredPieces, offeredForScore]);

  const rewards = score ? satisfactionToRewards(score.total) : null;

  if (!currentCase) {
    return (
      <div className="fixed inset-0 z-50 bg-violet-950/95 text-violet-50 flex flex-col items-center justify-center gap-4 p-6">
        <p className="text-center max-w-md">
          No case staged for chapel. Move remains here with Chapel / Move to
          Chapel — hub tiles only open rooms. Buy décor in Emporium → Chapel
          Decor.
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
    gameNow() > currentCase.serviceDateMs;
  const offered = getUrnById(currentCase.offeredUrnId);
  const offeredCasket = getCasketById(currentCase.offeredCasketId);
  const urnStandService = caseUsesUrnStand(currentCase);
  const isMemorial = currentCase.directive === 'CREMATION_THEN_VIEWING';
  const viewingService =
    currentCase.directive === 'BURIAL_VIEWING' ||
    currentCase.directive === 'VIEWING_THEN_CREMATION' ||
    currentCase.directive === 'CREMATION_THEN_VIEWING';
  const urnMatch =
    offered != null && offered.material === currentCase.preferredUrnMaterial;
  const casketMatch =
    offeredCasket != null &&
    offeredCasket.material === currentCase.preferredCasketMaterial;

  const wall = getChapelDecorById(layout?.theme.wallId ?? '');
  const floor = getChapelDecorById(layout?.theme.floorId ?? '');
  const drapery = getChapelDecorById(layout?.theme.draperyId ?? '');
  const lighting = getChapelDecorById(layout?.theme.lightingId ?? '');
  const pews = getChapelDecorById(layout?.theme.pewsId ?? '');
  const pedestalDecor = getChapelDecorById(
    layout?.theme.urnPedestalId ?? ''
  );

  const wallGrad =
    wall?.style?.wall ?? 'from-violet-900 via-violet-950 to-[#12081a]';
  const floorColor = floor?.style?.floor ?? '#1a1024';
  const drapeColor = drapery?.style?.drapery ?? 'rgba(80,40,100,0.35)';
  const lightColor = lighting?.style?.lighting ?? 'rgba(255,200,120,0.12)';
  const pewColor = pews?.style?.pews ?? '#2a1830';

  const flowerCount =
    layout?.pieces.filter((p) =>
      ['LILIES', 'ROSES', 'WREATH'].includes(p.kind)
    ).length ?? 0;
  const maxStands = maxFlowerStands(chapelOwnedDecor);

  const ownedByKind = (kind: string) =>
    CHAPEL_DECOR_CATALOG.filter(
      (d) => d.kind === kind && chapelOwnedDecor.includes(d.id)
    );

  return (
    <div className="safe-screen fixed inset-0 z-50 bg-violet-950/95 text-violet-50 flex flex-col select-none overflow-auto">
      <div className="flex justify-between items-start border-b border-violet-800 pb-3 gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-violet-300">
            CHAPEL — {displayCaseName(currentCase)}
          </h2>
          <p className="text-[10px] text-violet-300/70 leading-snug">
            {directiveLabel(currentCase.directive)} · Prefers{' '}
            {currentCase.preferredFlowers} · Urn{' '}
            {currentCase.preferredUrnMaterial}
            {!urnStandService
              ? ` · Casket ${currentCase.preferredCasketMaterial}`
              : ''}{' '}
            · ${cash}
            {lateService ? ' · LATE' : ''}
            {currentCase.decayLevel > 5
              ? ` · ${decayLabel(currentCase.decayLevel)}`
              : ''}
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

      <div className="flex-1 flex flex-col gap-3 mt-3 pb-4">
        {/* Floor */}
        <div
          className={`relative h-56 rounded-xl border-2 border-violet-700 overflow-hidden bg-gradient-to-b ${wallGrad} touch-none`}
          data-chapel-floor
        >
          <div
            className="absolute inset-x-0 bottom-0 h-[42%]"
            style={{ background: floorColor }}
          />
          <div
            className="absolute inset-y-0 left-0 w-6"
            style={{ background: drapeColor }}
          />
          <div
            className="absolute inset-y-0 right-0 w-6"
            style={{ background: drapeColor }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(60% 50% at 50% 35%, ${lightColor}, transparent 70%)`,
            }}
          />
          {/* pews silhouette */}
          <div
            className="absolute left-3 right-3 bottom-2 h-3 rounded-sm opacity-80 pointer-events-none"
            style={{ background: pewColor }}
          />

          <ChapelMourners active={viewingService} />

          {layout?.pieces.map((piece) => {
            const override = dragOverrides[piece.id];
            const displayPiece = override
              ? { ...piece, x: override.x, y: override.y }
              : piece;
            return (
              <DraggablePiece
                key={piece.id}
                piece={displayPiece}
                offeredUrn={offered}
                offeredCasket={offeredCasket}
                pedestalColor={
                  pedestalDecor?.style?.pedestal ?? BASIC_URN_PEDESTAL.pedestal
                }
                pedestalAccent={
                  pedestalDecor?.style?.pedestalAccent ??
                  BASIC_URN_PEDESTAL.pedestalAccent
                }
                onPreview={(x, y) =>
                  setDragOverrides((prev) => ({
                    ...prev,
                    [piece.id]: { x, y },
                  }))
                }
                onCommit={(x, y) => {
                  setDragOverrides((prev) => {
                    const next = { ...prev };
                    delete next[piece.id];
                    return next;
                  });
                  moveChapelPiece(currentCase.id, piece.id, x, y);
                }}
                onRemoveFlower={() => {
                  if (['LILIES', 'ROSES', 'WREATH'].includes(piece.kind)) {
                    removeChapelFlower(currentCase.id, piece.id);
                  }
                }}
              />
            );
          })}
        </div>

        {/* Live score */}
        {score && rewards && (
          <div className="rounded-xl border border-violet-700/80 bg-violet-950/80 p-2.5 text-[10px]">
            <div className="flex justify-between items-baseline mb-1">
              <span className="font-black tracking-wide text-amber-200">
                FAMILY SATISFACTION
              </span>
              <span className="text-lg font-black text-amber-300">
                {score.total}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-violet-200/90">
              <span>Count +{score.count}</span>
              <span>Symmetry +{score.symmetry}</span>
              <span>Proximity +{score.proximity}</span>
              <span>Variety +{score.variety}</span>
              <span>Preference +{score.preference}</span>
              <span>Freshness +{score.freshness}</span>
              <span>Decor +{score.decor}</span>
              <span>Vessel +{score.urnVessel}</span>
              <span className="text-red-300">Clutter −{score.clutter}</span>
            </div>
            <div className="mt-1 text-violet-300/80">
              Preview: +{rewards.payoutBoostPct}% payout · tip ${rewards.tipCash}{' '}
              · rep +{rewards.reputationDelta}
            </div>
          </div>
        )}

        {/* Theme pickers */}
        <ThemeRow
          label="Wall"
          options={ownedByKind('WALL')}
          selected={layout?.theme.wallId ?? null}
          onPick={(id) =>
            setChapelTheme(currentCase.id, { wallId: id })
          }
        />
        <ThemeRow
          label="Floor"
          options={ownedByKind('FLOOR')}
          selected={layout?.theme.floorId ?? null}
          onPick={(id) =>
            setChapelTheme(currentCase.id, { floorId: id })
          }
        />
        <ThemeRow
          label="Drapery"
          options={ownedByKind('DRAPERY')}
          selected={layout?.theme.draperyId ?? null}
          onPick={(id) =>
            setChapelTheme(currentCase.id, { draperyId: id })
          }
        />
        <ThemeRow
          label="Lighting"
          options={ownedByKind('LIGHTING')}
          selected={layout?.theme.lightingId ?? null}
          onPick={(id) =>
            setChapelTheme(currentCase.id, { lightingId: id })
          }
        />
        <ThemeRow
          label="Pews"
          options={ownedByKind('PEWS')}
          selected={layout?.theme.pewsId ?? null}
          onPick={(id) =>
            setChapelTheme(currentCase.id, { pewsId: id })
          }
        />
        {urnStandService && (
          <ThemeRow
            label="Urn pedestal"
            options={ownedByKind('URN_PEDESTAL')}
            selected={layout?.theme.urnPedestalId ?? null}
            onPick={(id) =>
              setChapelTheme(currentCase.id, { urnPedestalId: id })
            }
          />
        )}

        {chapelOwnedDecor.length === 0 && (
          <button
            type="button"
            onPointerDown={() => setActiveStation('EMPORIUM')}
            className="text-[11px] text-amber-300 underline text-left"
          >
            Buy Chapel Decor in Emporium to customize look →
          </button>
        )}

        {/* Urns */}
        <OfferStrip
          title="OFFER URN"
          empty="No vessels in stock."
          onEmporium={() => setActiveStation('EMPORIUM')}
        >
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
            const preferred =
              urn.material === currentCase.preferredUrnMaterial;
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
                <UrnVessel
                  urn={urn}
                  size="sm"
                  showPlaque={false}
                  className="mx-auto h-16"
                />
                <div className="text-[9px] font-bold leading-tight mt-0.5">
                  {urn.name}
                  {preferred ? ' ★' : ''}
                </div>
              </button>
            );
          })}
        </OfferStrip>

        {/* Caskets — burial / viewing-first only */}
        {!urnStandService && (
        <OfferStrip
          title="OFFER CASKET"
          empty="No caskets in stock."
          onEmporium={() => setActiveStation('EMPORIUM')}
        >
          <button
            type="button"
            onPointerDown={() => offerCasketToCase(currentCase.id, null)}
            className={`shrink-0 px-3 py-2 rounded-lg border text-[10px] ${
              !currentCase.offeredCasketId
                ? 'border-amber-400 bg-amber-950/50'
                : 'border-violet-800 bg-violet-950'
            }`}
          >
            None
          </button>
          {ownedCaskets.map((casket) => {
            const selected = currentCase.offeredCasketId === casket.id;
            const preferred =
              casket.material === currentCase.preferredCasketMaterial;
            return (
              <button
                key={casket.id}
                type="button"
                onPointerDown={() =>
                  offerCasketToCase(
                    currentCase.id,
                    selected ? null : casket.id
                  )
                }
                className={`shrink-0 w-28 rounded-xl border p-1.5 text-center ${
                  selected
                    ? 'border-amber-400 bg-amber-950/40'
                    : preferred
                      ? 'border-emerald-500/70 bg-violet-950'
                      : 'border-violet-800 bg-violet-950'
                }`}
              >
                <CasketVessel
                  casket={casket}
                  size="sm"
                  showPlaque={false}
                  className="mx-auto"
                />
                <div className="text-[9px] font-bold leading-tight mt-0.5">
                  {casket.name}
                  {preferred ? ' ★' : ''}
                </div>
              </button>
            );
          })}
        </OfferStrip>
        )}

        <div className="text-[10px] text-violet-300">
          Flower stands {flowerCount}/{maxStands}
          {urnMatch ? ' · Urn taste matched ★' : ''}
          {casketMatch && !urnStandService ? ' · Casket taste matched ★' : ''}
          {currentCase.urnPourQuality > 0
            ? ` · Pour ${currentCase.urnPourQuality}`
            : ''}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {FLOWER_TYPES.map((flower) => {
            const inv = showroomInventory.find((i) =>
              i.id.includes(flower.toLowerCase())
            );
            const preferred = currentCase.preferredFlowers === flower;
            const full = flowerCount >= maxStands;
            return (
              <button
                key={flower}
                type="button"
                disabled={full || !inv || inv.ownedCount <= 0}
                onPointerDown={() =>
                  placeFloralSpray(flower, currentCase.id)
                }
                className={`py-3 rounded font-semibold text-[11px] ${
                  inv && inv.ownedCount > 0 && !full
                    ? preferred
                      ? 'bg-amber-500 text-violet-950'
                      : 'bg-violet-700'
                    : 'bg-violet-950 text-violet-600'
                }`}
              >
                Place {flower}
                {preferred ? ' ★' : ''} ({inv?.ownedCount ?? 0})
              </button>
            );
          })}
        </div>

        <div
          className={`mt-auto grid gap-3 pb-2 ${
            isMemorial ? 'grid-cols-1' : 'grid-cols-2'
          }`}
        >
          {isMemorial ? (
            <button
              type="button"
              onPointerDown={() =>
                finalizeServiceAndNextCase('CREMATION', currentCase.id)
              }
              className="py-3 bg-violet-600 active:bg-violet-500 rounded font-bold text-sm"
            >
              Complete Ossuary Memorial
            </button>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

function ThemeRow({
  label,
  options,
  selected,
  onPick,
}: {
  label: string;
  options: { id: string; name: string }[];
  selected: string | null;
  onPick: (id: string | null) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto text-[10px]">
      <span className="shrink-0 text-violet-400 w-14">{label}</span>
      <button
        type="button"
        onPointerDown={() => onPick(null)}
        className={`shrink-0 px-2 py-1 rounded border ${
          !selected
            ? 'border-amber-400 bg-amber-950/40'
            : 'border-violet-800'
        }`}
      >
        Basic
      </button>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onPointerDown={() => onPick(o.id)}
          className={`shrink-0 px-2 py-1 rounded border ${
            selected === o.id
              ? 'border-amber-400 bg-amber-950/40'
              : 'border-violet-800'
          }`}
        >
          {o.name}
        </button>
      ))}
    </div>
  );
}

function OfferStrip({
  title,
  empty,
  onEmporium,
  children,
}: {
  title: string;
  empty: string;
  onEmporium: () => void;
  children: React.ReactNode;
}) {
  const childArray = React.Children.toArray(children);
  const onlyNone = childArray.length <= 1;
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <h3 className="text-xs font-black tracking-[0.18em] text-amber-200">
          {title}
        </h3>
        <button
          type="button"
          onPointerDown={onEmporium}
          className="text-[10px] px-2 py-1 rounded bg-amber-700/80"
        >
          Emporium →
        </button>
      </div>
      {onlyNone ? (
        <p className="text-[11px] text-violet-300/80">{empty}</p>
      ) : null}
      <div className="flex gap-2 overflow-x-auto pb-1">{children}</div>
    </div>
  );
}

function DraggablePiece({
  piece,
  offeredUrn,
  offeredCasket,
  pedestalColor,
  pedestalAccent,
  onPreview,
  onCommit,
  onRemoveFlower,
}: {
  piece: ChapelLayoutPiece;
  offeredUrn: ReturnType<typeof getUrnById>;
  offeredCasket: ReturnType<typeof getCasketById>;
  pedestalColor: string;
  pedestalAccent: string;
  onPreview: (x: number, y: number) => void;
  onCommit: (x: number, y: number) => void;
  onRemoveFlower: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const live = useRef({ x: piece.x, y: piece.y });
  const pointerIdRef = useRef<number | null>(null);
  const onPreviewRef = useRef(onPreview);
  const onCommitRef = useRef(onCommit);
  onPreviewRef.current = onPreview;
  onCommitRef.current = onCommit;

  const finishDrag = () => {
    if (!dragging.current) return;
    dragging.current = false;
    pointerIdRef.current = null;
    onCommitRef.current(live.current.x, live.current.y);
  };

  React.useEffect(() => {
    if (!dragging.current) {
      live.current = { x: piece.x, y: piece.y };
    }
  }, [piece.x, piece.y]);

  const applyPointer = (clientX: number, clientY: number) => {
    const floor = ref.current?.parentElement;
    if (!floor) return;
    const rect = floor.getBoundingClientRect();
    const x = Math.max(
      0.05,
      Math.min(0.95, (clientX - rect.left) / rect.width)
    );
    const y = Math.max(
      0.08,
      Math.min(0.92, (clientY - rect.top) / rect.height)
    );
    live.current = { x, y };
    onPreviewRef.current(x, y);
  };

  React.useEffect(() => {
    const samePointer = (e: PointerEvent) =>
      pointerIdRef.current == null || e.pointerId === pointerIdRef.current;

    const onWinMove = (e: PointerEvent) => {
      if (!dragging.current || !samePointer(e)) return;
      applyPointer(e.clientX, e.clientY);
    };
    const onWinUp = (e: PointerEvent) => {
      if (!dragging.current || !samePointer(e)) return;
      finishDrag();
    };
    // Window move/up so drag tracks even when setPointerCapture is rejected
    window.addEventListener('pointermove', onWinMove);
    window.addEventListener('pointerup', onWinUp);
    window.addEventListener('pointercancel', onWinUp);
    return () => {
      window.removeEventListener('pointermove', onWinMove);
      window.removeEventListener('pointerup', onWinUp);
      window.removeEventListener('pointercancel', onWinUp);
    };
  }, []);

  const onPointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    dragging.current = true;
    pointerIdRef.current = e.pointerId;
    live.current = { x: piece.x, y: piece.y };
    try {
      ref.current?.setPointerCapture(e.pointerId);
    } catch {
      /* window pointermove/up still drive the drag */
    }
  };

  const isFlower = ['LILIES', 'ROSES', 'WREATH'].includes(piece.kind);

  return (
    <div
      ref={ref}
      onPointerDown={onPointerDown}
      onPointerUp={finishDrag}
      onPointerCancel={finishDrag}
      className="absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing touch-none z-10"
      style={{ left: `${piece.x * 100}%`, top: `${piece.y * 100}%` }}
    >
      {piece.kind === 'COFFIN' && (
        <div className="relative">
          {offeredCasket ? (
            <CasketVessel casket={offeredCasket} size="sm" showPlaque={false} />
          ) : (
            <div className="w-28 h-10 bg-amber-900 rounded-sm border border-amber-600 flex items-center justify-center text-[9px] font-bold">
              CASKET / BIER
            </div>
          )}
        </div>
      )}
      {piece.kind === 'URN' && (
        <div className="flex flex-col items-center">
          {offeredUrn ? (
            <UrnVessel urn={offeredUrn} size="sm" showPlaque={false} />
          ) : (
            <div className="w-14 h-14 rounded-full bg-stone-700 border border-stone-500 flex items-center justify-center text-[9px] font-bold">
              URN
            </div>
          )}
          {/* Pedestal / plinth under the vessel */}
          <div className="relative -mt-0.5 flex flex-col items-center">
            <div
              className="w-16 h-2 rounded-sm border border-black/30"
              style={{ background: pedestalAccent }}
            />
            <div
              className="w-12 h-10 rounded-sm border border-black/40 shadow-md"
              style={{
                background: `linear-gradient(180deg, ${pedestalAccent} 0%, ${pedestalColor} 35%, ${pedestalColor} 100%)`,
              }}
            />
            <div
              className="w-20 h-2.5 rounded-sm border border-black/40 -mt-0.5"
              style={{ background: pedestalColor }}
            />
            <span className="text-[7px] font-bold tracking-wide text-violet-200/70 mt-0.5">
              STAND
            </span>
          </div>
        </div>
      )}
      {isFlower && (
        <div className="relative text-[10px] font-bold px-2 py-1 rounded bg-emerald-700/95 border border-emerald-400/40">
          {piece.kind as FlowerKind}
          <button
            type="button"
            onPointerDown={(ev) => {
              ev.stopPropagation();
              onRemoveFlower();
            }}
            className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-700 text-[9px] leading-4"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
