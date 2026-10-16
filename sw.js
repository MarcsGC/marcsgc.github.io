// Service worker: guarda la app para que funcione sin conexión.
// Cambia VERSION cada vez que publiques cambios para que los móviles descarguen la versión nueva.
const VERSION = "graficalo-v3.1";
const CORE = ["./", "index.html", "i18n.js", "stats.js", "app.js", "charts.js", "statsview.js", "export.js", "ocr.js", "main.js",
  "lib/chart.umd.js", "lib/hammer.min.js", "lib/chartjs-plugin-zoom.min.js", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png"];
// xlsx, jspdf y el lector de fotos se guardan la primera vez que se usan

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin === self.location.origin) {
    const heavy = /\/(lib|ocr)\//.test(url.pathname);
    if (heavy) { // librerías grandes: primero la copia guardada
      e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => { if (res.ok) { const c = res.clone(); caches.open(VERSION).then(x => x.put(e.request, c)); } return res; })));
      return;
    }
    // archivos de la app: primero la red (para recibir cambios); sin conexión, la copia guardada
    e.respondWith(fetch(e.request).then(res => {
      if (res.ok) { const c = res.clone(); caches.open(VERSION).then(x => x.put(e.request, c)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(hit => hit || caches.match("index.html"))));
    return;
  }
  if (/fonts\.(googleapis|gstatic)\.com/.test(url.hostname)) {
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => { const c = res.clone(); caches.open(VERSION).then(x => x.put(e.request, c)); return res; })));
  }
});
