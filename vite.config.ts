import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    chunkSizeWarningLimit: 600,
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
