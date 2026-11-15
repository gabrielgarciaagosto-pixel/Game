import React, { useEffect, useState } from 'react';
import { DEFAULT_PLAYER_NAME } from '../data/playerName';
import { useGameStore } from '../store/useGameStore';

export const HouseSettings: React.FC = () => {
  const open = useGameStore((s) => s.settingsOpen);
  const playerName = useGameStore((s) => s.playerName);
  const hasStartedGame = useGameStore((s) => s.hasStartedGame);
  const setPlayerName = useGameStore((s) => s.setPlayerName);
  const setSettingsOpen = useGameStore((s) => s.setSettingsOpen);
  const replayTutorial = useGameStore((s) => s.replayTutorial);
  const [draft, setDraft] = useState(playerName);

  useEffect(() => {
    if (open) setDraft(playerName);
  }, [open, playerName]);

  if (!open) return null;

  const save = () => {
    setPlayerName(draft);
    setSettingsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-[10020] bg-black/75 flex items-end sm:items-center justify-center p-4">
      <div className="w-full max-w-sm rounded-2xl border border-[#3a3228] bg-[#12100e] p-5 text-[#ebe6dd] shadow-2xl">
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
        <div className="mt-4 flex flex-col gap-2">
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
          <button
            type="button"
            onClick={() => setSettingsOpen(false)}
            className="w-full py-2 text-xs text-[#6e675c]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
