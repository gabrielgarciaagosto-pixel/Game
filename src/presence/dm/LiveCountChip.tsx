import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSheetOpen } from '../../components/useSheetOpen';
import { formatSessionLength, type CountReport } from '../aggregate';
import {
  masterConfigured,
  parlorSignedIn,
  readPlayerCount,
  signInParlor,
  signOutParlor,
} from './readCount';

const REFRESH_MS = 45_000;

const PREVIEW: CountReport = {
  live: 3,
  today: 5,
  week: 12,
  averageSessionMs: 18 * 60 * 1000,
  versions: [
    { versionName: '0.9.81-demo', versionCode: 99, players: 3 },
    { versionName: '0.9.80-demo', versionCode: 98, players: 2 },
  ],
};

function previewRequested(): boolean {
  if (!import.meta.env.DEV) return false;
  return new URLSearchParams(window.location.search).get('dmPreview') === '1';
}

/** Dungeon Master build only. Reads totals. It does not write a presence ping. */
export const LiveCountChip: React.FC = () => {
  const preview = previewRequested();
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState<CountReport | null>(preview ? PREVIEW : null);
  const [note, setNote] = useState<string | null>(
    preview ? 'Local preview. Firebase is not connected in this shot.' : null
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [signedIn, setSignedIn] = useState(preview || parlorSignedIn());
  useSheetOpen(open);

  useEffect(() => {
    if (preview || !masterConfigured() || !parlorSignedIn()) return;
    const ac = new AbortController();
    void readPlayerCount(ac.signal)
      .then((next) => {
        setReport(next);
        setSignedIn(true);
        setNote(null);
      })
      .catch(() => {
        setNote('The count could not be read.');
      });
    return () => ac.abort();
  }, [preview]);

  useEffect(() => {
    if (!open || preview || !signedIn) return;
    let timer = 0;
    let current: AbortController | null = null;
    const pull = () => {
      if (document.visibilityState === 'hidden') return;
      current?.abort();
      current = new AbortController();
      void readPlayerCount(current.signal)
        .then((next) => {
          setReport(next);
          setNote(null);
        })
        .catch((err: unknown) => {
          if (err instanceof DOMException && err.name === 'AbortError') return;
          setNote('The count could not be read.');
        });
    };
    pull();
    timer = window.setInterval(pull, REFRESH_MS);
    const onHide = () => {
      if (document.visibilityState === 'hidden') current?.abort();
      else pull();
    };
    document.addEventListener('visibilitychange', onHide);
    return () => {
      window.clearInterval(timer);
      current?.abort();
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [open, preview, signedIn]);

  const submit = () => {
    if (busy) return;
    if (!email.trim() || !password) {
      setNote('Enter the parlor email and password.');
      return;
    }
    setBusy(true);
    setNote(null);
    const ac = new AbortController();
    void signInParlor(email.trim(), password, ac.signal)
      .then(() => readPlayerCount(ac.signal))
      .then((next) => {
        setPassword('');
        setSignedIn(true);
        setReport(next);
        setNote(null);
      })
      .catch(() => {
        setNote('That sign-in did not work.');
      })
      .finally(() => setBusy(false));
  };

  return (
    <>
      <button
        type="button"
        data-dm-chip
        data-live-count={report ? String(report.live) : ''}
        onClick={() => setOpen(true)}
        className="inline-flex min-h-11 items-center whitespace-nowrap rounded-lg border border-emerald-900/70 bg-slate-950/80 px-1.5 font-mono text-[12px] text-slate-200"
      >
        {report ? (
          <>
            LIVE <span className="font-bold text-emerald-300">{report.live}</span>
          </>
        ) : (
          'LIVE'
        )}
      </button>
      {open
        ? createPortal(
        <div className="house-sheet-overlay z-[80] bg-black/70" data-dm-monitor>
          <div className="house-sheet flex flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 text-slate-100 shadow-2xl">
            <div className="min-h-0 overflow-y-auto p-4">
              <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/80">
                Dungeon Master
              </p>
              <h2 className="mt-1 font-mono text-base font-bold text-slate-100">Player count</h2>
              <p className="mt-1 text-[11px] leading-snug text-slate-400">
                Totals only. This build does not add you to the count.
              </p>
              {note ? <p className="mt-3 text-[12px] leading-snug text-amber-100">{note}</p> : null}
              {!masterConfigured() && !preview ? (
                <p className="mt-3 text-[12px] leading-snug text-slate-300">
                  The count is not connected yet.
                </p>
              ) : null}
              {masterConfigured() && !signedIn && !preview ? (
                <form
                  className="mt-4 space-y-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    submit();
                  }}
                >
                  <label className="block text-[11px] text-slate-400">
                    Email
                    <input
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      autoComplete="username"
                      inputMode="email"
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    />
                  </label>
                  <label className="block text-[11px] text-slate-400">
                    Password
                    <input
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      type="password"
                      autoComplete="current-password"
                      className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={busy}
                    className="min-h-11 w-full rounded-lg bg-emerald-800 text-sm font-bold text-emerald-50 disabled:opacity-50"
                  >
                    {busy ? 'Signing in' : 'Sign in'}
                  </button>
                </form>
              ) : null}
              {report ? <CountBody report={report} /> : null}
              {signedIn && !preview ? (
                <button
                  type="button"
                  onClick={() => {
                    signOutParlor();
                    setSignedIn(false);
                    setReport(null);
                    setNote(null);
                  }}
                  className="mt-4 min-h-11 w-full rounded-lg border border-slate-700 text-sm text-slate-300"
                >
                  Sign out
                </button>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-11 shrink-0 border-t border-slate-800 text-sm text-slate-300"
            >
              Close
            </button>
          </div>
        </div>,
        document.getElementById('root') ?? document.body
      )
        : null}
    </>
  );
};

function CountBody({ report }: { report: CountReport }) {
  return (
    <div className="mt-4 space-y-3">
      <dl className="grid grid-cols-2 gap-2">
        <Stat label="Live now" value={String(report.live)} />
        <Stat label="Today" value={String(report.today)} />
        <Stat label="Last 7 days" value={String(report.week)} />
        <Stat label="Average session" value={formatSessionLength(report.averageSessionMs)} />
      </dl>
      <div>
        <p className="text-[10px] uppercase tracking-[0.16em] text-slate-500">By app version</p>
        <p className="mt-1 text-[11px] leading-snug text-slate-500">
          Players active in the last 7 days. Refreshes while this panel is open.
        </p>
        {report.versions.length === 0 ? (
          <p className="mt-2 text-[12px] text-slate-400">No players in the last 7 days.</p>
        ) : (
          <ul className="mt-2 space-y-1">
            {report.versions.map((row) => (
              <li
                key={`${row.versionName}-${row.versionCode}`}
                className="flex items-baseline justify-between gap-3 rounded-lg border border-slate-800 px-2.5 py-2 font-mono text-[12px]"
              >
                <span className="min-w-0 truncate text-slate-200">
                  {row.versionName}
                  <span className="text-slate-500"> ({row.versionCode})</span>
                </span>
                <span className="shrink-0 font-bold text-emerald-300">{row.players}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-2">
      <dt className="text-[10px] uppercase tracking-[0.14em] text-slate-500">{label}</dt>
      <dd className="mt-1 font-mono text-[13px] font-bold leading-snug text-slate-100">{value}</dd>
    </div>
  );
}
