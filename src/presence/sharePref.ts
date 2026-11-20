const SHARE_KEY = 'ossuarian-share-play-count';
export const SHARE_PLAY_COUNT_EVENT = 'ossuarian-share-play-count';

/** On unless this install has explicitly turned the setting off. */
export function sharePlayCount(): boolean {
  try {
    return localStorage.getItem(SHARE_KEY) !== '0';
  } catch {
    return true;
  }
}

export function setSharePlayCount(on: boolean): void {
  try {
    localStorage.setItem(SHARE_KEY, on ? '1' : '0');
  } catch {
    /* the game still plays if storage is blocked */
  }
  window.dispatchEvent(new Event(SHARE_PLAY_COUNT_EVENT));
}
