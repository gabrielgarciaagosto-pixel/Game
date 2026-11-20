/** Replaced at build time by Vite. `master` is the Dungeon Master app. Anything else is the public player app. */
declare const __OSSUARIAN_ROLE__: 'player' | 'master';

interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY?: string;
  readonly VITE_FIREBASE_AUTH_DOMAIN?: string;
  readonly VITE_FIREBASE_PROJECT_ID?: string;
  readonly VITE_FIREBASE_APP_ID?: string;
  readonly VITE_PUBLIC_DEMO?: string;
}
