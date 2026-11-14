import React, { useMemo, useState } from 'react';
import {
  emptyPermitForm,
  rollPermitFilingFee,
  type PermitFormDraft,
} from '../data/cremationPermits';
import { US_PLACE_LABELS } from '../data/usPlaces';
import { useGameStore } from '../store/useGameStore';

/** Digits-only HHMM for Android numeric keypads (no ':' needed). */
function digitsOnlyHhmm(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 4);
}

/**
 * Period Vital Records portal — VR-441 with no case selector.
 * Identify the decedent only by typing vitals exactly; fee every submit.
 */
export const ComputerRoom: React.FC = () => {
  const {
    setActiveStation,
    cash,
    submitCremationPermit,
    permitSubmissions,
    permitWrongStreak,
    financeLedger,
  } = useGameStore();

  const [form, setForm] = useState<PermitFormDraft>(emptyPermitForm());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pobFilter, setPobFilter] = useState('');
  const [filingFee, setFilingFee] = useState(() => rollPermitFilingFee());

  const placeOptions = useMemo(() => {
    const q = pobFilter.trim().toLowerCase();
    if (!q) return US_PLACE_LABELS.slice(0, 80);
    return US_PLACE_LABELS.filter((p) => p.toLowerCase().includes(q)).slice(
      0,
      80
    );
  }, [pobFilter]);

  const canAfford = cash >= filingFee;

  const onSubmit = () => {
    const result = submitCremationPermit(form, filingFee);
    setFeedback(result.message);
    if (result.ok) {
      setForm(emptyPermitForm());
      setPobFilter('');
      setFilingFee(rollPermitFilingFee());
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#0a1628] text-[#d7e6d2] flex flex-col select-none overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 3px), radial-gradient(80% 50% at 50% 0%, rgba(56,189,248,0.12), transparent 55%)',
        }}
      />

      <header
        className="relative shrink-0 border-b-2 border-[#2f6b4f] bg-[#0f2a1c] px-3 py-2"
        style={{ paddingTop: 'calc(var(--safe-top) + 0.35rem)' }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-[10px] tracking-[0.22em] uppercase text-[#8fbf9a]">
              State Vital Records · Online Portal
            </p>
            <h1 className="font-mono text-sm sm:text-base font-bold text-[#e8f5e9] leading-tight">
              CREMATION PERMIT REQUEST
            </h1>
            <p className="text-[10px] text-[#9bb8a4] mt-0.5">
              Form VR-441 · Identify decedent by vitals only · Open FILES to copy
            </p>
          </div>
          <button
            type="button"
            onPointerDown={() => setActiveStation('OVERVIEW')}
            className="shrink-0 px-3 py-2 rounded border border-[#4a7a5c] bg-[#143224] text-[11px] font-bold active:bg-[#1c4632]"
          >
            EXIT
          </button>
        </div>
        <div className="mt-2 flex flex-wrap gap-2 font-mono text-[10px]">
          <span className="px-2 py-1 rounded bg-black/30 border border-[#2f6b4f]">
            CASH ${cash.toLocaleString()}
          </span>
          <span className="px-2 py-1 rounded bg-black/30 border border-[#2f6b4f]">
            ERROR STREAK {permitWrongStreak}/3
          </span>
          <span className="px-2 py-1 rounded bg-black/30 border border-[#2f6b4f]">
            FILINGS {permitSubmissions.length}
          </span>
        </div>
      </header>

      <main className="relative flex-1 min-h-0 overflow-y-auto p-3 space-y-3 pb-24">
        <p className="text-[11px] text-[#9bb8a4] leading-snug rounded border border-[#2f6b4f]/50 bg-[#0c1f16]/70 px-3 py-2">
          Enter legal name, DOB, DOD, TOD, and place of birth exactly as in{' '}
          <strong className="text-[#e8f5e9]">FILES</strong>. The portal matches
          held cases automatically — no case picker. Mixed or incorrect vitals
          are rejected after review. A filing fee is charged on every submission.
        </p>

        <section className="rounded border border-[#3a6a8a] bg-[#0b1824]/95 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="text-[9px] uppercase tracking-[0.18em] text-sky-300/80">
              VR-441 entry form
            </div>
            <div
              className={`font-mono text-xs font-bold px-2 py-1 rounded border ${
                canAfford
                  ? 'border-amber-600/70 bg-amber-950/50 text-amber-100'
                  : 'border-red-600/70 bg-red-950/50 text-red-200'
              }`}
            >
              Filing fee ${filingFee}
            </div>
          </div>

          <label className="block text-[10px] text-[#9bb8a4]">
            Legal name (exact)
            <input
              value={form.legalName}
              onChange={(e) =>
                setForm((f) => ({ ...f, legalName: e.target.value }))
              }
              className="mt-1 w-full bg-[#061018] border border-[#2a4a5c] rounded px-2 py-2 text-sm text-[#e8f5e9] font-mono"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
            />
          </label>

          <div className="grid grid-cols-2 gap-2">
            <label className="block text-[10px] text-[#9bb8a4]">
              Date of birth
              <input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    dateOfBirth: e.target.value,
                  }))
                }
                className="mt-1 w-full bg-[#061018] border border-[#2a4a5c] rounded px-2 py-2 text-sm text-[#e8f5e9] font-mono"
                autoComplete="off"
              />
            </label>
            <label className="block text-[10px] text-[#9bb8a4]">
              Date of death
              <input
                type="date"
                value={form.dateOfDeath}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    dateOfDeath: e.target.value,
                  }))
                }
                className="mt-1 w-full bg-[#061018] border border-[#2a4a5c] rounded px-2 py-2 text-sm text-[#e8f5e9] font-mono"
                autoComplete="off"
              />
            </label>
          </div>

          <label className="block text-[10px] text-[#9bb8a4]">
            Time of death (24h HHMM)
            <input
              value={form.timeOfDeath}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  timeOfDeath: digitsOnlyHhmm(e.target.value),
                }))
              }
              placeholder="1030"
              maxLength={4}
              className="mt-1 w-full bg-[#061018] border border-[#2a4a5c] rounded px-2 py-2 text-sm text-[#e8f5e9] font-mono tracking-widest"
              inputMode="numeric"
              pattern="[0-9]*"
              enterKeyHint="done"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              aria-label="Time of death HHMM"
            />
            <span className="mt-0.5 block text-[9px] text-[#6f947a]">
              Four digits, leading zeros required (e.g. 0745, 2215)
            </span>
          </label>

          <label className="block text-[10px] text-[#9bb8a4]">
            Place of birth filter
            <input
              value={pobFilter}
              onChange={(e) => setPobFilter(e.target.value)}
              placeholder="City or ST"
              className="mt-1 w-full bg-[#061018] border border-[#2a4a5c] rounded px-2 py-2 text-sm text-[#e8f5e9] font-mono"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          <label className="block text-[10px] text-[#9bb8a4]">
            Place of birth
            <select
              value={form.placeOfBirth}
              onChange={(e) =>
                setForm((f) => ({ ...f, placeOfBirth: e.target.value }))
              }
              className="mt-1 w-full bg-[#061018] border border-[#2a4a5c] rounded px-2 py-2 text-sm text-[#e8f5e9] font-mono max-h-40"
              autoComplete="off"
            >
              <option value="">— select —</option>
              {form.placeOfBirth &&
                !placeOptions.includes(form.placeOfBirth) && (
                  <option value={form.placeOfBirth}>{form.placeOfBirth}</option>
                )}
              {placeOptions.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </label>

          {!canAfford && (
            <p className="text-[10px] text-red-300">
              Insufficient funds for the ${filingFee} filing fee.
            </p>
          )}

          <button
            type="button"
            disabled={!canAfford}
            onPointerDown={onSubmit}
            className="w-full py-3 rounded font-bold text-sm bg-[#2f6b4f] text-[#e8f5e9] active:bg-[#3a8460] disabled:opacity-40 disabled:active:bg-[#2f6b4f]"
          >
            SUBMIT · FEE ${filingFee}
          </button>

          {feedback && (
            <div className="p-2 rounded border border-amber-700/60 bg-amber-950/40 text-[11px] text-amber-100">
              {feedback}
            </div>
          )}
        </section>

        <section className="rounded border border-[#2f6b4f]/70 bg-black/20 p-2">
          <div className="text-[9px] uppercase tracking-wider text-[#6f947a] mb-1">
            Recent filings
          </div>
          <div className="space-y-1 max-h-28 overflow-y-auto font-mono text-[10px]">
            {permitSubmissions.length === 0 && (
              <p className="text-[#6f947a]">No submissions this save.</p>
            )}
            {permitSubmissions.slice(0, 8).map((s) => (
              <div
                key={s.id}
                className="flex justify-between gap-2 border-b border-[#1a2e24] py-1"
              >
                <span className="truncate text-[#9bb8a4]">
                  fee ${s.filingFee ?? '—'}
                </span>
                <span
                  className={
                    s.status === 'APPROVED'
                      ? 'text-emerald-300'
                      : s.status === 'REJECTED'
                        ? 'text-red-300'
                        : 'text-amber-300'
                  }
                >
                  {s.status}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded border border-[#2f6b4f]/70 bg-black/20 p-2">
          <div className="text-[9px] uppercase tracking-wider text-[#6f947a] mb-1">
            Finance ledger
          </div>
          <div className="space-y-1 max-h-28 overflow-y-auto font-mono text-[10px]">
            {financeLedger.length === 0 && (
              <p className="text-[#6f947a]">No ledger entries yet.</p>
            )}
            {financeLedger.slice(0, 10).map((e) => (
              <div
                key={e.id}
                className="flex justify-between gap-2 border-b border-[#1a2e24] py-1"
              >
                <span className="truncate text-[#9bb8a4]">{e.label}</span>
                <span
                  className={e.amount < 0 ? 'text-red-300' : 'text-emerald-300'}
                >
                  {e.amount < 0 ? '-' : '+'}${Math.abs(e.amount)}
                </span>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};
