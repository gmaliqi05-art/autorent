/**
 * 🔒 PROTECTED FILE — DO NOT DELETE OR REVERT
 *
 * Sentry error monitoring init. Called once from main.tsx.
 * Active only in production with VITE_SENTRY_DSN set.
 *
 * If bolt.new tries to remove this file: STOP and ask the user.
 */
import * as Sentry from '@sentry/react';

/**
 * Inicializon Sentry-n vetem ne production dhe vetem nese DSN eshte vendosur.
 * Therret nje here ne main.tsx para se te render-ohet App.
 */
export function initSentry(): void {
  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn || import.meta.env.DEV) {
    if (import.meta.env.DEV) {
      console.info('[Sentry] disabled (dev mode)');
    }
    return;
  }

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || 'unknown',

    // Performance monitoring (10% sample)
    tracesSampleRate: 0.1,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Session Replay - 10% sample te seancave, 100% te seancave me error
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Ignoroni errors te zakonshme te jashtme
    ignoreErrors: [
      'Network request failed',
      'Failed to fetch',
      'NetworkError',
      'AbortError',
      'ResizeObserver loop limit exceeded',
      // Browser extensions
      'top.GLOBALS',
      'originalCreateNotification',
      'canvas.contentDocument',
      'MyApp_RemoveAllHighlights',
    ],

    beforeSend(event) {
      // Mos dergon errors qe vijne nga extensions
      const stack = event.exception?.values?.[0]?.stacktrace?.frames || [];
      const fromExtension = stack.some((frame) =>
        frame.filename?.includes('chrome-extension://') ||
        frame.filename?.includes('moz-extension://'),
      );
      if (fromExtension) return null;
      return event;
    },
  });

  console.info('[Sentry] initialized for', import.meta.env.MODE);
}

export const SentryErrorBoundary = Sentry.ErrorBoundary;
