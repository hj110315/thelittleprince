const CACHE_NAME = 'celestial-planner-v1';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/hud.css',
  './js/app.js',
  './js/db.js',
  './js/store.js',
  './js/planetManager.js',
  './js/taskManager.js',
  './js/audioManager.js',
  './js/canvas/stage.js',
  './js/canvas/skyManager.js',
  './js/canvas/planetRenderer.js',
  './js/canvas/b612Renderer.js',
  './js/canvas/monoplane.js',
  'https://unpkg.com/dexie@3.2.4/dist/dexie.js',
  'https://unpkg.com/konva@9.2.0/konva.min.js',
  'https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Cormorant+Garamond:ital,wght@0,600;0,700;1,400&family=Nunito:ital,wght@0,400;0,600;0,700;1,400&family=Space+Mono:wght@400;700&display=swap'
];

// Install Event - Pre-cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Cache-first with Network Fallback
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return networkResponse;
      });
    })
  );
});
