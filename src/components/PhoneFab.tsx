import React from 'react';
import { audioManager } from '../utils/audioManager';
import { PhoneBook, usePhoneLines } from './PhoneDesk';

const PHONE_FAB_CLASS =
  'bg-emerald-800 active:bg-emerald-700 text-emerald-50 font-extrabold px-3.5 py-3 rounded-xl shadow-2xl flex items-center gap-2 border-2 border-emerald-300/70 text-sm min-h-12';

/**
 * Hub twin of FILES. Same anchor, so it shows and hides in the same rooms.
 * The calendar sheet hides that anchor; this button goes with it.
 */
export const PhoneFab: React.FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = ({ open, onOpenChange }) => {
  const { readyCount } = usePhoneLines();

  return (
    <>
      <button
        type="button"
        data-phone-fab
        data-phone-ready={readyCount}
        aria-expanded={open}
        onClick={() => {
          audioManager.playUiClick('tick');
          onOpenChange(!open);
        }}
        style={{ touchAction: 'manipulation' }}
        className={PHONE_FAB_CLASS}
      >
        <span>PHONE</span>
        {readyCount > 0 ? (
          <span className="rounded-full bg-emerald-950/80 px-1.5 py-0.5 text-[10px] font-bold text-emerald-100">
            {readyCount}
          </span>
        ) : null}
      </button>
      {open ? (
        <div
          data-phone-panel
          className="hub-fab-sheet fixed z-[51] flex flex-col overflow-hidden rounded-2xl border-2 border-emerald-700/70 bg-slate-900 text-slate-100 shadow-2xl"
        >
          <div className="flex shrink-0 items-center gap-2 border-b border-slate-800 px-3 py-2">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300/80">
                Desk phone
              </div>
              <div className="text-sm font-bold text-emerald-50">Call for extra work</div>
            </div>
            <button
              type="button"
              onClick={() => {
                audioManager.playUiClick('tick');
                onOpenChange(false);
              }}
              className="ml-auto rounded-full border border-emerald-800 px-3 py-1 text-[12px] font-bold text-emerald-100"
            >
              Close
            </button>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
            <PhoneBook />
          </div>
        </div>
      ) : null}
    </>
  );
};
