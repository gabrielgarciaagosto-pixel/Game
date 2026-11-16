import React from 'react';
import { decayLabel, displayCaseName, friendlyToken } from '../types/game';
import { TAG_WINDOW_MS, useGameStore } from '../store/useGameStore';

/** Front face for each capacity. Doors match bays. */
function coolerFace(bayCount: number): { cols: number; rows: number } {
  if (bayCount <= 6) return { cols: 2, rows: 3 };
  if (bayCount <= 8) return { cols: 2, rows: 4 };
  if (bayCount <= 10) return { cols: 2, rows: 5 };
  return { cols: 3, rows: 4 };
}

export const CoolerRoom: React.FC = () => {
  const {
    cases,
    tagBodyInCooler,
    selectActiveCase,
    activeCaseId,
    setActiveStation,
    takeCaseToStation,
    coolerCapacity,
  } = useGameStore();

  const coolerCases = cases.filter((c) => c.location === 'COOLER');
  const bayCount = coolerCapacity();
  const face = coolerFace(bayCount);

  return (
    <div className="safe-screen fixed inset-0 z-40 bg-slate-950 text-slate-100 flex flex-col select-none overflow-hidden">
      <div className="shrink-0 flex justify-between items-start border-b border-cyan-900/60 pb-2 gap-2 px-1">
        <div className="min-w-0">
          <h2 className="text-base font-bold text-cyan-400">
            COOLER — 38°F · {bayCount} BAYS
          </h2>
          <p className="text-[10px] text-slate-400 leading-snug">
            Tap name within 60s to toe-tag. Use Prep / Cremate / Chapel to move
            remains. Expand bays in Emporium Upgrades.
          </p>
        </div>
        <button
          type="button"
          onPointerDown={() => setActiveStation('OVERVIEW')}
          className="px-3 py-1.5 bg-slate-800 rounded text-xs font-semibold shrink-0"
        >
          Back
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto py-3">
        <div
          className="cooler-shell"
          data-cooler-bays={bayCount}
          data-cooler-cols={face.cols}
          data-cooler-rows={face.rows}
        >
          <div className="cooler-crown">
            <span className="cooler-lamp is-power" aria-hidden />
            <span className="cooler-readout">38°F</span>
            <span className="cooler-crown-label">HOLD</span>
          </div>
          <div
            className="cooler-grid"
            style={{ gridTemplateColumns: `repeat(${face.cols}, minmax(0, 1fr))` }}
          >
        {Array.from({ length: bayCount }).map((_, index) => {
          const body = coolerCases[index];
          if (!body) {
            return (
              <div key={index} className="cooler-door is-empty">
                <DoorHardware lamp="is-off" />
                <div className="cooler-etch">
                  BAY #{index + 1}
                  <span>EMPTY</span>
                </div>
              </div>
            );
          }

          const tagHeld = !body.isTagged && body.tagRemainingMs > TAG_WINDOW_MS;
          const secondsLeft = tagHeld
            ? 0
            : Math.max(0, Math.ceil(body.tagRemainingMs / 1000));
          const canStillTag = !body.isTagged && (tagHeld || secondsLeft > 0);
          const isSelected = activeCaseId === body.id;

          const lamp = body.isTagged
            ? 'is-tagged'
            : !tagHeld && secondsLeft === 0
              ? 'is-expired'
              : 'is-waiting';

          return (
            <div
              key={body.id}
              onPointerDown={() => selectActiveCase(body.id)}
              className={`cooler-door is-occupied ${isSelected ? 'is-selected' : ''}`}
            >
              <DoorHardware lamp={lamp} />
              {canStillTag && (
                <button
                  type="button"
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    tagBodyInCooler(body.id);
                    selectActiveCase(body.id);
                  }}
                  className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 bg-amber-400 text-slate-950 px-3 py-1.5 rounded-full font-extrabold text-xs shadow-xl animate-bounce whitespace-nowrap border-2 border-white"
                >
                  TAP TO TAG: &quot;{body.name}&quot;
                  {tagHeld ? '' : ` (${secondsLeft}s)`}
                </button>
              )}

              <div className="cooler-plate">
              <div className="flex justify-between items-center text-xs font-mono text-slate-400">
                <span>BAY #{index + 1}</span>
                {body.isTagged ? (
                  <span className="text-emerald-400 font-bold">✓ TAGGED</span>
                ) : !tagHeld && secondsLeft === 0 ? (
                  <span className="text-red-400 font-bold">UNTAGGED</span>
                ) : (
                  <span className="text-amber-300">AWAITING TAG</span>
                )}
              </div>

              <div className="my-auto text-center">
                <div className="text-base font-bold text-white">
                  {displayCaseName(body)}
                </div>
                <div className="text-xs text-cyan-300 font-mono mt-1">
                  Measured Weight: {body.weightLbs} lbs | {friendlyToken(body.tissueCondition)}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 flex justify-between gap-1">
                <span>
                  {body.isEmbalmed
                    ? `Embalmed ${body.embalmRank ?? '✓'}`
                    : 'Unembalmed'}
                </span>
                <span>
                  {body.isCremated
                    ? `Cremated ${body.cremationRank ?? '✓'}`
                    : body.decayLevel > 5
                      ? decayLabel(body.decayLevel)
                      : 'Intact'}
                </span>
              </div>

              {isSelected && (
                <div className="flex gap-1 mt-1">
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      takeCaseToStation(body.id, 'EMBALMING');
                    }}
                    className="flex-1 text-[10px] py-1.5 bg-emerald-700 rounded font-bold"
                  >
                    Prep
                  </button>
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      takeCaseToStation(body.id, 'CREMATION');
                    }}
                    className="flex-1 text-[10px] py-1.5 bg-orange-700 rounded font-bold"
                  >
                    Cremate
                  </button>
                  <button
                    type="button"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      takeCaseToStation(body.id, 'SHOWROOM');
                    }}
                    className="flex-1 text-[10px] py-1.5 bg-violet-700 rounded font-bold"
                  >
                    Chapel
                  </button>
                </div>
              )}
              </div>
            </div>
          );
        })}
          </div>
          <div className="cooler-kick" aria-hidden />
        </div>
      </div>
    </div>
  );
};

function DoorHardware({ lamp }: { lamp: string }) {
  return (
    <>
      <span className="cooler-hinge" aria-hidden />
      <span className="cooler-hinge is-lower" aria-hidden />
      <span className={`cooler-lamp ${lamp}`} aria-hidden />
      <span className="cooler-latch" aria-hidden />
    </>
  );
}
