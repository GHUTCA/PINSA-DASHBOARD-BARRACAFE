// pinsita-sw.js · Service Worker condiviso Pinsita · v1 (13-jul-2026)
// Scopo OGGI: rendere le pagine staff "instalables" (WebAPK standalone che
// Android non ammazza come le schede Chrome). Passthrough puro: NON cachea
// niente — tutto sempre fresco dalla rete.
// Scopo DOMANI (cantiere UN CLICK): qui vivrà il handler 'push' per la
// campanella nativa (Web Push via relay Cloudflare) — un file solo per tutti.
self.addEventListener('install',  ()  => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',    ()  => { /* passthrough: rete normale, zero cache */ });
