import { useEffect, useMemo, useState } from 'react';
import { aggregatePlayers, ago, formatSessionLength } from './aggregate';
import {
  clearSession,
  configReady,
  loadPlayers,
  pushNews,
  restoreVault,
  sendGift,
  signIn,
} from './firebase';
import { displayNameMap } from './names';
import { SAMPLE_HEADLINE, samplePlayers } from './sample';
import type { GiftKind, Player, Screen } from './types';

const SAMPLE = new URLSearchParams(window.location.search).get('sample') === '1';
const ROOMS: Record<string, string> = {
  OVERVIEW: 'Hub',
  COOLER: 'Cooler',
  EMBALMING: 'Embalming',
  CREMATION: 'Crematory',
  URN_FILLING: 'Urn room',
  SHOWROOM: 'Showroom',
  URN_VAULT: 'Vault',
  EMPORIUM: 'Emporium',
  COMPUTER: 'Computer',
};

export function App() {
  const [ready, setReady] = useState(SAMPLE);
  const [signedIn, setSignedIn] = useState(SAMPLE);
  const [players, setPlayers] = useState<Player[]>(() => (SAMPLE ? samplePlayers(Date.now()) : []));
  const [screen, setScreen] = useState<Screen>('players');
  const [selected, setSelected] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const names = useMemo(() => displayNameMap(players), [players]);
  const now = Date.now();
  const report = useMemo(() => aggregatePlayers(players, now), [players, now]);

  useEffect(() => {
    if (SAMPLE) return;
    let stop = false;
    void restoreVault().then((saved) => {
      if (stop) return;
      setEmail(saved.email);
      setPassword(saved.password);
      setSignedIn(saved.signedIn);
      setReady(true);
    });
    return () => {
      stop = true;
    };
  }, []);

  useEffect(() => {
    if (SAMPLE || !signedIn) return;
    let stop = false;
    let id = 0;
    const pull = () => {
      void loadPlayers()
        .then((next) => {
          if (!stop) {
            setPlayers(next);
            setNote('');
          }
        })
        .catch((error: unknown) => {
          if (stop) return;
          if (error instanceof Error && error.message === 'signedout') {
            setSignedIn(false);
            return;
          }
          setNote('The parlor could not be reached.');
        });
    };
    const stopTimer = () => {
      if (!id) return;
      window.clearInterval(id);
      id = 0;
    };
    const arm = () => {
      stopTimer();
      if (document.hidden) return;
      pull();
      id = window.setInterval(pull, 45_000);
    };
    const onVis = () => arm();
    document.addEventListener('visibilitychange', onVis);
    arm();
    return () => {
      stop = true;
      stopTimer();
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [signedIn]);

  if (!ready) {
    return <div className="urn-safe-x h-dvh bg-[#100e0c]" />;
  }

  if (!signedIn) {
    return (
      <SignIn
        email={email}
        password={password}
        busy={busy}
        note={note}
        onEmail={setEmail}
        onPassword={setPassword}
        onSubmit={() => {
          setBusy(true);
          setNote('');
          void signIn(email, password)
            .then(() => setSignedIn(true))
            .catch((error: unknown) => {
              setNote(
                error instanceof Error && error.message === 'unconfigured'
                  ? 'The Firebase web keys are not in the environment.'
                  : 'That email or password was not accepted.'
              );
            })
            .finally(() => setBusy(false));
        }}
      />
    );
  }

  const openPlayer = (installId: string) => {
    setSelected(installId);
    setScreen('detail');
  };

  return (
    <div className="urn-safe-x mx-auto flex h-dvh max-w-md flex-col bg-[#100e0c] text-[#f3eadc]">
      <header className="urn-safe-top shrink-0 border-b border-[#3a3228] px-4 pb-3" data-urn-header>
        <div className="flex items-baseline justify-between gap-3">
          <h1 className="font-[Cinzel,Georgia,serif] text-[15px] tracking-[0.18em] text-[#c4a574]">
            MASTER URN
          </h1>
          {SAMPLE ? (
            <p className="text-[11px] text-[#c4a574]" data-sample>
              Sample parlor
            </p>
          ) : (
            <button
              type="button"
              className="text-[12px] text-[#b7aa98]"
              onClick={() => {
                void clearSession().then(() => {
                  setSignedIn(false);
                  setPlayers([]);
                });
              }}
            >
              Leave
            </button>
          )}
        </div>
        {note ? <p className="mt-1 text-[12px] text-[#d7b3a4]">{note}</p> : null}
      </header>
      <main className="min-h-0 flex-1 overflow-auto px-4 py-3" data-screen={screen}>
        {screen === 'players' ? (
          <PlayerList
            players={players}
            names={names}
            now={now}
            live={report.live}
            today={report.today}
            week={report.week}
            session={formatSessionLength(report.averageSessionMs)}
            versions={report.versions}
            onOpen={openPlayer}
          />
        ) : null}
        {screen === 'detail' && selected ? (
          <PlayerDetail
            player={players.find((item) => item.installId === selected) ?? null}
            name={names.get(selected) ?? 'Mortician'}
            now={now}
            onBack={() => setScreen('players')}
          />
        ) : null}
        {screen === 'gift' ? (
          <GiftForm
            sample={SAMPLE}
            names={names}
            players={players}
            onNote={setNote}
          />
        ) : null}
        {screen === 'news' ? <NewsForm sample={SAMPLE} onNote={setNote} /> : null}
      </main>
      <nav className="urn-safe-bottom grid shrink-0 grid-cols-3 border-t border-[#3a3228]" data-urn-tabs>
        <NavButton current={screen === 'players' || screen === 'detail'} onClick={() => setScreen('players')}>
          Parlors
        </NavButton>
        <NavButton current={screen === 'gift'} onClick={() => setScreen('gift')}>
          Gift
        </NavButton>
        <NavButton current={screen === 'news'} onClick={() => setScreen('news')}>
          News
        </NavButton>
      </nav>
    </div>
  );
}

function SignIn({
  email,
  password,
  busy,
  note,
  onEmail,
  onPassword,
  onSubmit,
}: {
  email: string;
  password: string;
  busy: boolean;
  note: string;
  onEmail: (value: string) => void;
  onPassword: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      className="urn-safe-x urn-safe-top urn-safe-bottom mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-[#100e0c] px-5 text-[#f3eadc]"
      data-screen="signin"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <h1 className="font-[Cinzel,Georgia,serif] text-center text-[18px] tracking-[0.2em] text-[#c4a574]">
        MASTER URN
      </h1>
      <p className="mt-3 text-center text-[13px] leading-relaxed text-[#b7aa98]">
        The parlor book. After one entry, this phone keeps the login.
      </p>
      {!configReady() ? (
        <p className="mt-4 text-[13px] text-[#d7b3a4]">The Firebase web keys are not in the environment.</p>
      ) : null}
      <label className="mt-6 text-[12px] text-[#b7aa98]" htmlFor="urn-email">
        Email
      </label>
      <input
        id="urn-email"
        type="email"
        autoComplete="username"
        value={email}
        onChange={(event) => onEmail(event.target.value)}
        className="mt-1 min-h-11 rounded-lg border border-[#3a3228] bg-[#1a1612] px-3"
      />
      <label className="mt-3 text-[12px] text-[#b7aa98]" htmlFor="urn-password">
        Password
      </label>
      <input
        id="urn-password"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => onPassword(event.target.value)}
        className="mt-1 min-h-11 rounded-lg border border-[#3a3228] bg-[#1a1612] px-3"
      />
      {note ? <p className="mt-3 text-[13px] text-[#d7b3a4]">{note}</p> : null}
      <button
        type="submit"
        disabled={busy}
        className="mt-5 min-h-11 rounded-lg bg-[#c4a574] text-sm font-bold text-[#1a140e] disabled:opacity-50"
      >
        Log in
      </button>
    </form>
  );
}

function PlayerList({
  players,
  names,
  now,
  live,
  today,
  week,
  session,
  versions,
  onOpen,
}: {
  players: Player[];
  names: Map<string, string>;
  now: number;
  live: number;
  today: number;
  week: number;
  session: string;
  versions: { versionName: string; versionCode: number; players: number }[];
  onOpen: (installId: string) => void;
}) {
  const ordered = [...players].sort((a, b) => b.lastSeen - a.lastSeen);
  return (
    <div>
      <div className="grid grid-cols-2 gap-2">
        <Stat label="Live now" value={String(live)} />
        <Stat label="Today" value={String(today)} />
        <Stat label="Last 7 days" value={String(week)} />
        <Stat label="Session" value={session} />
      </div>
      <div className="mt-3 rounded-xl border border-[#3a3228] px-3 py-2">
        <p className="text-[10px] uppercase tracking-[0.16em] text-[#c4a574]">Versions</p>
        {versions.length === 0 ? (
          <p className="mt-1 text-[12px] text-[#b7aa98]">No one this week.</p>
        ) : (
          versions.slice(0, 3).map((version) => (
            <p key={`${version.versionName}-${version.versionCode}`} className="mt-1 text-[12px] text-[#f3eadc]">
              {version.versionName} ({version.versionCode}) · {version.players}
            </p>
          ))
        )}
      </div>
      <ul className="mt-3 space-y-2">
        {ordered.map((player) => {
          const name = names.get(player.installId) ?? 'Mortician';
          return (
            <li key={player.installId}>
              <button
                type="button"
                data-player={name}
                onClick={() => onOpen(player.installId)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#3a3228] bg-[#1a1612] px-3 py-2 text-left"
              >
                <span>
                  <span className="block text-[14px] font-semibold">{name}</span>
                  <span className="block text-[11px] text-[#b7aa98]">{ago(player.lastSeen, now)}</span>
                </span>
                <span className="text-[11px] text-[#c4a574]">{player.versionName}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function PlayerDetail({
  player,
  name,
  now,
  onBack,
}: {
  player: Player | null;
  name: string;
  now: number;
  onBack: () => void;
}) {
  if (!player) {
    return (
      <button type="button" onClick={onBack} className="text-[13px] text-[#c4a574]">
        All parlors
      </button>
    );
  }
  const rows: Array<[string, string]> = [
    ['Money', `$${player.cash}`],
    ['Reputation', String(player.reputation)],
    ['Interment', String(player.intermentScore)],
    ['Ossilegium', `${player.ossilegiumGrams} g`],
    ['Urns', String(player.urnsCount)],
    ['Cases', String(player.casesHandled)],
    ['Rank', player.rankTitle || 'Porter'],
    ['Homes', String(player.homesKept)],
    ['Room', ROOMS[player.activeStation] ?? 'Hub'],
    ['House', player.ownedPropertyLabel || 'Unknown house'],
    ['City', player.ownedPropertyCity || 'Unknown city'],
    ['Version', `${player.versionName} (${player.versionCode})`],
    ['Platform', platformLabel(player.platform)],
    ['Last seen', ago(player.lastSeen, now)],
    ['This session', formatSessionLength(player.sessionMs)],
  ];
  return (
    <div data-player-detail={name}>
      <button type="button" onClick={onBack} className="text-[13px] text-[#c4a574]">
        All parlors
      </button>
      <h2 className="mt-2 font-[Cinzel,Georgia,serif] text-[22px] text-[#f3eadc]">{name}</h2>
      <dl className="mt-3 divide-y divide-[#3a3228] rounded-xl border border-[#3a3228]">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-baseline justify-between gap-3 px-3 py-2">
            <dt className="text-[12px] text-[#b7aa98]">{label}</dt>
            <dd className="text-right text-[13px]">{value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function GiftForm({
  sample,
  names,
  players,
  onNote,
}: {
  sample: boolean;
  names: Map<string, string>;
  players: Player[];
  onNote: (note: string) => void;
}) {
  const options = [...players].sort((a, b) =>
    (names.get(a.installId) ?? '').localeCompare(names.get(b.installId) ?? '')
  );
  const preset = options.find((player) => names.get(player.installId) === 'Kyle 135')?.installId ?? '';
  const [scope, setScope] = useState<'one' | 'all'>(preset ? 'one' : 'all');
  const [target, setTarget] = useState(preset);
  const [kind, setKind] = useState<GiftKind>('money');
  const [amount, setAmount] = useState('500');
  const [busy, setBusy] = useState(false);

  const submit = () => {
    if (sample) {
      onNote('Sample parlor. Nothing was sent.');
      return;
    }
    const dollars = Math.round(Number(amount));
    if (kind === 'money' && (!Number.isFinite(dollars) || dollars < 1 || dollars > 1_000_000)) {
      onNote('Enter an amount from 1 to 1000000.');
      return;
    }
    if (scope === 'one' && !target) {
      onNote('Choose a parlor.');
      return;
    }
    setBusy(true);
    void sendGift({
      target: scope === 'all' ? 'all' : target,
      kind,
      amount: kind === 'remains' ? 1 : dollars,
    })
      .then(() => onNote('Sent.'))
      .catch(() => onNote('The gift could not be sent.'))
      .finally(() => setBusy(false));
  };

  return (
    <div data-gift-form>
      <h2 className="font-[Cinzel,Georgia,serif] text-[18px]">Send a gift</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-[#b7aa98]">
        One parlor, or every parlor. A remains waits if the cooler is full. Money is added once.
      </p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <Choice on={scope === 'one'} onClick={() => setScope('one')}>
          One parlor
        </Choice>
        <Choice on={scope === 'all'} onClick={() => setScope('all')}>
          Every parlor
        </Choice>
      </div>
      {scope === 'one' ? (
        <label className="mt-3 block text-[12px] text-[#b7aa98]">
          Parlor
          <select
            value={target}
            onChange={(event) => setTarget(event.target.value)}
            className="mt-1 min-h-11 w-full rounded-lg border border-[#3a3228] bg-[#1a1612] px-3"
          >
            {options.map((player) => (
              <option key={player.installId} value={player.installId}>
                {names.get(player.installId) ?? 'Mortician'}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <Choice on={kind === 'remains'} onClick={() => setKind('remains')}>
          A remains
        </Choice>
        <Choice on={kind === 'money'} onClick={() => setKind('money')}>
          Money
        </Choice>
      </div>
      {kind === 'money' ? (
        <label className="mt-3 block text-[12px] text-[#b7aa98]">
          Amount
          <input
            inputMode="numeric"
            value={amount}
            onChange={(event) => setAmount(event.target.value.replace(/[^\d]/g, ''))}
            className="mt-1 min-h-11 w-full rounded-lg border border-[#3a3228] bg-[#1a1612] px-3"
          />
        </label>
      ) : null}
      <button
        type="button"
        disabled={busy}
        onClick={submit}
        className="mt-4 min-h-11 w-full rounded-lg bg-[#c4a574] text-sm font-bold text-[#1a140e] disabled:opacity-50"
      >
        Send
      </button>
    </div>
  );
}

function NewsForm({ sample, onNote }: { sample: boolean; onNote: (note: string) => void }) {
  const [text, setText] = useState(sample ? SAMPLE_HEADLINE : '');
  const [busy, setBusy] = useState(false);
  const line = text.replace(/\s+/g, ' ').trim().slice(0, 160);

  return (
    <div data-news-form>
      <h2 className="font-[Cinzel,Georgia,serif] text-[18px]">Push News</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-[#b7aa98]">
        One line for every parlor. It joins the wire like any other county note.
      </p>
      <textarea
        value={text}
        maxLength={180}
        onChange={(event) => setText(event.target.value)}
        className="mt-4 min-h-28 w-full rounded-xl border border-[#3a3228] bg-[#1a1612] px-3 py-2 text-[15px] leading-relaxed"
        aria-label="Headline"
      />
      <button
        type="button"
        disabled={busy || line.length === 0}
        onClick={() => {
          if (sample) {
            onNote('Sample parlor. Nothing was sent.');
            return;
          }
          setBusy(true);
          void pushNews(line)
            .then(() => onNote('The wire has the new line.'))
            .catch(() => onNote('The line could not be sent.'))
            .finally(() => setBusy(false));
        }}
        className="mt-3 min-h-11 w-full rounded-lg bg-[#c4a574] text-sm font-bold text-[#1a140e] disabled:opacity-50"
      >
        Send to every parlor
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[#3a3228] bg-[#1a1612] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.14em] text-[#c4a574]">{label}</p>
      <p className="mt-1 text-[14px] font-semibold">{value}</p>
    </div>
  );
}

function Choice({
  on,
  onClick,
  children,
}: {
  on: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on}
      className={`min-h-11 rounded-lg border px-2 text-[13px] font-semibold ${
        on ? 'border-[#c4a574] bg-[#c4a574] text-[#1a140e]' : 'border-[#3a3228] text-[#d9cbb8]'
      }`}
    >
      {children}
    </button>
  );
}

function NavButton({
  current,
  onClick,
  children,
}: {
  current: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-12 text-[13px] font-semibold ${current ? 'text-[#c4a574]' : 'text-[#b7aa98]'}`}
    >
      {children}
    </button>
  );
}

function platformLabel(platform: string): string {
  if (platform === 'android') return 'Android';
  if (platform === 'ios') return 'iOS';
  return 'Web';
}
