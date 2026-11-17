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
    LocalNotifications: {
      smallIcon: 'ic_stat_ossuarian',
      iconColor: '#c4a574',
    },
    SystemBars: {
      // Native padding here plus our CSS floor double-counts the status bar.
      // MainActivity publishes the real insets as --safe-area-inset-*.
      insetsHandling: 'disable',
      style: 'DARK',
      hidden: false,
    },
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
