import React, { useEffect } from 'react';
import { useGameStore } from '../store/useGameStore';
import { audioManager, CROSSFADE_MS, unlockGameAudio } from '../utils/audioManager';

/**
 * Soft-loops the Ossuarian theme on the splash only — fades out when Start
 * is pressed. Yields immediately if crematory beds take the bus.
 */
export const MenuThemeAudio: React.FC = () => {
  const hasStartedGame = useGameStore((s) => s.hasStartedGame);
  const audioMode = useGameStore((s) => s.retort.audioMode);

  useEffect(() => {
    const unlock = () => {
      void unlockGameAudio();
    };
    window.addEventListener('pointerdown', unlock, { once: true, passive: true });
    window.addEventListener('keydown', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true, passive: true });
    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
  }, []);

  useEffect(() => {
    const crematoryOwnsAudio =
      audioMode === 'START' || audioMode === 'LOOP';

    if (crematoryOwnsAudio) {
      return;
    }

    if (!hasStartedGame) {
      void audioManager.crossfadeTo('theme', {
        loop: true,
        durationMs: CROSSFADE_MS,
      });
    } else if (audioManager.getCurrentId() === 'theme') {
      void audioManager.fadeOut(CROSSFADE_MS);
    }
  }, [hasStartedGame, audioMode]);

  return null;
};
