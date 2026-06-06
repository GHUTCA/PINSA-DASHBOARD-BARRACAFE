/* ──────────────────────────────────────────────────────────────
   PINSITA · Service Worker · v1
   Strategia: NETWORK-FIRST (la rete vince sempre).
   Motivo: lavorate in New Version continuo — la cache NON deve mai
   nascondere un aggiornamento. La cache serve solo come rete di
   sicurezza se il dispositivo è offline.
   Per forzare un refresh totale: alza CACHE_NAME (es. v1 → v2).
   ────────────────────────────────────────────────────────────── */
const CACHE_NAME = 'pinsita-shell-v1';

self.addEventListener('install', (e) => {
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
