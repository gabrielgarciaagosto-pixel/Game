import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { requestHouseNotificationPermission } from '../utils/houseNotifications';
import { useSheetOpen } from './useSheetOpen';

const ASKED_KEY = 'ossuarian-notify-asked';

function alreadyAsked(): boolean {
  try {
    return localStorage.getItem(ASKED_KEY) === '1';
  } catch {
    return true;
  }
}

function markAsked() {
  try {
    localStorage.setItem(ASKED_KEY, '1');
  } catch {
    // A private window can refuse the flag. The sheet still closes.
  }
}

/**
 * One ask after the tutorial, before any system dialog.
 * Not now, or a declined phone prompt, leaves notices off.
 * Settings can ask again later.
 */
export const NotificationAsk: React.FC = () => {
  const hasStartedGame = useGameStore((s) => s.hasStartedGame);
  const titleGate = useGameStore((s) => s.titleGate);
  const tutorial = useGameStore((s) => s.tutorial);
  const notificationsEnabled = useGameStore((s) => s.notificationsEnabled);
  const settingsOpen = useGameStore((s) => s.settingsOpen);
  const bankForeclosed = useGameStore((s) => s.bankForeclosed);
  const legalAlert = useGameStore((s) => s.legalAlert);
  const serviceFeedback = useGameStore((s) => s.serviceFeedback);
  const rankFanfare = useGameStore((s) => s.rankFanfare);
  const legendaryOffer = useGameStore((s) => s.legendaryOffer);
  const setNotificationsEnabled = useGameStore((s) => s.setNotificationsEnabled);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [declined, setDeclined] = useState(false);

  const blocked =
    !hasStartedGame ||
    titleGate ||
    tutorial !== 'done' ||
    notificationsEnabled ||
    settingsOpen ||
    bankForeclosed ||
    legalAlert != null ||
    serviceFeedback != null ||
    rankFanfare != null ||
    legendaryOffer != null;

  useEffect(() => {
    if (blocked || alreadyAsked()) {
      setOpen(false);
      return;
    }
    setOpen(true);
  }, [blocked]);

  useEffect(() => {
    if (!open) return;
    const close = () => {
      markAsked();
      setOpen(false);
    };
    window.__ossuarianCloseNotifyAsk = close;
    return () => {
      if (window.__ossuarianCloseNotifyAsk === close) {
        delete window.__ossuarianCloseNotifyAsk;
      }
    };
  }, [open]);

  useSheetOpen(open);

  if (!open) return null;

  const later = () => {
    markAsked();
    setOpen(false);
  };

  const allow = () => {
    if (busy) return;
    setBusy(true);
    void requestHouseNotificationPermission().then((result) => {
      setBusy(false);
      if (result === 'granted' || result === 'unsupported') {
        if (result === 'granted') setNotificationsEnabled(true);
        markAsked();
        setOpen(false);
        return;
      }
      setNotificationsEnabled(false);
      markAsked();
      setDeclined(true);
    });
  };

  return (
    <div
      data-notify-ask
      className="sheet-safe fixed inset-0 z-[10025] flex items-end justify-center bg-black/75 sm:items-center"
    >
      <div className="w-full max-w-sm rounded-2xl border border-[#3a3228] bg-[#12100e] p-5 text-[#ebe6dd] shadow-2xl">
        <p className="text-[10px] uppercase tracking-[0.22em] text-[#6e675c]">
          The house
        </p>
        <h2
          className="mt-1 text-lg text-[#f3eadc]"
          style={{ fontFamily: 'Cinzel, Georgia, serif' }}
        >
          Phone notices
        </h2>
        {declined ? (
          <p className="mt-3 text-sm leading-relaxed text-[#d9cbb8]">
            The phone declined. Notices stay on this screen. You can allow them
            later in Settings.
          </p>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-[#d9cbb8]">
            The house can tell this phone when a body is due, when a family
            chooses from your stock, or when the bank expects a payment. While
            you are here, those notes still appear on screen.
          </p>
        )}
        <div className="mt-4 flex gap-2">
          {declined ? (
            <button
              type="button"
              data-notify-close
              onClick={later}
              className="flex-1 rounded-xl bg-[#c4a574] py-3 text-sm font-bold text-[#1a140e]"
            >
              Close
            </button>
          ) : (
            <>
              <button
                type="button"
                data-notify-later
                onClick={later}
                className="flex-1 rounded-xl border border-[#3a3228] py-3 text-sm font-bold text-[#d9cbb8]"
              >
                Not now
              </button>
              <button
                type="button"
                data-notify-allow
                disabled={busy}
                onClick={allow}
                className="flex-[1.3] rounded-xl bg-[#c4a574] py-3 text-sm font-bold text-[#1a140e] disabled:opacity-60"
              >
                {busy ? 'Asking…' : 'Allow'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
