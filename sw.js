const CACHE = 'burraco-v28';
const FILES = [
  '/punteggio_burraco/burraco.html',
  '/punteggio_burraco/manifest.json',
  '/punteggio_burraco/icon-192.png',
  '/punteggio_burraco/icon-512.png'
];

self.addEventListener('install', e => {
  // Fix #1: install non-atomic — un file mancante non blocca tutto
  e.waitUntil(
    caches.open(CACHE).then(async c => {
      for (const f of FILES) {
        try { await c.add(f); } catch(err) { console.warn('SW: skip', f, err); }
      }
    })
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  // Fix #3: ignora richieste non-GET
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.open(CACHE).then(c =>
      c.match(e.request).then(cached => {
        if (cached) return cached;
        // Fix #2: fallback offline — navigation request → servi l'HTML principale
        if (e.request.mode === 'navigate') {
          return c.match('/punteggio_burraco/burraco.html') || fetch(e.request);
        }
        return fetch(e.request);
      })
    )
  );
});

self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});