import React, { useMemo, useState } from 'react';
import {
  BANK_LOAN_PRODUCTS,
  PROPERTY_STATE_CODES,
  earlyPayoffAmount,
  filterPropertiesByState,
  getPropertyById,
  type PropertyListing,
} from '../data/bankProducts';
import { US_JURISDICTIONS } from '../data/usPlaces';
import {
  BANK_FORECLOSURE_AFTER_MS,
  formatFamilyCountdown,
} from '../data/bankForeclosure';
import { gameNow } from '../utils/gameNow';
import { useGameStore } from '../store/useGameStore';
import { TapButton } from './TapButton';

type Tab = 'overview' | 'loans' | 'listings';

/**
 * First National Mortuary Bank — balance, loans, property listings.
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
  const buyProperty = useGameStore((s) => s.buyProperty);

  const [tab, setTab] = useState<Tab>(bankOpenTab ?? 'overview');
  const [stateFilter, setStateFilter] = useState<string>('ALL');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{
    title: string;
    body: string;
    action: () => void;
  } | null>(null);
  const [flash, setFlash] = useState<string | null>(null);

  React.useEffect(() => {
    if (bankOpenTab) {
      setTab(bankOpenTab);
      setBankOpenTab(null);
    }
  }, [bankOpenTab, setBankOpenTab]);

  const used = facilitySpaceUsed();
  const total = facilitySpaceTotal();
  const listings = useMemo(
    () => filterPropertiesByState(stateFilter === 'ALL' ? 'ALL' : stateFilter),
    [stateFilter]
  );
  const detail: PropertyListing | null = detailId
    ? getPropertyById(detailId) ?? null
    : null;

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
            ['loans', 'Loans'],
            ['listings', 'Listings'],
          ] as const
        ).map(([id, label]) => (
          <TapButton
            key={id}
            onTap={() => {
              setTab(id);
              setDetailId(null);
            }}
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
                Operating property
              </div>
              <div className="font-bold text-emerald-50">{ownedProperty.label}</div>
              <div className="text-[11px] text-slate-300">
                {ownedProperty.city}, {ownedProperty.stateCode}
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-400 mt-1">
                <span>Space {used}/{ownedProperty.spaceTotal}</span>
                <span>Flow ×{ownedProperty.clientFlow}</span>
                <span>Sales ×{ownedProperty.salesMult}</span>
                <span>Basis ${ownedProperty.purchasedFor.toLocaleString()}</span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-700 bg-[#10141c] p-3 space-y-1">
              <div className="text-[10px] uppercase tracking-wider text-slate-500">
                Account
              </div>
              <div className="text-2xl font-black font-mono text-emerald-100">
                ${cash.toLocaleString()}
              </div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Overdraft and missed loan drafts share the bank foreclosure
                timer (2h warning · 4h seize). Keep balances non-negative.
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

            <div className="rounded-xl border border-slate-700 bg-[#10141c] p-3">
              <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">
                Open loan status
              </div>
              {activeLoans.length === 0 ? (
                <p className="text-[11px] text-slate-500">No open notes.</p>
              ) : (
                <ul className="space-y-2">
                  {activeLoans.map((l) => (
                    <li
                      key={l.id}
                      className="text-[11px] border-b border-slate-800 pb-1"
                    >
                      <div className="font-semibold text-slate-200">{l.label}</div>
                      <div className="font-mono text-slate-400">
                        Rem ${l.principalRemaining.toLocaleString()} · pay $
                        {l.paymentAmount} · missed {l.missedPayments} ·{' '}
                        {l.aprPct}% APR
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        )}

        {tab === 'loans' && (
          <section className="space-y-3">
            <p className="text-[11px] text-slate-400">
              Products list size, term (family hours), APR, and installment.
              Drafts auto-pull; shortfalls overdraw and arm foreclosure.
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
              Your notes — pay / early payoff
            </div>
            {activeLoans.length === 0 && (
              <p className="text-[11px] text-slate-500">No active loans.</p>
            )}
            {activeLoans.map((l) => (
              <div
                key={l.id}
                className="rounded-xl border border-slate-700 bg-[#12161e] p-3 space-y-2"
              >
                <div className="font-bold text-slate-100">{l.label}</div>
                <div className="text-[10px] font-mono text-slate-400">
                  Rem ${l.principalRemaining.toLocaleString()} · next due{' '}
                  {new Date(l.nextPaymentDueAt).toLocaleString()} · missed{' '}
                  {l.missedPayments}
                </div>
                <div className="flex gap-2">
                  <TapButton
                    onTap={() =>
                      runConfirm(
                        'Confirm payment',
                        `Pay installment $${l.paymentAmount}?`,
                        () => payBankLoanInstallment(l.id)
                      )
                    }
                    className="flex-1 py-2 rounded-lg bg-sky-800 text-[11px] font-bold"
                  >
                    Pay ${l.paymentAmount}
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

        {tab === 'listings' && !detail && (
          <section className="space-y-2">
            <div className="flex items-center gap-2">
              <label className="text-[10px] text-slate-400 shrink-0">
                State
              </label>
              <select
                value={stateFilter}
                onChange={(e) => setStateFilter(e.target.value)}
                className="flex-1 bg-[#0a1018] border border-slate-700 rounded px-2 py-1.5 text-[11px] font-mono"
              >
                <option value="ALL">All states</option>
                {PROPERTY_STATE_CODES.map((code) => {
                  const name =
                    US_JURISDICTIONS.find((j) => j.code === code)?.name ?? code;
                  return (
                    <option key={code} value={code}>
                      {code} — {name}
                    </option>
                  );
                })}
              </select>
            </div>
            <p className="text-[10px] text-slate-500">
              Showing {Math.min(listings.length, 40)} of {listings.length} ·
              relocate prefers larger space than your used {used}.
            </p>
            {listings.slice(0, 40).map((listing) => (
              <TapButton
                key={listing.id}
                onTap={() => setDetailId(listing.id)}
                className="w-full text-left rounded-xl border border-slate-700 bg-[#121820] p-3 active:bg-slate-900"
              >
                <div className="flex justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-emerald-50 truncate">
                      {listing.label}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {listing.city}, {listing.stateCode} · space {listing.space}
                    </div>
                  </div>
                  <div className="text-right shrink-0 font-mono text-[11px] text-amber-100">
                    ${listing.price.toLocaleString()}
                  </div>
                </div>
                <div className="mt-1 text-[10px] font-mono text-slate-500">
                  flow ×{listing.clientFlow} · sales ×{listing.salesMult} · rep +
                  {listing.repBonus}
                </div>
              </TapButton>
            ))}
          </section>
        )}

        {tab === 'listings' && detail && (
          <section className="space-y-3">
            <TapButton
              onTap={() => setDetailId(null)}
              className="text-[11px] text-emerald-300 font-bold"
            >
              ← Back to listings
            </TapButton>
            <div className="rounded-xl border border-emerald-800/50 bg-[#101a22] p-3 space-y-2">
              <h3 className="text-base font-black text-emerald-50">
                {detail.label}
              </h3>
              <p className="text-[11px] text-slate-300">{detail.blurb}</p>
              <div className="grid grid-cols-2 gap-1 text-[10px] font-mono text-slate-400">
                <span>
                  {detail.city}, {detail.stateCode}
                </span>
                <span>${detail.price.toLocaleString()}</span>
                <span>Space {detail.space}</span>
                <span>Flow ×{detail.clientFlow}</span>
                <span>Sales ×{detail.salesMult}</span>
                <span>Rep +{detail.repBonus}</span>
              </div>
              <p className="text-[10px] text-amber-200/80">
                Relocate (state choice). Current used space {used} — listing must
                fit. 20% down on mortgage.
              </p>
              <div className="flex gap-2">
                <TapButton
                  onTap={() =>
                    runConfirm(
                      'Buy cash',
                      `Pay $${detail.price.toLocaleString()} cash and relocate to ${detail.city}?`,
                      () => buyProperty(detail.id, 'CASH')
                    )
                  }
                  className="flex-1 py-2.5 rounded-lg bg-emerald-700 text-[11px] font-black"
                >
                  Buy cash
                </TapButton>
                <TapButton
                  onTap={() =>
                    runConfirm(
                      'Mortgage',
                      `20% down ($${Math.ceil(detail.price * 0.2).toLocaleString()}) + mortgage for ${detail.city}?`,
                      () => buyProperty(detail.id, 'MORTGAGE')
                    )
                  }
                  className="flex-1 py-2.5 rounded-lg bg-amber-700 text-[11px] font-black"
                >
                  Mortgage
                </TapButton>
              </div>
            </div>
          </section>
        )}
      </main>

      {confirm && (
        <div className="absolute inset-0 z-30 bg-black/70 flex items-end sm:items-center justify-center p-4">
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
