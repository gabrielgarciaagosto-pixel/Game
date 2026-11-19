import React, { useEffect, useMemo, useRef } from 'react';
import { CaseTransferBar } from './CaseTransferBar';
import { displayCaseName, decayLabel } from '../types/game';
import { caseAtLocation, useGameStore } from '../store/useGameStore';
import { isChapelGathering, serviceTiming } from '../data/pacing';
import { useGameNow } from '../hooks/useGameNow';
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
import {
  chapelMusicChoice,
  chapelPrefMatchBonus,
  decorPrefLabel,
  evaluateChapelPrefMatches,
  SERVICE_MUSIC_NONE,
  SERVICE_MUSIC_PLAYLIST,
  serviceMusicLabel,
  serviceMusicOptions,
} from '../data/familyChapelPrefs';
import { caseUsesUrnStand } from '../data/familyUrnPick';
import { FamilyPreferenceCard } from './FamilyPreferenceCard';
import { directiveLabel, friendlyToken } from '../types/game';
import { UrnVessel } from './urns/UrnVessel';
import { CasketVessel } from './caskets/CasketVessel';
import { ChapelNave, CHAPEL_ART_ASPECT } from './chapel/ChapelNave';

const FLOWER_TYPES = ['LILIES', 'ROSES', 'WREATH'] as const;

function ChapelMusicPicker({
  choice,
  requiredId,
  onPick,
}: {
  choice: string;
  requiredId?: string | null;
  onPick: (id: string) => void;
}) {
  const chip = (on: boolean) =>
    `px-2 py-1 rounded text-[11px] border ${
      on
        ? 'border-amber-400 bg-amber-900/50 text-amber-100'
        : 'border-violet-700 bg-violet-950/60'
    }`;
  return (
    <div className="space-y-1" data-chapel-music-picker>
      <div className="text-[10px] uppercase tracking-wider text-amber-200">
        {requiredId ? (
          <>
            Required music · {serviceMusicLabel(requiredId)}
            <span className="ml-1 rounded bg-amber-400 px-1 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-950">
              Non-negotiable
            </span>
          </>
        ) : (
          'Music'
        )}
      </div>
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          data-chapel-music="none"
          aria-pressed={choice === SERVICE_MUSIC_NONE}
          onPointerDown={() => onPick(SERVICE_MUSIC_NONE)}
          className={chip(choice === SERVICE_MUSIC_NONE)}
        >
          No music
        </button>
        <button
          type="button"
          data-chapel-music="playlist"
          aria-pressed={choice === SERVICE_MUSIC_PLAYLIST}
          onPointerDown={() => onPick(SERVICE_MUSIC_PLAYLIST)}
          className={chip(choice === SERVICE_MUSIC_PLAYLIST)}
        >
          Playlist
        </button>
        {serviceMusicOptions().map((t) => (
          <button
            key={t.id}
            type="button"
            data-chapel-music={t.id}
            data-tutorial-target={requiredId === t.id ? 'chapel-music' : undefined}
            aria-pressed={choice === t.id}
            onPointerDown={() => onPick(t.id)}
            className={chip(choice === t.id)}
          >
            {t.label}
            {requiredId === t.id ? ' · required' : ''}
          </button>
        ))}
      </div>
    </div>
  );
}

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
    setChapelServiceMusic,
    moveChapelPiece,
  } = useGameStore();

  const currentCase = caseAtLocation(cases, 'CHAPEL', activeCaseId);
  const now = useGameNow(currentCase?.serviceDateMs != null);

  useEffect(() => {
    if (currentCase && currentCase.id !== activeCaseId) {
      focusCase(currentCase.id);
    }
  }, [currentCase, activeCaseId, focusCase]);

  useEffect(() => {
    if (currentCase) ensureChapelLayout(currentCase.id);
  }, [currentCase, ensureChapelLayout]);

  const layout = currentCase ? chapelLayouts[currentCase.id] : undefined;

  useEffect(() => {
    if (!currentCase || !layout) return;
    const focal = layout.pieces.find((piece) => piece.id === 'focal' && piece.kind === 'COFFIN');
    if (!focal) return;
    // Older rooms left the casket on the altar or down in the aisle.
    const parkedHigh = focal.y < 0.535;
    const parkedInAisle = focal.y > 0.59 && focal.y < 0.74;
    if (parkedHigh || parkedInAisle) {
      moveChapelPiece(currentCase.id, focal.id, 0.5, 0.555);
    }
  }, [currentCase, layout, moveChapelPiece]);
  /** Live drag overrides — score uses these; store persists only on release. */
  const [dragOverrides, setDragOverrides] = React.useState<
    Record<string, { x: number; y: number }>
  >({});
  const [visitMusic, setVisitMusic] = React.useState<string>(SERVICE_MUSIC_NONE);

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
  const prefPreview = useMemo(() => {
    if (!currentCase || !layout) return null;
    const flowerKinds = scoredPieces
      .map((p) => p.kind)
      .filter((k): k is FlowerKind =>
        k === 'LILIES' || k === 'ROSES' || k === 'WREATH'
      );
    const matches = evaluateChapelPrefMatches({
      prefs: currentCase.familyChapelPrefs,
      theme: layout.theme,
      flowersPlaced: flowerKinds,
      serviceMusicId: layout.serviceMusicId ?? null,
    });
    return { matches, bonus: chapelPrefMatchBonus(matches) };
  }, [currentCase, layout, scoredPieces]);

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
      familyPrefBonus: prefPreview?.bonus ?? 0,
    });
  }, [
    currentCase,
    layout,
    chapelOwnedDecor,
    scoredPieces,
    offeredForScore,
    prefPreview,
  ]);

  const rewards = score ? satisfactionToRewards(score.total) : null;

  if (!currentCase) {
    return (
      <div
        data-chapel-empty
        className="safe-screen fixed inset-0 z-50 bg-violet-950/95 text-violet-50 flex flex-col select-none overflow-auto"
      >
        <div className="flex justify-between items-start border-b border-violet-800 pb-3 gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-violet-300">Chapel</h2>
            <p className="text-[10px] text-violet-300/70 leading-snug">
              No service is set.
            </p>
          </div>
          <button
            type="button"
            data-tutorial-target="back"
            onPointerDown={() => setActiveStation('OVERVIEW')}
            className="px-3 py-2 bg-violet-900 rounded text-xs"
          >
            Back
          </button>
        </div>
        <div className="flex-1 flex flex-col gap-3 mt-3 pb-4">
          <div
            className="relative w-full rounded-xl border-2 border-violet-700 overflow-hidden bg-[#c4a574] touch-none"
            style={{ aspectRatio: String(CHAPEL_ART_ASPECT) }}
            data-chapel-floor
          >
            <ChapelNave
              floor="#1a1024"
              drape="rgba(80,40,100,0.35)"
              light="rgba(255,200,120,0.12)"
              pew="#2a1830"
              withMourners={false}
            />
          </div>
          <ChapelMusicPicker
            choice={chapelMusicChoice(visitMusic, false)}
            onPick={setVisitMusic}
          />
        </div>
      </div>
    );
  }

  const lateService =
    currentCase.serviceDateMs != null && now > currentCase.serviceDateMs;
  const graceService =
    lateService && now - (currentCase.serviceDateMs ?? 0) <= 45 * 60 * 1000;
  const offered = getUrnById(currentCase.offeredUrnId);
  const offeredCasket = getCasketById(currentCase.offeredCasketId);
  const urnStandService = caseUsesUrnStand(currentCase);
  const isMemorial = currentCase.directive === 'CREMATION_THEN_VIEWING';
  const viewingService = isChapelGathering(currentCase.directive);
  const serviceLive =
    viewingService && serviceTiming(currentCase.serviceDateMs, now) === 'grace';
  const urnMatch =
    offered != null && offered.material === currentCase.preferredUrnMaterial;
  const casketMatch =
    offeredCasket != null &&
    offeredCasket.material === currentCase.preferredCasketMaterial;

  const floor = getChapelDecorById(layout?.theme.floorId ?? '');
  const drapery = getChapelDecorById(layout?.theme.draperyId ?? '');
  const lighting = getChapelDecorById(layout?.theme.lightingId ?? '');
  const pews = getChapelDecorById(layout?.theme.pewsId ?? '');
  const pedestalDecor = getChapelDecorById(
    layout?.theme.urnPedestalId ?? ''
  );

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
            {friendlyToken(currentCase.preferredFlowers)}
            {currentCase.familyChapelPrefs.wallId
              ? ` · ${decorPrefLabel(currentCase.familyChapelPrefs.wallId)}`
              : ''}{' '}
            · Urn {friendlyToken(currentCase.preferredUrnMaterial)}
            {!urnStandService
              ? ` · Casket ${friendlyToken(currentCase.preferredCasketMaterial)}`
              : ''}{' '}
            · ${cash}
            {graceService ? ' · GRACE' : lateService ? ' · RESCHEDULE' : ''}
            {currentCase.decayLevel > 5
              ? ` · ${decayLabel(currentCase.decayLevel)}`
              : ''}
          </p>
          <CaseTransferBar currentCase={currentCase} showVault />
        </div>
        <div className="flex flex-col gap-2 shrink-0">
          <button
            type="button"
            data-tutorial-target="back"
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
        <FamilyPreferenceCard prefs={currentCase.familyChapelPrefs} />
        {/* Floor */}
        <div
          className="relative w-full rounded-xl border-2 border-violet-700 overflow-hidden bg-[#c4a574] touch-none"
          style={{ aspectRatio: String(CHAPEL_ART_ASPECT) }}
          data-chapel-floor
          data-chapel-service={serviceLive ? '1' : undefined}
        >
          {serviceLive && (
            <>
              <div className="chapel-service-glow" aria-hidden />
              <p className="chapel-service-label">SERVICE IN PROGRESS</p>
            </>
          )}
          <ChapelNave
            floor={floorColor}
            drape={drapeColor}
            light={lightColor}
            pew={pewColor}
            withMourners={viewingService}
          />

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
              <span>Family prefs +{score.familyPrefs}</span>
              <span className="text-red-300">Clutter −{score.clutter}</span>
            </div>
            <div className="mt-1 text-violet-300/80">
              Preview: +{rewards.payoutBoostPct}% payout · tip ${rewards.tipCash}{' '}
              · rep +{rewards.reputationDelta}
            </div>
          </div>
        )}

        {prefPreview && (
          <div className="rounded-xl border border-amber-800/50 bg-amber-950/40 p-2.5 text-[10px] space-y-1">
            <div className="font-bold text-amber-200 tracking-wide">
              FAMILY WISHES (bonus only)
            </div>
            <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-amber-100/90">
              {prefPreview.matches.map((m) => (
                <span
                  key={m.key}
                  className={m.matched ? 'text-emerald-300' : 'text-amber-100/70'}
                >
                  {m.matched ? '✓' : '·'} {m.label}: {m.preferredName}
                </span>
              ))}
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

        <ChapelMusicPicker
          choice={chapelMusicChoice(layout?.serviceMusicId, serviceLive)}
          requiredId={currentCase.familyChapelPrefs.musicTrackId}
          onPick={(id) => setChapelServiceMusic(currentCase.id, id)}
        />

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
                data-tutorial-target="casket"
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
                data-tutorial-target={flower === 'ROSES' ? 'roses' : undefined}
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
                Place {friendlyToken(flower)}
                {flower === 'ROSES' ? ' · required' : preferred ? ' ★' : ''} (
                {inv?.ownedCount ?? 0})
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
                data-tutorial-target="finalize-burial"
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
      style={{
        left: `${piece.x * 100}%`,
        top: `${piece.y * 100}%`,
        width: piece.kind === 'COFFIN' ? '12.5%' : undefined,
      }}
    >
      {piece.kind === 'COFFIN' && (
        <div className="relative">
          <div
            className="pointer-events-none absolute left-1/2 w-[108%] -translate-x-1/2"
            style={{ top: '97%' }}
            aria-hidden
          >
            <svg viewBox="0 0 240 32" className="block h-auto w-full overflow-visible">
              <ellipse cx="120" cy="27" rx="92" ry="4.5" fill="#2a1a0c" opacity="0.4" />
              <path d="M34 8h172l8 10H26z" fill="#3a2a20" stroke="#1c120c" strokeWidth="2.4" strokeLinejoin="round" />
              <rect x="30" y="2" width="180" height="8" rx="1.5" fill="#5c4030" stroke="#1c120c" strokeWidth="2.4" />
              <circle cx="58" cy="22" r="5.5" fill="#1a120c" stroke="#3a2c20" strokeWidth="1.6" />
              <circle cx="182" cy="22" r="5.5" fill="#1a120c" stroke="#3a2c20" strokeWidth="1.6" />
              <circle cx="58" cy="22" r="1.6" fill="#8a7058" />
              <circle cx="182" cy="22" r="1.6" fill="#8a7058" />
            </svg>
          </div>
          {offeredCasket ? (
            <CasketVessel
              casket={offeredCasket}
              size="md"
              showPlaque={false}
              chapel
              className="w-full"
            />
          ) : (
            <CasketVessel
              chapel
              className="w-full"
              casket={{
                id: 'bier',
                name: 'Bier',
                material: 'OAK',
                silhouette: 'HALF_COUCH',
                finish: 'Oak',
                hardware: 'Brass',
                blurb: '',
                cost: 0,
                resaleValue: 0,
                prestigeBonus: 0,
                reputationRequired: 0,
                palette: {
                  body: '#b45309',
                  bodyDeep: '#78350f',
                  highlight: '#fbbf24',
                  lining: '#f5e6d3',
                  hardware: '#d4a017',
                  trim: '#92400e',
                },
              }}
              size="sm"
              showPlaque={false}
            />
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
