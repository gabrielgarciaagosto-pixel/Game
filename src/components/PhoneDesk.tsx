import React, { useState } from 'react';
import {
  PHONE_CONTACTS,
  contactAccess,
  type PhoneContact,
} from '../data/phoneContacts';
import { PHONE_EXTRA_PER_DAY, formatHourSpan, localDayKey } from '../data/pacing';
import { titleAtXp } from '../data/rankProgression';
import { gameNow } from '../utils/gameNow';
import { useGameStore } from '../store/useGameStore';

function Row({
  contact,
  unlocked,
  reason,
  readyAt,
  now,
  onCall,
}: {
  contact: PhoneContact;
  unlocked: boolean;
  reason: string;
  readyAt: number;
  now: number;
  onCall: (id: string) => void;
}) {
  const cooling = unlocked && now < readyAt;
  const quiet = !unlocked || cooling;
  return (
    <li
      data-phone-contact={contact.id}
      data-phone-state={unlocked ? (cooling ? 'cooldown' : 'ready') : 'locked'}
      className={`rounded-xl border px-3 py-2.5 ${
        quiet
          ? 'border-white/5 bg-black/30 text-slate-500 grayscale'
          : 'border-emerald-900/50 bg-[#10241c] text-slate-100'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className={`text-sm font-bold ${quiet ? 'text-slate-400' : 'text-emerald-50'}`}>
            {contact.name}
          </div>
          <div className="text-[10px] uppercase tracking-[0.14em] text-slate-500">
            {contact.desk}
          </div>
        </div>
        {unlocked && !cooling ? (
          <button
            type="button"
            onClick={() => onCall(contact.id)}
            className="shrink-0 rounded-full bg-emerald-500 px-3 py-1.5 text-[12px] font-black text-emerald-950"
          >
            Call
          </button>
        ) : null}
      </div>
      <p className="mt-1 text-[11px] leading-snug">
        {cooling
          ? `Line is dark. Back in ${formatHourSpan(readyAt - now)}.`
          : unlocked
            ? contact.blurb
            : reason}
      </p>
      {unlocked ? (
        <p className="mt-1 font-mono text-[10px] text-slate-500">
          About {Math.round(contact.odds * 100)}% · own cooldown{' '}
          {formatHourSpan(contact.cooldownMs)}
        </p>
      ) : null}
    </li>
  );
}

/** Desk phone on the office computer. Each contact cools down on its own. */
export const PhoneDesk: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const reputation = useGameStore((s) => s.reputation);
  const careerXp = useGameStore((s) => s.careerXp);
  const homesKept = useGameStore((s) => s.homesKept);
  const cooldowns = useGameStore((s) => s.phoneCooldownUntil);
  const phoneDayKey = useGameStore((s) => s.phoneDayKey);
  const phoneCasesToday = useGameStore((s) => s.phoneCasesToday);
  const last = useGameStore((s) => s.phoneLastResult);
  const placePhoneCall = useGameStore((s) => s.placePhoneCall);
  const [now, setNow] = useState(() => gameNow());

  React.useEffect(() => {
    const id = window.setInterval(() => setNow(gameNow()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const todayCount = phoneDayKey === localDayKey(now) ? phoneCasesToday : 0;
  const held = titleAtXp(careerXp);
  const progress = {
    reputation,
    homesOwned: homesKept,
    rankIndex: held.index,
    rankTitle: held.title,
  };

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-[#07110e] text-slate-100" data-phone-desk>
      <header
        className="flex items-center gap-2 border-b border-emerald-900/60 px-3 py-3"
        style={{ paddingTop: 'calc(var(--safe-top) + 0.6rem)' }}
      >
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-300/80">Desk phone</p>
          <h2 className="text-base font-bold">Call for extra work</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="ml-auto rounded-full border border-emerald-800 px-3 py-1.5 text-[12px] font-bold text-emerald-100"
        >
          Close
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3 space-y-3">
        <p className="text-[12px] leading-snug text-slate-400">
          The day still brings its own cases. These lines are extra —{' '}
          {todayCount}/{PHONE_EXTRA_PER_DAY} landed today. Calling one number
          does not quiet the others.
        </p>
        {last ? (
          <div
            data-phone-result
            className={`rounded-xl border px-3 py-2 text-[13px] leading-snug ${
              last.hit
                ? 'border-emerald-600/60 bg-emerald-950/70 text-emerald-50'
                : 'border-slate-700 bg-slate-900 text-slate-200'
            }`}
          >
            {last.text}
          </div>
        ) : null}
        <ul className="space-y-2">
          {PHONE_CONTACTS.map((contact) => {
            const access = contactAccess(contact, progress);
            return (
              <Row
                key={contact.id}
                contact={contact}
                unlocked={access.unlocked}
                reason={access.reason}
                readyAt={cooldowns[contact.id] ?? 0}
                now={now}
                onCall={placePhoneCall}
              />
            );
          })}
        </ul>
      </div>
    </div>
  );
};
