import React from 'react';
import { useGameStore } from '../store/useGameStore';

export const ServiceFeedbackModal: React.FC = () => {
  const feedback = useGameStore((s) => s.serviceFeedback);
  const clear = useGameStore((s) => s.clearServiceFeedback);

  if (!feedback) return null;

  return (
    <div className="fixed inset-0 z-[11000] bg-black/70 flex items-center justify-center p-5 select-none">
      <div className="max-w-md w-full max-h-[88vh] overflow-y-auto rounded-2xl border border-emerald-700/60 bg-slate-950 p-5 shadow-xl space-y-3">
        <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-400/80">
          Family feedback
        </p>
        <h3 className="text-lg font-bold text-emerald-100">
          {feedback.decedentName}
        </h3>
        <div className="rounded-lg border border-amber-800/50 bg-amber-950/40 px-3 py-2 space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-amber-300/80">
            Cortege
          </div>
          <ul className="text-sm text-amber-50 space-y-0.5">
            <li>
              Recovery:{' '}
              {feedback.fleetRecovery
                ? `${feedback.fleetRecovery} · +${feedback.fleetRep} reputation`
                : 'none'}
            </li>
            <li>
              Escort:{' '}
              {feedback.fleetEscort
                ? `${feedback.fleetEscort} · +$${(feedback.fleetCash - feedback.fleetFlowerCash).toLocaleString()}`
                : 'none'}
            </li>
            <li>
              Flower car:{' '}
              {feedback.fleetFlower
                ? `${feedback.fleetFlower} · +$${feedback.fleetFlowerCash.toLocaleString()}`
                : 'none'}
            </li>
            <li>
              Coach:{' '}
              {feedback.fleetCoach
                ? `${feedback.fleetCoach} · Interment +${feedback.intermentThisService}`
                : 'none'}
            </li>
          </ul>
          <p className="text-[12px] text-amber-200/90">
            House interment {feedback.intermentTotal}
          </p>
        </div>
        <p className="text-sm text-slate-300">
          Boost +{feedback.payoutBoostPct}% · tip ${feedback.tipCash} · rep +
          {feedback.reputationDelta}
          {feedback.prefBonus > 0
            ? ` · preference bonus ${feedback.prefBonus} pts`
            : ''}
        </p>
        {feedback.honored.length > 0 ? (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-emerald-400/70 mb-1">
              Honored
            </div>
            <ul className="text-sm text-emerald-100 space-y-0.5">
              {feedback.honored.map((h) => (
                <li key={h}>✓ {h}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-slate-400">
            No chapel preferences matched — still no penalty.
          </p>
        )}
        {feedback.missed.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
              Not matched (no penalty)
            </div>
            <ul className="text-sm text-slate-400 space-y-0.5">
              {feedback.missed.map((m) => (
                <li key={m}>· {m}</li>
              ))}
            </ul>
          </div>
        )}
        <button
          type="button"
          onPointerDown={() => clear()}
          className="w-full py-2.5 rounded-lg bg-emerald-800 active:bg-emerald-700 font-bold text-sm"
        >
          Continue
        </button>
      </div>
    </div>
  );
};
