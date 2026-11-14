import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import {
  audioManager,
  CROSSFADE_MS,
  unlockGameAudio,
} from '../utils/audioManager';
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
 * Soft service playlist in Chapel during viewing / Ossuary Memorial.
 * Crossfades between tracks; fades out on leave; replaces crematory beds
 * so burn audio and chapel music never clash.
 */
export const ServiceMusicAudio: React.FC = () => {
  const activeStation = useGameStore((s) => s.activeStation);
  const cases = useGameStore((s) => s.cases);
  const activeCaseId = useGameStore((s) => s.activeCaseId);

  const manifestRef = useRef<ServicePlaylistManifest | null>(null);
  const orderRef = useRef<string[]>([]);
  const indexRef = useRef(0);
  const playingRef = useRef(false);

  const chapelCase =
    cases.find((c) => c.id === activeCaseId && c.location === 'CHAPEL') ??
    cases.find((c) => c.location === 'CHAPEL');

  const serviceActive =
    activeStation === 'SHOWROOM' &&
    chapelCase != null &&
    isViewingService(chapelCase.directive);

  useEffect(() => {
    const unlock = () => {
      void unlockGameAudio();
    };
    window.addEventListener('pointerdown', unlock, { once: true, passive: true });
    return () => window.removeEventListener('pointerdown', unlock);
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
    let cancelled = false;

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

      const manifest = await loadServicePlaylist();
      if (cancelled) return;
      manifestRef.current = manifest;
      if (orderRef.current.length === 0) {
        orderRef.current = buildPlayOrder(manifest);
        indexRef.current = 0;
      }

      await playIndex(
        indexRef.current,
        manifest.crossfadeMs ?? CROSSFADE_MS
      );
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [serviceActive]);

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
