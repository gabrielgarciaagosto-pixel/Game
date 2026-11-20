/**
 * Player-facing build version. The title credit reads this.
 * Keep android/app/build.gradle versionName as `${GAME_VERSION}-demo`
 * and versionCode as VERSION_CODE. The update check compares VERSION_CODE
 * with version.json. See VERSION.md.
 */
export const GAME_VERSION = '0.9.84';

/** Installed Android versionCode. The web bundle cannot read the APK, so this must match build.gradle. */
export const VERSION_CODE = 102;

export const VERSION_NAME = `${GAME_VERSION}-demo`;

/**
 * Public feed. No token. Raw GitHub on the branch that holds the demo APKs.
 * A 404 or a dead network stays quiet. See VERSION.md when the branch changes.
 */
export const VERSION_FEED_URL =
  'https://raw.githubusercontent.com/gabrielgarciaagosto-pixel/Game/cursor/cooler-hub-inbox-c0e8/version.json';
