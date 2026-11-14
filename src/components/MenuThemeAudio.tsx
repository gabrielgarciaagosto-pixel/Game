import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import {
  audioManager,
  CROSSFADE_MS,
  unlockGameAudio,
} from '../utils/audioManager';
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
 *
 * Generation tokens cancel in-flight starts so leaving hub / Reset Game cannot
 * resurrect a menu bed inside Cooler / Chapel / Crematory.
 */
export const MenuThemeAudio: React.FC = () => {
  const hasStartedGame = useGameStore((s) => s.hasStartedGame);
  const activeStation = useGameStore((s) => s.activeStation);
  const audioMode = useGameStore((s) => s.retort.audioMode);

  const manifestRef = useRef<MenuPlaylistManifest | null>(null);
  const currentTrackRef = useRef<string | null>(null);
  const playingRef = useRef(false);
  /** Bumps on leave / remount so in-flight crossfades abort. */
  const genRef = useRef(0);

  const menuActive =
    (!hasStartedGame || activeStation === 'OVERVIEW') &&
    audioMode !== 'START' &&
    audioMode !== 'LOOP';
  const menuActiveRef = useRef(menuActive);
  menuActiveRef.current = menuActive;

  const isStale = (gen: number) =>
    gen !== genRef.current || !menuActiveRef.current;

  const playTrack = async (trackId: string, fadeMs: number, gen: number) => {
    if (isStale(gen)) return;
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

    // Leave / Reset raced the crossfade — pull menu back off the bus.
    if (isStale(gen) && isMenuBedId(audioManager.getCurrentId())) {
      playingRef.current = false;
      void audioManager.fadeOut(fadeMs);
    }
  };

  const startRandom = async (
    fadeMs: number,
    avoid: string | null,
    gen: number
  ) => {
    const manifest = await loadMenuPlaylist();
    if (isStale(gen)) return;
    manifestRef.current = manifest;
    const next = pickRandomMenuTrackId(manifest, avoid);
    if (!next) return;
    await playTrack(next, fadeMs, gen);
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
      const gen = genRef.current;
      void startRandom(
        manifestRef.current.crossfadeMs ?? CROSSFADE_MS,
        currentTrackRef.current,
        gen
      );
    };
    audioManager.addOneShotNearEndHandler(onNearEnd);
    return () => audioManager.removeOneShotNearEndHandler(onNearEnd);
  }, []);

  useEffect(() => {
    const onUnmute = () => {
      if (!menuActiveRef.current) return;
      playingRef.current = false;
      const gen = genRef.current;
      void startRandom(
        manifestRef.current?.crossfadeMs ?? CROSSFADE_MS,
        currentTrackRef.current,
        gen
      );
    };
    audioManager.addUnmuteHandler(onUnmute);
    return () => audioManager.removeUnmuteHandler(onUnmute);
  }, []);

  useEffect(() => {
    const fadeMs = manifestRef.current?.crossfadeMs ?? CROSSFADE_MS;

    if (!menuActive) {
      // Invalidate any in-flight startRandom / near-end handoff.
      genRef.current += 1;
      if (playingRef.current || isMenuOrThemeBedId(audioManager.getCurrentId())) {
        playingRef.current = false;
        const id = audioManager.getCurrentId();
        if (id == null || isMenuOrThemeBedId(id)) {
          void audioManager.fadeOut(fadeMs);
        }
      }
      return;
    }

    // Already on a menu bed (e.g. splash → hub) — keep playing.
    if (playingRef.current && isMenuBedId(audioManager.getCurrentId())) {
      return;
    }

    // Hub / title owns the bus: crossfade over leftover chapel/crematory beds
    // so returning from Chapel is never stuck silent.
    const gen = ++genRef.current;
    void startRandom(fadeMs, null, gen);
  }, [menuActive]);

  return null;
};
