/*
 * Service Worker per RentaKar
 *
 * Strategjia:
 *  - Static assets (JS/CSS me hash ne emer): cache-first me update ne background
 *  - HTML/navigation: network-first me fallback ne offline.html
 *  - Imazhe (CDN ekstern + Supabase Storage): stale-while-revalidate
 *  - API calls (Supabase REST/Auth): always network (NUK cache-ohen)
 */

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `rentakar-static-${CACHE_VERSION}`;
const IMAGES_CACHE = `rentakar-images-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
];

// === INSTALL ===
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(PRECACHE_URLS).catch((err) => {
        console.warn('[SW] precache failed:', err);
      })
    )
  );
  self.skipWaiting();
});

// === ACTIVATE ===
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !key.endsWith(CACHE_VERSION))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// === FETCH ===
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Mos cache-o Supabase API calls (REST/Auth/Realtime/Storage uploads)
  if (
    url.hostname.endsWith('.supabase.co') &&
    (url.pathname.startsWith('/rest/') ||
      url.pathname.startsWith('/auth/') ||
      url.pathname.startsWith('/realtime/') ||
      url.pathname.startsWith('/functions/'))
  ) {
    return; // default browser behavior, no caching
  }

  // Navigation requests → network first, fallback offline.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Update precache me HTML te ri ne background
          const responseClone = response.clone();
          caches.open(STATIC_CACHE).then((cache) => cache.put('/', responseClone));
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => cached || caches.match(OFFLINE_URL))
        )
    );
    return;
  }

  // Static assets (JS/CSS/fonts) — cache-first
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font'
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone));
            }
            return response;
          })
      )
    );
    return;
  }

  // Imazhe — stale-while-revalidate
  if (request.destination === 'image') {
    event.respondWith(
      caches.open(IMAGES_CACHE).then((cache) =>
        cache.match(request).then((cached) => {
          const fetchPromise = fetch(request)
            .then((response) => {
              if (response.ok && response.status === 200) {
                cache.put(request, response.clone());
              }
              return response;
            })
            .catch(() => cached);
          return cached || fetchPromise;
        })
      )
    );
    return;
  }
});

// === MESSAGES (per manual updates) ===
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
