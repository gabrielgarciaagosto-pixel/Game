import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import { audioManager, CROSSFADE_MS, unlockGameAudio } from '../utils/audioManager';

/**
 * Crematory music — priority seamless chain (Gabriel's audible cutoff):
 *   start sting  →  (crossfade)  →  gapless run loop  →  (fade out)  →  sweep/complete
 *
 * Uses decoded Web Audio buffers so Android WebView gets:
 * - overlapping GainNode crossfade from start → loop (no hard cut)
 * - AudioBufferSourceNode.loop for a sample-accurate run bed
 * - fade-out into sweep / done instead of pause()
 */
export const CrematoryAudio: React.FC = () => {
  const audioMode = useGameStore((s) => s.retort.audioMode);
  const primaryOn = useGameStore((s) => s.retort.primaryOn);
  const phase = useGameStore((s) => s.retort.phase);
  const patchRetort = useGameStore((s) => s.patchRetort);
  /** Last bed we asked the manager to play — avoids restarting on re-renders. */
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

  // Start sting → loop: fire CROSSFADE_MS before the sting ends
  useEffect(() => {
    audioManager.setOneShotNearEndHandler((id) => {
      if (id !== 'crematoryStart') return;
      const { audioMode: mode, primaryOn: on, phase: p } =
        useGameStore.getState().retort;
      if (mode === 'START' && on && p !== 'SWEEP' && p !== 'DONE') {
        activeBedRef.current = 'loop';
        void audioManager.crossfadeTo('crematoryLoop', {
          loop: true,
          durationMs: CROSSFADE_MS,
        });
        patchRetort({ audioMode: 'LOOP' });
      } else if (mode === 'START') {
        activeBedRef.current = 'off';
        void audioManager.fadeOut(CROSSFADE_MS);
        patchRetort({ audioMode: 'OFF' });
      }
    });
    return () => {
      audioManager.setOneShotNearEndHandler(null);
    };
  }, [patchRetort]);

  useEffect(() => {
    const shouldSilence =
      audioMode === 'OFF' ||
      phase === 'SWEEP' ||
      phase === 'DONE' ||
      !primaryOn;

    if (shouldSilence) {
      if (activeBedRef.current !== 'off') {
        activeBedRef.current = 'off';
        void audioManager.fadeOut(CROSSFADE_MS);
      }
      if (audioMode !== 'OFF') {
        patchRetort({ audioMode: 'OFF' });
      }
      return;
    }

    if (audioMode === 'START') {
      if (activeBedRef.current === 'start') return;
      activeBedRef.current = 'start';
      // Short fade-in so theme→start also softens; keep shorter than handoff
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
  }, [audioMode, primaryOn, phase, patchRetort]);

  useEffect(() => {
    return () => {
      // Only tear down if we still own the bus (don't kill theme on hot reload oddities)
      if (activeBedRef.current !== 'off') {
        audioManager.stopImmediate();
        activeBedRef.current = 'off';
      }
    };
  }, []);

  return null;
};
