// Service worker: guarda la app para que funcione sin conexión.
// Cambia VERSION cada vez que publiques cambios para que los móviles descarguen la versión nueva.
const VERSION = "graficalo-v1";
const FILES = ["./", "index.html", "chart.umd.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
      // guarda también las fuentes de Google la primera vez que se cargan
      if (res.ok && (e.request.url.startsWith(self.location.origin) || /fonts\.(googleapis|gstatic)\.com/.test(e.request.url))) {
        const copy = res.clone(); caches.open(VERSION).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match("index.html")))
  );
});
