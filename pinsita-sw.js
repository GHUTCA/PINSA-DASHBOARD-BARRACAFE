// pinsita-sw.js · Service Worker condiviso Pinsita · v2 (14-jul-2026)
// - Passthrough puro: NON cachea niente, tutto fresco dalla rete (WebAPK
//   standalone che Android non ammazza come le schede).
// - Web Push nativo: handler 'push' → notifica di sistema (campanella a
//   schermo spento, senza Telegram). Payload dal relay Cloudflare pinsita-push:
//   { title, body, tag?, url?, requireInteraction? }.
self.addEventListener('install',  ()  => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',    ()  => { /* passthrough: rete normale, zero cache */ });

self.addEventListener('push', (event) => {
  let d = { title: 'Pinsita', body: '' };
  try { d = event.data.json(); } catch (e) { if (event.data) { try { d.body = event.data.text(); } catch (_) {} } }
  event.waitUntil(self.registration.showNotification(d.title || 'Pinsita', {
    body: d.body || '',
    tag: d.tag || undefined,
    renotify: !!d.tag,
    icon: d.icon || undefined,
    data: d,
    requireInteraction: d.requireInteraction !== false,   // default: resta finché non la tocchi
    vibrate: [80, 40, 80],
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || '/mesero.html';
  event.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) { if (c.url.indexOf(target) >= 0 && 'focus' in c) return c.focus(); }
    for (const c of all) { if ('focus' in c) return c.focus(); }
    if (self.clients.openWindow) return self.clients.openWindow(target);
  })());
});
