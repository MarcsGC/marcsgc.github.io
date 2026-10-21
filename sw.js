// Service worker de la raíz: solo existe para retirar el de la antigua Gráficalo (que vivía en /).
// Se desregistra al activarse. No borra ninguna caché ni ningún dato: Gráficalo (/graficalo/) y Formidex (/formidex/)
// gestionan las suyas por su cuenta.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", e => { e.waitUntil(self.registration.unregister()); });
