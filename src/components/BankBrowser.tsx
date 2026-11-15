import React, { useState } from 'react';
import {
  BANK_LOAN_PRODUCTS,
  earlyPayoffAmount,
} from '../data/bankProducts';
import {
  BANK_FORECLOSURE_AFTER_MS,
  formatFamilyCountdown,
} from '../data/bankForeclosure';
import { formatDateTime12 } from '../utils/clock12';
import { gameNow } from '../utils/gameNow';
import { useGameStore } from '../store/useGameStore';
import { TapButton } from './TapButton';

type Tab = 'overview' | 'loans';

/**
 * First National Mortuary Bank — balance, loans, mortgages (no listings).
 */
export const BankBrowser: React.FC = () => {
  const cash = useGameStore((s) => s.cash);
  const activeLoans = useGameStore((s) => s.activeLoans);
  const ownedProperty = useGameStore((s) => s.ownedProperty);
  const negativeCashSinceMs = useGameStore((s) => s.negativeCashSinceMs);
  const bankWarningIssued = useGameStore((s) => s.bankWarningIssued);
  const bankOpenTab = useGameStore((s) => s.bankOpenTab);
  const setBankOpenTab = useGameStore((s) => s.setBankOpenTab);
  const facilitySpaceUsed = useGameStore((s) => s.facilitySpaceUsed);
  const facilitySpaceTotal = useGameStore((s) => s.facilitySpaceTotal);
  const takeBankLoan = useGameStore((s) => s.takeBankLoan);
  const payBankLoanInstallment = useGameStore((s) => s.payBankLoanInstallment);
  const earlyPayoffBankLoan = useGameStore((s) => s.earlyPayoffBankLoan);
  const setComputerOpenApp = useGameStore((s) => s.setComputerOpenApp);

  const [tab, setTab] = useState<Tab>(
    bankOpenTab === 'loans' ? 'loans' : 'overview'
  );
  const [confirm, setConfirm] = useState<{
    title: string;
    body: string;
    action: () => void;
  } | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  React.useEffect(() => {
    if (bankOpenTab === 'loans' || bankOpenTab === 'overview') {
      setTab(bankOpenTab);
      setBankOpenTab(null);
    } else if (bankOpenTab === 'listings') {
      // Legacy deep-link → realty app
      setBankOpenTab(null);
      setComputerOpenApp('REALTY');
    }
  }, [bankOpenTab, setBankOpenTab, setComputerOpenApp]);

  const used = facilitySpaceUsed();
  const total = facilitySpaceTotal();
  const mortgages = activeLoans.filter((l) => l.kind === 'MORTGAGE');
  const personal = activeLoans.filter((l) => l.kind === 'PERSONAL');

  const debtLabel =
    cash < 0
      ? bankWarningIssued
        ? 'FORECLOSURE CLOCK ACTIVE'
        : negativeCashSinceMs
          ? 'OVERDRAWN — warning pending'
          : 'OVERDRAWN'
      : activeLoans.some((l) => l.missedPayments > 0)
        ? 'LOAN DISTRESS'
        : 'CURRENT';

  const runConfirm = (
    title: string,
    body: string,
    action: () => { ok: boolean; message: string }
  ) => {
    setConfirm({
      title,
      body,
      action: () => {
        const r = action();
        setFlash(r.message);
        setConfirm(null);
      },
    });
  };

  return (
    <div className="h-full bg-[#0b1220] text-slate-100 flex flex-col overflow-hidden">
      <header className="shrink-0 border-b border-emerald-900/60 bg-[#0f1a14] px-3 py-2">
        <p className="text-[9px] tracking-[0.22em] uppercase text-emerald-400/80">
          First National Mortuary Bank
        </p>
        <h2 className="text-sm font-bold text-emerald-50">Online Banking</h2>
        <div className="mt-1 flex flex-wrap gap-1.5 font-mono text-[10px]">
          <span className="px-2 py-0.5 rounded bg-black/40 border border-emerald-800">
            BAL ${cash.toLocaleString()}
          </span>
          <span
            className={`px-2 py-0.5 rounded border ${
              cash < 0
                ? 'border-red-600 bg-red-950/50 text-red-100'
                : 'border-emerald-800 bg-black/40'
            }`}
          >
            {debtLabel}
          </span>
          <span className="px-2 py-0.5 rounded bg-black/40 border border-emerald-800">
            SPACE {used}/{total}
          </span>
        </div>
      </header>

      <nav className="shrink-0 flex gap-1 px-2 py-1.5 border-b border-slate-800 bg-[#0c141c] overflow-x-auto">
        {(
          [
            ['overview', 'Balance'],
            ['loans', 'Loans & mortgages'],
          ] as const
        ).map(([id, label]) => (
          <TapButton
            key={id}
            onTap={() => setTab(id)}
            className={`shrink-0 px-2.5 py-1 rounded text-[10px] font-bold border ${
              tab === id
                ? 'bg-emerald-700 border-emerald-400 text-emerald-50'
                : 'bg-slate-900 border-slate-700 text-slate-300'
            }`}
          >
            {label}
          </TapButton>
        ))}
      </nav>

      <main className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 pb-16">
        {flash && (
          <div className="rounded border border-amber-700/60 bg-amber-950/40 px-2 py-1.5 text-[11px] text-amber-100">
            {flash}
          </div>
        )}

        {tab === 'overview' && (
          <section className="space-y-3">
            <div className="rounded-xl border border-emerald-900/50 bg-[#101a22] p-3 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-emerald-400/70">
                Collateral / operating property
              </div>
              <div className="font-bold text-emerald-50">{ownedProperty.label}</div>
              <div className="text-[11px] text-slate-300">
                {ownedProperty.city}, {ownedProperty.stateCode}
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-400 mt-1">
                <span>
                  Space {used}/{ownedProperty.spaceTotal}
                </span>
                <span>Flow ×{ownedProperty.clientFlow}</span>
                <span>Sales ×{ownedProperty.salesMult}</span>
                <span>Basis ${ownedProperty.purchasedFor.toLocaleString()}</span>
              </div>
              <TapButton
                onTap={() => setComputerOpenApp('REALTY')}
                className="mt-2 w-full py-1.5 rounded border border-emerald-800/60 text-[10px] font-bold text-emerald-200"
              >
                Browse Lychgate Realty listings
              </TapButton>
            </div>

            <div className="rounded-xl border border-slate-700 bg-[#10141c] p-3 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">
                Account
              </div>
              <div className="text-2xl font-black font-mono text-emerald-100">
                ${cash.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Overdraft and missed loan/mortgage drafts share the foreclosure
                timer (2h warning · 4h seize).
              </p>
              {negativeCashSinceMs != null && cash < 0 && (
                <p className="text-[11px] text-amber-200 font-mono">
                  Debt clock:{' '}
                  {formatFamilyCountdown(
                    Math.max(
                      0,
                      BANK_FORECLOSURE_AFTER_MS -
                        (gameNow() - negativeCashSinceMs)
                    )
                  )}{' '}
                  to foreclosure
                </p>
              )}
            </div>

            <div className="rounded-xl border border-slate-700 bg-[#10141c] p-3 space-y-2">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">
                Mortgages
              </div>
              {mortgages.length === 0 ? (
                <p className="text-[11px] text-slate-500">
                  No open mortgage. Purchase homes via Lychgate Realty.
                </p>
              ) : (
                mortgages.map((l) => (
                  <div key={l.id} className="text-[11px] border-b border-slate-800 pb-1">
                    <div className="font-semibold text-slate-200">{l.label}</div>
                    <div className="font-mono text-slate-400">
                      Rem ${l.principalRemaining.toLocaleString()} · pay $
                      {l.paymentAmount} · missed {l.missedPayments}
                    </div>
                  </div>
                ))
              )}
              <div className="text-[10px] uppercase tracking-wider text-slate-500 pt-1">
                Personal notes
              </div>
              {personal.length === 0 ? (
                <p className="text-[11px] text-slate-500">None open.</p>
              ) : (
                personal.map((l) => (
                  <div key={l.id} className="text-[11px]">
                    <div className="font-semibold text-slate-200">{l.label}</div>
                    <div className="font-mono text-slate-400">
                      Rem ${l.principalRemaining.toLocaleString()} · pay $
                      {l.paymentAmount}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {tab === 'loans' && (
          <section className="space-y-3">
            <p className="text-[11px] text-slate-400">
              Working capital notes. Mortgages appear when you finance a Lychgate
              purchase. Drafts auto-pull; shortfalls overdraw accounts.
            </p>
            {BANK_LOAN_PRODUCTS.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-emerald-900/40 bg-[#101a22] p-3 space-y-2"
              >
                <div className="font-bold text-emerald-50">{p.name}</div>
                <div className="text-[10px] font-mono text-slate-400 grid grid-cols-2 gap-1">
                  <span>Principal ${p.principal.toLocaleString()}</span>
                  <span>APR {p.aprPct}%</span>
                  <span>Term {p.termFamilyHours}h fam.</span>
                  <span>
                    Pay ${p.paymentAmount} / {p.paymentEveryFamilyHours}h
                  </span>
                </div>
                <TapButton
                  onTap={() =>
                    runConfirm(
                      'Confirm loan',
                      `Take ${p.name}? Immediate +$${p.principal.toLocaleString()}.`,
                      () => takeBankLoan(p.id)
                    )
                  }
                  className="w-full py-2 rounded-lg bg-emerald-700 text-emerald-50 text-[11px] font-black"
                >
                  Take loan
                </TapButton>
              </div>
            ))}

            <div className="text-[10px] uppercase tracking-wider text-slate-500 pt-2">
              Your notes &amp; mortgages — pay / early payoff
            </div>
            {activeLoans.length === 0 && (
              <p className="text-[11px] text-slate-500">No active loans.</p>
            )}
            {activeLoans.map((l) => (
              <div
                key={l.id}
                className="rounded-xl border border-slate-700 bg-[#12161e] p-3 space-y-2"
              >
                <div className="font-bold text-slate-100">
                  {l.label}
                  <span className="ml-2 text-[9px] uppercase text-slate-500">
                    {l.kind}
                  </span>
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  Rem ${l.principalRemaining.toLocaleString()} · next due{' '}
                  {formatDateTime12(l.nextPaymentDueAt)} · missed{' '}
                  {l.missedPayments}
                </div>
                <div className="flex gap-2">
                  <TapButton
                    onTap={() => {
                      const due = Math.min(
                        l.principalRemaining,
                        l.paymentAmount
                      );
                      runConfirm(
                        'Confirm payment',
                        due < l.paymentAmount
                          ? `Final payment $${due.toLocaleString()} closes this note.`
                          : `Pay installment $${due.toLocaleString()}?`,
                        () => payBankLoanInstallment(l.id)
                      );
                    }}
                    className="flex-1 py-2 rounded-lg bg-sky-800 text-[11px] font-bold"
                  >
                    Pay $
                    {Math.min(
                      l.principalRemaining,
                      l.paymentAmount
                    ).toLocaleString()}
                  </TapButton>
                  <TapButton
                    onTap={() => {
                      const due = earlyPayoffAmount(l);
                      runConfirm(
                        'Early payoff',
                        `Pay off early for $${due.toLocaleString()} (incl. 2% crumb)?`,
                        () => earlyPayoffBankLoan(l.id)
                      );
                    }}
                    className="flex-1 py-2 rounded-lg bg-amber-800 text-[11px] font-bold"
                  >
                    Early payoff
                  </TapButton>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>

      {confirm && (
        <div className="sheet-safe-inset absolute inset-0 z-30 bg-black/70 flex items-end sm:items-center justify-center">
          <div className="w-full max-w-sm rounded-xl border border-emerald-700 bg-slate-950 p-4 space-y-3">
            <h4 className="font-bold text-emerald-50">{confirm.title}</h4>
            <p className="text-[12px] text-slate-300">{confirm.body}</p>
            <div className="flex gap-2">
              <TapButton
                onTap={() => setConfirm(null)}
                className="flex-1 py-2 rounded-lg bg-slate-800 text-[11px] font-bold"
              >
                Cancel
              </TapButton>
              <TapButton
                onTap={confirm.action}
                className="flex-1 py-2 rounded-lg bg-emerald-700 text-[11px] font-black"
              >
                Confirm
              </TapButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
