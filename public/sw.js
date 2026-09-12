const CACHE_NAME = 'horizon-cache-v2.1.36';
const ASSETS_TO_CACHE = [
  '/manifest.json',
  '/favicon.png',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/horizon_header_1.png',
  '/horizon_header_2.png',
  '/horizon_footer_1.png',
  '/horizon_footer_2.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[SW] Purging outdated cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data && (event.data.type === 'PURGE_CACHE' || event.data.type === 'SKIP_WAITING')) {
    self.skipWaiting();
    caches.keys().then((names) => {
      return Promise.all(names.map((name) => caches.delete(name)));
    });
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Never cache API or dynamic requests
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // Navigation requests (HTML pages) MUST be Network-First to prevent stale chunk lockouts
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => cached || caches.match('/index.html'));
        })
    );
    return;
  }

  // Pure static images & icons can use Cache First with network fallback
  const isStaticImage = /\.(png|jpg|jpeg|svg|webp|ico)$/i.test(url.pathname);
  if (isStaticImage) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        }).catch(() => {
          return new Response('', { status: 404, statusText: 'Not Found' });
        });
      })
    );
    return;
  }

  // All scripts, stylesheets, and data are Network-First to guarantee fresh application updates
  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
