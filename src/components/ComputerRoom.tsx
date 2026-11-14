import React, { useEffect, useMemo, useState } from 'react';
import {
  directiveNeedsCremationPermit,
  emptyPermitForm,
  type PermitFormDraft,
} from '../data/cremationPermits';
import { permitStatusLabel } from '../data/decedentVitals';
import { US_PLACE_LABELS } from '../data/usPlaces';
import { displayCaseName } from '../types/game';
import { useGameStore } from '../store/useGameStore';

/**
 * Period state-records portal — file cremation permits.
 * Vitals are NOT shown here: players must open Case Files (FILES FAB) to copy.
 * Local form state stays mounted while FILES is open so typed drafts survive.
 */
export const ComputerRoom: React.FC = () => {
  const {
    setActiveStation,
    cases,
    activeCaseId,
    selectActiveCase,
    submitCremationPermit,
    permitSubmissions,
    permitWrongStreak,
  } = useGameStore();

  const cremationCases = useMemo(
    () =>
      cases.filter(
        (c) => directiveNeedsCremationPermit(c.directive) && !c.isCremated
      ),
    [cases]
  );

  const selected =
    cremationCases.find((c) => c.id === activeCaseId) ??
    cremationCases[0] ??
    null;

  const [form, setForm] = useState<PermitFormDraft>(emptyPermitForm());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pobFilter, setPobFilter] = useState('');
  const [draftCaseId, setDraftCaseId] = useState<string | null>(null);

  const selectCase = (caseId: string) => {
    selectActiveCase(caseId);
    // Switching cases clears the draft; Case Files overlay does not remount us.
    if (draftCaseId !== caseId) {
      setForm(emptyPermitForm());
      setPobFilter('');
      setFeedback(null);
      setDraftCaseId(caseId);
    }
  };

  useEffect(() => {
    if (selected && draftCaseId == null) {
      setDraftCaseId(selected.id);
    }
  }, [selected, draftCaseId]);

  const placeOptions = useMemo(() => {
    const q = pobFilter.trim().toLowerCase();
    if (!q) return US_PLACE_LABELS.slice(0, 80);
    return US_PLACE_LABELS.filter((p) => p.toLowerCase().includes(q)).slice(
      0,
      80
    );
  }, [pobFilter]);

  const onSubmit = () => {
    if (!selected) return;
    const result = submitCremationPermit(selected.id, form);
    setFeedback(result.message);
    if (result.ok) {
      setForm(emptyPermitForm());
      setPobFilter('');
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
              Form VR-441 · Open FILES to copy vitals — nothing is prefilled
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
            ERROR STREAK {permitWrongStreak}/3
          </span>
          <span className="px-2 py-1 rounded bg-black/30 border border-[#2f6b4f]">
            FILINGS {permitSubmissions.length}
          </span>
          {selected && (
            <span className="px-2 py-1 rounded bg-black/30 border border-[#2f6b4f]">
              STATUS {permitStatusLabel(selected.cremationPermitStatus)}
            </span>
          )}
        </div>
      </header>

      <div className="relative flex-1 min-h-0 flex flex-col sm:flex-row overflow-hidden">
        <aside className="sm:w-40 shrink-0 border-b sm:border-b-0 sm:border-r border-[#1e3d2c] bg-[#071510]/80 max-h-[28%] sm:max-h-none overflow-y-auto">
          <div className="px-2 py-1.5 text-[9px] uppercase tracking-wider text-[#6f947a] border-b border-[#1e3d2c]">
            Eligible cases
          </div>
          {cremationCases.length === 0 && (
            <p className="p-3 text-[11px] text-[#6f947a]">
              No open cremation cases. Intake a Direct Cremation / Viewing→Cremation /
              Ossuary Memorial case.
            </p>
          )}
          {cremationCases.map((c) => (
            <button
              key={c.id}
              type="button"
              onPointerDown={() => selectCase(c.id)}
              className={`w-full text-left px-2.5 py-2 border-b border-[#14281e] text-[11px] ${
                selected?.id === c.id ? 'bg-[#1a3d2a]' : 'active:bg-[#12241a]'
              }`}
            >
              <div className="font-bold text-[#e2f0e4] truncate">
                {displayCaseName(c)}
              </div>
              <div className="text-[9px] text-[#8fbf9a]">
                #{c.id} · {permitStatusLabel(c.cremationPermitStatus)}
              </div>
            </button>
          ))}
        </aside>

        <main className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 pb-24">
          {!selected ? (
            <p className="text-sm text-[#8fbf9a] m-auto text-center py-10">
              Select a cremation case to file VR-441.
            </p>
          ) : (
            <>
              <p className="text-[11px] text-[#9bb8a4] leading-snug rounded border border-[#2f6b4f]/50 bg-[#0c1f16]/70 px-3 py-2">
                Use the <strong className="text-[#e8f5e9]">FILES</strong> button
                to open the case file and copy DOB, DOD, TOD, and place of birth
                exactly. Wrong filings delay approval; three bad filings trigger
                a state fine. Typed fields stay while FILES is open.
              </p>

              <section className="rounded border border-[#3a6a8a] bg-[#0b1824]/95 p-3 space-y-2">
                <div className="text-[9px] uppercase tracking-[0.18em] text-sky-300/80">
                  VR-441 entry form · case #{selected.id}
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
                  Time of death (24h HH:MM)
                  <input
                    value={form.timeOfDeath}
                    placeholder="HH:MM"
                    onChange={(e) =>
                      setForm((f) => ({ ...f, timeOfDeath: e.target.value }))
                    }
                    className="mt-1 w-full bg-[#061018] border border-[#2a4a5c] rounded px-2 py-2 text-sm text-[#e8f5e9] font-mono"
                    inputMode="numeric"
                    autoComplete="off"
                    spellCheck={false}
                  />
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
                        <option value={form.placeOfBirth}>
                          {form.placeOfBirth}
                        </option>
                      )}
                    {placeOptions.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>

                {!selected.isTagged && (
                  <p className="text-[10px] text-amber-200/90">
                    Tag the remains in the Cooler before filing.
                  </p>
                )}

                <button
                  type="button"
                  disabled={
                    !selected.isTagged ||
                    selected.cremationPermitStatus === 'PENDING' ||
                    selected.cremationPermitStatus === 'APPROVED'
                  }
                  onPointerDown={onSubmit}
                  className="w-full py-3 rounded font-bold text-sm bg-[#2f6b4f] text-[#e8f5e9] active:bg-[#3a8460] disabled:opacity-40 disabled:active:bg-[#2f6b4f]"
                >
                  SUBMIT TO VITAL RECORDS
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
                <div className="space-y-1 max-h-36 overflow-y-auto font-mono text-[10px]">
                  {permitSubmissions.length === 0 && (
                    <p className="text-[#6f947a]">No submissions this save.</p>
                  )}
                  {permitSubmissions.slice(0, 8).map((s) => (
                    <div
                      key={s.id}
                      className="flex justify-between gap-2 border-b border-[#1a2e24] py-1"
                    >
                      <span className="truncate">#{s.caseId}</span>
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
            </>
          )}
        </main>
      </div>
    </div>
  );
};
