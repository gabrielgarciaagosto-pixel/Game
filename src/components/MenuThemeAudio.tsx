import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';

const THEME_SRC = '/audio/ossuarian-theme.m4a';

/**
 * Loops the Ossuarian theme on the splash / main hub.
 * Starts (or resumes) after the first user gesture if autoplay is blocked.
 */
export const MenuThemeAudio: React.FC = () => {
  const hasStartedGame = useGameStore((s) => s.hasStartedGame);
  const activeStation = useGameStore((s) => s.activeStation);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const shouldPlay = !hasStartedGame || activeStation === 'OVERVIEW';

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
      tryPlay();
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };

    if (shouldPlay) {
      tryPlay();
      window.addEventListener('pointerdown', unlock, { once: true });
      window.addEventListener('keydown', unlock, { once: true });
    }

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
    if (shouldPlay) {
      void audio.play().catch(() => undefined);
    } else {
      audio.pause();
    }
  }, [shouldPlay]);

  return null;
};
