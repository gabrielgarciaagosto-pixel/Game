import React from 'react';
import { AshMound, BoneShard, Femur, Rib, SkullCap } from './crematoryArt';

type BonePhase = 'INTACT' | 'CHARRING' | 'CALCINING' | 'FRAGMENTING' | 'ASH';

export const HearthCharge: React.FC<{
  mode: 'BURN' | 'SWEEP';
  bonePhase: BonePhase;
  progress: number;
  nudge: number;
  largeBonesLeft: number;
  mediumBonesLeft: number;
  fineAshLeft: number;
}> = ({
  mode,
  bonePhase,
  progress,
  nudge,
  largeBonesLeft,
  mediumBonesLeft,
  fineAshLeft,
}) => {
  if (mode === 'SWEEP') {
    const femurs = Math.ceil((largeBonesLeft / 100) * 3);
    const ribs = Math.ceil((largeBonesLeft / 100) * 2);
    const showSkull = largeBonesLeft > 20;
    const shards = Math.ceil((mediumBonesLeft / 100) * 14);
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
          {Array.from({ length: shards }).map((_, i) => (
            <div
              key={`shard-${i}`}
              className="w-5 h-3"
              style={{
                transform: `translateY(${(nudge + i) % 3}px) rotate(${-30 + ((i * 17 + nudge) % 60)}deg)`,
              }}
            >
              <BoneShard i={i} />
            </div>
          ))}
        </div>
        <div
          className="absolute inset-x-[6%] bottom-[28%] flex items-end justify-center gap-1"
          style={{ transform: `translateX(${(nudge % 3) - 1}px)` }}
        >
          {showSkull && (
            <SkullCap className="w-14 h-11 -mr-1" />
          )}
          {Array.from({ length: ribs }).map((_, i) => (
            <Rib
              key={`rib-${i}`}
              className="w-10 h-5"
            />
          ))}
          {Array.from({ length: femurs }).map((_, i) => (
            <Femur
              key={`femur-${i}`}
              className="w-6 h-16"
            />
          ))}
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
        <AshMound amount={70 + progress * 20} className="absolute left-1/2 -translate-x-1/2 bottom-[10%] w-[76%] h-16" />
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
              transform: `translateY(${bonePhase === 'FRAGMENTING' ? 6 : 0}px)`,
            }}
          >
            <SkullCap className="w-12 h-10" />
            <Rib className="w-9 h-4 mb-2" />
            <Femur className="w-5 h-14" />
            <Femur className="w-5 h-12" />
            {bonePhase === 'FRAGMENTING' &&
              Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="w-4 h-3"
                  style={{
                    transform: `translateY(${(nudge + i) % 5}px) rotate(${i * 18}deg)`,
                  }}
                >
                  <BoneShard i={i} />
                </div>
              ))}
          </div>
        </>
      )}
      <div className="absolute left-[10%] right-[10%] bottom-[8%] flex justify-between px-1">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="w-1.5 h-3 rounded-sm bg-zinc-600 shadow-inner" />
        ))}
      </div>
    </div>
  );
};
