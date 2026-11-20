import { useEffect, useState } from 'react';
import {
  AGREEMENT_BODY,
  AGREEMENT_LEAVE,
  AGREEMENT_ONLINE,
  AGREEMENT_SURE,
  writeFictionAgreement,
  writeFictionRefusal,
} from '../presence/fictionGate';
import { leaveTheHouse } from '../presence/houseExit';

const LEAVE_MS = 2400;

export function FirstLaunchAgreement({
  refused,
  onAgreed,
}: {
  refused: boolean;
  onAgreed: () => void;
}) {
  const [phase, setPhase] = useState<'ask' | 'sure' | 'leave'>(refused ? 'leave' : 'ask');

  useEffect(() => {
    window.__ossuarianHardwareBack = () => {
      if (phase === 'sure') {
        setPhase('ask');
        return 'handled';
      }
      if (phase === 'leave') {
        leaveTheHouse();
        return 'handled';
      }
      return 'handled';
    };
    return () => {
      delete window.__ossuarianHardwareBack;
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'leave') return;
    const id = window.setTimeout(() => leaveTheHouse(), LEAVE_MS);
    return () => window.clearTimeout(id);
  }, [phase]);

  const agree = () => {
    writeFictionAgreement();
    onAgreed();
  };

  const confirmLeave = () => {
    writeFictionRefusal();
    setPhase('leave');
  };

  return (
    <div
      className="fixed inset-0 z-[10060] flex flex-col bg-[#08080a] text-[#ebe6dd]"
      style={{
        padding:
          'var(--safe-top) var(--safe-right) var(--safe-bottom) var(--safe-left)',
      }}
      data-agreement-root
      data-agreement-screen={phase}
    >
      <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5">
        <p
          className="text-center text-[13px] tracking-[0.22em] text-[#c4a574]"
          style={{ fontFamily: 'Cinzel, Georgia, serif' }}
        >
          OSSUARIAN
        </p>
        {phase === 'ask' ? (
          <>
            <p className="mt-6 text-[15px] leading-relaxed text-[#f3eadc]">{AGREEMENT_BODY}</p>
            <p className="mt-4 text-[15px] leading-relaxed text-[#f3eadc]" data-agreement-internet>
              {AGREEMENT_ONLINE}
            </p>
            <button
              type="button"
              onClick={agree}
              className="mt-6 min-h-11 w-full rounded-lg bg-[#c4a574] text-sm font-bold text-[#1a140e]"
            >
              Agree
            </button>
            <button
              type="button"
              onClick={() => setPhase('sure')}
              className="mt-2 min-h-11 w-full rounded-lg border border-[#3a3228] text-sm text-[#d9cbb8]"
            >
              Disagree
            </button>
          </>
        ) : null}
        {phase === 'sure' ? (
          <>
            <p className="mt-6 text-[15px] leading-relaxed text-[#f3eadc]">{AGREEMENT_SURE}</p>
            <button
              type="button"
              onClick={() => setPhase('ask')}
              className="mt-6 min-h-11 w-full rounded-lg bg-[#c4a574] text-sm font-bold text-[#1a140e]"
            >
              Go back
            </button>
            <button
              type="button"
              onClick={confirmLeave}
              className="mt-2 min-h-11 w-full rounded-lg border border-[#3a3228] text-sm text-[#d9cbb8]"
            >
              Yes
            </button>
          </>
        ) : null}
        {phase === 'leave' ? (
          <p className="mt-6 text-center text-[16px] leading-relaxed text-[#f3eadc]" aria-live="polite">
            {AGREEMENT_LEAVE}
          </p>
        ) : null}
      </div>
    </div>
  );
}
