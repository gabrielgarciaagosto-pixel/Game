import React, { useEffect, useMemo, useState } from 'react';
import {
  emptyPermitForm,
  rollPermitFilingFee,
  type PermitFormDraft,
} from '../data/cremationPermits';
import { US_PLACE_LABELS } from '../data/usPlaces';
import { gameDate, subscribeClock } from '../utils/gameNow';
import { useGameStore } from '../store/useGameStore';
import { BankBrowser } from './BankBrowser';
import { FakeBrowserChrome } from './FakeBrowserChrome';
import { FuneraryEmporium } from './FuneraryEmporium';

function digitsOnlyHhmm(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 4);
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

type DesktopApp = 'DESKTOP' | 'VR441' | 'SHOP' | 'BANK';

/**
 * Office computer: desktop wallpaper + icons, apps open in a fake browser.
 * VR-441 draft stays mounted (hidden) so FILES / shop switches don't wipe it.
 */
export const ComputerRoom: React.FC = () => {
  const {
    setActiveStation,
    computerOpenApp,
    setComputerOpenApp,
    cash,
    submitCremationPermit,
    permitSubmissions,
    permitWrongStreak,
    financeLedger,
  } = useGameStore();

  const [app, setApp] = useState<DesktopApp>(() =>
    computerOpenApp === 'SHOP' ||
    computerOpenApp === 'VR441' ||
    computerOpenApp === 'BANK'
      ? computerOpenApp
      : 'DESKTOP'
  );
  const [clock, setClock] = useState(() => gameDate());
  const [form, setForm] = useState<PermitFormDraft>(emptyPermitForm());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pobFilter, setPobFilter] = useState('');
  const [filingFee, setFilingFee] = useState(() => rollPermitFilingFee());

  useEffect(() => {
    if (
      computerOpenApp === 'SHOP' ||
      computerOpenApp === 'VR441' ||
      computerOpenApp === 'BANK'
    ) {
      setApp(computerOpenApp);
    }
  }, [computerOpenApp]);

  useEffect(() => {
    const id = window.setInterval(() => setClock(gameDate()), 15_000);
    const unsub = subscribeClock(() => setClock(gameDate()));
    return () => {
      window.clearInterval(id);
      unsub();
    };
  }, []);

  const placeOptions = useMemo(() => {
    const q = pobFilter.trim().toLowerCase();
    if (!q) return US_PLACE_LABELS.slice(0, 80);
    return US_PLACE_LABELS.filter((p) => p.toLowerCase().includes(q)).slice(
      0,
      80
    );
  }, [pobFilter]);

  const canAfford = cash >= filingFee;

  const goDesktop = () => {
    setApp('DESKTOP');
    setComputerOpenApp(null);
  };

  const openApp = (next: 'VR441' | 'SHOP' | 'BANK') => {
    setApp(next);
    setComputerOpenApp(next);
  };

  const onSubmit = () => {
    const result = submitCremationPermit(form, filingFee);
    setFeedback(result.message);
    if (result.ok) {
      setForm(emptyPermitForm());
      setPobFilter('');
      setFilingFee(rollPermitFilingFee());
    }
  };

  const clockLabel = `${pad2(clock.getHours())}:${pad2(clock.getMinutes())}`;

  return (
    <div className="fixed inset-0 z-40 flex flex-col select-none overflow-hidden text-slate-100">
      {/* Wallpaper */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(165deg, #1a3a4a 0%, #0c1e28 40%, #142018 70%, #0a1210 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-30"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 30%, rgba(255,255,255,0.08), transparent 40%), radial-gradient(circle at 80% 70%, rgba(56,189,248,0.12), transparent 45%)',
        }}
      />

      {/* Desktop layer */}
      <div
        className={`relative flex-1 min-h-0 flex flex-col ${
          app === 'DESKTOP' ? '' : 'invisible pointer-events-none absolute inset-0'
        }`}
        style={{ paddingTop: 'calc(var(--safe-top) + 0.5rem)' }}
      >
        <div className="px-4 flex justify-between items-start">
          <div>
            <p className="text-[10px] tracking-[0.2em] uppercase text-teal-200/70">
              Ossuarian OS
            </p>
            <h1 className="text-lg font-bold text-teal-50">Office Desktop</h1>
          </div>
          <button
            type="button"
            onPointerDown={() => setActiveStation('OVERVIEW')}
            className="px-3 py-2 rounded border border-teal-700/60 bg-teal-950/70 text-[11px] font-bold"
          >
            Shut down
          </button>
        </div>

        <div className="flex-1 p-4 grid grid-cols-2 gap-4 content-start max-w-lg">
          <button
            type="button"
            onClick={() => openApp('VR441')}
            className="flex flex-col items-center gap-2 p-3 rounded-xl active:bg-white/10"
            style={{ touchAction: 'manipulation' }}
          >
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-emerald-700 to-teal-950 border border-emerald-400/40 flex items-center justify-center shadow-lg font-mono text-xs font-black text-emerald-50">
              VR
            </div>
            <span className="text-[11px] text-center text-teal-50 font-semibold leading-tight drop-shadow">
              State Vital Records
            </span>
          </button>
          <button
            type="button"
            onClick={() => openApp('SHOP')}
            className="flex flex-col items-center gap-2 p-3 rounded-xl active:bg-white/10"
            style={{ touchAction: 'manipulation' }}
          >
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-amber-600 to-stone-900 border border-amber-300/40 flex items-center justify-center shadow-lg text-lg font-black text-amber-50">
              $
            </div>
            <span className="text-[11px] text-center text-teal-50 font-semibold leading-tight drop-shadow">
              Funerary Emporium
            </span>
          </button>
          <button
            type="button"
            onClick={() => openApp('BANK')}
            className="flex flex-col items-center gap-2 p-3 rounded-xl active:bg-white/10"
            style={{ touchAction: 'manipulation' }}
          >
            <div className="w-14 h-14 rounded-lg bg-gradient-to-br from-lime-700 to-emerald-950 border border-lime-300/50 flex items-center justify-center shadow-lg font-mono text-[10px] font-black text-lime-50 tracking-tight">
              BANK
            </div>
            <span className="text-[11px] text-center text-teal-50 font-semibold leading-tight drop-shadow">
              First National Bank
            </span>
          </button>
        </div>

        <div className="shrink-0 h-10 bg-black/55 border-t border-white/10 flex items-center justify-between px-3 backdrop-blur-sm">
          <button
            type="button"
            onPointerDown={() => setActiveStation('OVERVIEW')}
            className="px-2 py-1 rounded bg-teal-800/80 text-[10px] font-bold"
          >
            Start
          </button>
          <div className="font-mono text-[11px] text-teal-100/90">
            {clockLabel} · ${cash.toLocaleString()}
          </div>
        </div>
      </div>

      {/* VR-441 always mounted so draft survives shop / FILES */}
      <div
        className={
          app === 'VR441'
            ? 'absolute inset-0 z-20'
            : 'absolute inset-0 z-20 invisible pointer-events-none'
        }
        aria-hidden={app !== 'VR441'}
      >
        <FakeBrowserChrome
          title="State Vital Records — VR-441"
          url="https://vital.records.state.gov/cremation/vr-441"
          onClose={goDesktop}
        >
          <div className="h-full bg-[#0a1628] text-[#d7e6d2] flex flex-col overflow-hidden">
            <header className="shrink-0 border-b border-[#2f6b4f] bg-[#0f2a1c] px-3 py-2">
              <p className="text-[10px] tracking-[0.22em] uppercase text-[#8fbf9a]">
                State Vital Records · Online Portal
              </p>
              <h2 className="font-mono text-sm font-bold text-[#e8f5e9]">
                CREMATION PERMIT REQUEST
              </h2>
              <div className="mt-1 flex flex-wrap gap-2 font-mono text-[10px]">
                <span className="px-2 py-0.5 rounded bg-black/30 border border-[#2f6b4f]">
                  CASH ${cash.toLocaleString()}
                </span>
                <span className="px-2 py-0.5 rounded bg-black/30 border border-[#2f6b4f]">
                  STREAK {permitWrongStreak}/3
                </span>
                <span className="px-2 py-0.5 rounded bg-black/30 border border-[#2f6b4f]">
                  FILINGS {permitSubmissions.length}
                </span>
              </div>
            </header>
            <main className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 pb-20">
              <p className="text-[11px] text-[#9bb8a4] leading-snug rounded border border-[#2f6b4f]/50 bg-[#0c1f16]/70 px-3 py-2">
                Open <strong className="text-[#e8f5e9]">FILES</strong> to copy
                vitals. Draft stays if you switch apps. Fee every submit.
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
                    onPaste={(e) => {
                      e.preventDefault();
                      setForm((f) => ({
                        ...f,
                        timeOfDeath: digitsOnlyHhmm(
                          e.clipboardData.getData('text')
                        ),
                      }));
                    }}
                    placeholder="1030"
                    className="mt-1 w-full bg-[#061018] border border-[#2a4a5c] rounded px-2 py-2 text-sm text-[#e8f5e9] font-mono tracking-widest"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete="off"
                    aria-label="Time of death HHMM"
                  />
                </label>
                <label className="block text-[10px] text-[#9bb8a4]">
                  Place of birth filter
                  <input
                    value={pobFilter}
                    onChange={(e) => setPobFilter(e.target.value)}
                    placeholder="City or ST"
                    className="mt-1 w-full bg-[#061018] border border-[#2a4a5c] rounded px-2 py-2 text-sm text-[#e8f5e9] font-mono"
                  />
                </label>
                <label className="block text-[10px] text-[#9bb8a4]">
                  Place of birth
                  <select
                    value={form.placeOfBirth}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        placeOfBirth: e.target.value,
                      }))
                    }
                    className="mt-1 w-full bg-[#061018] border border-[#2a4a5c] rounded px-2 py-2 text-sm text-[#e8f5e9] font-mono"
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
                <button
                  type="button"
                  disabled={!canAfford}
                  onPointerDown={onSubmit}
                  className="w-full py-3 rounded font-bold text-sm bg-[#2f6b4f] text-[#e8f5e9] disabled:opacity-40"
                >
                  SUBMIT · FEE ${filingFee}
                </button>
                {feedback && (
                  <div className="p-2 rounded border border-amber-700/60 bg-amber-950/40 text-[11px] text-amber-100">
                    {feedback}
                  </div>
                )}
              </section>
              <section className="rounded border border-[#2f6b4f]/70 bg-black/20 p-2 font-mono text-[10px]">
                <div className="text-[9px] uppercase text-[#6f947a] mb-1">
                  Recent filings
                </div>
                {permitSubmissions.slice(0, 6).map((s) => (
                  <div key={s.id} className="flex justify-between py-0.5">
                    <span>fee ${s.filingFee ?? '—'}</span>
                    <span>{s.status}</span>
                  </div>
                ))}
                {financeLedger.slice(0, 4).map((e) => (
                  <div key={e.id} className="flex justify-between py-0.5 text-[#9bb8a4]">
                    <span className="truncate">{e.label}</span>
                    <span>
                      {e.amount < 0 ? '-' : '+'}${Math.abs(e.amount)}
                    </span>
                  </div>
                ))}
              </section>
            </main>
          </div>
        </FakeBrowserChrome>
      </div>

      {app === 'SHOP' && (
        <div className="absolute inset-0 z-20">
          <FakeBrowserChrome
            title="Funerary Emporium — Catalog"
            url="https://shop.funerary-emporium.biz/catalog"
            onClose={goDesktop}
          >
            <FuneraryEmporium embedded onClose={goDesktop} />
          </FakeBrowserChrome>
        </div>
      )}

      {app === 'BANK' && (
        <div className="absolute inset-0 z-20">
          <FakeBrowserChrome
            title="First National Mortuary Bank"
            url="https://bank.first-national-mortuary.example/online"
            onClose={goDesktop}
          >
            <BankBrowser />
          </FakeBrowserChrome>
        </div>
      )}
    </div>
  );
};
