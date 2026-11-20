import React, { useEffect, useState } from 'react';
import { formatDeviceDate, formatTimeOf } from '../utils/clock12';
import { useGameStore } from '../store/useGameStore';

function stamp(ms: number): string {
  const date = new Date(ms);
  return `${formatDeviceDate(date)}, ${formatTimeOf(date)}`;
}

/** Classic office mail on the parlor computer. */
export const HouseMail: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const houseMail = useGameStore((s) => s.houseMail);
  const markHouseLetterRead = useGameStore((s) => s.markHouseLetterRead);
  const [openId, setOpenId] = useState<string | null>(null);
  const unread = houseMail.reduce((count, letter) => count + (letter.read ? 0 : 1), 0);
  const open = houseMail.find((letter) => letter.id === openId) ?? null;

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.coverFab = '1';
    return () => {
      delete root.dataset.coverFab;
    };
  }, []);

  return (
    <div
      data-house-mail-root
      className="absolute inset-0 z-20 flex flex-col bg-[#1c1814] text-[#241c16]"
      style={{ fontFamily: 'Georgia, "Iowan Old Style", Palatino, "Palatino Linotype", serif' }}
    >
      <header
        className="shrink-0 flex items-center justify-between gap-3 border-b border-[#4a3d30] bg-[#2c261f] py-2 text-[#f3ead7]"
        style={{
          paddingTop: 'calc(var(--safe-top) + 0.35rem)',
          paddingLeft: 'var(--safe-left)',
          paddingRight: 'var(--safe-right)',
        }}
      >
        <div className="min-w-0">
          <p className="text-[10px] tracking-[0.22em] uppercase text-[#c4a574]">Office mail</p>
          <h2 className="text-base leading-tight">Night Desk</h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 min-h-11 rounded border border-[#c4a574]/50 px-3 text-[13px] text-[#f3ead7]"
        >
          Close
        </button>
      </header>

      {open ? (
        <article
          data-house-mail="open"
          className="flex min-h-0 flex-1 flex-col bg-[#f4ecd9]"
        >
          <div
            className="shrink-0 border-b border-[#d9cbb4] py-3"
            style={{ paddingLeft: 'var(--safe-left)', paddingRight: 'var(--safe-right)' }}
          >
            <button
              type="button"
              data-house-mail-back
              onClick={() => setOpenId(null)}
              className="mb-3 inline-flex min-h-11 items-center gap-2 rounded border border-[#6b5344] bg-[#efe4d0] px-3 text-[15px] font-semibold text-[#3a3128]"
            >
              <span aria-hidden>‹</span>
              Back
            </button>
            <dl className="space-y-1 text-[13px] leading-snug">
              <div className="grid grid-cols-[4.5rem_1fr] gap-2">
                <dt className="text-[#6b5344]">From</dt>
                <dd>{open.from}</dd>
              </div>
              <div className="grid grid-cols-[4.5rem_1fr] gap-2">
                <dt className="text-[#6b5344]">To</dt>
                <dd>{open.to}</dd>
              </div>
              <div className="grid grid-cols-[4.5rem_1fr] gap-2">
                <dt className="text-[#6b5344]">Date</dt>
                <dd>{stamp(open.sentAt)}</dd>
              </div>
              <div className="grid grid-cols-[4.5rem_1fr] gap-2">
                <dt className="text-[#6b5344]">Subject</dt>
                <dd className="font-semibold">{open.subject}</dd>
              </div>
            </dl>
          </div>
          <div
            className="min-h-0 flex-1 overflow-y-auto py-3 text-[14px] leading-[1.45] whitespace-pre-wrap"
            style={{
              paddingLeft: 'var(--safe-left)',
              paddingRight: 'var(--safe-right)',
              paddingBottom: 'calc(var(--safe-bottom) + 0.75rem)',
            }}
          >
            {open.body}
          </div>
        </article>
      ) : (
        <div data-house-mail="inbox" className="flex min-h-0 flex-1 flex-col bg-[#f4ecd9]">
          <div className="shrink-0 flex items-baseline justify-between border-b border-[#d9cbb4] px-4 py-2">
            <h3 className="text-[13px] uppercase tracking-[0.16em] text-[#6b5344]">Inbox</h3>
            <p className="text-[12px] text-[#6b5344]">
              {unread === 0 ? 'No unread' : unread === 1 ? '1 unread' : `${unread} unread`}
            </p>
          </div>
          {houseMail.length === 0 ? (
            <p className="px-4 py-6 text-[15px] leading-relaxed text-[#3a3128]">
              The night desk has not written. Mail arrives after the house has been closed.
            </p>
          ) : (
            <ul
              className="min-h-0 flex-1 overflow-y-auto"
              style={{ paddingBottom: 'calc(var(--safe-bottom) + 0.75rem)' }}
            >
              {houseMail.map((letter) => (
                <li key={letter.id} className="border-b border-[#e4d8c2]">
                  <button
                    type="button"
                    data-house-letter={letter.id}
                    data-house-letter-read={letter.read ? '1' : '0'}
                    onClick={() => {
                      markHouseLetterRead(letter.id);
                      setOpenId(letter.id);
                    }}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left"
                  >
                    <span
                      aria-hidden
                      className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${
                        letter.read ? 'border border-[#b7a890] bg-transparent' : 'bg-[#7a2e2a]'
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className={`truncate text-[15px] ${letter.read ? '' : 'font-semibold'}`}>
                          {letter.from}
                        </span>
                        <span className="shrink-0 text-[11px] text-[#6b5344]">
                          {formatDeviceDate(new Date(letter.sentAt))}
                        </span>
                      </span>
                      <span className={`block truncate text-[13px] ${letter.read ? 'text-[#4a4036]' : ''}`}>
                        {letter.subject}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
