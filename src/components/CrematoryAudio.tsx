import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';

const START_SRC = '/audio/crematory-start.m4a';
const LOOP_SRC = '/audio/crematory-loop.m4a';

/**
 * Plays the one-shot crematory start sting, then loops the normal run bed
 * until the burn finishes (sweep / done / audioMode OFF).
 */
export const CrematoryAudio: React.FC = () => {
  const audioMode = useGameStore((s) => s.retort.audioMode);
  const primaryOn = useGameStore((s) => s.retort.primaryOn);
  const phase = useGameStore((s) => s.retort.phase);
  const patchRetort = useGameStore((s) => s.patchRetort);

  const startRef = useRef<HTMLAudioElement | null>(null);
  const loopRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const start = new Audio(START_SRC);
    start.preload = 'auto';
    start.volume = 0.7;
    startRef.current = start;

    const loop = new Audio(LOOP_SRC);
    loop.preload = 'auto';
    loop.loop = true;
    loop.volume = 0.55;
    loopRef.current = loop;

    const onStartEnded = () => {
      const mode = useGameStore.getState().retort.audioMode;
      const burning =
        useGameStore.getState().retort.phase === 'BURN' &&
        useGameStore.getState().retort.primaryOn;
      if (mode === 'START' && burning) {
        patchRetort({ audioMode: 'LOOP' });
      } else if (mode === 'START') {
        patchRetort({ audioMode: 'OFF' });
      }
    };
    start.addEventListener('ended', onStartEnded);

    return () => {
      start.removeEventListener('ended', onStartEnded);
      start.pause();
      loop.pause();
      start.src = '';
      loop.src = '';
      startRef.current = null;
      loopRef.current = null;
    };
  }, [patchRetort]);

  useEffect(() => {
    const start = startRef.current;
    const loop = loopRef.current;
    if (!start || !loop) return;

    const stopAll = () => {
      start.pause();
      start.currentTime = 0;
      loop.pause();
      loop.currentTime = 0;
    };

    if (audioMode === 'OFF' || phase === 'SWEEP' || phase === 'DONE') {
      stopAll();
      return;
    }

    if (audioMode === 'START') {
      loop.pause();
      void start.play().catch(() => undefined);
      return;
    }

    if (audioMode === 'LOOP') {
      start.pause();
      if (primaryOn && phase === 'BURN') {
        void loop.play().catch(() => undefined);
      } else {
        loop.pause();
      }
    }
  }, [audioMode, primaryOn, phase]);

  return null;
};
