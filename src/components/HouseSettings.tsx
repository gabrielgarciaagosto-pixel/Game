import React, { useEffect, useState } from 'react';
import { DEFAULT_PLAYER_NAME } from '../data/playerName';
import { resetGame } from '../dev/devActions';
import { useGameStore } from '../store/useGameStore';
import { audioManager } from '../utils/audioManager';
import { requestHouseNotificationPermission } from '../utils/houseNotifications';
import { useSheetOpen } from './useSheetOpen';

export const HouseSettings: React.FC = () => {
  const open = useGameStore((s) => s.settingsOpen);
  const playerName = useGameStore((s) => s.playerName);
  const hasStartedGame = useGameStore((s) => s.hasStartedGame);
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const setSettingsOpen = useGameStore((s) => s.setSettingsOpen);
  const replayTutorial = useGameStore((s) => s.replayTutorial);
  const notificationsEnabled = useGameStore((s) => s.notificationsEnabled);
  const setNotificationsEnabled = useGameStore((s) => s.setNotificationsEnabled);
  const [draft, setDraft] = useState(playerName);
  const [music, setMusic] = useState(1);
  const [musicMuted, setMusicMuted] = useState(false);
  const [interfaceVol, setInterfaceVol] = useState(1);
  const [interfaceMuted, setInterfaceMuted] = useState(false);
  const [confirmErase, setConfirmErase] = useState(false);
  const [notifyNote, setNotifyNote] = useState<string | null>(null);
  useSheetOpen(open);

  useEffect(() => {
    if (!open) {
      setConfirmErase(false);
      return;
    }
    setDraft(playerName);
    setMusic(audioManager.getMusicVolume());
    setMusicMuted(audioManager.isMusicMuted());
    setInterfaceVol(audioManager.getInterfaceVolume());
    setInterfaceMuted(audioManager.isInterfaceMuted());
  }, [open, playerName]);

  useEffect(() => {
    if (!open || !confirmErase) return;
    const close = () => setConfirmErase(false);
    window.__ossuarianCloseSettingsConfirm = close;
    return () => {
      if (window.__ossuarianCloseSettingsConfirm === close) {
        delete window.__ossuarianCloseSettingsConfirm;
      }
    };
  }, [open, confirmErase]);

  if (!open) return null;

  const save = () => {
    setPlayerName(draft);
    setSettingsOpen(false);
  };

  const erase = () => {
    setConfirmErase(false);
    resetGame('Save erased.');
  };

  return (
    <>
      <div className="sheet-safe fixed inset-0 z-[10020] bg-black/75 flex items-end sm:items-center justify-center">
        <div className="flex max-h-full w-full max-w-sm flex-col overflow-hidden rounded-2xl border border-[#3a3228] bg-[#12100e] text-[#ebe6dd] shadow-2xl">
          <div className="min-h-0 overflow-y-auto p-5">
            <p className="text-[10px] uppercase tracking-[0.22em] text-[#6e675c]">
              Settings
            </p>
            <h2
              className="mt-1 text-lg text-[#f3eadc]"
              style={{ fontFamily: 'Cinzel, Georgia, serif' }}
            >
              The house
            </h2>
            <label className="mt-4 block text-[11px] text-[#b7aa98]">
              Your name
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={DEFAULT_PLAYER_NAME}
                maxLength={24}
                autoComplete="off"
                className="mt-1 w-full rounded-lg border border-[#3a3228] bg-[#0c0b09] px-3 py-2 text-sm text-[#f3eadc]"
              />
            </label>
            <p className="mt-2 text-[11px] leading-snug text-[#6e675c]">
              Families and the state use this name. Blank saves as {DEFAULT_PLAYER_NAME}.
            </p>

            <div className="mt-4 space-y-3 border-t border-[#3a3228] pt-4">
              <VolumeRow
                label="Music volume"
                value={music}
                muted={musicMuted}
                onChange={(value) => {
                  setMusic(value);
                  audioManager.setMusicVolume(value);
                }}
                onMute={(muted) => {
                  setMusicMuted(muted);
                  audioManager.setMusicMuted(muted);
                }}
              />
              <VolumeRow
                label="Interface volume"
                hint="Taps, clicks, and touch"
                value={interfaceVol}
                muted={interfaceMuted}
                onChange={(value) => {
                  setInterfaceVol(value);
                  audioManager.setInterfaceVolume(value);
                }}
                onMute={(muted) => {
                  setInterfaceMuted(muted);
                  audioManager.setInterfaceMuted(muted);
                }}
                onRelease={() => {
                  if (!audioManager.isInterfaceMuted()) {
                    audioManager.playUiClick('tick');
                  }
                }}
              />
            </div>

            <div className="mt-4 border-t border-[#3a3228] pt-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] text-[#b7aa98]">Phone notices</p>
                  <p className="mt-1 text-[11px] leading-snug text-[#6e675c]">
                    When a body arrives, or a family chooses an urn or a casket
                    from your stock, the phone can ping you. The on-screen
                    notice still shows while the house is open.
                  </p>
                </div>
                <button
                  type="button"
                  data-notify-toggle
                  aria-pressed={notificationsEnabled}
                  onClick={() => {
                    if (notificationsEnabled) {
                      setNotificationsEnabled(false);
                      setNotifyNote('Phone notices are off. The house still shows them on screen.');
                      return;
                    }
                    setNotifyNote('Asking the phone for permission…');
                    void requestHouseNotificationPermission().then((result) => {
                      if (result === 'granted') {
                        setNotificationsEnabled(true);
                        setNotifyNote(
                          'On. Arrivals and family choices will ping this phone.'
                        );
                        return;
                      }
                      if (result === 'unsupported') {
                        setNotificationsEnabled(true);
                        setNotifyNote(
                          'This screen cannot post a system notice. The preference is saved for the phone, and the house still shows them here.'
                        );
                        return;
                      }
                      setNotificationsEnabled(false);
                      setNotifyNote(
                        'Permission was declined. Notices stay on screen until the phone allows them.'
                      );
                    });
                  }}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-[11px] font-bold ${
                    notificationsEnabled
                      ? 'bg-[#c4a574] text-[#1a140e]'
                      : 'border border-[#3a3228] text-[#d9cbb8]'
                  }`}
                >
                  {notificationsEnabled ? 'On' : 'Off'}
                </button>
              </div>
              {notifyNote ? (
                <p className="mt-2 text-[11px] leading-snug text-[#d9cbb8]">
                  {notifyNote}
                </p>
              ) : null}
            </div>

            <button
              type="button"
              onClick={() => setConfirmErase(true)}
              className="mt-4 w-full rounded-lg border border-red-800/80 py-2.5 text-sm font-bold text-red-300"
            >
              Erase save file
            </button>

            <div className="mt-3 flex flex-col gap-2">
              <button
                type="button"
                onClick={save}
                className="w-full rounded-lg bg-[#c4a574] py-2.5 text-sm font-bold text-[#1a140e]"
              >
                Save name
              </button>
              <button
                type="button"
                disabled={!hasStartedGame}
                onClick={() => {
                  setPlayerName(draft);
                  replayTutorial();
                  setSettingsOpen(false);
                }}
                className="w-full rounded-lg border border-[#3a3228] py-2.5 text-sm text-[#d9cbb8] disabled:opacity-40"
              >
                Replay tutorial
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="shrink-0 border-t border-[#3a3228] py-3 text-xs text-[#6e675c]"
          >
            Close
          </button>
        </div>
      </div>

      {confirmErase && (
        <div className="sheet-safe fixed inset-0 z-[10030] bg-black/80 flex items-end sm:items-center justify-center">
          <div
            className="w-full max-w-sm rounded-2xl border border-red-900/70 bg-[#14110e] p-5 text-[#ebe6dd] shadow-2xl"
            data-erase-confirm
          >
            <p className="text-sm leading-relaxed text-[#f3eadc]">
              Erase all progress? This can't be undone.
            </p>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmErase(false)}
                className="flex-1 rounded-lg border border-[#3a3228] py-2.5 text-sm text-[#d9cbb8]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={erase}
                className="flex-1 rounded-lg bg-red-800 py-2.5 text-sm font-bold text-red-50"
              >
                Erase
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

function VolumeRow({
  label,
  hint,
  value,
  muted,
  onChange,
  onMute,
  onRelease,
}: {
  label: string;
  hint?: string;
  value: number;
  muted: boolean;
  onChange: (value: number) => void;
  onMute: (muted: boolean) => void;
  onRelease?: () => void;
}) {
  const pct = Math.round(value * 100);
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label className="text-[11px] text-[#b7aa98]">
          {label}
          {hint ? (
            <span className="mt-0.5 block text-[10px] text-[#6e675c]">{hint}</span>
          ) : null}
        </label>
        <label className="flex shrink-0 items-center gap-1.5 text-[11px] text-[#d9cbb8]">
          <input
            type="checkbox"
            checked={muted}
            onChange={(e) => onMute(e.target.checked)}
          />
          Mute
        </label>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={pct}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        onPointerUp={onRelease}
        className="mt-1 w-full accent-[#c4a574]"
      />
    </div>
  );
}
