import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import {
  audioManager,
  CROSSFADE_MS,
  isCrematoryBed,
  unlockGameAudio,
} from '../utils/audioManager';
import { isServiceBedId } from '../data/servicePlaylist';

/**
 * Crematory burn beds — always crossfade, never hard-cut:
 *   start sting → gapless run loop → fade on finish / leave room / chapel music
 *
 * Burn state (audioMode) stays LOOP while the retort runs even if the player
 * leaves the crematory; audible output only resumes when they return.
 */
export const CrematoryAudio: React.FC = () => {
  const audioMode = useGameStore((s) => s.retort.audioMode);
  const primaryOn = useGameStore((s) => s.retort.primaryOn);
  const phase = useGameStore((s) => s.retort.phase);
  const activeStation = useGameStore((s) => s.activeStation);
  const patchRetort = useGameStore((s) => s.patchRetort);
  const activeBedRef = useRef<'start' | 'loop' | 'off'>('off');

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

  // Start sting → loop handoff
  useEffect(() => {
    const onNearEnd = (id: string) => {
      if (id !== 'crematoryStart') return;
      const state = useGameStore.getState();
      const { audioMode: mode, primaryOn: on, phase: p } = state.retort;
      const inCrematory = state.activeStation === 'CREMATION';
      if (mode === 'START' && on && p !== 'SWEEP' && p !== 'DONE') {
        patchRetort({ audioMode: 'LOOP' });
        if (inCrematory && !isServiceBedId(audioManager.getCurrentId())) {
          activeBedRef.current = 'loop';
          void audioManager.crossfadeTo('crematoryLoop', {
            loop: true,
            durationMs: CROSSFADE_MS,
          });
        } else {
          // Left the room or chapel music owns the bus — keep mode, stay silent
          activeBedRef.current = 'off';
        }
      } else if (mode === 'START') {
        activeBedRef.current = 'off';
        void audioManager.fadeOut(CROSSFADE_MS);
        patchRetort({ audioMode: 'OFF' });
      }
    };
    audioManager.addOneShotNearEndHandler(onNearEnd);
    return () => audioManager.removeOneShotNearEndHandler(onNearEnd);
  }, [patchRetort]);

  useEffect(() => {
    const burnEnded =
      audioMode === 'OFF' ||
      phase === 'SWEEP' ||
      phase === 'DONE' ||
      !primaryOn;
    const inCrematory = activeStation === 'CREMATION';
    const chapelMusicOwns = isServiceBedId(audioManager.getCurrentId());

    // Burn finished — fade crematory beds only, then clear mode.
    // Never fadeOut while a chapel service bed owns the bus (MenuThemeAudio
    // used to clobber service music when audioMode flipped to OFF).
    if (burnEnded) {
      const currentId = audioManager.getCurrentId();
      if (
        !isServiceBedId(currentId) &&
        (activeBedRef.current !== 'off' || isCrematoryBed(currentId))
      ) {
        activeBedRef.current = 'off';
        void audioManager.fadeOut(CROSSFADE_MS);
      } else {
        activeBedRef.current = 'off';
      }
      if (audioMode !== 'OFF' && (phase === 'SWEEP' || phase === 'DONE' || !primaryOn)) {
        patchRetort({ audioMode: 'OFF' });
      }
      return;
    }

    // Left crematory or chapel service music is playing — fade out, keep audioMode
    if (!inCrematory || chapelMusicOwns) {
      if (activeBedRef.current !== 'off') {
        activeBedRef.current = 'off';
        void audioManager.fadeOut(CROSSFADE_MS);
      }
      return;
    }

    // In crematory with an active burn — fade beds back in
    if (audioMode === 'START') {
      if (activeBedRef.current === 'start') return;
      activeBedRef.current = 'start';
      void audioManager.crossfadeTo('crematoryStart', {
        loop: false,
        durationMs: Math.min(400, CROSSFADE_MS),
      });
      return;
    }

    if (audioMode === 'LOOP') {
      if (activeBedRef.current === 'loop') return;
      activeBedRef.current = 'loop';
      void audioManager.crossfadeTo('crematoryLoop', {
        loop: true,
        durationMs: CROSSFADE_MS,
      });
    }
  }, [audioMode, primaryOn, phase, activeStation, patchRetort]);

  useEffect(() => {
    return () => {
      if (activeBedRef.current !== 'off') {
        audioManager.stopImmediate();
        activeBedRef.current = 'off';
      }
    };
  }, []);

  // Dev mute clears the bus while activeBedRef still says "playing" — re-assert.
  useEffect(() => {
    const onUnmute = () => {
      const state = useGameStore.getState();
      if (state.activeStation !== 'CREMATION') return;
      if (isServiceBedId(audioManager.getCurrentId())) return;
      const mode = state.retort.audioMode;
      if (mode !== 'START' && mode !== 'LOOP') return;
      activeBedRef.current = 'off';
      if (mode === 'START') {
        activeBedRef.current = 'start';
        void audioManager.crossfadeTo('crematoryStart', {
          loop: false,
          durationMs: Math.min(400, CROSSFADE_MS),
        });
      } else {
        activeBedRef.current = 'loop';
        void audioManager.crossfadeTo('crematoryLoop', {
          loop: true,
          durationMs: CROSSFADE_MS,
        });
      }
    };
    audioManager.addUnmuteHandler(onUnmute);
    return () => audioManager.removeUnmuteHandler(onUnmute);
  }, []);

  return null;
};
