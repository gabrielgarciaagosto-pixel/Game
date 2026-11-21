import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import {
  audioManager,
  CROSSFADE_MS,
} from '../utils/audioManager';
import { serviceTiming } from '../data/pacing';
import {
  SERVICE_MUSIC_NONE,
  serviceMusicIsTrack,
} from '../data/familyChapelPrefs';
import { useGameNow } from '../hooks/useGameNow';
import {
  buildPlayOrder,
  isServiceBedId,
  loadServicePlaylist,
  serviceBedId,
  type ServicePlaylistManifest,
} from '../data/servicePlaylist';

function isViewingService(directive: string): boolean {
  return (
    directive === 'BURIAL_VIEWING' ||
    directive === 'VIEWING_THEN_CREMATION' ||
    directive === 'CREMATION_THEN_VIEWING'
  );
}

/**
 * Soft service playlist while a chapel service is in progress.
 * Before that hour, and when No music is chosen, the chapel stays quiet.
 * Crossfades between tracks; fades out on leave; replaces crematory beds
 * so burn audio and chapel music never clash.
 */
export const ServiceMusicAudio: React.FC = () => {
  const activeStation = useGameStore((s) => s.activeStation);
  const titleGate = useGameStore((s) => s.titleGate);
  const cases = useGameStore((s) => s.cases);
  const activeCaseId = useGameStore((s) => s.activeCaseId);
  /** When retort flips OFF mid-service, re-assert the chapel bed. */
  const retortAudioMode = useGameStore((s) => s.retort.audioMode);

  const manifestRef = useRef<ServicePlaylistManifest | null>(null);
  const orderRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const playingRef = useRef(false);
  /** Tracks last preferredMusicId so clearing a pick restarts the default bed. */
  const lastPreferredRef = useRef<string | null | undefined>(undefined);

  const chapelLayouts = useGameStore((s) => s.chapelLayouts);

  const chapelCase =
    cases.find((c) => c.id === activeCaseId && c.location === 'CHAPEL') ??
    cases.find((c) => c.location === 'CHAPEL');

  const preferredMusicId =
    chapelCase != null
      ? chapelLayouts[chapelCase.id]?.serviceMusicId ?? null
      : null;

  const now = useGameNow(
    activeStation === 'SHOWROOM' && chapelCase?.serviceDateMs != null
  );
  const serviceLive =
    chapelCase != null &&
    serviceTiming(chapelCase.serviceDateMs ?? null, now) === 'grace';

  const serviceActive =
    !titleGate &&
    activeStation === 'SHOWROOM' &&
    chapelCase != null &&
    isViewingService(chapelCase.directive) &&
    serviceLive &&
    preferredMusicId !== SERVICE_MUSIC_NONE;

  useEffect(() => {
    audioManager.installGestureUnlock();
  }, []);

  const playIndex = async (i: number, fadeMs: number) => {
    const manifest = manifestRef.current;
    if (!manifest || orderRef.current.length === 0) return;
    const trackId = orderRef.current[i % orderRef.current.length];
    const track = manifest.tracks.find((t) => t.id === trackId);
    if (!track) return;
    indexRef.current = i % orderRef.current.length;
    const bedId = serviceBedId(track.id);
    const multi = orderRef.current.length > 1;
    playingRef.current = true;
    await audioManager.crossfadeTo(bedId, {
      url: track.file,
      loop: !multi,
      volume: manifest.volume,
      durationMs: fadeMs,
    });
  };

  useEffect(() => {
    const onNearEnd = (id: string) => {
      if (!isServiceBedId(id)) return;
      if (!playingRef.current || !manifestRef.current) return;
      if (orderRef.current.length <= 1) return;
      void playIndex(
        indexRef.current + 1,
        manifestRef.current.crossfadeMs ?? CROSSFADE_MS
      );
    };
    audioManager.addOneShotNearEndHandler(onNearEnd);
    return () => audioManager.removeOneShotNearEndHandler(onNearEnd);
  }, []);

  useEffect(() => {
    const onUnmute = () => {
      if (!serviceActive) return;
      // Force a fresh crossfade — mute cleared the bus while playingRef stayed true.
      playingRef.current = false;
      void playIndex(
        indexRef.current,
        manifestRef.current?.crossfadeMs ?? CROSSFADE_MS
      );
    };
    audioManager.addUnmuteHandler(onUnmute);
    return () => audioManager.removeUnmuteHandler(onUnmute);
  }, [serviceActive]);

  useEffect(() => {
    let cancelled = false;

    const ensurePlaying = async (fadeMs: number) => {
      const manifest = await loadServicePlaylist();
      if (cancelled) return;
      manifestRef.current = manifest;
      let forceRestart = false;
      const prevPreferred = lastPreferredRef.current;
      lastPreferredRef.current = preferredMusicId;
      // A named track leads. Playlist, or an untouched pick, uses the house order.
      if (serviceMusicIsTrack(preferredMusicId)) {
        const nextOrder = [
          preferredMusicId as string,
          ...manifest.tracks
            .map((t) => t.id)
            .filter((id) => id !== preferredMusicId),
        ];
        if (orderRef.current[0] !== preferredMusicId) {
          forceRestart = true;
        }
        orderRef.current = nextOrder;
        indexRef.current = 0;
      } else if (
        serviceMusicIsTrack(prevPreferred) ||
        (prevPreferred != null && preferredMusicId == null)
      ) {
        orderRef.current = buildPlayOrder(manifest);
        indexRef.current = 0;
        forceRestart = true;
      } else if (orderRef.current.length === 0) {
        orderRef.current = buildPlayOrder(manifest);
        indexRef.current = 0;
      }
      if (
        playingRef.current &&
        isServiceBedId(audioManager.getCurrentId()) &&
        !forceRestart
      ) {
        return;
      }
      await playIndex(indexRef.current, fadeMs);
    };

    const run = async () => {
      if (!serviceActive) {
        if (playingRef.current || isServiceBedId(audioManager.getCurrentId())) {
          playingRef.current = false;
          await audioManager.fadeOut(
            manifestRef.current?.crossfadeMs ?? CROSSFADE_MS
          );
        }
        return;
      }

      await ensurePlaying(manifestRef.current?.crossfadeMs ?? CROSSFADE_MS);
    };

    void run();
    return () => {
      cancelled = true;
    };
    // retortAudioMode: recover if burn-end / menu theme cleared the bus
  }, [serviceActive, retortAudioMode, preferredMusicId]);

  useEffect(() => {
    return () => {
      if (playingRef.current || isServiceBedId(audioManager.getCurrentId())) {
        playingRef.current = false;
        void audioManager.fadeOut(
          manifestRef.current?.crossfadeMs ?? CROSSFADE_MS
        );
      }
    };
  }, []);

  return null;
};
