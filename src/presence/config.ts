export interface FirebasePublicConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

/**
 * Public web config only. Fill the Vite env keys after the Firebase project exists.
 * Empty values turn the ping off. There is no admin secret here.
 */
export function readFirebaseConfig(): FirebasePublicConfig {
  return {
    apiKey: clean(import.meta.env.VITE_FIREBASE_API_KEY),
    authDomain: clean(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
    projectId: clean(import.meta.env.VITE_FIREBASE_PROJECT_ID),
    appId: clean(import.meta.env.VITE_FIREBASE_APP_ID),
  };
}

export function firebaseReady(config: FirebasePublicConfig = readFirebaseConfig()): boolean {
  return Boolean(config.apiKey && config.projectId && config.appId);
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
