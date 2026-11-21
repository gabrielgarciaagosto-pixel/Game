import React from 'react';
import {
  decorPrefLabel,
  serviceMusicLabel,
  type FamilyChapelPreferences,
} from '../data/familyChapelPrefs';

/** Roses and music sit apart from the bonus-only chapel wishes. */
export const FamilyPreferenceCard: React.FC<{
  prefs: FamilyChapelPreferences;
}> = ({ prefs }) => {
  return (
    <div data-family-prefs className="space-y-2">
      <div
        data-required-prefs
        className="space-y-1 rounded-lg border border-amber-400/80 bg-amber-950/50 p-2"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="text-[10px] uppercase tracking-[0.16em] text-amber-200">
            Required
          </div>
          <span className="rounded bg-amber-400 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-amber-950">
            Non-negotiable
          </span>
        </div>
        <p className="text-[12px] font-semibold text-amber-50">Roses</p>
        <p className="text-[12px] text-amber-50">
          Music · {serviceMusicLabel(prefs.musicTrackId)}
        </p>
        <p className="text-[10px] leading-snug text-amber-100/80">
          Meeting either is +2 on the house rating. Missing the roses, or
          playing the wrong music, is −2. A miss will not sink the service.
        </p>
      </div>
      <div className="space-y-1 rounded-lg border border-violet-800/60 bg-violet-950/40 p-2">
        <div className="text-[10px] uppercase tracking-wider text-violet-300/80">
          Optional — bonus only
        </div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[11px] text-violet-100/90">
          <span>Walls · {decorPrefLabel(prefs.wallId)}</span>
          <span>Floor · {decorPrefLabel(prefs.floorId)}</span>
          <span>Drapery · {decorPrefLabel(prefs.draperyId)}</span>
          <span>Lighting · {decorPrefLabel(prefs.lightingId)}</span>
          <span className="col-span-2">Pews · {decorPrefLabel(prefs.pewsId)}</span>
        </div>
        <p className="text-[9px] text-violet-300/80">
          Matching these adds a bonus. Missing them never lowers the rating.
        </p>
      </div>
    </div>
  );
};
