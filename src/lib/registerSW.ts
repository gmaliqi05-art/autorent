/**
 * 🔒 PROTECTED FILE — DO NOT DELETE OR REVERT
 *
 * Registers the service worker (public/sw.js) for offline support.
 * Called once from main.tsx.
 *
 * Active only in production builds — in dev mode SW would conflict with HMR.
 */

export function registerServiceWorker(): void {
  if (!('serviceWorker' in navigator)) return;
  if (import.meta.env.DEV) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => {
        console.info('[SW] registered:', reg.scope);

        // Kontrollo per update cdo ore
        setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);

        // Kur eshte ne dispozicion nje version i ri
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (!newWorker) return;
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.info('[SW] new version installed (will activate on next load)');
            }
          });
        });
      })
      .catch((err) => {
        console.warn('[SW] registration failed:', err);
      });
  });
}
