import React, { useEffect, useState } from 'react';
import {
  BANK_WARNING_AFTER_MS,
  bankMsUntilForeclosure,
  formatFamilyCountdown,
} from '../data/bankForeclosure';
import { gameNow, subscribeClock } from '../utils/gameNow';
import { useGameStore } from '../store/useGameStore';

/** HUD strip when accounts are overdrawn past the 2h bank warning. */
export const BankDebtHud: React.FC = () => {
  const cash = useGameStore((s) => s.cash);
  const negativeCashSinceMs = useGameStore((s) => s.negativeCashSinceMs);
  const bankWarningIssued = useGameStore((s) => s.bankWarningIssued);
  const bankForeclosed = useGameStore((s) => s.bankForeclosed);
  const [, setTick] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setTick((n) => n + 1), 1000);
    const unsub = subscribeClock(() => setTick((n) => n + 1));
    return () => {
      window.clearInterval(id);
      unsub();
    };
  }, []);

  if (bankForeclosed || cash >= 0 || negativeCashSinceMs == null) return null;
  const now = gameNow();
  const elapsed = now - negativeCashSinceMs;
  if (elapsed < BANK_WARNING_AFTER_MS && !bankWarningIssued) return null;

  const remaining = bankMsUntilForeclosure(negativeCashSinceMs, now) ?? 0;

  return (
    <div
      className="fixed left-1/2 -translate-x-1/2 z-[90] max-w-lg w-[calc(100%-1.5rem)] pointer-events-none"
      style={{ top: 'calc(var(--safe-top) + 3.25rem)' }}
    >
      <div className="rounded-lg border border-amber-700/80 bg-amber-950/95 px-3 py-2 text-amber-50 shadow-lg font-mono text-[11px] flex items-center justify-between gap-2">
        <span className="font-bold tracking-wide text-amber-200">
          BANK DEBT · ${cash.toLocaleString()}
        </span>
        <span className="text-amber-100">
          Foreclosure in {formatFamilyCountdown(remaining)}
        </span>
      </div>
    </div>
  );
};
