/**
 * 🔒 PROTECTED FILE — DO NOT DELETE OR REVERT
 *
 * Konfigurim Capacitor per packaging si app native (Android + iOS).
 *
 * webDir = './dist' (output i Vite build)
 *
 * Per te ndertuar nje APK te Android Studio ose IPA te Xcode:
 *   1. npm run build              -> krijon ./dist
 *   2. npx cap sync               -> kopjon ./dist tek android/app/src/main/assets
 *                                    dhe ios/App/App/public
 *   3. npx cap open android       -> hap Android Studio
 *   4. npx cap open ios           -> hap Xcode (vetem Mac)
 *
 * Shih BOLT_NOTES.md per udhezime te plote.
 */
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.rentcars.life',
  appName: 'RentaKar',
  webDir: 'dist',

  // Server config — kur te zhvilloni, mund t'i tregoni te perdori URL-n e dev server
  // (komentuar ne production)
  // server: {
  //   url: 'http://localhost:5173',
  //   cleartext: true,
  // },

  // Backend URL i platforms (perdoret nga deeplinks dhe email confirmations)
  // server: {
  //   hostname: 'rentcars.life',
  //   androidScheme: 'https',
  // },

  // Default settings per UI native
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#ffffff',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: false,
      splashImmersive: false,
    },
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#0066ff',
    },
  },

  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },

  ios: {
    contentInset: 'always',
    scrollEnabled: true,
    backgroundColor: '#ffffff',
  },
};

export default config;
