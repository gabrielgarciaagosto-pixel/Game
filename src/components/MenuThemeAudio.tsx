import React, { useEffect, useRef } from 'react';
import { freshThemeDue, markFreshThemePlayed } from '../utils/bootSave';
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

/** Room duck: about a third of the playlist level, within a short fade. */
const ROOM_DUCK = 0.35;
const DUCK_FADE_MS = 750;

/**
 * Title + main-hub BGM (Gabriel menu playlist).
 * A launch with no save starts on the Ossuarian theme, once, then joins
 * the menu rotation. A launch that already has a save starts on a random
 * menu track. On end, another random (avoid immediate repeat).
 * Stays playing in every room except the chapel, ducked to about 35%.
 * Chapel keeps the service playlist. Mute and the playlist volume still apply.
 * SFX never go through this bed.
 *
 * Generation tokens cancel in-flight starts so leaving for the chapel
 * cannot resurrect a menu bed over service music.
 */
export const MenuThemeAudio: React.FC = () => {
  const hasStartedGame = useGameStore((s) => s.hasStartedGame);
  const titleGate = useGameStore((s) => s.titleGate);
  const activeStation = useGameStore((s) => s.activeStation);

  const manifestRef = useRef<MenuPlaylistManifest | null>(null);
  const currentTrackRef = useRef<string | null>(null);
  const playingRef = useRef(false);
  /** Bumps on leave / remount so in-flight crossfades abort. */
  const genRef = useRef(0);
  /** Monotonic token so a stale playTrack never fades a newer menu start. */
  const playTokenRef = useRef(0);

  const inPlay = hasStartedGame && !titleGate;
  const chapelOwns = inPlay && activeStation === 'SHOWROOM';
  const atHub = !inPlay || activeStation === 'OVERVIEW';
  const menuShouldPlay = !chapelOwns;
  const gainScale = atHub ? 1 : ROOM_DUCK;
  const menuShouldPlayRef = useRef(menuShouldPlay);
  menuShouldPlayRef.current = menuShouldPlay;
  const gainScaleRef = useRef(gainScale);
  gainScaleRef.current = gainScale;

  const isStale = (gen: number) =>
    gen !== genRef.current || !menuShouldPlayRef.current;

  const playTrack = async (trackId: string, fadeMs: number, gen: number) => {
    if (isStale(gen)) return;
    const manifest = manifestRef.current;
    if (!manifest) return;
    const track = manifest.tracks.find((t) => t.id === trackId);
    if (!track) return;

    const bedId = menuBedId(trackId);
    const token = ++playTokenRef.current;
    currentTrackRef.current = trackId;
    playingRef.current = true;
    await audioManager.crossfadeTo(bedId, {
      url: track.file,
      loop: false,
      volume: manifest.volume * gainScaleRef.current,
      durationMs: fadeMs,
    });

    // Leave / Reset raced this crossfade — only tear down if we still own
    // the latest play token (a newer start must not be silenced).
    if (token !== playTokenRef.current) return;
    if (isStale(gen) && audioManager.getCurrentId() === bedId) {
      playingRef.current = false;
      void audioManager.fadeOut(fadeMs);
    }
  };

  const playTheme = async (fadeMs: number, gen: number) => {
    if (isStale(gen)) return;
    const manifest = manifestRef.current;
    if (!manifest) return;
    const token = ++playTokenRef.current;
    currentTrackRef.current = null;
    playingRef.current = true;
    await audioManager.crossfadeTo('theme', {
      loop: false,
      volume: manifest.volume * gainScaleRef.current,
      durationMs: fadeMs,
    });
    if (token !== playTokenRef.current) return;
    if (isStale(gen) && audioManager.getCurrentId() === 'theme') {
      playingRef.current = false;
      void audioManager.fadeOut(fadeMs);
    }
  };

  const startRandom = async (
    fadeMs: number,
    avoid: string | null,
    gen: number,
    mode: 'open' | 'handoff' | 'unmute'
  ) => {
    const manifest = await loadMenuPlaylist();
    if (isStale(gen)) return;
    manifestRef.current = manifest;
    // Near-end always advances. A stuck opener flag must not replay Ossuarian.
    if (mode === 'handoff') {
      if (freshThemeDue()) markFreshThemePlayed();
    } else if (audioManager.bedIsCurrent('theme')) {
      // StrictMode remounts the opener. Don't replace Ossuarian with a random track.
      playingRef.current = true;
      if (freshThemeDue()) markFreshThemePlayed();
      return;
    } else if (freshThemeDue()) {
      await playTheme(fadeMs, gen);
      // A blocked fallback play() leaves currentId null, but the theme element
      // still owns the bed. Marking here is what lets the near-end rotate.
      if (!isStale(gen) && audioManager.bedIsCurrent('theme')) {
        markFreshThemePlayed();
      }
      return;
    }
    const next = pickRandomMenuTrackId(manifest, avoid);
    if (!next) return;
    await playTrack(next, fadeMs, gen);
  };

  useEffect(() => {
    audioManager.installGestureUnlock();
    void unlockGameAudio();
  }, []);

  useEffect(() => {
    const onNearEnd = (id: string) => {
      if (id !== 'theme' && !isMenuBedId(id)) return;
      if (!playingRef.current || !manifestRef.current) return;
      if (!menuShouldPlayRef.current) return;
      const gen = genRef.current;
      void startRandom(
        manifestRef.current.crossfadeMs ?? CROSSFADE_MS,
        currentTrackRef.current,
        gen,
        'handoff'
      );
    };
    audioManager.addOneShotNearEndHandler(onNearEnd);
    return () => audioManager.removeOneShotNearEndHandler(onNearEnd);
  }, []);

  useEffect(() => {
    const onUnmute = () => {
      if (!menuShouldPlayRef.current) return;
      playingRef.current = false;
      const gen = genRef.current;
      void startRandom(
        manifestRef.current?.crossfadeMs ?? CROSSFADE_MS,
        currentTrackRef.current,
        gen,
        'unmute'
      );
    };
    audioManager.addUnmuteHandler(onUnmute);
    return () => audioManager.removeUnmuteHandler(onUnmute);
  }, []);

  useEffect(() => {
    const chapelFade = manifestRef.current?.crossfadeMs ?? CROSSFADE_MS;

    if (!menuShouldPlay) {
      // Chapel owns the bus. Let the service playlist crossfade in.
      genRef.current += 1;
      if (playingRef.current || isMenuOrThemeBedId(audioManager.getCurrentId())) {
        playingRef.current = false;
        const id = audioManager.getCurrentId();
        if (id == null || isMenuOrThemeBedId(id)) {
          void audioManager.fadeOut(chapelFade);
        }
      }
      return;
    }

    const manifestVol = manifestRef.current?.volume ?? 0.42;
    const target = manifestVol * gainScale;

    // Same clip, new level: hub is full, every other non-chapel room is ducked.
    if (playingRef.current && isMenuOrThemeBedId(audioManager.getCurrentId())) {
      audioManager.setCurrentVolume(target, DUCK_FADE_MS);
      return;
    }

    // Hub / title owns the bus: crossfade over leftover chapel/crematory beds
    // so returning from Chapel is never stuck silent.
    const gen = ++genRef.current;
    void startRandom(atHub ? chapelFade : DUCK_FADE_MS, null, gen, 'open');
  }, [menuShouldPlay, gainScale, atHub]);

  return null;
};
