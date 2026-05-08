// Service Worker for حسم — bump this version whenever you deploy major changes
const CACHE_VERSION = 'hasm-v1';

// Install: activate immediately
self.addEventListener('install', event => {
  self.skipWaiting();
});

// Activate: take control of all clients + cleanup old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: NETWORK-FIRST for HTML/JS (always check for updates),
// CACHE-FIRST for images (fast loading, rarely change)
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // For HTML and JS: try network first, fall back to cache if offline
  const isHtmlOrJs =
    req.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('/Jawib') ||
    url.pathname.endsWith('/Jawib/');

  if (isHtmlOrJs) {
    event.respondWith(
      fetch(req)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, clone)).catch(() => {});
          return response;
        })
        .catch(() => caches.match(req).then(r => r || caches.match('./')))
    );
    return;
  }

  // For images, fonts, etc: cache first, network fallback
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(response => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(c => c.put(req, clone)).catch(() => {});
        }
        return response;
      });
    })
  );
});
