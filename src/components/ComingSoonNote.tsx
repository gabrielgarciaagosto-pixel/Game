import React from 'react';

/** Honest, general roadmap. Nothing beyond what the house already plans. */
export const COMING_SOON_POINTS = [
  'More urns and caskets',
  'More families and their stories',
  'Polish and balance',
  'More rooms in the house',
] as const;

export const ComingSoonPanel: React.FC<{ onClose: () => void }> = ({
  onClose,
}) => (
  <div
    className="fixed inset-0 z-[10040] flex items-end justify-center bg-black/75 sm:items-center"
    style={{
      paddingTop: 'var(--safe-top)',
      paddingRight: 'var(--safe-right)',
      paddingBottom: 'var(--safe-bottom)',
      paddingLeft: 'var(--safe-left)',
    }}
    onClick={onClose}
    role="presentation"
  >
    <div
      data-coming-soon
      className="m-4 w-full max-w-sm rounded-2xl border border-[#3a3228] bg-[#12100e] p-5 text-left text-[#ebe6dd] shadow-2xl"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-labelledby="coming-soon-title"
    >
      <p className="text-[10px] uppercase tracking-[0.22em] text-[#c4a574]">
        Roadmap
      </p>
      <h2
        id="coming-soon-title"
        className="mt-1 text-lg text-[#f3eadc]"
        style={{ fontFamily: 'Cinzel, Georgia, serif' }}
      >
        Coming soon
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-[#d9cbb8]">
        This public demo is a work in progress. Still ahead, in general terms:
      </p>
      <ul className="mt-3 space-y-1.5 text-sm text-[#f3eadc]">
        {COMING_SOON_POINTS.map((line) => (
          <li key={line} className="flex gap-2">
            <span className="text-[#c4a574]" aria-hidden>
              ·
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={onClose}
        className="mt-5 w-full rounded-lg bg-[#c4a574] py-2.5 text-sm font-bold text-[#1a140e]"
      >
        Close
      </button>
    </div>
  </div>
);
