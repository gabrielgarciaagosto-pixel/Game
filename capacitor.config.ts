import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.deathismybusiness.game',
  appName: 'Ossuarian: First Urn',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#0f172a',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
    },
    SystemBars: {
      insetsHandling: 'css',
      style: 'DARK',
      hidden: false,
    },
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
