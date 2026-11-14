import React from 'react';
import {
  BANK_FORECLOSURE_BODY,
  BANK_FORECLOSURE_TITLE,
} from '../data/bankForeclosure';
import { useGameStore } from '../store/useGameStore';

export const BankForeclosureScreen: React.FC = () => {
  const bankForeclosed = useGameStore((s) => s.bankForeclosed);
  const acknowledgeBankForeclosure = useGameStore(
    (s) => s.acknowledgeBankForeclosure
  );

  if (!bankForeclosed) return null;

  return (
    <div className="fixed inset-0 z-[12000] bg-black/92 flex items-center justify-center p-6 select-none">
      <div className="max-w-md w-full border border-red-800/80 bg-gradient-to-b from-red-950 to-zinc-950 rounded-2xl p-6 shadow-2xl text-center space-y-4">
        <p className="text-[10px] uppercase tracking-[0.28em] text-red-400/80">
          First National Mortuary Bank
        </p>
        <h2 className="text-3xl font-black text-red-200 tracking-tight">
          {BANK_FORECLOSURE_TITLE}
        </h2>
        <p className="text-sm text-red-100/90 leading-relaxed">
          {BANK_FORECLOSURE_BODY}
        </p>
        <button
          type="button"
          onPointerDown={() => acknowledgeBankForeclosure()}
          className="w-full py-3 rounded-lg bg-red-700 active:bg-red-600 font-bold text-sm text-white"
        >
          Return to title
        </button>
      </div>
    </div>
  );
};
