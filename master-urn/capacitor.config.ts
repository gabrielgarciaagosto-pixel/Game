import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.deathismybusiness.masterurn',
  appName: 'Master Urn',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#0c0a09',
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
