import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { sentryVitePlugin } from '@sentry/vite-plugin';

// Sentry vite plugin aktivizohet vetem nese keto env vars jane set:
//   SENTRY_AUTH_TOKEN (organization auth token; vendos ne CI secrets)
//   SENTRY_ORG
//   SENTRY_PROJECT
// Pa keto, source maps gjenerohen lokalisht por nuk ngarkohen.
const sentryEnabled = !!(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_ORG && process.env.SENTRY_PROJECT);

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    ...(sentryEnabled
      ? [
          sentryVitePlugin({
            org: process.env.SENTRY_ORG,
            project: process.env.SENTRY_PROJECT,
            authToken: process.env.SENTRY_AUTH_TOKEN,
            release: { name: process.env.VITE_APP_VERSION || process.env.GITHUB_SHA },
            sourcemaps: { assets: './dist/**' },
            telemetry: false,
          }),
        ]
      : []),
  ],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    chunkSizeWarningLimit: 600,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React + React-Router (used everywhere)
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/react-router/') ||
              id.includes('node_modules/scheduler/')) {
            return 'vendor-react';
          }
          // Supabase
          if (id.includes('node_modules/@supabase/')) {
            return 'vendor-supabase';
          }
          // i18n
          if (id.includes('node_modules/i18next') ||
              id.includes('node_modules/react-i18next')) {
            return 'vendor-i18n';
          }
          // Sentry — already lazy-effect-y, but isolate it
          if (id.includes('node_modules/@sentry/')) {
            return 'vendor-sentry';
          }
          // Leaflet (used only in map pages — already lazy in build)
          if (id.includes('node_modules/leaflet') ||
              id.includes('node_modules/react-leaflet')) {
            return 'vendor-maps';
          }
          // date-fns
          if (id.includes('node_modules/date-fns')) {
            return 'vendor-date';
          }
          // Helmet
          if (id.includes('node_modules/react-helmet-async')) {
            return 'vendor-helmet';
          }
          return undefined;
        },
      },
    },
  },
});
