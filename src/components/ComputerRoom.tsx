import React, { useEffect, useMemo, useState } from 'react';
import {
  emptyPermitForm,
  rollPermitFilingFee,
  type PermitFormDraft,
} from '../data/cremationPermits';
import { US_PLACE_LABELS } from '../data/usPlaces';
import { resolvePlayerName } from '../data/playerName';
import {
  formatDeviceDate,
  formatTimeOf,
  readTodFields,
  writeTod,
  type Meridiem,
} from '../utils/clock12';
import { gameDate, subscribeClock } from '../utils/gameNow';
import { useGameStore } from '../store/useGameStore';
import { BankBrowser } from './BankBrowser';
import { DesktopAppIcon } from './DesktopAppIcon';
import { FakeBrowserChrome } from './FakeBrowserChrome';
import { FuneraryEmporium } from './FuneraryEmporium';
import { FleetBrowser } from './FleetBrowser';
import { RealtyBrowser } from './RealtyBrowser';
import { CrematoryCatalog } from './crematory/CrematoryCatalog';
import { CoolComposureCatalog } from './cooler/CoolComposureCatalog';
import { PhoneDesk } from './PhoneDesk';
import { HouseMail } from './HouseMail';

type DesktopApp =
  | 'DESKTOP'
  | 'VR441'
  | 'SHOP'
  | 'BANK'
  | 'REALTY'
  | 'FLEETS'
  | 'CRAIGMILE'
  | 'COOL'
  | 'PHONE'
  | 'MAIL';

const BROWSER_APPS: DesktopApp[] = [
  'SHOP',
  'VR441',
  'BANK',
  'REALTY',
  'FLEETS',
  'CRAIGMILE',
  'COOL',
];

/** The desk clock ticks every second. It stays its own component so the
 * permit form does not render again on each tick. */
const DesktopClock: React.FC<{ cash: number }> = ({ cash }) => {
  const [clock, setClock] = useState(() => gameDate());
  useEffect(() => {
    const id = window.setInterval(() => setClock(gameDate()), 1000);
    const unsub = subscribeClock(() => setClock(gameDate()));
    return () => {
      window.clearInterval(id);
      unsub();
    };
  }, []);
  return (
    <div
      className="min-w-0 flex-1 truncate text-right font-mono text-[11px] text-[#9eecc0] crt-phosphor-glow"
      data-device-clock
    >
      {formatDeviceDate(clock)} · {formatTimeOf(clock)} · ${cash.toLocaleString()}
    </div>
  );
};

/**
 * Office computer: CRT desktop + icons; apps open in a fake browser.
 * VR-441 draft stays mounted (hidden) so FILES / shop switches don't wipe it.
 */
export const ComputerRoom: React.FC = () => {
  const {
    setActiveStation,
    computerOpenApp,
    setComputerOpenApp,
    setSettingsOpen,
    cash,
    submitCremationPermit,
    permitSubmissions,
    permitWrongStreak,
    financeLedger,
    playerName,
    houseMail,
  } = useGameStore();
  const unreadMail = houseMail.reduce((count, letter) => count + (letter.read ? 0 : 1), 0);

  const [app, setApp] = useState<DesktopApp>(() =>
    computerOpenApp === 'PHONE' || computerOpenApp === 'MAIL'
      ? computerOpenApp
      : computerOpenApp && BROWSER_APPS.includes(computerOpenApp)
        ? computerOpenApp
        : 'DESKTOP'
  );
  const [form, setForm] = useState<PermitFormDraft>(emptyPermitForm());
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pobFilter, setPobFilter] = useState('');
  const [filingFee, setFilingFee] = useState(() => rollPermitFilingFee());

  useEffect(() => {
    if (computerOpenApp === 'PHONE' || computerOpenApp === 'MAIL') {
      setApp(computerOpenApp);
      return;
    }
    if (computerOpenApp && BROWSER_APPS.includes(computerOpenApp)) {
      setApp(computerOpenApp);
      return;
    }
    setApp('DESKTOP');
  }, [computerOpenApp]);

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

  const openApp = (next: Exclude<DesktopApp, 'DESKTOP'>) => {
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
        style={{
          paddingTop: 'var(--safe-top)',
          paddingBottom:
            'calc(var(--files-fab-bottom) + var(--fab-stack-height) + 0.35rem)',
        }}
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
            className="min-h-11 px-3 rounded border border-[#7dffb2]/40 bg-black/50 text-[11px] font-bold text-[#b8f0d0] font-mono"
            data-tutorial-target="shut-down"
          >
            Shut down
          </button>
        </div>

        <div
          className="flex-1 min-h-0 px-2 pt-2 pb-2 grid grid-cols-2 gap-x-1 gap-y-1 content-start max-w-lg overflow-y-auto"
        >
          <DesktopAppIcon kind="VR441" onOpen={() => openApp('VR441')} />
          <DesktopAppIcon kind="SHOP" onOpen={() => openApp('SHOP')} />
          <DesktopAppIcon kind="BANK" onOpen={() => openApp('BANK')} />
          <DesktopAppIcon kind="REALTY" onOpen={() => openApp('REALTY')} />
          <DesktopAppIcon kind="FLEETS" onOpen={() => openApp('FLEETS')} />
          <DesktopAppIcon kind="CRAIGMILE" onOpen={() => openApp('CRAIGMILE')} />
          <DesktopAppIcon kind="COOL" onOpen={() => openApp('COOL')} />
          <DesktopAppIcon kind="PHONE" onOpen={() => openApp('PHONE')} />
          <DesktopAppIcon
            kind="MAIL"
            marked={unreadMail > 0}
            onOpen={() => openApp('MAIL')}
          />
          <DesktopAppIcon kind="SETTINGS" onOpen={() => setSettingsOpen(true)} />
        </div>

        <div
          className="crt-taskbar relative z-[7] shrink-0 flex items-center gap-2 px-3"
          style={{
            minHeight: '2.75rem',
            paddingLeft: 'var(--safe-left)',
            paddingRight: 'var(--safe-right)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveStation('OVERVIEW')}
            style={{ touchAction: 'manipulation' }}
            className="shrink-0 min-h-11 px-3 rounded-sm bg-[#2a5a40] border border-[#7dffb2]/35 text-[11px] font-bold text-[#d7ffe8]"
          >
            Start
          </button>
          <button
            type="button"
            data-house-mail-task
            onClick={() => openApp('MAIL')}
            className={`shrink-0 min-h-11 px-3 rounded-sm border text-[11px] font-bold ${
              unreadMail > 0
                ? 'border-[#e7d7b8] bg-[#7a2e2a] text-[#f4ecd9]'
                : 'border-[#7dffb2]/35 bg-[#1a3328] text-[#d7ffe8]'
            }`}
          >
            {unreadMail > 0 ? `Mail ${unreadMail}` : 'Mail'}
          </button>
          <DesktopClock cash={cash} />
        </div>
      </div>

      {app === 'PHONE' ? <PhoneDesk onClose={goDesktop} /> : null}
      {app === 'MAIL' ? <HouseMail onClose={goDesktop} /> : null}

      {/* VR-441 always mounted so draft survives shop / FILES */}
      <div
        className={
          app === 'VR441'
            ? 'absolute inset-0 z-20'
            : 'absolute inset-0 z-20 invisible pointer-events-none'
        }
        aria-hidden={app !== 'VR441'}
        style={{ inset: 0 }}
      >
        <FakeBrowserChrome
          title="State Vital Records — VR-441"
          url="https://vital.records.state.gov/cremation/vr-441"
          onClose={goDesktop}
          deskTarget
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
            <main className="fab-scroll-pad flex-1 min-h-0 overflow-y-auto p-3 space-y-3">
              <p className="text-[11px] text-[#9bb8a4] leading-snug rounded border border-[#2f6b4f]/50 bg-[#0c1f16]/70 px-3 py-2">
                {resolvePlayerName(playerName)}, open{' '}
                <strong className="text-[#e8f5e9]">FILES</strong> to copy
                vitals. Draft stays if you switch apps. Fee every submit.
              </p>
              <section className="paper-sheet rounded border border-[#8a7048] p-3 space-y-2">
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
                  Time of death
                  {(() => {
                    const tod = readTodFields(form.timeOfDeath);
                    const commit = (next: {
                      hour: string;
                      minute: string;
                      mer: Meridiem;
                    }) =>
                      setForm((f) => ({
                        ...f,
                        timeOfDeath: writeTod(next.hour, next.minute, next.mer),
                      }));
                    return (
                      <div className="mt-1 grid grid-cols-3 gap-2">
                        <select
                          aria-label="Hour of death"
                          value={tod.hour}
                          onChange={(e) =>
                            commit({ ...tod, hour: e.target.value })
                          }
                          className="w-full bg-[#061018] border border-[#2a4a5c] rounded px-2 py-2 text-sm text-[#e8f5e9] font-mono"
                        >
                          <option value="">Hour</option>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(
                            (h) => (
                              <option key={h} value={String(h)}>
                                {h}
                              </option>
                            )
                          )}
                        </select>
                        <select
                          aria-label="Minute of death"
                          value={tod.minute}
                          onChange={(e) =>
                            commit({ ...tod, minute: e.target.value })
                          }
                          className="w-full bg-[#061018] border border-[#2a4a5c] rounded px-2 py-2 text-sm text-[#e8f5e9] font-mono"
                        >
                          {Array.from({ length: 60 }, (_, m) =>
                            String(m).padStart(2, '0')
                          ).map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                        <select
                          aria-label="AM or PM"
                          value={tod.mer}
                          onChange={(e) =>
                            commit({
                              ...tod,
                              mer: e.target.value === 'PM' ? 'PM' : 'AM',
                            })
                          }
                          className="w-full bg-[#061018] border border-[#2a4a5c] rounded px-2 py-2 text-sm text-[#e8f5e9] font-mono"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    );
                  })()}
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
                  data-tutorial-target="permit"
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
                  <div
                    key={s.id}
                    className="flex justify-between py-0.5"
                    data-tutorial-target={
                      s.status === 'REJECTED' ? 'permit-rejection' : undefined
                    }
                  >
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
          style={{ inset: 0 }}
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
          style={{ inset: 0 }}
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
          style={{ inset: 0 }}
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
          style={{ inset: 0 }}
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

      {app === 'CRAIGMILE' && (
        <div className="absolute inset-0 z-20" style={{ inset: 0 }}>
          <FakeBrowserChrome
            title="Craigmile Crematory Corp"
            url="https://www.craigmilecrematory.biz/catalog"
            onClose={goDesktop}
          >
            <CrematoryCatalog />
          </FakeBrowserChrome>
        </div>
      )}

      {app === 'COOL' && (
        <div className="absolute inset-0 z-20" style={{ inset: 0 }}>
          <FakeBrowserChrome
            title="Cool Composure"
            url="https://www.coolcomposure.biz/catalog"
            onClose={goDesktop}
          >
            <CoolComposureCatalog />
          </FakeBrowserChrome>
        </div>
      )}
    </div>
  );
};
