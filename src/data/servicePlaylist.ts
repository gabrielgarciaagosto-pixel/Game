/**
 * Chapel service playlist — loaded from /audio/services/manifest.json.
 * Gabriel can drop tracks in public/audio/services/ without code changes.
 */

export type ServicePlaybackMode = 'shuffle' | 'sequence';

export interface ServiceTrackManifest {
  id: string;
  /** Absolute `/audio/...` or filename relative to /audio/services/ */
  file: string;
  title?: string;
}

export interface ServicePlaylistManifest {
  version: number;
  playback: ServicePlaybackMode;
  volume: number;
  crossfadeMs: number;
  tracks: ServiceTrackManifest[];
}

export const SERVICE_MANIFEST_URL = '/audio/services/manifest.json';

const DEFAULT_MANIFEST: ServicePlaylistManifest = {
  version: 1,
  playback: 'sequence',
  volume: 0.26,
  crossfadeMs: 1400,
  tracks: [
    {
      id: 'chapel-service-1',
      file: '/audio/services/chapel-service-1.m4a',
      title: 'Chapel Service I',
    },
    {
      id: 'chapel-service-2',
      file: '/audio/services/chapel-service-2.m4a',
      title: 'Chapel Service II',
    },
  ],
};

function resolveTrackUrl(file: string): string {
  if (file.startsWith('/')) return file;
  if (file.startsWith('http://') || file.startsWith('https://')) return file;
  return `/audio/services/${file.replace(/^\.\//, '')}`;
}

export function serviceBedId(trackId: string): string {
  return `service:${trackId}`;
}

export function isServiceBedId(id: string | null | undefined): boolean {
  return typeof id === 'string' && id.startsWith('service:');
}

let cached: ServicePlaylistManifest | null = null;
let loadPromise: Promise<ServicePlaylistManifest> | null = null;

export async function loadServicePlaylist(): Promise<ServicePlaylistManifest> {
  if (cached) return cached;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const res = await fetch(SERVICE_MANIFEST_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`manifest ${res.status}`);
      const raw = (await res.json()) as Partial<ServicePlaylistManifest>;
      const tracks = (raw.tracks ?? [])
        .filter((t) => t && typeof t.id === 'string' && typeof t.file === 'string')
        .map((t) => ({
          id: t.id,
          file: resolveTrackUrl(t.file),
          title: t.title,
        }));
      cached = {
        version: raw.version ?? 1,
        playback: raw.playback === 'sequence' ? 'sequence' : 'shuffle',
        volume: typeof raw.volume === 'number' ? raw.volume : 0.26,
        crossfadeMs:
          typeof raw.crossfadeMs === 'number' ? raw.crossfadeMs : 1400,
        tracks: tracks.length > 0 ? tracks : DEFAULT_MANIFEST.tracks,
      };
      return cached;
    } catch {
      cached = DEFAULT_MANIFEST;
      return cached;
    } finally {
      loadPromise = null;
    }
  })();

  return loadPromise;
}

/** Build a play order (fresh shuffle or sequence copy). */
export function buildPlayOrder(manifest: ServicePlaylistManifest): string[] {
  const ids = manifest.tracks.map((t) => t.id);
  if (manifest.playback !== 'shuffle' || ids.length <= 1) return [...ids];
  const order = [...ids];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}
