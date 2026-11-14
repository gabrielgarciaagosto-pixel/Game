/**
 * Title / main-hub menu playlist — loaded from /audio/menu/manifest.json.
 * Drop extra tracks in public/audio/menu/ without code changes.
 */

export type MenuPlaybackMode = 'random';

export interface MenuTrackManifest {
  id: string;
  /** Absolute `/audio/...` or filename relative to /audio/menu/ */
  file: string;
  title?: string;
}

export interface MenuPlaylistManifest {
  version: number;
  playback: MenuPlaybackMode;
  volume: number;
  crossfadeMs: number;
  tracks: MenuTrackManifest[];
}

export const MENU_MANIFEST_URL = '/audio/menu/manifest.json';

const DEFAULT_MANIFEST: MenuPlaylistManifest = {
  version: 1,
  playback: 'random',
  volume: 0.42,
  crossfadeMs: 1400,
  tracks: [
    {
      id: 'menu-music-1',
      file: '/audio/menu/menu-music-1.m4a',
      title: 'Main Menu I',
    },
    {
      id: 'menu-music-2',
      file: '/audio/menu/menu-music-2.m4a',
      title: 'Main Menu II',
    },
  ],
};

function resolveTrackUrl(file: string): string {
  if (file.startsWith('/')) return file;
  if (file.startsWith('http://') || file.startsWith('https://')) return file;
  return `/audio/menu/${file.replace(/^\.\//, '')}`;
}

export function menuBedId(trackId: string): string {
  return `menu:${trackId}`;
}

export function isMenuBedId(id: string | null | undefined): boolean {
  return typeof id === 'string' && id.startsWith('menu:');
}

/** Also treat legacy splash theme as a menu bed for yield checks. */
export function isMenuOrThemeBedId(id: string | null | undefined): boolean {
  return id === 'theme' || isMenuBedId(id);
}

let cached: MenuPlaylistManifest | null = null;
let loadPromise: Promise<MenuPlaylistManifest> | null = null;

export async function loadMenuPlaylist(): Promise<MenuPlaylistManifest> {
  if (cached) return cached;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    try {
      const res = await fetch(MENU_MANIFEST_URL, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`manifest ${res.status}`);
      const raw = (await res.json()) as Partial<MenuPlaylistManifest>;
      const tracks = (raw.tracks ?? [])
        .filter((t) => t && typeof t.id === 'string' && typeof t.file === 'string')
        .map((t) => ({
          id: t.id,
          file: resolveTrackUrl(t.file),
          title: t.title,
        }));
      cached = {
        version: raw.version ?? 1,
        playback: 'random',
        volume: typeof raw.volume === 'number' ? raw.volume : 0.42,
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

/**
 * Pick a random track id. When `avoidId` is set and 2+ tracks exist,
 * never returns that id (no immediate repeat).
 */
export function pickRandomMenuTrackId(
  manifest: MenuPlaylistManifest,
  avoidId: string | null = null
): string | null {
  const ids = manifest.tracks.map((t) => t.id);
  if (ids.length === 0) return null;
  if (ids.length === 1) return ids[0];
  const pool = avoidId ? ids.filter((id) => id !== avoidId) : ids;
  const choices = pool.length > 0 ? pool : ids;
  return choices[Math.floor(Math.random() * choices.length)] ?? null;
}
