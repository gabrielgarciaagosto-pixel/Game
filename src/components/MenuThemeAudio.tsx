import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import {
  audioManager,
  CROSSFADE_MS,
  isCrematoryBed,
  unlockGameAudio,
} from '../utils/audioManager';
import { isServiceBedId } from '../data/servicePlaylist';
import {
  isMenuBedId,
  isMenuOrThemeBedId,
  loadMenuPlaylist,
  menuBedId,
  pickRandomMenuTrackId,
  type MenuPlaylistManifest,
} from '../data/menuPlaylist';

/**
 * Title + main-hub BGM (Gabriel menu playlist).
 * Random track on menu open; on end, another random (avoid immediate repeat).
 * Crossfades out when entering gameplay rooms; respects mute/unmute.
 */
export const MenuThemeAudio: React.FC = () => {
  const hasStartedGame = useGameStore((s) => s.hasStartedGame);
  const activeStation = useGameStore((s) => s.activeStation);
  const audioMode = useGameStore((s) => s.retort.audioMode);

  const manifestRef = useRef<MenuPlaylistManifest | null>(null);
  const currentTrackRef = useRef<string | null>(null);
  const playingRef = useRef(false);
  /** Bumps when leaving menu so in-flight crossfades don't re-assert. */
  const genRef = useRef(0);

  const menuActive =
    (!hasStartedGame || activeStation === 'OVERVIEW') &&
    audioMode !== 'START' &&
    audioMode !== 'LOOP';
  const menuActiveRef = useRef(menuActive);
  menuActiveRef.current = menuActive;

  const playTrack = async (trackId: string, fadeMs: number) => {
    const manifest = manifestRef.current;
    if (!manifest) return;
    const track = manifest.tracks.find((t) => t.id === trackId);
    if (!track) return;
    currentTrackRef.current = trackId;
    playingRef.current = true;
    await audioManager.crossfadeTo(menuBedId(trackId), {
      url: track.file,
      loop: false,
      volume: manifest.volume,
      durationMs: fadeMs,
    });
  };

  const startRandom = async (fadeMs: number, avoid: string | null = null) => {
    const manifest = await loadMenuPlaylist();
    manifestRef.current = manifest;
    const next = pickRandomMenuTrackId(manifest, avoid);
    if (!next) return;
    await playTrack(next, fadeMs);
  };

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
    const onNearEnd = (id: string) => {
      if (!isMenuBedId(id)) return;
      if (!playingRef.current || !manifestRef.current) return;
      if (!menuActiveRef.current) return;
      const avoid = currentTrackRef.current;
      void startRandom(
        manifestRef.current.crossfadeMs ?? CROSSFADE_MS,
        avoid
      );
    };
    audioManager.addOneShotNearEndHandler(onNearEnd);
    return () => audioManager.removeOneShotNearEndHandler(onNearEnd);
  }, []);

  useEffect(() => {
    const onUnmute = () => {
      if (!menuActiveRef.current) return;
      playingRef.current = false;
      void startRandom(
        manifestRef.current?.crossfadeMs ?? CROSSFADE_MS,
        currentTrackRef.current
      );
    };
    audioManager.addUnmuteHandler(onUnmute);
    return () => audioManager.removeUnmuteHandler(onUnmute);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const gen = ++genRef.current;
    const fadeMs = manifestRef.current?.crossfadeMs ?? CROSSFADE_MS;

    const run = async () => {
      if (!menuActive) {
        if (playingRef.current || isMenuOrThemeBedId(audioManager.getCurrentId())) {
          playingRef.current = false;
          // Leave chapel / crematory beds alone — only fade our own beds.
          const id = audioManager.getCurrentId();
          if (id == null || isMenuOrThemeBedId(id)) {
            await audioManager.fadeOut(fadeMs);
          }
        }
        return;
      }

      // Already on a menu bed (e.g. splash → hub) — keep playing.
      if (
        playingRef.current &&
        isMenuBedId(audioManager.getCurrentId())
      ) {
        return;
      }

      // Don't clobber chapel / crematory if somehow active.
      const current = audioManager.getCurrentId();
      if (isServiceBedId(current) || isCrematoryBed(current)) {
        return;
      }

      await startRandom(fadeMs, null);
      if (cancelled || gen !== genRef.current) return;
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [menuActive]);

  return null;
};
