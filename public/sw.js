const CACHE_NAME = 'neet-analytics-v1';
const ASSETS = [
  '/dashboard',
  '/sign-in',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(() => {});
    })
  );
});

self.addEventListener('fetch', (e) => {
  // Serve from network, fallback to cache for offline capabilities
  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});
