import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';

const THEME_SRC = '/audio/ossuarian-theme.m4a';

/**
 * Loops the Ossuarian theme on the splash only — stops when Start is pressed.
 */
export const MenuThemeAudio: React.FC = () => {
  const hasStartedGame = useGameStore((s) => s.hasStartedGame);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio(THEME_SRC);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = 0.55;
    audioRef.current = audio;

    const tryPlay = () => {
      void audio.play().catch(() => {
        /* wait for a gesture */
      });
    };

    const unlock = () => {
      if (!useGameStore.getState().hasStartedGame) tryPlay();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };

    tryPlay();
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (hasStartedGame) {
      audio.pause();
      audio.currentTime = 0;
    } else {
      void audio.play().catch(() => undefined);
    }
  }, [hasStartedGame]);

  return null;
};
