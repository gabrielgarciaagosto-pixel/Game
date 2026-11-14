import React from 'react';
import { AshMound, BoneShard, Femur, Rib, SkullCap } from './crematoryArt';

type BonePhase = 'INTACT' | 'CHARRING' | 'CALCINING' | 'FRAGMENTING' | 'ASH';

export type BoneContact = {
  /** Chamber % where the tool last hit remains */
  x: number;
  y: number;
  /** Monotonic tick so React re-applies displacement */
  n: number;
};

function pushAway(
  homeX: number,
  homeY: number,
  contact: BoneContact | null,
  seed: number
): { tx: number; ty: number; rot: number } {
  if (!contact || contact.n <= 0) {
    return { tx: (seed % 3) - 1, ty: 0, rot: seed * 7 };
  }
  // Bones sit in lower hearth; map home % into approximate chamber coords
  const bx = 20 + homeX * 0.6;
  const by = 58 + homeY * 0.35;
  let dx = bx - contact.x;
  let dy = by - contact.y;
  const len = Math.hypot(dx, dy) || 1;
  // Generous falloff — far bones still shiver a little
  const falloff = Math.max(0.25, 1 - len / 55);
  dx = (dx / len) * (10 + (seed % 5)) * falloff;
  dy = (dy / len) * (7 + (seed % 4)) * falloff;
  // Pulse with contact tick
  const pulse = 0.65 + 0.35 * Math.sin(contact.n * 1.7 + seed);
  return {
    tx: dx * pulse,
    ty: dy * pulse,
    rot: seed * 11 + contact.n * 9 * falloff,
  };
}

export const HearthCharge: React.FC<{
  mode: 'BURN' | 'SWEEP';
  bonePhase: BonePhase;
  progress: number;
  nudge: number;
  contact: BoneContact | null;
  largeBonesLeft: number;
  mediumBonesLeft: number;
  fineAshLeft: number;
  /** Brief highlight when a tool is in contact */
  contactHot?: boolean;
}> = ({
  mode,
  bonePhase,
  progress,
  nudge,
  contact,
  largeBonesLeft,
  mediumBonesLeft,
  fineAshLeft,
  contactHot,
}) => {
  if (mode === 'SWEEP') {
    const femurs = Math.ceil((largeBonesLeft / 100) * 3);
    const ribs = Math.ceil((largeBonesLeft / 100) * 2);
    const showSkull = largeBonesLeft > 20;
    const shards = Math.ceil((mediumBonesLeft / 100) * 14);

    const skullPush = pushAway(50, 40, contact, nudge + 3);

    return (
      <div className="absolute inset-x-0 bottom-0 z-20 h-[46%] pointer-events-none">
        <div className="absolute inset-x-[8%] bottom-[18%] h-[18%] rounded-[50%] bg-black/50 blur-md" />
        {fineAshLeft > 0 && (
          <AshMound
            amount={fineAshLeft}
            className="absolute left-1/2 -translate-x-1/2 bottom-[6%] w-[78%] h-16"
          />
        )}
        <div className="absolute inset-x-[10%] bottom-[22%] flex flex-wrap items-end justify-center gap-1">
          {Array.from({ length: shards }).map((_, i) => {
            const p = pushAway(30 + (i % 7) * 8, 55 + (i % 3) * 5, contact, i + nudge);
            return (
              <div
                key={`shard-${i}`}
                className="w-5 h-3 transition-transform duration-150 ease-out"
                style={{
                  transform: `translate(${p.tx}px, ${p.ty}px) rotate(${-30 + p.rot}deg)`,
                  filter: contactHot ? 'drop-shadow(0 0 4px rgba(251,191,36,0.7))' : undefined,
                }}
              >
                <BoneShard i={i} />
              </div>
            );
          })}
        </div>
        <div className="absolute inset-x-[6%] bottom-[28%] flex items-end justify-center gap-1">
          {showSkull && (
            <div
              className="transition-transform duration-150 ease-out"
              style={{
                transform: `translate(${skullPush.tx}px, ${skullPush.ty}px) rotate(${skullPush.rot * 0.15}deg)`,
                filter: contactHot
                  ? 'drop-shadow(0 0 6px rgba(251,146,60,0.85))'
                  : undefined,
              }}
            >
              <SkullCap className="w-14 h-11 -mr-1" />
            </div>
          )}
          {Array.from({ length: ribs }).map((_, i) => {
            const p = pushAway(35 + i * 12, 48, contact, 20 + i + nudge);
            return (
              <div
                key={`rib-${i}`}
                className="transition-transform duration-150 ease-out"
                style={{
                  transform: `translate(${p.tx}px, ${p.ty}px) rotate(${p.rot * 0.2}deg)`,
                }}
              >
                <Rib className="w-10 h-5" />
              </div>
            );
          })}
          {Array.from({ length: femurs }).map((_, i) => {
            const p = pushAway(40 + i * 10, 35, contact, 40 + i + nudge);
            return (
              <div
                key={`femur-${i}`}
                className="transition-transform duration-150 ease-out"
                style={{
                  transform: `translate(${p.tx}px, ${p.ty}px) rotate(${p.rot * 0.12}deg)`,
                  filter: contactHot
                    ? 'drop-shadow(0 0 5px rgba(253,186,116,0.75))'
                    : undefined,
                }}
              >
                <Femur className="w-6 h-16" />
              </div>
            );
          })}
        </div>
        <div className="absolute left-[8%] right-[8%] bottom-[8%] h-2 rounded-full bg-gradient-to-r from-transparent via-zinc-500/80 to-transparent" />
      </div>
    );
  }

  const char = bonePhase === 'CHARRING' || bonePhase === 'CALCINING';
  const boneOpacity =
    bonePhase === 'INTACT' ? 0 : bonePhase === 'CHARRING' ? 0.25 : 0.95;
  const shroudOpacity =
    bonePhase === 'ASH' ? 0 : bonePhase === 'FRAGMENTING' ? 0.15 : 0.9;

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 h-[48%] pointer-events-none">
      <div className="absolute inset-x-[12%] bottom-[16%] h-[22%] rounded-[50%] bg-black/55 blur-md" />
      {bonePhase === 'ASH' ? (
        <AshMound
          amount={70 + progress * 20}
          className="absolute left-1/2 -translate-x-1/2 bottom-[10%] w-[76%] h-16"
        />
      ) : (
        <>
          <div
            className="absolute left-1/2 -translate-x-1/2 bottom-[18%] w-[70%] h-[62%]"
            style={{ opacity: shroudOpacity }}
          >
            <div
              className="absolute left-[18%] bottom-0 w-[64%] h-[58%] rounded-[40%] border border-black/40"
              style={{
                background: char
                  ? 'linear-gradient(180deg, #292524, #0c0a09 70%)'
                  : 'linear-gradient(180deg, #d6d3d1, #a8a29e)',
                boxShadow: char
                  ? 'inset 0 0 18px rgba(234,88,12,0.45)'
                  : 'inset 0 8px 12px rgba(255,255,255,0.25)',
              }}
            />
            <div
              className="absolute left-[38%] bottom-[48%] w-[24%] h-[28%] rounded-full border border-black/30"
              style={{
                background: char ? '#1c1917' : '#e7e5e4',
              }}
            />
            {char && (
              <>
                <div className="absolute left-[30%] bottom-[22%] w-10 h-px bg-orange-500/80 rotate-12" />
                <div className="absolute left-[48%] bottom-[30%] w-8 h-px bg-amber-400/70 -rotate-6" />
                <div className="absolute left-[40%] bottom-[14%] w-12 h-px bg-red-500/50 rotate-3" />
              </>
            )}
          </div>
          <div
            className="absolute inset-x-[8%] bottom-[16%] flex items-end justify-center gap-1"
            style={{
              opacity: boneOpacity,
            }}
          >
            {(() => {
              const skull = pushAway(50, 30, contact, nudge);
              return (
                <div
                  className="transition-transform duration-150 ease-out"
                  style={{
                    transform: `translate(${skull.tx}px, ${skull.ty + (bonePhase === 'FRAGMENTING' ? 6 : 0)}px)`,
                    filter: contactHot
                      ? 'drop-shadow(0 0 6px rgba(251,146,60,0.9))'
                      : undefined,
                  }}
                >
                  <SkullCap className="w-12 h-10" />
                </div>
              );
            })()}
            {(() => {
              const p = pushAway(42, 40, contact, nudge + 2);
              return (
                <div
                  className="mb-2 transition-transform duration-150 ease-out"
                  style={{ transform: `translate(${p.tx}px, ${p.ty}px)` }}
                >
                  <Rib className="w-9 h-4" />
                </div>
              );
            })()}
            {[0, 1].map((i) => {
              const p = pushAway(48 + i * 8, 28, contact, nudge + 4 + i);
              return (
                <div
                  key={i}
                  className="transition-transform duration-150 ease-out"
                  style={{
                    transform: `translate(${p.tx}px, ${p.ty}px) rotate(${p.rot * 0.1}deg)`,
                    filter: contactHot
                      ? 'drop-shadow(0 0 5px rgba(253,186,116,0.8))'
                      : undefined,
                  }}
                >
                  <Femur className={i === 0 ? 'w-5 h-14' : 'w-5 h-12'} />
                </div>
              );
            })}
            {bonePhase === 'FRAGMENTING' &&
              Array.from({ length: 8 }).map((_, i) => {
                const p = pushAway(35 + i * 5, 50, contact, nudge + i);
                return (
                  <div
                    key={i}
                    className="w-4 h-3 transition-transform duration-150 ease-out"
                    style={{
                      transform: `translate(${p.tx}px, ${p.ty}px) rotate(${i * 18 + p.rot}deg)`,
                    }}
                  >
                    <BoneShard i={i} />
                  </div>
                );
              })}
          </div>
        </>
      )}
      <div className="absolute left-[10%] right-[10%] bottom-[8%] flex justify-between px-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <div
            key={i}
            className="w-1.5 h-3 rounded-sm bg-zinc-600 shadow-inner"
          />
        ))}
      </div>
    </div>
  );
};
