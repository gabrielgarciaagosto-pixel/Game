/** Kept outside the save. Erase save does not clear these. Only a reinstall or clear data does. */
export const FICTION_AGREED_KEY = 'ossuarian-fiction-agreed';
export const FICTION_REFUSED_KEY = 'ossuarian-fiction-refused';

export const AGREEMENT_BODY =
  'Everything in this game is fiction. No real names of the deceased are used and no real locations are used. Any name or detail that resembles a real person or place is purely coincidence. All information in the game is made up. The game will not ask for personal information, personal data, or location. Just have fun.';

export const AGREEMENT_ONLINE =
  'An internet connection is recommended to enhance the game, but it is not required. It works fully offline. Stats sync and Head Mortician gifts wait until the game is online.';

export const AGREEMENT_SURE = "We're sorry you couldn't agree. Are you sure?";

export const AGREEMENT_LEAVE = 'Understood. Please uninstall the game.';

export const SHARE_COUNT_LINE =
  'Sends an anonymous ping while the game is open, so the parlor can count players.';

export const SHARE_STATS_LINE =
  'The game also collects the name you chose and your parlor stats, anonymously. No personal info, no location, and no payment data.';

export type FictionChoice = 'agreed' | 'refused' | 'unknown';

export function readFictionChoice(): FictionChoice {
  try {
    if (localStorage.getItem(FICTION_REFUSED_KEY) === '1') return 'refused';
    if (localStorage.getItem(FICTION_AGREED_KEY) === '1') return 'agreed';
  } catch {
    /* storage blocked: show the agreement again */
  }
  return 'unknown';
}

export function writeFictionAgreement(): void {
  try {
    localStorage.setItem(FICTION_AGREED_KEY, '1');
    localStorage.removeItem(FICTION_REFUSED_KEY);
  } catch {
    /* the next open will ask again */
  }
}

export function writeFictionRefusal(): void {
  try {
    localStorage.setItem(FICTION_REFUSED_KEY, '1');
  } catch {
    /* the screen still closes; the next open asks again if this could not stick */
  }
}
