import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import {
  NOTIFICATION_STALL_MESSAGE,
  acceptPhoneNoticesIfGranted,
  onHouseNoticeResume,
  openHouseNotificationSettings,
  requestHouseNotificationPermission,
} from '../utils/houseNotifications';
import { useSheetOpen } from './useSheetOpen';

/**
 * One ask for any parlor that has finished the tutorial and has not
 * answered yet, including a save made before this sheet existed.
 * Not now, or a declined phone prompt, leaves notices off.
 * Settings can ask again later.
 */
export const NotificationAsk: React.FC = () => {
  const hasStartedGame = useGameStore((s) => s.hasStartedGame);
  const titleGate = useGameStore((s) => s.titleGate);
  const tutorial = useGameStore((s) => s.tutorial);
  const notificationsEnabled = useGameStore((s) => s.notificationsEnabled);
  const notificationPromptSeen = useGameStore((s) => s.notificationPromptSeen);
  const settingsOpen = useGameStore((s) => s.settingsOpen);
  const bankForeclosed = useGameStore((s) => s.bankForeclosed);
  const legalAlert = useGameStore((s) => s.legalAlert);
  const serviceFeedback = useGameStore((s) => s.serviceFeedback);
  const rankFanfare = useGameStore((s) => s.rankFanfare);
  const legendaryOffer = useGameStore((s) => s.legendaryOffer);
  const setNotificationsEnabled = useGameStore((s) => s.setNotificationsEnabled);
  const markNotificationPromptSeen = useGameStore(
    (s) => s.markNotificationPromptSeen
  );
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [fault, setFault] = useState<string | null>(null);
  const [settingsNote, setSettingsNote] = useState<string | null>(null);
  const askGen = useRef(0);

  const blocked =
    !hasStartedGame ||
    titleGate ||
    tutorial !== 'done' ||
    notificationsEnabled ||
    notificationPromptSeen ||
    settingsOpen ||
    bankForeclosed ||
    legalAlert != null ||
    serviceFeedback != null ||
    rankFanfare != null ||
    legendaryOffer != null;

  useEffect(() => {
    if (blocked) {
      setOpen(false);
      return;
    }
    setOpen(true);
  }, [blocked]);

  useEffect(() => {
    if (!open) return;
    const close = () => {
      markNotificationPromptSeen();
      setOpen(false);
    };
    window.__ossuarianCloseNotifyAsk = close;
    return () => {
      if (window.__ossuarianCloseNotifyAsk === close) {
        delete window.__ossuarianCloseNotifyAsk;
      }
    };
  }, [open, markNotificationPromptSeen]);

  useSheetOpen(open);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    const timers: number[] = [];
    const clearTimers = () => {
      timers.forEach((id) => window.clearTimeout(id));
      timers.length = 0;
    };
    const look = () => {
      clearTimers();
      [0, 350, 900].forEach((delay) => {
        const id = window.setTimeout(() => {
          if (cancelled) return;
          void acceptPhoneNoticesIfGranted().then((ok) => {
            if (!ok || cancelled) return;
            askGen.current += 1;
            setBusy(false);
            setFault(null);
            setDeclined(false);
            setOpen(false);
          });
        }, delay);
        timers.push(id);
      });
    };
    look();
    const stop = onHouseNoticeResume(look);
    return () => {
      cancelled = true;
      clearTimers();
      stop();
    };
  }, [open]);

  if (!open) return null;

  const later = () => {
    markNotificationPromptSeen();
    setOpen(false);
  };

  const allow = () => {
    if (busy) return;
    const gen = askGen.current + 1;
    askGen.current = gen;
    setBusy(true);
    setDeclined(false);
    setFault(null);
    void requestHouseNotificationPermission(() => {
      if (askGen.current !== gen) return;
      setBusy(false);
      setFault(NOTIFICATION_STALL_MESSAGE);
    }).then(async (result) => {
      if (result === 'granted') {
        const on = await acceptPhoneNoticesIfGranted();
        if (!on) {
          setNotificationsEnabled(true);
          markNotificationPromptSeen();
        }
      }
      if (askGen.current !== gen) return;
      if (result === 'granted') {
        setBusy(false);
        setFault(null);
        setOpen(false);
        return;
      }
      const recovered = await acceptPhoneNoticesIfGranted();
      if (askGen.current !== gen) return;
      setBusy(false);
      if (recovered) {
        setFault(null);
        setOpen(false);
        return;
      }
      setFault(null);
      markNotificationPromptSeen();
      if (result === 'unsupported') {
        setOpen(false);
        return;
      }
      setNotificationsEnabled(false);
      setDeclined(true);
    });
  };

  const openSettings = () => {
    void openHouseNotificationSettings().then((opened) => {
      setSettingsNote(
        opened
          ? 'Notification settings are open. Allow notices for this house, then come back.'
          : 'On this screen the phone settings cannot be opened. On the installed house, this opens Android notification settings.'
      );
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
        {fault ? (
          <p className="mt-3 text-sm leading-relaxed text-[#d9cbb8]">{fault}</p>
        ) : declined ? (
          <p className="mt-3 text-sm leading-relaxed text-[#d9cbb8]">
            The phone declined, and it will not ask again. Open notification
            settings for this house and allow notices. Until then, notes stay
            on this screen.
          </p>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-[#d9cbb8]">
            The house can tell this phone when a body is due, when a retort
            finishes, when a service is about to begin, when a family chooses
            from your stock, or when the bank expects a payment. While you are
            here, those notes still appear on screen.
          </p>
        )}
        {settingsNote ? (
          <p className="mt-2 text-sm leading-relaxed text-[#d9cbb8]">{settingsNote}</p>
        ) : null}
        <div className="mt-4 flex flex-col gap-2">
          {fault || declined ? (
            <>
              {fault ? (
                <button
                  type="button"
                  data-notify-allow
                  disabled={busy}
                  onClick={allow}
                  className="w-full rounded-xl border border-[#3a3228] py-3 text-sm font-bold text-[#d9cbb8] disabled:opacity-60"
                >
                  {busy ? 'Asking…' : 'Try again'}
                </button>
              ) : null}
              <button
                type="button"
                data-notify-settings
                onClick={openSettings}
                className="w-full rounded-xl bg-[#c4a574] py-3 text-sm font-bold text-[#1a140e]"
              >
                Open notification settings
              </button>
              <button
                type="button"
                data-notify-close
                onClick={later}
                className="w-full rounded-xl border border-[#3a3228] py-3 text-sm font-bold text-[#d9cbb8]"
              >
                {declined ? 'Close' : 'Not now'}
              </button>
            </>
          ) : (
            <div className="flex gap-2">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
