const CACHE_NAME = 'arcflash-pwa-cache-v6';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.json',
  './service-worker.js',
  './pdfs/arc-flash-guide.pdf'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(
        ASSETS_TO_CACHE.map(async asset => {
          try {
            await cache.add(asset);
          } catch (error) {
            console.warn('Service worker failed to cache', asset, error);
          }
        })
      )
    )
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);
  const isPdfRequest = requestUrl.pathname.endsWith('/pdfs/arc-flash-guide.pdf');
  const isSameOrigin = requestUrl.origin === self.location.origin;

  if (event.request.method !== 'GET') {
    return;
  }

  if (isPdfRequest && isSameOrigin) {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse =>
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          })
        )
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then(networkResponse => {
        return caches.open(CACHE_NAME).then(cache => {
          if (event.request.url.startsWith(self.location.origin)) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      });
    }).catch(() => caches.match('./index.html'))
  );
});
