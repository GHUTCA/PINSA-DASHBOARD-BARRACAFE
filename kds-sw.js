// kds-sw.js · Service Worker minimale (passthrough) · v1
// Scopo UNICO: rendere il KDS "instalable" per Chrome → "Instalar aplicación"
// = WebAPK a TUTTO schermo (fullscreen). NON cachea NIENTE: ogni richiesta va
// alla rete come sempre, così il KDS resta sempre fresco (nessuna versione
// congelata, il rischio n°1 delle PWA con cache aggressiva).
self.addEventListener('install',  ()  => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',    ()  => { /* passthrough: rete normale, zero cache */ });
