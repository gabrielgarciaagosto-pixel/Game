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
import { DesktopAppIcon } from './DesktopAppIcon';
import { FakeBrowserChrome } from './FakeBrowserChrome';
import { FuneraryEmporium } from './FuneraryEmporium';
import { FleetBrowser } from './FleetBrowser';
import { RealtyBrowser } from './RealtyBrowser';

function digitsOnlyHhmm(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 4);
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

type DesktopApp = 'DESKTOP' | 'VR441' | 'SHOP' | 'BANK' | 'REALTY' | 'FLEETS';

/**
 * Office computer: CRT desktop + icons; apps open in a fake browser.
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
    computerOpenApp === 'BANK' ||
    computerOpenApp === 'REALTY' ||
    computerOpenApp === 'FLEETS'
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
      computerOpenApp === 'BANK' ||
      computerOpenApp === 'REALTY' ||
      computerOpenApp === 'FLEETS'
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

  const openApp = (next: 'VR441' | 'SHOP' | 'BANK' | 'REALTY' | 'FLEETS') => {
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
    <div
      className="fixed inset-0 z-40 flex flex-col select-none overflow-hidden text-slate-100 crt-desktop"
      style={{ width: '100%', height: '100%' }}
    >
      {/* CRT phosphor wash + bezel (behind UI) */}
      <div className="absolute inset-0 crt-bezel crt-flicker" aria-hidden />
      {/* Scanlines / vignette above UI, non-interactive */}
      <div className="crt-overlay" aria-hidden />

      {/* Desktop layer */}
      <div
        className={`relative flex-1 min-h-0 flex flex-col z-[1] ${
          app === 'DESKTOP'
            ? ''
            : 'invisible pointer-events-none absolute inset-0'
        }`}
        style={{ paddingTop: 'calc(var(--safe-top, 0px) + 0.75rem)' }}
      >
        <div className="px-4 flex justify-between items-start">
          <div>
            <p className="text-[9px] tracking-[0.22em] uppercase text-[#7dffb2]/70 crt-phosphor-glow font-mono">
              Ossuarian OS · CRT-9
            </p>
            <h1 className="text-lg font-bold text-[#c8f5d8] crt-phosphor-glow font-mono">
              Office Desktop
            </h1>
          </div>
          <button
            type="button"
            onClick={() => setActiveStation('OVERVIEW')}
            style={{ touchAction: 'manipulation' }}
            className="px-3 py-2 rounded border border-[#7dffb2]/40 bg-black/50 text-[11px] font-bold text-[#b8f0d0] font-mono"
          >
            Shut down
          </button>
        </div>

        <div className="flex-1 px-2 pt-2 pb-1 grid grid-cols-2 gap-x-1 gap-y-1 content-start max-w-lg overflow-y-auto">
          <DesktopAppIcon kind="VR441" onOpen={() => openApp('VR441')} />
          <DesktopAppIcon kind="SHOP" onOpen={() => openApp('SHOP')} />
          <DesktopAppIcon kind="BANK" onOpen={() => openApp('BANK')} />
          <DesktopAppIcon kind="REALTY" onOpen={() => openApp('REALTY')} />
          <DesktopAppIcon kind="FLEETS" onOpen={() => openApp('FLEETS')} />
        </div>

        <div className="crt-taskbar relative z-[7] shrink-0 h-10 flex items-center justify-between px-3">
          <button
            type="button"
            onClick={() => setActiveStation('OVERVIEW')}
            style={{ touchAction: 'manipulation' }}
            className="px-2 py-1 rounded-sm bg-[#2a5a40] border border-[#7dffb2]/35 text-[10px] font-bold text-[#d7ffe8]"
          >
            Start
          </button>
          <div className="font-mono text-[11px] text-[#9eecc0] crt-phosphor-glow">
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
        style={{
          paddingTop: 'calc(var(--safe-top, 0px) + 0.35rem)',
          paddingBottom: 'calc(var(--safe-bottom, 0px) + 0.35rem)',
          paddingLeft: '0.35rem',
          paddingRight: '0.35rem',
        }}
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
                      setForm((f) => ({
                        ...f,
                        legalName: e.target.value,
                      }))
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
                  onClick={onSubmit}
                  style={{ touchAction: 'manipulation' }}
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
                  <div
                    key={e.id}
                    className="flex justify-between py-0.5 text-[#9bb8a4]"
                  >
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
        <div
          className="absolute inset-0 z-20"
          style={{
            paddingTop: 'calc(var(--safe-top, 0px) + 0.35rem)',
            paddingBottom: 'calc(var(--safe-bottom, 0px) + 0.35rem)',
            paddingLeft: '0.35rem',
            paddingRight: '0.35rem',
          }}
        >
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
        <div
          className="absolute inset-0 z-20"
          style={{
            paddingTop: 'calc(var(--safe-top, 0px) + 0.35rem)',
            paddingBottom: 'calc(var(--safe-bottom, 0px) + 0.35rem)',
            paddingLeft: '0.35rem',
            paddingRight: '0.35rem',
          }}
        >
          <FakeBrowserChrome
            title="First National Mortuary Bank"
            url="https://bank.first-national-mortuary.example/online"
            onClose={goDesktop}
          >
            <BankBrowser />
          </FakeBrowserChrome>
        </div>
      )}

      {app === 'REALTY' && (
        <div
          className="absolute inset-0 z-20"
          style={{
            paddingTop: 'calc(var(--safe-top, 0px) + 0.35rem)',
            paddingBottom: 'calc(var(--safe-bottom, 0px) + 0.35rem)',
            paddingLeft: '0.35rem',
            paddingRight: '0.35rem',
          }}
        >
          <FakeBrowserChrome
            title="Lychgate Commercial Realty"
            url="https://www.lychgate-realty.biz/listings"
            onClose={goDesktop}
          >
            <RealtyBrowser />
          </FakeBrowserChrome>
        </div>
      )}

      {app === 'FLEETS' && (
        <div
          className="absolute inset-0 z-20"
          style={{
            paddingTop: 'calc(var(--safe-top, 0px) + 0.35rem)',
            paddingBottom: 'calc(var(--safe-bottom, 0px) + 0.35rem)',
            paddingLeft: '0.35rem',
            paddingRight: '0.35rem',
          }}
        >
          <FakeBrowserChrome
            title="Lampblack Coach & Motor"
            url="https://www.lampblackcoach.biz/showroom"
            onClose={goDesktop}
          >
            <FleetBrowser />
          </FakeBrowserChrome>
        </div>
      )}
    </div>
  );
};
