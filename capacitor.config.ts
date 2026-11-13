import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.deathismybusiness.game',
  appName: 'Death is my Business',
  webDir: 'dist',
  android: {
    allowMixedContent: false,
    backgroundColor: '#0f172a',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
    },
  },
  server: {
    androidScheme: 'https',
  },
};

export default config;
